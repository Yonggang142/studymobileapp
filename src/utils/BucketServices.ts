

const BUCKET = "materials";

import { supabaseClient } from "@/config/supabaseClient";
import * as Crypto from "expo-crypto";

export async function getFileHash(fileUri: string): Promise<string | null> {
  try {
    const response = await fetch(fileUri)
    const arrayBuffer = await response.arrayBuffer()
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
    return await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      base64
    )
  } catch (err) {
    console.error("Hash failed:", err)
    return null
  }
}

export async function uploadToBucket(userId: string, materialId: string, fileUri: string) {
  
  console.log("uploadToBucket — fetching:", fileUri)
  const response = await fetch(fileUri)
  const arrayBuffer = await response.arrayBuffer()
  
  const path = `${userId}/${materialId}`
  
  // Pass ArrayBuffer directly — Supabase storage accepts it
  const { error } = await supabaseClient.storage
    .from(BUCKET)
    .upload(path, arrayBuffer, { contentType: response.headers.get("content-type") || "application/octet-stream", upsert: true });

  if (error) {
    console.error("Bucket upload failed:", error);
    throw error;
  }

  return path;
}



export async function downloadFromBucket(bucketFilePath: string) {
  if (!bucketFilePath) return null;

  // Use signed URL + fetch to avoid Expo's broken response.blob()
  const { data: signedData, error: signedError } = await supabaseClient.storage
    .from(BUCKET)
    .createSignedUrl(bucketFilePath, 300);

  if (signedError || !signedData?.signedUrl) {
    console.error("Signed URL failed:", signedError);
    return null;
  }

  const response = await fetch(signedData.signedUrl);
  if (!response.ok) {
    console.error("Download fetch failed:", response.status);
    return null;
  }

  return response.arrayBuffer();
}
