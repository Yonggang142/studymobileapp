import { View, Text, TouchableOpacity} from "react-native"
import { useUserStore } from "@/stores/userStore"
import { useQuery } from '@tanstack/react-query'
import { supabaseClient } from "@/configs/supabaseClient"
import { globalStyles } from "@/styles/global"
import { useState } from "react"

import { useRouter } from 'expo-router'
import { Ionicons } from "@expo/vector-icons"

import { downloadFromBucket } from "../../utils/BucketServices"
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

async function fetchMaterials(userId: string) {
    const { data } = await supabaseClient
        .from("materials")
        .select("material_id, title, created_at, material_name, file_path")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

    return data
}

export default function Materials() {

    const router = useRouter()
    const userId = useUserStore((state) => state.userId)

    
    function showMoreInfo() {
        router.replace('/Auth')
        

    }

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

    return (
        <View>
   
            {data && data.map((item) => (
                <TouchableOpacity key={item.material_id} onPress={showMoreInfo}>
                    <Text style={globalStyles.header}>
                        {item.title}
                    </Text>


                    <Text>
                        {item.material_name}
                    </Text>


                    <Text>
                        {item.created_at}
                    </Text>


                    <TouchableOpacity onPress={(e) => {e.stopPropagation(); downloadFile(item.file_path, item.material_name)}}>
                        <Ionicons name="download" size={30}/>
                    </TouchableOpacity>
                </TouchableOpacity>
            ))}
        </View>
    )
}