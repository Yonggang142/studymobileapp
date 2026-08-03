

const BUCKET = "materials";

import { supabaseClient } from "@/config/supabaseClient";
import { File, Paths } from "expo-file-system";
import * as Crypto from "expo-crypto";

// Reads a URI (file://, content://, https://) into raw bytes.
// Uses XHR + Blob.bytes() (RN 0.73+) which is byte-accurate — unlike the
// FileReader base64 + atob round-trip, which can corrupt binary data in Hermes
// and cause inconsistent hashes for the same file.
const readUriAsBytes = (uri: string): Promise<Uint8Array> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.responseType = 'blob';
    xhr.onload = async () => {
      const blob = xhr.response as Blob;
      try {
        const b = blob as any
        if (typeof b.bytes === 'function') {
          resolve(await b.bytes())
          return
        }
      } catch { /* fall through to FileReader fallback */ }
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.includes(',') ? result.split(',')[1] : result;
        resolve(base64ToBytes(base64));
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    };
    xhr.onerror = () => reject(new TypeError('Network request failed'));
    xhr.open('GET', uri, true);
    xhr.send(null);
  });
};

const base64ToBytes = (base64: string): Uint8Array => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
};

const bytesToBase64 = (bytes: Uint8Array): string => {
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)) as never)
  }
  return btoa(binary)
};

export async function persistPickedFile(uri: string, name: string): Promise<string> {
  // Fast path: File API can read this URI directly.
  try {
    const source = new File(uri)
    if (source.exists) {
      const dest = new File(Paths.document, `picked_${Date.now()}_${name}`)
      await source.copy(dest)
      return dest.uri
    }
  } catch { /* fall through to XHR path */ }

  // Fallback: read the raw bytes via XHR + Blob.bytes() (handles file:// DocumentPicker cache URIs
  // that the File API can't read or reports as non-existent), then write into
  // the app's own document directory where the File API CAN read.
  try {
    const bytes = await readUriAsBytes(uri)
    const dest = new File(Paths.document, `picked_${Date.now()}_${name}`)
    await dest.write(bytes)
    return dest.uri
  } catch (err) {
    console.error("persistPickedFile failed:", err)
    return uri
  }
}

export async function getFileHash(fileUri: string): Promise<string | null> {
  // Always hash with ONE method (MD5 of the file's base64 via byte-accurate read).
  // Using the same method for every file keeps hashes consistent across the
  // photo and document paths.
  try {
    const bytes = await readUriAsBytes(fileUri)
    const base64 = bytesToBase64(bytes)
    console.log("getFileHash — bytes:", bytes.length)
    const md5 = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.MD5, base64)
    console.log("getFileHash — md5:", md5)
    return md5
  } catch (err) {
    console.error("Hash failed:", err)
    return null
  }
}

export async function uploadToBucket(userId: string, materialId: string, fileUri: string) {
  
  console.log("uploadToBucket — reading:", fileUri)
  // Read raw bytes via XHR + Blob.bytes() — byte-accurate for binary files.
  const bytes = await readUriAsBytes(fileUri)
  const contentType = mimeFromUri(fileUri) ?? 'application/octet-stream'
  
  const path = `${userId}/${materialId}`
  
  const { error } = await supabaseClient.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType, upsert: true });

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

/** Check if a file with this hash already exists in DB — returns its bucket path */
export async function findExistingFile(userId: string, fileHash: string): Promise<string | null> {
  if (!fileHash) return null
  const { data } = await supabaseClient
    .from("materials")
    .select("file_path")
    .eq("user_id", userId)
    .eq("file_hash", fileHash)
    .limit(1)
    .single()
  return data?.file_path ?? null
}
