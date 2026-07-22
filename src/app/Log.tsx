

import { useLocalSearchParams } from 'expo-router'
import { View, Text } from 'react-native'
import { globalStyles } from '@/styles/global'
import { useRouter } from 'expo-router'

import Button from '@/components/Button'


import ReviewCard from '@/components/ReviewCard'

import { supabaseClient } from '@/configs/supabaseClient'

import { useUserStore } from '@/stores/userStore'
export default function Log() {

    const userId = useUserStore((state) => state.userId)

    const router = useRouter();
    const { logSummary, topic, score } = useLocalSearchParams<{ logSummary: string, topic: string, score: string }>()
    const data = logSummary ? JSON.parse(logSummary) : null
    

    async function handleContinue() {


        /// prompt users to put the topic first
        if (topic) {
            await supabaseClient
                .from("topic_scores")
                .upsert({
                    score: score, 
                    user_id: userId,
                    topic: topic
                })
           
        }

        router.push('/Index')
    }

    function handleDone() {
        router.push('/Index')
    }

    return (
        <>
            <ReviewCard data={data} />
            <Button text="continue without storing" onPress={handleDone}/>
            <Button text="Store the score!" onPress={handleContinue}/>
        


        </>
        
    )

    
}