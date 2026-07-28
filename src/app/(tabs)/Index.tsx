import { Text } from 'react-native'
import { View } from 'react-native'
import { ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { useUserStore } from '@/stores/userStore'
import { useEffect, useMemo, useState } from 'react'

import { useQuery } from '@tanstack/react-query'
import { supabaseClient } from '@/config/supabaseClient'

import fetchProfile from '@/utils/fetchProfile'

import fetchTopics from '@/utils/fetchTopicData'
import { LineChart, PieChart } from 'react-native-gifted-charts'
import Button from '@/components/Button'

import { fetchMaterials } from '@/utils/fetchMaterials'
import { globalStyles } from '@/styles/global'
import { colors } from '@/styles/global'


const chartColors = ['#4fc3f7', '#ff8a65', '#81c784', '#ba68c8', '#fff176', '#4db6ac']


export default function HomeScreen() {
    const router = useRouter();
    const userId = useUserStore((state) => state.userId);

    const [topicPopup, setTopicPopup] = useState<string | null>(null)
    const [isGenerating, setIsGenerating] = useState(false)


    const { data, error } = useQuery({
        queryKey: ["profile", userId],
        queryFn: () => fetchProfile(userId!),
        enabled: !!userId,
    });


    useEffect(() => {
        if (error) console.log("fetchProfile:", error)
    }, [error])


    const { data: dataMaterial, error: errorMaterial } = useQuery({
        queryKey: ["materials", userId],
        queryFn: () => fetchMaterials(userId!),
        enabled: !!userId,
    });


    const { data: topic, error: errorTopic } = useQuery({
        queryKey: ["topics", userId],
        queryFn: () => fetchTopics(userId!),
        enabled: !!userId,
    });



    const statistics = useMemo(() => {
        


        const statisticsBase = [
            {
                title: "Infomation Retention Rate",
                number: -1,
                total: 100
            },

            {
                title: "Revision streak",
                number: -1
            },

            {
                title: "Topics Mastered",
                number: -1,
            },

            {
                title: "Topics Need Revision or Work",
                number: -1,

            },

        ]


        if (dataMaterial) {
            const now = new Date()
            const today = Math.floor(now.getTime() / 86400000)

            const userDays = [...new Set(
                dataMaterial.map(row => Math.floor(new Date(row.created_at).getTime() / 86400000))
            )].sort((a, b) => b - a)


            let streak = 0
            for (let i = 0; i < userDays.length; i++) {
                if (userDays[i] === today - i) {
                    streak++
                } else {
                    break
                }
            }
            statisticsBase[1].number = streak
        }


        if (data) {
            const count = data?.retention?.[0]
            const rententionTotalScore = data?.retention?.[0]

            if (!count || !rententionTotalScore) {
                statisticsBase[0].number = -1
            } else {
                const rententionAveragedScore = rententionTotalScore / count
                statisticsBase[0].number = rententionAveragedScore
            }
            
        }

        if (topic) {
            const strongThreshold = 8
            const weakThreshold = 5
            let strongCount = 0
            let weakCount = 0

            for (const row of topic) {
                if (row.score >= strongThreshold) {
                    strongCount += 1
                } else if (row.score < weakThreshold) {
                    weakCount += 1
                }
            }

            statisticsBase[2].number = strongCount
            statisticsBase[3].number = weakCount
        }  
        

        return statisticsBase

    }, [topic, data, dataMaterial])



    const formatDate = (dayNum: string) => {
        const d = new Date(Number(dayNum) * 86400000)
        return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`
    }
    const decay = 0.095




    async function handleSubmit(type : string) {
        setIsGenerating(true)
        try {
        
        const topic = topicPopup

        
            const prompt = dataMaterial?.filter((material) => material.topic == topic)
                .map((material) => material.summary)
                .join(",") ?? ""
            
            const response = await fetch(`${process.env.EXPO_PUBLIC_SERVER_URL}/api/revision`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json", 
                },
                body: JSON.stringify({
                    summarizedMistakes: prompt,
                    type: type
                })
            })

            const data = await response.json()
        if (type == "mcq") {

            if (data?.content) {

                router.push({
                    pathname: '/Results',
                    params: { type: type, content: data.content, topic: topic},
                })
            }
        } else {
            if (data?.content) {

                router.push({
                    pathname: '/Results',
                    params: { type: type, content: data.content},
                })
            }
        }
        } catch (err) {
            console.error("Failed to generate revision:", err)
            useUserStore.getState().showToast("Revision failed")
        } finally {
            setIsGenerating(false)
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
                        newArr.push({ value: obj[day], onPress: () => setTopicPopup(topic), dataPointsRadius: 20})
                    }

                    prev = obj[day]
                }
            }

            return { newArr, color: chartColors[i % chartColors.length], dataPointsColor: chartColors[i % chartColors.length] }
        });

        return hashTable

    }, [topic])


    const allLines = Object.entries(DataTable).map(([topic, value], i) => ({
        data: Object.entries(value)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([, score]) => ({ value: score })),
        color: chartColors[i % chartColors.length],
        dataPointsColor: chartColors[i % chartColors.length],
    }))

    return (
        <View style={{
            flex: 1,
            justifyContent:'center',
            alignItems:'center'
        }}>
            {isGenerating && (
                <View style={{ position: 'absolute', zIndex: 10, top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)' }}>
                    <ActivityIndicator size="large" color={colors.text} />
                </View>
            )}
            <View style={{
                margin: 5,
                padding: 20,
                borderRadius: 10,
                width: 370,
                height: 130,
                backgroundColor: colors.surface,
                borderColor: colors.Borders,
                borderWidth: 1,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                
                gap: 16
            }}>

                <Text>
                    Motivational quote of the day: 
                </Text>
                <Text style={{

                    flexShrink: 1
                }}>
                    An apple a day keeps the doctor away
                </Text>
            </View>
            <View style={{
                margin: 5,
                paddingTop: 20,
                borderRadius: 10,
                width: 370,
                height: 130,
                backgroundColor: colors.surface,
                borderColor: colors.Borders,
                borderWidth: 1,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 16
            }}>
                {statistics.map((item, index) => (
                    <View key={index} style={{ alignItems: 'center' }}>
                        {item.total ? (
                            <View style={{ alignItems: 'center' }}>
                                {item.number === -1 ? (
                                    <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#999' }}>N/A</Text>
                                ) : (
                                    <PieChart
                                        donut
                                        radius={35}
                                        innerRadius={26}
                                        data={[
                                            { value: item.number, color: chartColors[0] },
                                            { value: item.total - item.number, color: '#e0e0e0' },
                                        ]}
                                        centerLabelComponent={() => (
                                            <Text style={{ fontSize: 12, fontWeight: 'bold', color: colors.text }}>
                                                {item.number}%
                                            </Text>
                                        )}
                                    />
                                )}
                                <Text style={{ fontSize: 10, color: colors.text, marginTop: 4, textAlign: 'center', maxWidth: 70 }}>
                                    {item.title}
                                </Text>
                            </View>
                        ) : (
                            <View style={{ alignItems: 'center' }}>
                                <Text style={{ fontSize: 20, fontWeight: 'bold', color: item.number === -1 ? '#999' : chartColors[index % chartColors.length] }}>
                                    {item.number === -1 ? 'N/A' : item.number}
                                </Text>
                                <Text style={{ fontSize: 10, color: colors.text, marginTop: 4, textAlign: 'center', maxWidth: 70 }}>
                                    {item.title}
                                </Text>
                            </View>
                        )}
                    </View>
                ))}
            </View>


            <View style={{
                margin: 5,
                paddingTop: 20,
                borderRadius: 10,
                width: 370,
                height: 270,
                backgroundColor: colors.surface,
                borderColor: colors.Borders,
                borderWidth: 1
                
            }}>

                <LineChart
                    data={allLines[0]?.data ?? []}
                    dataSet={allLines.slice(1)}
                    curved
                />
            </View>




            {topicPopup && (
                <View style={{
                    position: 'absolute',

                }}>
                    <Button text='Revise MCQ' onPress={() => handleSubmit("mcq-revision")} disabled={isGenerating}></Button>
                    <Button text='error revision (no points)' onPress={() => handleSubmit("knowledge-revision")} disabled={isGenerating}></Button>
                    
                </View>


            )}
        </View>
    )
}
