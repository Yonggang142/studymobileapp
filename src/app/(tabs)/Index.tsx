import { Text, Touchable, TouchableOpacity } from 'react-native'
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

import { Dimensions } from 'react-native';

const chartColors = ['#4fc3f7', '#ff8a65', '#81c784', '#ba68c8', '#fff176', '#4db6ac', '#f06292', '#a1887f', '#90a4ae', '#ffd54f', '#7986cb', '#4dd0e1', '#e57373', '#9575cd', '#aed581', '#ffb74d', '#64b5f6', '#e6ee9c', '#ce93d8', '#80cbc4']


export default function HomeScreen() {

    const screenWidth = Dimensions.get('window').width;
    console.log("=== HomeScreen RENDER ===")
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


   const decay = 0.95



   


    const dayToLabel = (dayNum: number) => {
        const d = new Date(dayNum * 86400000)
        return `${d.getDate()}/${d.getMonth() + 1}`
    }
 


    async function handleSubmit(type : string) {
        setIsGenerating(true)
        try {
        
        const topic = topicPopup

        
            const prompt = dataMaterial?.filter((material) => material.topic == topic)
                .map((material) => material.summary)
                .join(",") ?? ""
            
            if (prompt == "") {
                useUserStore.getState().showToast("Topic is empty, meaning there is no summary for ur material")
                return
            }



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
                    params: { type: type, content: data.content, topic: topic, alreadyBucket: "true"},
                })
            }
        } else {
            if (data?.content) {

                router.push({
                    pathname: '/Results',
                    params: { type: type, content: data.content, alreadyBucket: "true"},
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

    
    const { lines, avgDPE } = useMemo(() => {
        //console.log("lines memo — topic:", topic?.length, "userId:", userId)
        if (!topic) return { lines: [], DPE: 0 }
        const today = Math.floor(new Date().getTime() / 86400000)

        const hashTable: Record<string, Record<number, number>> = {}
        let globalMin = Infinity

        for (const row of topic) {
            const day = Math.floor(new Date(row.created_at).getTime() / 86400000)
            if (!hashTable[row.topic]) hashTable[row.topic] = {}
            hashTable[row.topic][day] = row.score
            globalMin = Math.min(globalMin, day)

        }
        let DPE = 0
        let DPEcounter = 0
        const lines = Object.entries(hashTable).map(([topic, obj], i) => {
            let minDay = Infinity
            for (const d of Object.keys(obj)) {
                
                minDay = Math.min(minDay, Number(d))
            }

            let prev = obj[minDay]
            let prevUndef = false

            const data = []
            //console.log(prev, minDay)            
            for (let day = globalMin; day <= today; day++) {
                const dateLabel = dayToLabel(day)
                if (day < minDay) {
                    data.push({ value: 0, label: dateLabel, dataPointColor: 'transparent', thickness: 0, color: 'transparent'})  
                } else if (obj[day] == undefined) {
                    data.push({ value: prev * decay, label: dateLabel, hideDataPoint: true })
                    prev = prev * decay
                    prevUndef = true
                } else if (obj[day] == null) {

                } else {
                    if (prevUndef) {
                        DPE += -(prev - obj[day])
                        DPEcounter += 1
                    }
                    data.push({ value: obj[day], label: dateLabel, dataPointsRadius: 20})
                    prev = obj[day]
                    prevUndef = false
                }
            }

            data.push({ value: undefined as any, hideDataPoint: false  })
            return { topic, data, startIndex: prev !== 0 ? minDay - globalMin : today + 1, color: chartColors[i % chartColors.length], dataPointsColor: chartColors[i % chartColors.length] }
        })

        const avgDPE = DPE / DPEcounter
        return { lines, avgDPE }
    }, [topic])




     const statistics = useMemo(() => {
        


        const statisticsBase = [
            {
                title: "Infomation Retention Rate",
                number: -1,
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
            {
                title: "Topics that you have not attempted",
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


    
        if (topic) {
            const strongThreshold = 8
            const weakThreshold = 5

            const now = new Date()
            const today = Math.floor(now.getTime() / 86400000)

            const latestByTopic: Record<string, { score: number; day: number }> = {}
      
            for (const row of topic) {
                const day = Math.floor(new Date(row.created_at).getTime() / 86400000)

                if (!latestByTopic[row.topic] || day > latestByTopic[row.topic].day) {
                    latestByTopic[row.topic] = { score: row.score, day }
                }
            }

            let strongCount = 0
            let weakCount = 0
            let unattempted = 0 
            for (const { score, day } of Object.values(latestByTopic)) {

                if (!score) {
                    unattempted += 1
                    continue
                }
                const daysSince = today - day
  
                const effectiveScore = score * Math.pow(decay, daysSince)
    
                if (effectiveScore >= strongThreshold) {
                    strongCount += 1
                } else if (effectiveScore < weakThreshold) {
                    weakCount += 1
                }
            }
            statisticsBase[4].number = unattempted
            statisticsBase[2].number = strongCount
            statisticsBase[3].number = weakCount
            statisticsBase[0].number = Number(avgDPE ? avgDPE.toPrecision(3) : -1)
        }  
        

        return statisticsBase

    }, [topic, data, dataMaterial])

 
    //console.log(JSON.stringify(lines, null, 2))
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
                marginBottom: 0,
                paddingVertical: 12,
                borderRadius: 10,
                width: 370,
                backgroundColor: colors.surface,
                borderColor: colors.Borders,
                borderWidth: 1,
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: statistics[1].number === -1 ? '#999' : chartColors[1 % chartColors.length] }}>
                    {statistics[1].number === -1 ? 'N/A' : statistics[1].number}
                </Text>
                <Text style={{ fontSize: 11, color: colors.text, marginTop: 4 }}>
                    {statistics[1].title}
                </Text>
            </View>

  
            <View style={{
                margin: 5,
                marginTop: 5,
                paddingTop: 16,
                paddingBottom: 8,
                borderRadius: 10,
                width: 370,
                backgroundColor: colors.surface,
                borderColor: colors.Borders,
                borderWidth: 1,
                flexDirection: 'row',
                flexWrap: 'wrap',
            }}>
                {[0, 2, 3, 4].map((idx) => (
                    <View key={idx} style={{ width: '50%', alignItems: 'center', paddingVertical: 8 }}>
                        <Text style={{ fontSize: 20, fontWeight: 'bold', color: statistics[idx].number === -1 ? '#999' : chartColors[idx % chartColors.length] }}>
                            {statistics[idx].number === -1 ? 'N/A' : statistics[idx].number}
                        </Text>
                        <Text style={{ fontSize: 10, color: colors.text, marginTop: 4, textAlign: 'center', maxWidth: 120 }}>
                            {statistics[idx].title}
                        </Text>
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
                borderWidth: 1,
   
            }}>

                <LineChart
                    data={lines[0]?.data ?? []}
                    dataSet={lines.slice(1)}
                    
                    width={300}
                    xAxisThickness={1}
                    xAxisColor={colors.Borders}
                    xAxisLabelTextStyle={{ color: colors.text, fontSize: 9 }}
                    yAxisThickness={1}
                    yAxisColor={colors.Borders}
                    yAxisTextStyle={{ color: colors.text, fontSize: 10 }}
                    adjustToWidth={true}
                    parentWidth={screenWidth - 32}  
                    initialSpacing={25}
                    endSpacing={10}
                    disableScroll={true}

                />
            </View>

            {lines.length > 0 && (
                <View style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    gap: 12,
                    marginTop: 8,
                    paddingHorizontal: 10,
                }}>
                    {lines.map((line, i) => (
                        <TouchableOpacity onPress={() => setTopicPopup(line.topic)} key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: line.color }} />
                            <Text style={{ fontSize: 11, color: colors.text }}>{line.topic}</Text>
                        </TouchableOpacity>
                        
                    ))}
                </View>
            )}




            {topicPopup && (
                <View style={{
                    position: 'absolute',
                    backgroundColor: "#ffffff",
                    width: 350,
                    height: 160,
                    padding: 20
                }}>
                    <Button text='Revise MCQ' onPress={() => handleSubmit("mcq-revision")} disabled={isGenerating}></Button>
                    <Button text='error revision (no points)' onPress={() => handleSubmit("knowledge-revision")} disabled={isGenerating}></Button>
                    
                </View>


            )}
        </View>
    )
}
