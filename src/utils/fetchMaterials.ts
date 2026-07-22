import { supabaseClient } from "@/configs/supabaseClient"

export async function fetchMaterials(userId: string) {
    
    const { data } = await supabaseClient
        .from("materials")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

    return data
}