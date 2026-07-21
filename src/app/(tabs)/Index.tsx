import { Text } from 'react-native'
import { View } from 'react-native'
import { useRouter } from 'expo-router'
import { useUserStore } from '@/stores/userStore'
import { useEffect, useMemo } from 'react'

import { useQuery } from '@tanstack/react-query'
import { supabaseClient } from '@/configs/supabaseClient'

import fetchProfile from '@/utils/fetchProfile'

import fetchTopics from '@/utils/fetchTopicData'
import { LineChart } from 'react-native-gifted-charts'


export default function HomeScreen() {
    const router = useRouter();
    const userId = useUserStore((state) => state.userId);

    
    const { data, error } = useQuery({
        queryKey: [userId],
        queryFn: () => fetchProfile(userId!),
        enabled: !!userId,
    });


    const { data: topic, error: errorTopic } = useQuery({
        queryKey: [userId],
        queryFn: () => fetchTopics(userId!),
        enabled: !!userId,
    });

    /* pause for testing
    useEffect(() => {
        if (!userId) {
            router.replace('/Auth')
        }
    }, [userId])

    */



    
    /*
    useEffect(() => {
        const sampleMCQ = JSON.stringify([
            {
                question: 'What is the powerhouse of the cell?',
                options: ['A) Nucleus', 'B) Mitochondria', 'C) Ribosome', 'D) Golgi apparatus'],
                answer: 1,
                explanation: 'Mitochondria produce ATP through cellular respiration.',
            },
            {
                question: 'Which gas do plants absorb during photosynthesis?',
                options: ['A) Oxygen', 'B) Nitrogen', 'C) Carbon dioxide', 'D) Hydrogen'],
                answer: 2,
                explanation: 'Plants use CO₂ and sunlight to produce glucose.',
            },
            {
                question: "What is Newton's first law of motion?",
                options: [
                    'A) F = ma',
                    'B) Action equals reaction',
                    'C) Objects in motion stay in motion unless acted upon',
                    'D) Energy cannot be created',
                ],
                answer: 2,
                explanation: 'Also known as the law of inertia.',
            },
        ])
        router.push({
            pathname: '/Results',
            params: { type: 'mcq', content: sampleMCQ },
        })
    }, [])
    */

    const formatDate = (dayNum: string) => {
        const d = new Date(Number(dayNum) * 86400000)
        return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`
    }
    const decay = 0.05
    
    const DataTable = useMemo(() => {

        const hashTable : Record<string, Record<number, number>> = {}
        if (topic) {
            for (let i = 0; i < topic.length; i++) {
                const row = topic[i]
                if (hashTable[row.topic]) {

                    const daysSinceEpoch = Math.floor(new Date(row.created_at).getTime() / 86400000);
                    hashTable[row.topic][daysSinceEpoch] =  row.score
                } else {
                    hashTable[row.topic] = {}
                    const daysSinceEpoch = Math.floor(new Date(row.created_at).getTime() / 86400000);
            
                    hashTable[row.topic][daysSinceEpoch] =  row.score
                }


            }
        }
     
        Object.entries(hashTable).map(([topic, object]) => {
            let minimum_day = Infinity
            let maximum_day = - Infinity
            Object.entries(object).forEach(([days, score]) => {
                const dayNum = Number(days)
                minimum_day = Math.min(minimum_day, dayNum)
                maximum_day = Math.max(maximum_day, dayNum)
            })

            let prev = object[minimum_day]
            const newObject : Record<number, number> = {}
            for (let i = minimum_day; i < maximum_day + 1; i++) {
                if (!object[i]) {
                    const scoreForDay = prev * decay
                    prev = scoreForDay
                    newObject[i] = scoreForDay
                } else {
                    prev = object[i]
                    newObject[i] = object[i]
                }
            }

            return newObject
            
        });
        
        return hashTable

    }, [topic])

    return (
        <View>
            <Text>Home</Text>
            
            {Object.entries(DataTable).map(([key, value]: [string, Record<number, number>]) => {
                const chartData = Object.entries(value)
                    .sort(([a], [b]) => Number(a) - Number(b))
                    .map(([day, score]) => ({ 
                        value: score, 
                        label: formatDate(day)
                    }))

                return (
                    <LineChart 
                        key={key}
                        data={chartData}
                        color="#4fc3f7"
                        curved
                    />
                )
            })}
       



        </View>
    )
}