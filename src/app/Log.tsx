

import { useLocalSearchParams } from 'expo-router'
import { View, Text, ActivityIndicator } from 'react-native'
import { globalStyles } from '@/styles/global'
import { useRouter } from 'expo-router'
import { use, useMemo, useState } from 'react'

import Button from '@/components/Button'
import fetchAllFolders from "@/utils/fetchAllFolders"

import { useQuery } from '@tanstack/react-query'

import ReviewCard from '@/components/ReviewCard'

import { supabaseClient } from '@/configs/supabaseClient'

import { useUserStore } from '@/stores/userStore'

import TagInput from '@/components/TagInput'

import { uploadToBucket } from '@/utils/bucketServices'

import fetchTopics from '@/utils/fetchTopicData'


import * as Crypto from "expo-crypto"

export default function Log() {

    const userId = useUserStore((state) => state.userId)

    const { data: allFolders, error: error2 } = useQuery({
        queryKey: ["folders", userId],
        queryFn: () => fetchAllFolders(userId!),
        enabled: !!userId,
    });


    const { data: topicsData, error: errorTopic } = useQuery({
        queryKey: ["topics", userId],
        queryFn: () => fetchTopics(userId!),
        enabled: !!userId,
    });


    const [isSaving, setIsSaving] = useState(false)

    const router = useRouter();
    const { logSummary, topic, score, materialName, fileUri, answerFileName, answerFileUri, autoLog, fileHash, alreadyAnswerBucket, alreadyBucket } = useLocalSearchParams<{ answerFileName: string, logSummary: string, topic: string, score: string, materialName: string, fileUri: string, alreadyAnswerBucket: string, alreadyBucket: string, autoLog: string, answerFileUri: string,  fileHash: string }>()
    const data = logSummary ? JSON.parse(logSummary) : null

    const [selectedFolder, setSelectedFolder] = useState("")
    const [selectedDescp, setSelectedDescp] = useState("")
    const [isLogging, setIsLogging] = useState(false)

    async function handleStore(selectedDescp: string, selectedFolder: string) {
        setIsSaving(true)
        try {
            const parsed = data ?? {}

            //console.log("1")
            let error = null
            if (!alreadyBucket && userId) {

                const materialId = Crypto.randomUUID()

                const bucketPath = uploadToBucket(userId, materialId, fileUri)
                const { error: addError } = await supabaseClient
                    .from("materials")
                    .upsert({
                        user_id: userId,
                        material_id: materialId,
                        material_name: materialName,
                        file_hash: fileHash,
                        file_path: bucketPath,
                        score_table: parsed.topics,
                        summary: parsed.summary,
                        topic: selectedDescp,
                        folder: selectedFolder
                    })
                error = addError
            }
            
            let errorScore = null
            if (!autoLog) {
                const { error: insertError } = await supabaseClient
                    .from("topic_scores")
                    .insert({
                        user_id: userId,
                        topic: topic,
                        score: parseInt(score)
                    })
                errorScore = insertError
            }



            let errorAnswer = null
            if (!alreadyAnswerBucket && userId) {

                const materialId = Crypto.randomUUID()

                const bucketPath = uploadToBucket(userId, materialId, answerFileUri)
                const { error: errorAnswer } = await supabaseClient
                    .from("materials")
                    .upsert({
                        user_id: userId,
                        material_id: materialId,
                        material_name: answerFileName, 
                        file_hash: fileHash,
                        file_path: bucketPath,
                        score_table: parsed.topics,
                        summary: parsed.summary,
                        topic: selectedDescp,
                        folder: selectedFolder
                    })
                error = errorAnswer
            }


            if (!error && !errorScore && !errorAnswer) {
                useUserStore.getState().showToast("File saved!")
            } else {
                useUserStore.getState().showToast(`File saved failure ${error?.message ?? errorScore?.message}`)
            }
            router.push('/Index')
        } catch (err) {
            console.error("Failed to save material and score:", err)
            useUserStore.getState().showToast("Save failed")
        } finally {
            setIsSaving(false)
        }
    }

    const topic_tags = useMemo(() => {

        return [... new Set(topicsData?.map((row) => row.topic))]
        
    }, [topicsData])


    function handleDone() {
        router.push('/Index')
    }

    return (
        <View style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center"
        }}>



            {isSaving && (
                <View style={{ position: 'absolute', zIndex: 10, top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)' }}>
                    <ActivityIndicator size="large" />
                </View>
            )}
            {isLogging ? (
                <View style={{
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 300,
                    gap: 6,
                }}>
                    <Text style={globalStyles.header}>
                        Give precise, descriptions to your stuff
                        Or match previous descriptions
                    </Text>
                    <TagInput allTags={topic_tags ?? []} placeholder="Topic that this folder classifies under" query={selectedDescp} setQuery={setSelectedDescp} />

                    <TagInput allTags={allFolders ?? []} placeholder="Folder to place document under" query={selectedFolder} setQuery={setSelectedFolder} />

                    <Button onPress={() => handleStore(selectedDescp, selectedFolder)} text={"Enter"}>

                    </Button>

                    <Button text="Back" onPress={() => { setIsLogging(false); }}></Button>



                </View>
            ) : (
                <>
                    {!autoLog && <ReviewCard data={data} />}
                    <Button text={autoLog ? "dont store it" : "continue without storing score"} onPress={handleDone} />
                    <Button text={autoLog ? "store the file (no quiz stored btw)" : "store the score!"} onPress={() => setIsLogging(true)} disabled={isSaving} />
                </>
            )}



        </View>

    )


}