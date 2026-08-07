import { ScrollView, Text, Touchable, TouchableOpacity } from 'react-native'
import { View } from 'react-native'
import { ActivityIndicator } from 'react-native'
import { Platform } from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { useRouter } from 'expo-router'
import { useUserStore } from '@/stores/userStore'
import { useEffect, useMemo, useState } from 'react'
import CircularProgress from '@/components/CircularProgress'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabaseClient } from '@/config/supabaseClient'
import { TextInput } from 'react-native'
import fetchProfile from '@/utils/fetchProfile'

import fetchTopics from '@/utils/fetchTopicData'
import { LineChart, PieChart } from 'react-native-gifted-charts'
import Button from '@/components/Button'

import { fetchMaterials } from '@/utils/fetchMaterials'
import { globalStyles } from '@/styles/global'
import { colors } from '@/styles/global'

import { Dimensions } from 'react-native';
import TagInput from '@/components/TagInput'

const chartColors = ['#4fc3f7', '#ff8a65', '#81c784', '#ba68c8', '#fff176', '#4db6ac', '#f06292', '#a1887f', '#90a4ae', '#ffd54f', '#7986cb', '#4dd0e1', '#e57373', '#9575cd', '#aed581', '#ffb74d', '#64b5f6', '#e6ee9c', '#ce93d8', '#80cbc4']


