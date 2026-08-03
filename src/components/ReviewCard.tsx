import { globalStyles } from "@/styles/global"
import { View, Text } from "react-native"

import Button from "./Button"
import { Ionicons } from "@expo/vector-icons"

interface ConceptNScoreNReason {
    concept: string
    score: number
    reason: string
}

interface Log {
    topics: ConceptNScoreNReason[]
    summary: string
}


export default function ReviewCard({ data }: { data: Log }) {


    return (
        <View>
            {data && (
                <View style={{
                    flexDirection: "column",
                    gap: 20,
                    marginTop: 50
                }}>
                    <View style={{
                        flexDirection: "column",
                        gap: 5
                    }}>

                        <Text style={{
                            color: '#ab88e4',
                            fontSize: 30,
                            fontWeight: 'bold'
                        }}>
                            Weak concepts
                        </Text>

                        {!data?.topics &&
                            <View style={{
                                borderRadius: 10,
                                backgroundColor: '#fefefe',
                                padding: 10,
                                flexDirection: 'row'
                            }}>

                                <Ionicons color={"#ab88e4"} name='book-outline' size={30} />

                                <Text style={{
                                    color: '#ab88e4',
                                    fontSize: 20,
                                    fontWeight: 'bold',
                                    marginLeft: 10
                                }}>
                                    None
                                </Text>
                            </View>}
                        {data?.topics?.filter((ConceptNScoreNReason: ConceptNScoreNReason) => (
                            ConceptNScoreNReason.score <= 5
                        )).map((ConceptNScoreNReason: ConceptNScoreNReason, idx: number) => (
                            <View key={idx}>

                                <Text >
                                    Score: {ConceptNScoreNReason.score}
                                </Text>

                                <Text >
                                    Concept: {ConceptNScoreNReason.concept}
                                </Text>

                                <Text >
                                    Reason for score: {ConceptNScoreNReason.reason}
                                </Text>
                            </View>
                        ))}

                    </View>


                    <View>

                        <Text style={{
                            color: '#ab88e4',
                            fontSize: 30,
                            fontWeight: 'bold',
                            marginBottom: 10
                        }}>
                            Strong concepts
                        </Text>

                        {!data?.topics &&
                            <View style={{
                                borderRadius: 10,
                                backgroundColor: '#fefefe',
                                padding: 10,
                                flexDirection: 'row'
                            }}>

                                <Ionicons color={"#ab88e4"} name='book-outline' size={30} />

                                <Text style={{
                                    color: '#ab88e4',
                                    fontSize: 20,
                                    fontWeight: 'bold',
                                    marginLeft: 10
                                }}>
                                    None
                                </Text>
                            </View>}
                        {data?.topics?.filter((ConceptNScoreNReason: ConceptNScoreNReason) => (
                            ConceptNScoreNReason.score > 5
                        )).map((ConceptNScoreNReason: ConceptNScoreNReason, idx: number) => (
                            <View key={idx} style={{
                                borderRadius: 10,
                                backgroundColor: '#fefefe',
                                padding: 10,
                                flexDirection: 'row'
                            }}>

                                <View style={{
                                    flexDirection: 'row'
                                }}>
                                    <Ionicons color={"#966aac"} name='book-outline' size={30} />

                                    <Text style={{
                                        color: '#966aac',
                                        fontSize: 20,
                                        fontWeight: 'bold',
                                        marginLeft: 10
                                    }}>
                                        Concept: {ConceptNScoreNReason.concept}
                                    </Text>

                                </View>

                                <Text>
                                    Score: {ConceptNScoreNReason.score}
                                </Text>



                                <Text>
                                    Reason for score: {ConceptNScoreNReason.reason}
                                </Text>
                            </View>
                        ))


                        }

                    </View>

                    <View>

                        <Text style={{
                            fontSize: 15,
                            fontWeight: 'semibold'
                        }}>
                            {data.summary}
                        </Text>

                    </View>


                </View>


            )}


        </View>
    )
}
