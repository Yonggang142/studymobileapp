

import { useLocalSearchParams } from 'expo-router'
import { View, Text } from 'react-native'
import { globalStyles } from '@/styles/global'
import { useRouter } from 'expo-router'

import Button from '@/components/Button'

interface Log {
    weak_at: string[]
    strong_at: string[]
    summary: string
}


/*
{
  "weak_at": ["concept 1", "concept 2"],
  "strong_at": ["concept 1", "concept 2"],
  "summary": "Summary of their overall performance pattern"
}
*/ 

export default function Log() {

    const router = useRouter();
    const { logSummary } = useLocalSearchParams<{ logSummary: string }>()
    const data = logSummary ? JSON.parse(logSummary) : null

    function handleContinue() {
        router.push('/Index')
    }

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
                        {data.weak_at.map((concept: string, idx: number) => (
                            <Text>
                                Concept: {concept}
                            </Text>
                        ))}

                    </View>


                    <View>

                        <Text style={globalStyles.header}>
                            Strong concepts
                        </Text>
                        {data.strong_at.map((concept: string, idx: number) => (
                            <Text>
                                Concept: {concept}
                            </Text>
                        ))}

                    </View>
                    
                    <View>

                        <Text>
                            {data.summary}
                        </Text>

                    </View>

                    <Button text="continue" onPress={handleContinue}>
                       
                    </Button>
                </View>

   
            )}


        </View>
    )

    
}