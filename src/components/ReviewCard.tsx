import { globalStyles } from "@/styles/global"
import { View, Text } from "react-native"

import Button from "./Button"

interface ConceptNScoreNReason {
    concept: string
    score: number
    reason: string
}

interface Log {
    topics: ConceptNScoreNReason[]
    summary: string
}


export default function ReviewCard({data}: {data: Log}) {


    return (
        <View>
            {data && (
                <View style={{
                        flexDirection: "column",
                        gap: 20
                    }}>
                    <View style={{
                        flexDirection: "column",
                        gap: 5
                    }}>

                        <Text style={globalStyles.header}>
                            Weak concepts
                        </Text>
                        {data.topics.filter((ConceptNScoreNReason: ConceptNScoreNReason) => (
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

                        <Text style={globalStyles.header}>
                            Strong concepts
                        </Text>
                        {data.topics.filter((ConceptNScoreNReason: ConceptNScoreNReason) => (
                            ConceptNScoreNReason.score > 5
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
                        ))
                        
                        
                        }

                    </View>
                    
                    <View>

                        <Text>
                            {data.summary}
                        </Text>

                    </View>

                    
                </View>

   
            )}


        </View>
    )
}