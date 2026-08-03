

import { useLocalSearchParams } from 'expo-router'
import { View, Text, ActivityIndicator } from 'react-native'
import { globalStyles } from '@/styles/global'
import { useRouter } from 'expo-router'
import { use, useMemo, useState } from 'react'

import Button from '@/components/Button'
import fetchAllFolders from "@/utils/fetchAllFolders"

import { useQuery, useQueryClient } from '@tanstack/react-query'

import ReviewCard from '@/components/ReviewCard'

import { supabaseClient } from '@/config/supabaseClient'

import { useUserStore } from '@/stores/userStore'

import TagInput from '@/components/TagInput'

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
    const queryClient = useQueryClient()

    const router = useRouter();
    const { logSummary, topic, score, summary, materialName, fileUri, bucketPath, answerBucketPath, answerFileName, answerFileUri, answerFileHash, fileHash, alreadyAnswerBucket, alreadyBucket } = useLocalSearchParams<{ answerFileName: string, logSummary: string, topic: string, score: string, summary: string, materialName: string, fileUri: string, bucketPath: string, answerBucketPath: string, alreadyAnswerBucket: string, alreadyBucket: string, answerFileUri: string, answerFileHash: string, fileHash: string }>()
    const data = logSummary ? JSON.parse(logSummary) : null

    const [selectedFolder, setSelectedFolder] = useState("")
    const [selectedDescp, setSelectedDescp] = useState("")
    const [isLogging, setIsLogging] = useState(false)



    async function handleStore(selectedDescp: string, selectedFolder: string) {
        setIsSaving(true)
        try {
            const parsed = data ?? {}

            let error = null
            if (!alreadyBucket && userId && bucketPath) {
                const materialId = Crypto.randomUUID()
                const { error: addError } = await supabaseClient
                    .from("materials")
                    .upsert({
                        user_id: userId,
                        material_id: materialId,
                        material_name: materialName,
                        file_hash: fileHash,
                        file_path: bucketPath,
                        score_table: parsed.topics,
                        summary: summary || parsed.summary,
                        topic: selectedDescp,
                        folder: selectedFolder
                    })
                error = addError
            }

            let errorScore = null
            if (score) {
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
            if (!alreadyAnswerBucket && userId && answerBucketPath) {
                const materialId = Crypto.randomUUID()
                const { error: ansError } = await supabaseClient
                    .from("materials")
                    .upsert({
                        user_id: userId,
                        material_id: materialId,
                        material_name: answerFileName,
                        file_hash: answerFileHash,
                        file_path: answerBucketPath,
                        score_table: parsed.topics,
                        summary: summary || parsed.summary,
                        topic: selectedDescp,
                        folder: selectedFolder
                    })
                errorAnswer = ansError
            }

            if (!error && !errorScore && !errorAnswer) {
                useUserStore.getState().showToast("File saved!")
                queryClient.invalidateQueries({ queryKey: ["materials", userId] })
                queryClient.invalidateQueries({ queryKey: ["topics", userId] })
                queryClient.invalidateQueries({ queryKey: ["folders", userId] })
            } else {
                useUserStore.getState().showToast(`File saved failure ${error?.message ?? errorScore?.message ?? errorAnswer?.message}`)
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


    async function handleDone() {
        // Discard: delete uploaded files, nothing to keep
        setIsSaving(true)
        try {
            if (bucketPath && !alreadyBucket) {
                await supabaseClient.storage.from('materials').remove([bucketPath])
                await supabaseClient.from('materials').delete().eq('file_path', bucketPath)
            }
            if (answerBucketPath && !alreadyAnswerBucket) {
                await supabaseClient.storage.from('materials').remove([answerBucketPath])
                await supabaseClient.from('materials').delete().eq('file_path', answerBucketPath)
            }
            queryClient.invalidateQueries({ queryKey: ["materials", userId] })
        } catch {
        } finally {
            setIsSaving(false)
        }
        router.push('/Index')
    }

  
    console.log(alreadyBucket)

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
                    <TagInput allTags={topic_tags ?? []} placeholder="Topic of this file" query={selectedDescp} setQuery={setSelectedDescp} />

                    <TagInput allTags={allFolders ?? []} placeholder="Folder of this file" query={selectedFolder} setQuery={setSelectedFolder} />

                    <Button onPress={() => handleStore(selectedDescp, selectedFolder)} text={"Enter"} iconName="enter">

                    </Button>

                    <Button text="Back" iconName="arrow-back" onPress={() => { setIsLogging(false); }}></Button>



                </View>
            ) : (
                <>
                    {score && <ReviewCard data={data} />}
                    {!alreadyBucket && !alreadyAnswerBucket ? (
                        <>
                            <Button text={"Save & go home"} iconName="save" onPress={() => setIsLogging(true)} disabled={isSaving} />
                            <Button text={"Discard"} iconName="close" onPress={handleDone} disabled={isSaving} />
                        </>
                    ) : (
                        <Button text={"Go home"} iconName="home" onPress={() => router.push('/Index')} />
                    )}
                </>
            )}



        </View>

    )


}