export default function HomeScreen() {

    const screenWidth = Dimensions.get('window').width;
    console.log("=== HomeScreen RENDER ===")
    const router = useRouter();
    const userId = useUserStore((state) => state.userId);
    const queryClient = useQueryClient();

    const [topicPopup, setTopicPopup] = useState<string | null>(null)
    const [isGenerating, setIsGenerating] = useState(false)

    const [examPopup, setExamPopup] = useState(false)

    const [examDate, setExamDate] = useState(new Date())
    const [showDate, setShowDate] = useState(false)

    const [examName, setExamName] = useState("")
    const formatDate = (d: Date) =>
        `${String(d.getDate()).padStart(2, '0')} / ${String(d.getMonth() + 1).padStart(2, '0')} / ${d.getFullYear()}`

    const toDaysFromEpoch = (value: Date | number | string): number =>
        Math.floor(new Date(value).getTime() / 86400000)




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

    const {maxDate, nextDate, daysRemaining} = useMemo(() => {

        if (!data || !data.exam_dates) return { maxDate: 0, nextDate: Infinity, daysRemaining: null }

        const today = Math.floor(Date.now() / 86400000)
        const arr = data.exam_dates
        let maxValue = 0
        let earliestValue = Infinity
        for (let i = 0; i < arr.length; i++) {
            const day = arr[i][0]
            if (day > maxValue) maxValue = day
            if (day > today && day < earliestValue) earliestValue = day
        }

        return {
            maxDate: maxValue,
            nextDate: earliestValue,
            daysRemaining: earliestValue === Infinity ? null : earliestValue - today
        }
    }, [data])



    const dayToLabel = (dayNum: number) => {
        const d = new Date(dayNum * 86400000)
        return `${d.getDate()}/${d.getMonth() + 1}`
    }

    async function submitExam() {
        try {
            const existing = data?.exam_dates ?? []
            const newExam = [Math.floor(examDate.getTime() / 86400000), examName || "Exam"]
            const { error } = await supabaseClient
                .from("profiles")
                .update({ exam_dates: [...existing, newExam] })
                .eq("user_id", userId)

            if (error) {
                console.error("submitExam:", error)
                useUserStore.getState().showToast("Failed to save exam")
            } else {
                useUserStore.getState().showToast("Exam saved")
                queryClient.invalidateQueries({ queryKey: ["profile", userId] })
            }
        } catch (err) {
            console.error("submitExam:", err)
            useUserStore.getState().showToast("Failed to save exam")
        } finally {
            setExamDate(new Date())
            setExamName("")
        }
    }

    async function handleSubmit(type: string) {
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
                        params: { type: type, content: data.content, topic: topic, alreadyBucket: "true" },
                    })
                }
            } else {
                if (data?.content) {

                    router.push({
                        pathname: '/Results',
                        params: { type: type, content: data.content, alreadyBucket: "true" },
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
                    data.push({ value: 0, label: dateLabel, dataPointColor: 'transparent', thickness: 0, color: 'transparent' })
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
                    data.push({ value: obj[day], label: dateLabel, dataPointsRadius: 20 })
                    prev = obj[day]
                    prevUndef = false
                }
            }

            data.push({ value: undefined as any, hideDataPoint: false })
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
        <>

            {!examPopup ? (
                <View style={{ flex: 1 }}>
                    <ScrollView contentContainerStyle={{
                        flexGrow: 1,
                        alignItems: 'center',
                        flexDirection: 'column'
                    }}>
                        <LinearGradient
                            colors={['#8a5cf5', '#5b3dca', '#412e9a']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={{
                                width: '100%',
                                height: 350,
                                flexDirection: 'column',
                                alignItems: 'center',
                            }}>
                            <TouchableOpacity style={{
                                position: 'absolute',
                                right: 40,
                                top: 100,

                            }} onPress={() => setExamPopup(true)}>
                                <Ionicons name='settings-outline' size={35} color='#ffffff' />
                            </TouchableOpacity>
                            <Text style={{
                                marginTop: 40,
                                backgroundColor: 'transparent',
                                fontWeight: 'bold',
                                color: '#ffffff',
                                fontSize: 25

                            }}>
                                Study Report
                            </Text>
                            <Text style={{
                                backgroundColor: 'transparent',
                                fontWeight: 'semibold',
                                color: '#ffffff',
                                fontSize: 18,
                                marginBottom: 30
                            }}>
                                Exam countdown
                            </Text>
                            <View style={{


                                backgroundColor: 'transparent',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexDirection: 'column',

                            }}>

                                <View style={{
                                    marginBottom: -70,
                                    alignItems: 'center'
                                }}>

                                    <CircularProgress size={250} maxDate={maxDate == 0 ? toDaysFromEpoch(Date.now()) : maxDate} startingDate={toDaysFromEpoch(data?.starting_date ?? Date.now())}/>
                                    <View style={{
                                        position: 'absolute',
                                        top: 40,
                                        flexDirection: 'column',
                                        alignItems: 'center',

                                    }}>

                                        <Text style={{
                                            backgroundColor: 'transparent',
                                            fontWeight: 'bold',
                                            color: '#ffffff',
                                            fontSize: 50,

                                        }}>
                                            {daysRemaining ?? '—'}
                                        </Text>
                                        <Text style={{
                                            backgroundColor: 'transparent',
                                            fontWeight: 'bold',
                                            color: '#ffffff',
                                            fontSize: 15,

                                        }}>
                                            Days remaining
                                        </Text>

                                    </View>
                                </View>
                            </View>


                        </LinearGradient>

                        <View style={{
                            margin: 5,
                            marginTop: -40,
                            paddingVertical: 12,
                            borderRadius: 10,
                            width: 350,
                            backgroundColor: colors.surface,
                            paddingLeft: 20,
                            justifyContent: 'center',
                        }}>
                            <Text style={{ fontSize: 18, fontWeight: 'semibold', color: '#2b2b2b', marginTop: 4 }}>
                                {statistics[1].title}
                            </Text>
                            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#000000' }}>
                                {statistics[1].number === -1 ? 'N/A' : statistics[1].number}
                            </Text>

                        </View>


                        <View style={{
                            margin: 5,
                            marginTop: -10,
                            paddingTop: 16,
                            paddingBottom: 8,
                            width: 370,
                            flexDirection: 'row',
                            flexWrap: 'wrap',
                        }}>
                            {[0, 2, 3, 4].map((idx) => (
                                <View key={idx} style={{ width: '50%', height: 120, padding: 10 }}>
                                    <View style={{ flex: 1, backgroundColor: '#ffffff', borderRadius: 10, padding: 15 }}>
                                        <Text style={{ fontWeight: 'semibold', fontSize: 14, color: '#2b2b2b', marginTop: 4 }}>
                                            {statistics[idx].title}
                                        </Text>
                                        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#000000', marginTop: 'auto' }}>
                                            {statistics[idx].number === -1 ? 'N/A' : statistics[idx].number}
                                        </Text>
                                    </View>


                                </View>
                            ))}
                        </View>


                        <View style={{
                            marginTop: 5,
                            paddingTop: 20,
                            borderRadius: 10,
                            width: 350,
                            marginBottom: 10,
                            paddingBottom: 20,
                            backgroundColor: colors.surface,

                        }}>

                            <LineChart
                                data={lines[0]?.data ?? []}
                                dataSet={lines.slice(1)}

                                width={290}
                                xAxisThickness={1}
                                xAxisColor={colors.Borders}
                                xAxisLabelTextStyle={{ opacity: 0 }}
                                yAxisThickness={1}
                                yAxisColor={colors.Borders}
                                yAxisTextStyle={{ color: colors.text, fontSize: 10 }}
                                adjustToWidth={true}
                                parentWidth={screenWidth - 32}
                                initialSpacing={25}
                                endSpacing={10}
                                disableScroll={true}

                                focusEnabled={true}
                                dataPointsRadius={20}
                                showDataPointLabelOnFocus={true}
                                focusTogether={false}
                                unFocusOnPressOut={false}
                                dataPointLabelWidth={64}
                                dataPointLabelShiftY={-34}
                                dataPointLabelComponent={(item: any) =>
                                    item?.label ? (
                                        <View style={{
                                            backgroundColor: '#741e99',
                                            borderRadius: 6,
                                            paddingHorizontal: 7,
                                            paddingVertical: 4,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}>
                                            <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: 'bold' }}>
                                                {item.label}
                                            </Text>
                                        </View>
                                    ) : null
                                }
                            />


                            {lines.length > 0 && (
                                <View style={{
                                    flexDirection: 'row',
                                    flexWrap: 'wrap',
                                    justifyContent: 'center',
                                    gap: 12,
                 
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

                            
                        </View>

                        




                    </ScrollView>

                    {isGenerating && (
                        <View style={{ position: 'absolute', zIndex: 10, top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)' }}>
                            <ActivityIndicator size="large" color={colors.text} />
                        </View>
                    )}

                    {topicPopup && (
                        <View style={{
                            position: 'absolute',
                            top: 0, left: 0, right: 0, bottom: 0,
                            justifyContent: 'center',
                            alignItems: 'center',
                            backgroundColor: 'rgba(255, 255, 255, 0.84)',
                        }}>
                            <View style={{
                                backgroundColor: 'transparent',
                                width: 350,
                                height: 180,
                                padding: 20,
                                justifyContent: 'center',
                                gap: 10,

                            }}>
                                <Button text='Revise MCQ' iconName="help-circle" onPress={() => handleSubmit("mcq-revision")} disabled={isGenerating}></Button>
                                <Button text='General review (no points)' iconName="book" onPress={() => handleSubmit("knowledge-revision")} disabled={isGenerating}></Button>
                                <Button text='Back' iconName="arrow-back" onPress={() => setTopicPopup("")} disabled={isGenerating}></Button>
                            </View>
                        </View>
                    )}
                </View>
            ) : (
                <View style={{
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <TouchableOpacity onPress={() => setShowDate(true)}
                        style={{ padding: 12,borderRadius: 8, flexDirection: 'row', justifyContent: 'space-between', gap: 20 }}>
                        <Text style= {{
                            fontSize: 25,
                            fontWeight: 'semibold'
                        }}>{formatDate(examDate)}</Text>
                        <Ionicons name="calendar-outline" size={30} />
                    </TouchableOpacity>


                    {showDate && (
                        <DateTimePicker
                            value={examDate}
                            mode="date"
                            display={Platform.OS === 'android' ? 'spinner' : 'default'}
                            onValueChange={(event, date) => setExamDate(date)}
                            onDismiss={() => setShowDate(false)}
                        />
                    )}


                    <TextInput
                        style={globalStyles.textInput}
                        placeholder='Name of the assessment'
                        onChangeText={(str) => setExamName(str)}
                        value={examName}
                    />
                    <View style ={{
                        height: 20
                    }}/>

                        
                    <Button width={300} text="Submit" iconName='add-circle' onPress={() => { setExamPopup(false); submitExam() }} ></Button>

                  
                    <Button width={300} text="Back" iconName="arrow-back" onPress={() => { setExamPopup(false) }} ></Button>

                
                </View>
            )}
        </>
    )
}
