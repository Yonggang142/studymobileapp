

const BUCKET = "materials";

import { supabaseClient } from "@/config/supabaseClient";
import { File } from "expo-file-system";

export async function getFileHash(fileUri: string): Promise<string | null> {
  try {
    const file = new File(fileUri)
    if (!file.exists) {
      console.error("Hash failed: file not found at", fileUri)
      return null
    }
    const info = file.info({ md5: true })
    console.log("getFileHash — md5:", info.md5)
    return info.md5 ?? null
  } catch (err) {
    console.error("Hash failed:", err)
    return null
  }
}

export async function uploadToBucket(userId: string, materialId: string, fileUri: string) {
  
  console.log("uploadToBucket — reading:", fileUri)
  // fetch() doesn't support file:// URIs on Android — use expo-file-system File class
  const file = new File(fileUri)
  const arrayBuffer = await file.arrayBuffer()
  const contentType = mimeFromUri(fileUri) ?? 'application/octet-stream'
  
  const path = `${userId}/${materialId}`
  
  const { error } = await supabaseClient.storage
    .from(BUCKET)
    .upload(path, arrayBuffer, { contentType, upsert: true });

  if (error) {
    console.error("Bucket upload failed:", error);
    throw error;
  }

  return path;
}

const mimeFromUri = (uri: string): string | null => {
  const ext = uri.split('.').pop()?.toLowerCase() ?? ''
  const map: Record<string, string> = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg',
    png: 'image/png', gif: 'image/gif',
    webp: 'image/webp', bmp: 'image/bmp',
    pdf: 'application/pdf',
  }
  return map[ext] ?? null
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
