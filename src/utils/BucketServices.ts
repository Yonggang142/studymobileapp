

const BUCKET = "materials";
import { gzipSync, gunzipSync } from "zlib";

import { supabaseClient } from "@/configs/supabaseClient";
import { blob } from "stream/consumers";

export async function uploadToBucket(userId: string, materialId: string, fileUri: string) {
  
  const blob = await fetch(fileUri).then(r => r.blob())
  const path = `${userId}/${materialId}`
  

  const { error } = await supabaseClient.storage
    .from(BUCKET)
    .upload(path, blob, { contentType: blob.type, upsert: true });

  if (error) {
    console.error("Bucket upload failed:", error);
    throw error;
  }

  return path;
}



export async function downloadFromBucket(bucketFilePath: string) {
  if (!bucketFilePath) return null;

  const { data, error } = await supabaseClient.storage
    .from(BUCKET)
    .download(bucketFilePath);

  if (error) {
    console.error("Bucket download failed:", error);
    return null;
  }
  
  return data
}