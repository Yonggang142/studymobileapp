import { supabaseClient } from "@/configs/supabaseClient";

export default async function fetchProfile(userId: string | null) {
    const { data, error } = await supabaseClient
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

    if (data) {
        return data
    }

    // row does not exist, insert the row
    const { data : insertData, error: insertError } = await supabaseClient
        .from("profiles")
        .insert({user_id: userId, user_name: "Anonymous"})
        .select()
        .single()


    if (insertError) {
        throw new Error(insertError.message);
    }  

    return insertData
}
