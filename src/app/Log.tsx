

import { useLocalSearchParams } from 'expo-router'
import { View, Text, ActivityIndicator } from 'react-native'
import { globalStyles } from '@/styles/global'
import { useRouter } from 'expo-router'
import { use, useState } from 'react'

import Button from '@/components/Button'
import fetchAllFolders from "@/utils/fetchAllFolders"

import { useQuery } from '@tanstack/react-query'

import ReviewCard from '@/components/ReviewCard'

import { supabaseClient } from '@/configs/supabaseClient'

import { useUserStore } from '@/stores/userStore'

import TagInput from '@/components/TagInput'
export default function Log() {

    const userId = useUserStore((state) => state.userId)

    const { data: allFolders, error: error2 } = useQuery({
        queryKey: ["folders", userId],
        queryFn: () => fetchAllFolders(userId!),
        enabled: !!userId,
    });


    const [isSaving, setIsSaving] = useState(false)

    const router = useRouter();
    const { logSummary, topic, score, materialName, materialId, bucketPath, autoLog, sourceUri } = useLocalSearchParams<{ logSummary: string, topic: string, score: string, materialName: string, materialId: string, bucketPath: string, autoLog: string, sourceUri: string }>()
    const data = logSummary ? JSON.parse(logSummary) : null

    const [selectedFolder, setSelectedFolder] = useState("")
    const [selectedDescp, setSelectedDescp] = useState("")
    const [isLogging, setIsLogging] = useState(false)

    async function handleStore(selectedDescp: string, selectedFolder: string) {
        setIsSaving(true)
        try {
            const parsed = data ?? {}

            console.log("1")
            const { error } = await supabaseClient
                .from("materials")
                .upsert({
                    user_id: userId,
                    material_name: materialName,
                    material_id: materialId,
                    file_path: bucketPath,
                    source_uri: sourceUri,
                    score_table: parsed.topics,
                    summary: parsed.summary,
                    topic: selectedDescp,
                    folder: selectedFolder
                })

            if (!autoLog) {
                const { error: errorScore } = await supabaseClient
                    .from("topic_scores")
                    .insert({
                        user_id: userId,
                        topic: topic,
                        score: parseInt(score)
                    })
            }



            router.push('/Index')
        } catch (err) {
            console.error("Failed to save material and score:", err)
        } finally {
            setIsSaving(false)
        }
    }





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
                    <TagInput allTags={data?.topic_tags ?? []} placeholder="Topic that this folder classifies under" query={selectedDescp} setQuery={setSelectedDescp} />

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