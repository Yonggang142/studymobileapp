import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView} from "react-native"
import { useUserStore } from "@/stores/userStore"
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabaseClient } from "@/config/supabaseClient"

import { useMemo, useState } from "react"

import { useRouter } from 'expo-router'
import { Ionicons } from "@expo/vector-icons"

import { downloadFromBucket } from "../../utils/bucketServices"
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import Button from "@/components/Button"

import Log from "../Log"
import ReviewCard from "@/components/ReviewCard"
import { fetchMaterials } from '@/utils/fetchMaterials'

import { globalStyles } from "@/styles/global"


interface ConceptNScoreNReason {
    concept: string
    score: number
    reason: string
}



interface Material {
    material_id: string
    title: string
    created_at: string
    material_name: string
    file_path: string
    folder: string
    score_table: ConceptNScoreNReason[]
    summary: string
}



export default function Materials() {

    const [folderPopup, setFolderPopup] = useState("")
    const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null)
    const router = useRouter()
    const userId = useUserStore((state) => state.userId)

    const [showMoreInfo, setShowMoreInfo] = useState<Material | null>(null)
    const [isLoading, setIsLoading] = useState(false)
   
    const [warningPopup, setWarningPopup] = useState(false)
    const queryClient = useQueryClient()
    const { data, error } = useQuery({
        queryKey: ["materials", userId],
        queryFn: () => fetchMaterials(userId!),
        enabled: !!userId,
    });

    // console.log(data)

    async function downloadFile(path: string, filename: string) {
        if (!path) return
        setIsLoading(true)
        try {
            const arrayBuffer = await downloadFromBucket(path)
            if (!arrayBuffer) return

            const file = new File(Paths.document, filename);
            const bytes = new Uint8Array(arrayBuffer);  
            await file.write(bytes);
            await Sharing.shareAsync(file.uri);

        } catch (err) {
            console.error('Download failed:', err)
            useUserStore.getState().showToast("Download failed")
        } finally {
            setIsLoading(false)
        }
    }

    const folderNames = useMemo(() => 
        data ? [...new Set(data.map(item => item.folder))] : []
    , [data])

   
    async function deleteFile(materialId: string, filePath: string) {
        
        setIsLoading(true)
        try {
        // Delete from Supabase storage first
        if (filePath) {
            await supabaseClient.storage.from('materials').remove([filePath])
        }
        const { error } = await supabaseClient
            .from("materials")
            .delete()
            .eq("user_id", userId)
            .eq("material_id", materialId)

        if (error) console.error(error)
        else queryClient.invalidateQueries({ queryKey: ["materials", userId] })
        } finally {
            setIsLoading(false)
        }
    }


    async function moveFile(materialId: string, newFolder: string) {
        setIsLoading(true)
        try {
        const { error } = await supabaseClient
            .from("materials")
            .update({folder: newFolder})
            .eq("user_id", userId)
            .eq("id", materialId)

        if (error) console.error(error)
        else queryClient.invalidateQueries({ queryKey: ["materials", userId] })
        } finally {
            setIsLoading(false)
        }

    }

    console.log(folderNames)

    return (
        <>  

     

            {warningPopup && showMoreInfo && (
                <View style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    zIndex: 20,
         
                }}>
                    <Text style={{
                        fontSize:25,
                        color: '#ffffff',
                        fontWeight: "bold"
                    }}>
                        Are u sure u wannt deleted
                    </Text>

                    <Button text="yessir" onPress={() => {deleteFile(showMoreInfo.material_id, showMoreInfo.file_path); setWarningPopup(false); setShowMoreInfo(null)}}/>

                     <Button text="no thx" onPress={() => setWarningPopup(false)}/>

                </View>

            )}

            {isLoading && (
                <View style={{ position: 'absolute', zIndex: 10, top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)' }}>
                    <ActivityIndicator size="large" />
                </View>
            )}

            {showMoreInfo ? (
                <View>



               
                    <ReviewCard data={{topics: showMoreInfo.score_table, summary: showMoreInfo.summary}}/>
                
    
                    
                   <View style={{
                        flexDirection: 'row',

                   }}>
                      <TouchableOpacity onPress={(e) => {e.stopPropagation(); downloadFile(showMoreInfo.file_path, showMoreInfo.material_name)}} disabled={isLoading} style={isLoading && { opacity: 0.4 }}>
                        <Ionicons name="download" size={30}/>
                        </TouchableOpacity>


                        <TouchableOpacity onPress={(e) => {e.stopPropagation(); setWarningPopup(true)}} disabled={isLoading} style={isLoading && { opacity: 0.4 }}>
                            <Ionicons name="trash" size={30}/>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={(e) => {e.stopPropagation(); setSelectedMaterial(showMoreInfo.material_id)}} disabled={isLoading} style={isLoading && { opacity: 0.4 }}>
                            <Ionicons name="move" size={30}/>
                        </TouchableOpacity>
                    </View> 
                  

                    <Button text="back" onPress={() => setShowMoreInfo(null)}/>
                   



                     {selectedMaterial && (
                        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: '#1a1a2e' }}>
                            <Text style={{ color: '#fff', marginBottom: 10 }}>Move to folder:</Text>
                            {folderNames?.filter(f => f !== folderPopup).map(folder => (
                                <TouchableOpacity key={folder} onPress={() => { moveFile(selectedMaterial, folder); setSelectedMaterial(null) }}>
                                    <Text>{folder}</Text>
                                </TouchableOpacity>
                            ))}
                            <TouchableOpacity onPress={() => setSelectedMaterial(null)}>
                                <Text style={{ color: '#ff5252', padding: 8 }}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                </View>

            ) : (
                <View style={{ flex: 1 }}>
                    <ScrollView style={{ flex: 1, marginTop: 80, marginHorizontal: 30}} contentContainerStyle={{ flexGrow: 1 }}>
                        
                        {folderNames.length ? (folderNames.map((item: string) => (
                            <TouchableOpacity key={item} onPress={() => setFolderPopup(folderPopup === item ? "" : item)}>
                                <Text>
                                    {item}
                                </Text>

                                {folderPopup != "" && data && item == folderPopup && data.filter((item) => item.folder == folderPopup).map((item) => (
                            <TouchableOpacity style={{marginLeft: 20}} key={item.material_id} onPress={() => setShowMoreInfo(item)}>
                    


                                <Text>
                                    Material name: {item.material_name}
                                </Text>


                                <Text>
                                    Created at: {item.created_at}
                                </Text>


                                <Text>
                                    Topic: {item.topic}
                                </Text>

                            </TouchableOpacity>

                        ))}
                            </TouchableOpacity>
                        ))): (
                            <View style={{
                                alignItems: "center",
                                justifyContent: 'center',
                                flex: 1
                            }}>

                                <Text style={globalStyles.header}>
                                    Respository is empty
                                </Text>


                            </View>
                        )}

                        
                    
                            
                    </ScrollView>


                    <View style={{ paddingBottom: 30, paddingTop: 20}}>
                        <Button text="Add material" onPress={() => { 
                            router.push({
                                pathname: '/AddMaterials',

                            })
                        }}/>
                    </View>
                        
                </View>
            )}
        </>
       
       
    )
}




