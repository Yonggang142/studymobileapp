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

    const formatDate = (iso: string) => {
        const d = new Date(iso)
        const date = d.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric' })
        const time = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
        return `${date} | ${time}`
    }

   
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
                        fontWeight: "bold",
                        flexWrap: 'wrap',
                        maxWidth: 300,
                        textAlign: 'center'
                    }}>
                        Are you sure you want to delete the file?
                    </Text>

                    <Button text="yes" iconName="checkmark" onPress={() => {deleteFile(showMoreInfo.material_id, showMoreInfo.file_path); setWarningPopup(false); setShowMoreInfo(null)}}/>

                     <Button text="no" iconName="close" onPress={() => setWarningPopup(false)}/>

                </View>

            )}

            {isLoading && (
                <View style={{ position: 'absolute', zIndex: 10, top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)' }}>
                    <ActivityIndicator size="large" />
                </View>
            )}

            {showMoreInfo ? (
                <View style={{
                    flex: 1,
                    margin: 20
                }}>



               
                    <ReviewCard data={{topics: showMoreInfo.score_table, summary: showMoreInfo.summary}}/>
                
    
                    
                   <View style={{
                        flexDirection: 'row',
                        justifyContent: 'center',
                        gap: 10,
                        marginBottom: 10,
                        marginTop: 20
                   }}>
                      <TouchableOpacity style={[{
                        backgroundColor: '#c14df2',
                        width: 60,
                        height: 60,
                        borderRadius: 30,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }, isLoading && { opacity: 0.4 }]}
                      onPress={(e) => {e.stopPropagation(); downloadFile(showMoreInfo.file_path, showMoreInfo.material_name)}} disabled={isLoading}>
                        <Ionicons color={"#ffffff"} name="download" size={30}/>
                        </TouchableOpacity>


                        <TouchableOpacity style={[{
                            backgroundColor: '#c14df2',
                            width: 60,
                            height: 60,
                            borderRadius: 30,
                            alignItems: 'center',
                            justifyContent: 'center',
                        }, isLoading && { opacity: 0.4 }]}
                        onPress={(e) => {e.stopPropagation(); setWarningPopup(true)}} disabled={isLoading}>
                            <Ionicons color={"#ffffff"} name="trash" size={30}/>
                        </TouchableOpacity>

                        <TouchableOpacity style={[{
                            backgroundColor: '#c14df2',
                            width: 60,
                            height: 60,
                            borderRadius: 30,
                            alignItems: 'center',
                            justifyContent: 'center',
                        }, isLoading && { opacity: 0.4 }]}
                        onPress={(e) => {e.stopPropagation(); setSelectedMaterial(showMoreInfo.material_id)}} disabled={isLoading}>
                            <Ionicons color={"#ffffff"} name="move" size={30}/>
                        </TouchableOpacity>
                    </View> 
                  

                    <Button text="back" iconName="arrow-back" onPress={() => setShowMoreInfo(null)}/>
                   



                     {selectedMaterial && (
                        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: '#ffffff', borderRadius: 20 }}>
                            
                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                marginBottom: 10
                            }}>


                                <Text style={{ color: '#b85afb', fontSize: 20, fontWeight: 'bold' }}>Move to folder</Text> 

                                <TouchableOpacity style={{marginLeft: 'auto'}}onPress={() => setSelectedMaterial(null)}>
                                    <Ionicons name='exit-outline' size={30} color={"#c32bff"} />

                                </TouchableOpacity>
                            </View>
                            {folderNames?.filter(f => f !== folderPopup).map(folder => (
                                <TouchableOpacity style={{
                                    flexDirection: 'row',
            
                                    alignItems: 'center'
                                }} key={folder} onPress={() => { moveFile(selectedMaterial, folder); setSelectedMaterial(null) }}>
                                    <Ionicons name='folder' size={30} color={"#c32bff"} />

                                    <Text style={{
                                        paddingLeft: 10,
                                        fontSize: 17,
                                        fontWeight: 'semibold'
                                    }}>
                                        {folder}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                            
                        </View>
                    )}

                </View>

            ) : (
                <View style={{ flex: 1, paddingTop: 50, paddingHorizontal: 20}}>

                    <Text style={{
                        fontSize: 30,
                        fontWeight: "bold",

                    }}>
                        Folder
                    </Text>
                    <ScrollView style={{ 
                        flex: 1, 
                        marginTop: 20,
                        borderRadius: 20,
                        backgroundColor: "#ffffff",
                        paddingTop: 10
                    }} contentContainerStyle={{ flexGrow: 1 }}>
                        
                        {folderNames.length ? (folderNames.map((item: string) => (
                            <TouchableOpacity style={{
                                backgroundColor: '#ffffff',
                                flexDirection: 'column',
                                
                                padding: 7,
                                marginHorizontal: 10
                               

                            }}
                            key={item} onPress={() => setFolderPopup(folderPopup === item ? "" : item)}>
                                
                            <View style={{
                                flexDirection: 'row',
                                alignItems: "center",
                            }}>
                                <Ionicons name='folder' size={30} color={"#c32bff"} />

                                <Text style={{
                                    paddingLeft: 20,
                                    fontSize: 17,
                                    fontWeight: 'semibold'
                                }}>
                                    {item}
                                </Text>
                            </View>
                            

                                {folderPopup != "" && data && item == folderPopup && data.filter((item) => item.folder == folderPopup).map((item) => (
                                    <TouchableOpacity style={{marginLeft: 20, marginVertical: 10}} key={item.material_id} onPress={() => setShowMoreInfo(item)}>
                    

                                        <View style={{
                                            flexDirection: 'row',
                                           
                                            alignItems: 'center'
                                        }}>
                                            <Ionicons name="document" size={25} color={"#c333e7"} />

                                            <Text style={{
                                                fontSize: 15,
                                                marginLeft: 10
                                                
                                            }}>
                                                {item.material_name}
                                            </Text>
                                        </View>
                                        

                                        <View style={{
                                            flexDirection: 'row',
                                           
                                            alignItems: 'center'
                                        }}>
                                            <Text style={{
                                                fontSize: 17,
                                                fontWeight: 'semibold'
                                            }}>
                                                {"Created at: "}
                                            </Text>

                                            <Text style={{
                                                fontSize: 15,
                                                color: '#aa18e0'
                                            }}>
                                                {formatDate(item.created_at)}
                                            </Text>
                                        </View>


                                         <View style={{
                                            flexDirection: 'row',
                                           
                                            alignItems: 'center'
                                        }}>
                                            <Text style={{
                                                fontSize: 17,
                                                fontWeight: 'semibold'
                                            }}>
                                                {"Topic: "}
                                            </Text>

                                            <Text style={{
                                                fontSize: 15,
                                                color: '#aa18e0'
                                            }}>
                                                {item.topic}
                                            </Text>
                                        </View>

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
                        <Button text="Add material" iconName="add" onPress={() => { 
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




