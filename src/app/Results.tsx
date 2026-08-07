import Button from '@/components/Button'
import Markdown from 'react-native-markdown-display'
import { useLocalSearchParams, VectorIcon } from 'expo-router'
import { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { useUserStore } from '@/stores/userStore'
import { useMemo } from 'react'

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
    const { type, content, summary, fileUri, bucketPath, answerBucketPath, answerFileName, topic, materialName, answerFileUri, fileHash, answerFileHash, alreadyAnswerBucket, alreadyBucket } = useLocalSearchParams<{ type: string; content: string, summary: string, fileUri: string, bucketPath: string, answerBucketPath: string, topic: string, materialName: string, alreadyAnswerBucket: string, answerFileUri: string, answerFileHash: string, alreadyBucket: string,  fileHash: string, answerFileName: string }>()
    const data = useMemo(() => {
        if (!content) return null
        try { return JSON.parse(content) } catch { return content }
    }, [content])

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

        for (let i = 0; i < data.length; i++) {
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
                    answerFileName: answerFileName,
                    logSummary: loggingData.content, 
                    topic: topic, 
                    score: score,
                    materialName: materialName,
                    fileUri: fileUri,
                    alreadyAnswerBucket: alreadyAnswerBucket,
                    alreadyBucket: alreadyBucket,
                    fileHash: fileHash,
                    answerFileUri: answerFileUri,                    
                    answerFileHash: answerFileHash,
                    summary: summary,
                    bucketPath: bucketPath,
                    answerBucketPath: answerBucketPath,
                },
            })
        } catch (err) {
            console.log("Error: ", err)
            useUserStore.getState().showToast("Logging failed")
        } finally {
            setIsCompiling(false)
        }


    }

    return (
        <View style={{ flex: 1, marginTop: 40 }}>
            {isCompiling && (
                <View style={{ position: 'absolute', zIndex: 10, top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)' }}>
                    <ActivityIndicator size="large" />
                </View>
            )}
            {type === 'mcq' || type === "mcq-revision" ? (
                <ScrollView style={{ 
                    flex: 1, 
                }}>
                    {(Array.isArray(data) ? data : data?.questions || []).map((question: MCQ, index: number) => (
                        <View key={index} style={{ 
                            padding: 16, 
                            borderColor: '#7a00c0',
                            borderBottomWidth: 2, 
                            backgroundColor: '#ffffff',
                            borderRadius: 10,
                            marginHorizontal: 15,
                            marginVertical: 10
                            }}>


                     
                            <Text style={{
                                fontSize: 20,
                                marginBottom: 20,
                                fontWeight: 'semibold'
                            }}>{index + 1}. {question.question}</Text>

                            <View style={{
                                flexDirection: "column",
                                gap: 5,
                            }}>
                                {question.options.map((option: string, opIndex: number) => (
                                    <View key={opIndex}>
                                        {(yourResponse[index] != null && yourResponse[index] == opIndex) ? (
                                            <View style={{
                                                flexDirection:'row'
                                            }}>
                                                <Text style={{
                                                    marginRight: 10, fontWeight: 'semibold', fontSize: 14,
                                                    color: `${rightOrWrong[index] ? '#4de136' : '#b21f1f'}`
                                                }}>
                                                    {opIndex + 1}.
                                                </Text>

                                                <Text style={{fontSize: 14,
                                                    color: `${rightOrWrong[index] ? '#4de136' : '#b21f1f'}`
                                                }}>
                                                    {option}
                                                </Text>
                                            </View>
                                            
                                           
                                        ) : (
                                            <TouchableOpacity key={opIndex} onPress={() => CheckAnswer(question, index, opIndex)}>
                                                <View style={{
                                                flexDirection:'row'
                                                }}>
                                                    <Text style={{ fontSize: 14, color: '#010101', marginRight: 10, fontWeight: 'semibold'}}>
                                                        {opIndex + 1}.
                                                    </Text>
                                                    <Text style={{ fontSize: 14, color: '#010101' }}>
                                                        {option}
                                                    </Text>
                                                </View>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                ))}
                            </View>


                            {rightOrWrong[index] != null && (
                                <Markdown style={{ body: { marginTop: 10, color: rightOrWrong[index] ? '#4de136' : '#b21f1f' } }}>
                                    {question.explanation ?? ""}
                                </Markdown>
                            )}


                        </View>
                    ))}



                </ScrollView>
            ) : (type == "knowledge" || type == "knowledge-revision") ? (
                
                <ScrollView style={{ flex: 1, padding: 16 }}>
                 
                     

                    {(Array.isArray(data) ? data : data?.topics || []).map((knowledge: Knowledge, index: number) => (
                        <View style={{
                            marginTop: 0
                        }}
                        key={index}>
                            <Markdown style={{
                                body: { fontSize: 30, color: '#924ed1', fontWeight: 'bold' },
                                heading1: { fontSize: 30, color: '#924ed1', fontWeight: 'bold' },
                                heading2: { fontSize: 30, color: '#924ed1', fontWeight: 'bold' },
                            }}>
                                {knowledge.title ?? ""}
                            </Markdown>

                            {knowledge.points.map((points: string, subIdx: number) => (
                                <Markdown key={subIdx}>
                                    {points ?? ""}
                                </Markdown>
                            ))}

                            <View style={{
                                paddingBottom: 10,
                                marginBottom: 10,
                                borderBottomColor: '#ffffff',
                                borderBottomWidth: 1
                            }}></View>
                        </View>
                    ))}
                    
                </ScrollView>
            ) : (type == "answers") ? (
                <ScrollView style={{ flex: 1, padding: 16 }}>
                    <Text style={{
                        fontSize: 30,
                        fontWeight: 'bold',
                        marginBottom: 20,
                        color: "#b941e1"
                    }}>Answers</Text>
                    {(Array.isArray(data) ? data : data?.questions || [data]).map((answers: Answers, index: number) => (
                        <View style={{ 
                            gap: 3

                        }} key={index}>
                            <Text style={{
                                fontSize: 20,
                                fontWeight: 'bold',
                                
                            }}>
                                Question {index + 1}
                            </Text>

                            <Text style={{
                                color: '#a91dd3'
                            }}>
                                The answer is: {answers.answer}
                            </Text>


                            <Markdown>
                                {answers.explanation ?? ""}
                            </Markdown>

                            <View style={{
                                paddingBottom: 10,
                                marginBottom: 10,
                                borderBottomColor: '#ffffff',
                                borderBottomWidth: 1
                            }}>
                                
                            </View>
                        </View>
                    ))}

                </ScrollView>
            ) : (type == "marking" || type == "markingNoAnswer") ? (
                <ScrollView contentContainerStyle={{ padding: 16 }}>
                    <Text style={{
                        fontSize: 30,
                        fontWeight: 'bold',
                        color: '#d16dff'
                    }}>
                        Score: {data?.results ? `${data.results.filter((r: any) => r.isCorrect).length}/${data.results.length}` : "N/A"}
                    </Text>

                    <Markdown style={{ body: { marginTop: 8 } }}>{data?.feedback ?? ""}</Markdown>
                    
                    
                    {data?.results?.map((r: any, i: number) => (
                        <View key={i} style={{ marginTop: 12, padding: 10, backgroundColor: r.isCorrect ? '#e8f5e9' : '#ffebee', borderRadius: 8 }}>
                            <Text style={{ fontWeight: 'bold' }}>Question {i + 1}: {r.question?.replace(/^\d+[.)]\s*/, "")}</Text>
                            <Text>Your answer: {r.studentAnswer ?? ""}</Text>
                       
                            <Markdown>{r.explanation ?? ""}</Markdown>
                        </View>
                    ))}
                </ScrollView>
            ) : (
                <ScrollView style={{
                    gap: 10
                }}>

                    <Markdown>
                        Summary of common mistakes: {JSON.stringify(data) ?? ""}
                    </Markdown>


                </ScrollView>

            )}


            <View style={{ paddingVertical: 12, alignItems: 'center' }}>
                {(type != "marking" && type != "answers" && type != "knowledge" && type != "knowledge-revision") ? 
                (
                <Button onPress={() => CompileData()} text={"log"} iconName="document-text" disabled={isCompiling}>

                </Button>
                ) : (
              
                        <Button onPress={() => router.push(
                            { 
                                pathname: '/Log', 
                                params: { materialName, answerFileUri, answerFileHash, fileUri, bucketPath, answerBucketPath, topic, fileHash, alreadyAnswerBucket, alreadyBucket, answerFileName, summary } 
                            
                            })} text={"complete"} iconName="checkmark-circle">
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
