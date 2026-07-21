import { Text } from 'react-native'
import { View } from 'react-native'
import { useRouter } from 'expo-router'
import { useUserStore } from '@/stores/userStore'
import { useEffect, useMemo, useState } from 'react'

import { useQuery } from '@tanstack/react-query'
import { supabaseClient } from '@/configs/supabaseClient'

import fetchProfile from '@/utils/fetchProfile'

import fetchTopics from '@/utils/fetchTopicData'
import { LineChart } from 'react-native-gifted-charts'




const colors = ['#4fc3f7', '#ff8a65', '#81c784', '#ba68c8', '#fff176', '#4db6ac']

export default function HomeScreen() {
    const router = useRouter();
    const userId = useUserStore((state) => state.userId);

    const [topicPopup, setTopicPopup] = useState(false)


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
    const decay = 0.095


    // open some popup to show whether u want to revise the topic (MCQ)
    function handlePressPoint(topic : "string") {
        // submit prompt to begin mcq based revision

    }

    function handleSubmit(type : string) {
        

        if (type == "revision") {
            // go direct them to notes that satisfy all the topic same as search
        } else if  (type == "error revision") {
            //go and see the errors u made
        
        } else if (type == "mcq") {
            // generate new mcq, redirect to results.tsx
        }
    }

    const DataTable = useMemo(() => {

        if (!topic) return {}
        const hashTable: Record<string, Record<number, number>> = {}

        let globalMin = Infinity, globalMax = -Infinity

        for (const row of topic) {
            const day = Math.floor(new Date(row.created_at).getTime() / 86400000)
            if (!hashTable[row.topic]) hashTable[row.topic] = {}
            hashTable[row.topic][day] = row.score
            globalMin = Math.min(globalMin, day)
            globalMax = Math.max(globalMax, day)
        }


        Object.entries(hashTable).map(([topic, obj], i) => {
            let minDay = Infinity
            for (const d of Object.keys(obj)) {
                minDay = Math.min(minDay, Number(d))
            }
            
            let prev = obj[minDay]
            const newArr = []

            for (let day = globalMin; day <= globalMax; day++) {
                if (day < minDay) {
                    newArr.push({ value: 0, dataPointColor: 'transparent', color: 'transparent'})  
                } else {
                    
                    if (obj[day] !== undefined) {
                        newArr.push({ value: prev * decay, hideDataPoint: true, })
                    } else {
                        newArr.push({ value: obj[day], onPress: () => handlePressPoint(topic), dataPointsRadius: 20})
                    }

                    prev = obj[day]
                }
            }

            return { newArr, color: colors[i % colors.length], dataPointsColor: colors[i % colors.length] }
        });

        return hashTable

    }, [topic])


    const allLines = Object.entries(DataTable).map(([topic, value], i) => ({
        data: Object.entries(value)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([, score]) => ({ value: score })),
        color: colors[i % colors.length],
        dataPointsColor: colors[i % colors.length],
    }))

    return (
        <View>
            <Text>Home</Text>



            <LineChart
                data={allLines[0]?.data ?? []}
                dataSet={allLines.slice(1)}
                curved
            />




        </View>
    )
}