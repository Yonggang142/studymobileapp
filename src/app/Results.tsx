import Button from '@/components/Button'
import { useLocalSearchParams, VectorIcon } from 'expo-router'
import { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
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
    const { type, content, materialId, topic } = useLocalSearchParams<{ type: string; content: string, materialId: string, topic: string}>()
    const data = content ? JSON.parse(content) : null

    const [rightOrWrong, setRightOrWrong] = useState<(Boolean | null)[]>([])
    const [yourResponse, setYourResponse] = useState<(number | null)[]>([])
   

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

        const WrongQuestionsArray = []
        const CorrectQuestionsArray = []

        for (let i = 0; i < data.Length; i++) {
            if (rightOrWrong[i]) {
                CorrectQuestionsArray.push(data[i].question)
            } else {
                WrongQuestionsArray.push(data[i].question)
            }
        }

        try {
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

            if (loggingData?.content && type != "revision") {
                const parsed = JSON.parse(loggingData.content)

                await supabaseClient
                    .from("materials")
                    .update({
                        score_table: parsed.topics,
                        summary: parsed.summary,
                        
                    })
                    .eq("user_id", userId)
                    .eq("material_id", materialId)
            }


            router.push({
                pathname: '/Log',
                params: { logSummary: loggingData.content, topic: topic, score: score },
            })
        } catch (err) {
            console.log("Error: ", err)
        }


    }

    return (
        <View>
            {type === 'mcq' || type === "mcq-revision" ? (
                <ScrollView style={{
                    flex: 9
                }}>
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
                                    <View>
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


                            {rightOrWrong[index] !== null && (
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
                <ScrollView style={{
                    gap: 10
                }}>


                    {data.map((knowledge: Knowledge, index: number) => (
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
                <ScrollView style={{
                    gap: 10
                }}>
                    <Text style={globalStyles.header}>Answers</Text>
                    {data.map((answers: Answers, index: number) => (
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
            ) : (
                <ScrollView style={{
                    gap: 10
                }}>

                    <Text>
                        Summary of common mistakes: {data}
                    </Text>


                </ScrollView>

            )}


            <View style={{
                flex: 1
            }}>
                <Button onPress={() => CompileData()} text={"log"}>

                </Button>
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