import { View, Text, TouchableOpacity} from "react-native"
import { useUserStore } from "@/stores/userStore"
import { useQuery } from '@tanstack/react-query'
import { supabaseClient } from "@/configs/supabaseClient"
import { globalStyles } from "@/styles/global"
import { useMemo, useState } from "react"

import { useRouter } from 'expo-router'
import { Ionicons } from "@expo/vector-icons"

import { downloadFromBucket } from "../../utils/BucketServices"
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

interface Material {
    material_id: string
    title: string
    created_at: string
    material_name: string
    file_path: string
    folder: string
}

async function fetchMaterials(userId: string) {
    
    const { data } = await supabaseClient
        .from("materials")
        .select("material_id, title, created_at, material_name, file_path, folder")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

    return data
}

export default function Materials() {

    const [folderPopup, setFolderPopup] = useState("")
    const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null)
    const router = useRouter()
    const userId = useUserStore((state) => state.userId)

    const [showMoreInfo, setShowMoreInfo] = useState<Material | null>(null)
   

    const { data, error } = useQuery({
        queryKey: [userId],
        queryFn: () => fetchMaterials(userId!),
        enabled: !!userId,
    });


    async function downloadFile(path: string, filename: string) {
        if (!path) return

        try {
            const blob = await downloadFromBucket(path)
            if (!blob) return
            const file = new File(Paths.document, filename);
            const arrayBuffer = await blob.arrayBuffer();
            const bytes = new Uint8Array(arrayBuffer);  
            await file.write(bytes);
            await Sharing.shareAsync(file.uri);

        } catch (err) {
            console.error('Download failed:', err)
        }
    }

    const folderNames = useMemo(() => 
        data ? [...new Set(data.map(item => item.folder))] : []
    , [data])


    async function deleteFile(materialId: string) {
        const { error } = await supabaseClient
            .from("materials")
            .delete()
            .eq("user_id", userId)
            .eq("id", materialId)

        if (error) console.error(error)
    }


    async function moveFile(materialId: string, newFolder: string) {
        const { error } = await supabaseClient
            .from("materials")
            .update({folder: newFolder})
            .eq("user_id", userId)
            .eq("id", materialId)

        if (error) console.error(error)

    }





    
    return (
        <>

            {showMoreInfo ? (
                <View>
                    <TouchableOpacity onPress={() => setShowMoreInfo(null)}>
                        <Text>
                            Back
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={(e) => {e.stopPropagation(); downloadFile(showMoreInfo.file_path, showMoreInfo.material_name)}}>
                        <Ionicons name="download" size={30}/>
                    </TouchableOpacity>


                    <TouchableOpacity onPress={(e) => {e.stopPropagation(); deleteFile(showMoreInfo.material_id)}}>
                        <Ionicons name="trash" size={30}/>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={(e) => {e.stopPropagation(); setSelectedMaterial(showMoreInfo.material_id)}}>
                        <Ionicons name="move" size={30}/>
                    </TouchableOpacity>


                     {selectedMaterial && (
                        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: '#1a1a2e' }}>
                            <Text style={{ color: '#fff', marginBottom: 10 }}>Move to folder:</Text>
                            {folderNames.filter(f => f !== folderPopup).map(folder => (
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
                 <View>
   
                    {folderNames && folderNames.map((item: string) => (
                        <TouchableOpacity key={item} onPress={() => {item == "" ? setFolderPopup(item) : setFolderPopup("")}}>
                            <Text>
                                {item}
                            </Text>
                        </TouchableOpacity>
                    ))}

                    {folderPopup != "" && data && data.filter((item) => item.folder == folderPopup).map((item) => (
                        <TouchableOpacity key={item.material_id} onPress={() => setShowMoreInfo(item)}>
                            <Text style={globalStyles.header}>
                                {item.title}
                            </Text>


                            <Text>
                                {item.material_name}
                            </Text>


                            <Text>
                                {item.created_at}
                            </Text>





                        </TouchableOpacity>

                    ))}

                   
                </View>
            )}
        </>
       
       
    )
}




