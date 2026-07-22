
import { supabaseClient } from "@/configs/supabaseClient"


export default async function fetchAllFolders(userId: string) {
    const { data } = await supabaseClient
        .from("materials")
        .select("folder")
        .eq("user_id", userId)

    const folders = [...new Set(data?.map(r => r.folder) ?? [])]

    return folders
}