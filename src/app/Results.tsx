import Button from '@/components/Button'
import { useLocalSearchParams, VectorIcon } from 'expo-router'
import { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { globalStyles } from '@/styles/global'
import { supabaseClient } from '@/configs/supabaseClient'
import { useUserStore } from '@/stores/userStore'


interface MCQ {
    question: string
    options: string[]
    answer: number
    explanation: string
}

interface Knowledge {
    title: string
    points: string[]
}


interface Answers {

    question: string
    options: string[],
    answer: number,
    explanation: string

}

export default function ResultsPage() {

    const router = useRouter()
    const userId = useUserStore((state) => state.userId)
    const { type, content, materialId, topic, materialName, bucketPath, sourceUri } = useLocalSearchParams<{ type: string; content: string, materialId: string, topic: string, materialName: string, bucketPath: string, sourceUri: string }>()
    const data = content ? JSON.parse(content) : null

    const [rightOrWrong, setRightOrWrong] = useState<(Boolean | null)[]>([])
    const [yourResponse, setYourResponse] = useState<(number | null)[]>([])
    const [isCompiling, setIsCompiling] = useState(false)
   

    function CheckAnswer(question: MCQ, index: number, opIndex: number) {
        if (opIndex === question.answer) {
            const updated = [...rightOrWrong]
            updated[index] = true
            setRightOrWrong(updated)

        } else {

            const updated = [...rightOrWrong]
            updated[index] = false
            setRightOrWrong(updated)
        }


        const updatedRes = [...yourResponse]
        updatedRes[index] = opIndex
        setYourResponse(updatedRes)
    }


    async function CompileData() {
        setIsCompiling(true)
        try {

        const WrongQuestionsArray = []
        const CorrectQuestionsArray = []

        for (let i = 0; i < data.Length; i++) {
            if (rightOrWrong[i]) {
                CorrectQuestionsArray.push(data[i].question)
            } else {
                WrongQuestionsArray.push(data[i].question)
            }
        }

            const response = await fetch(`${process.env.EXPO_PUBLIC_SERVER_URL}/api/logging`, {
                method: "POST",
                body: JSON.stringify({
                    wrong_questions: WrongQuestionsArray,
                    correct_questions: CorrectQuestionsArray
                }),
            })
            const cq = CorrectQuestionsArray.length
            const wq = WrongQuestionsArray.length
            const score = (cq/(cq + wq)) * 10 
            const loggingData = await response.json()




            router.push({
                pathname: '/Log',
                params: { 
                    logSummary: loggingData.content, 
                    topic: topic, 
                    score: score,
                    materialName: materialName,
                    materialId: materialId,
                    bucketPath: bucketPath,                    sourceUri: sourceUri,                    autoLog: "false",
                },
            })
        } catch (err) {
            console.log("Error: ", err)
        } finally {
            setIsCompiling(false)
        }


    }

    return (
        <View style={{ flex: 1 }}>
            {isCompiling && (
                <View style={{ position: 'absolute', zIndex: 10, top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)' }}>
                    <ActivityIndicator size="large" />
                </View>
            )}
            {type === 'mcq' || type === "mcq-revision" ? (
                <ScrollView style={{ flex: 1 }}>
                    {data.map((question: MCQ, index: number) => (
                        <View key={index} style={{ padding: 16, borderBottomWidth: 1 }}>
                            <Text style={{
                                fontSize: 20,
                                marginBottom: 20
                            }}>{question.question}</Text>

                            <View style={{
                                flexDirection: "column",
                                gap: 5,
                            }}>
                                {question.options.map((option: string, opIndex: number) => (
                                    <View key={opIndex}>
                                        {(yourResponse[index] && yourResponse[index] == opIndex) ? (
                                            <Text style={{
                                                color: `${rightOrWrong[index] ? '#4de136' : '#b21f1f'}`
                                            }}>
                                                {option}
                                            </Text>
                                        ) : (
                                            <TouchableOpacity key={opIndex} onPress={() => CheckAnswer(question, index, opIndex)}>
                                                <Text style={{ color: '#010101' }}>
                                                    {option}
                                                </Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                ))}
                            </View>


                            {rightOrWrong[index] != null && (
                                <Text style={{
                                    color: rightOrWrong[index] ? '#4de136' : '#b21f1f'
                                }}>
                                    {question.explanation}
                                </Text>
                            )}


                        </View>
                    ))}



                </ScrollView>
            ) : (type == "knowledge") ? (
                <ScrollView style={{ flex: 1, padding: 16 }}>


                    {data?.map((knowledge: Knowledge, index: number) => (
                        <View key={index}>
                            <Text style={globalStyles.header}>
                                {knowledge.title}
                            </Text>

                            {knowledge.points.map((points: string, subIdx: number) => (
                                <Text key={subIdx}>
                                    {points}
                                </Text>
                            ))}
                        </View>
                    ))}
                </ScrollView>
            ) : (type == "answers") ? (
                <ScrollView style={{ flex: 1, padding: 16 }}>
                    <Text style={globalStyles.header}>Answers</Text>
                    {(Array.isArray(data) ? data : [data]).map((answers: Answers, index: number) => (
                        <View style={{ 
                            gap: 5
                        }} key={index}>
                            <Text>
                                {answers.question}
                            </Text>

                            {answers.options.map((option: string, subIdx: number) => (
                                <Text key={subIdx}>
                                    {option}
                                </Text>
                            ))}

                            <Text>
                                {answers.answer}
                            </Text>


                            <Text>
                                {answers.explanation}
                            </Text>

                        </View>
                    ))}

                </ScrollView>
            ) : (type == "marking" || type == "markingNoAnswer") ? (
                <ScrollView style={{ gap: 10, padding: 16 }}>
                    <Text style={globalStyles.header}>
                        Score: {data?.results ? `${data.results.filter((r: any) => r.isCorrect).length}/${data.results.length}` : "N/A"}
                    </Text>
                    <Text style={{ marginTop: 8 }}>{data?.feedback}</Text>
                    {data?.results?.map((r: any, i: number) => (
                        <View key={i} style={{ marginTop: 12, padding: 10, backgroundColor: r.isCorrect ? '#e8f5e9' : '#ffebee', borderRadius: 8 }}>
                            <Text style={{ fontWeight: 'bold' }}>Q{i + 1}: {r.question}</Text>
                            <Text>Your answer: {r.studentAnswer}</Text>
                            <Text>Correct: {r.correctAnswer}</Text>
                            <Text style={{ color: r.isCorrect ? '#2e7d32' : '#c62828' }}>{r.isCorrect ? '✅ Correct' : '❌ Incorrect'}</Text>
                            <Text>{r.explanation ?? ""}</Text>
                        </View>
                    ))}
                </ScrollView>
            ) : (
                <ScrollView style={{
                    gap: 10
                }}>

                    <Text>
                        Summary of common mistakes: {JSON.stringify(data)}
                    </Text>


                </ScrollView>

            )}


            <View style={{ paddingVertical: 12, alignItems: 'center' }}>
                {(type != "marking" && type != "answers" && type != "knowledge") ? 
                (
                <Button onPress={() => CompileData()} text={"log"} disabled={isCompiling}>

                </Button>
                ) : (
              
                        <Button onPress={() => router.push({ pathname: '/Log', params: { autoLog: "true", materialName, materialId, bucketPath, topic } })} text={"complete"}>
                        </Button>

                 
                    
                )}
            </View>
            
        </View>
    )
}


interface Answers {

    question: string
    options: string[],
    answer: number,
    explanation: string

}