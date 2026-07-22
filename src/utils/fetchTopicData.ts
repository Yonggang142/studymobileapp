import { supabaseClient } from "@/configs/supabaseClient";

export default async function fetchTopics(userId: string | null) {

    const { data, error } = await supabaseClient
    .from("topic_scores")
    .select("*")
    .eq("user_id", userId)
    

    if (error) {
        console.log("Error: ", error)
        return 
    }

    return data

}
