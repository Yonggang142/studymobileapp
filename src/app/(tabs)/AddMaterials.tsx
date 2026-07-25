
import { View, Text, Image, ScrollView } from "react-native"
import { ActivityIndicator } from "react-native"
import Button from "@/components/Button"
import { Ionicons } from "@expo/vector-icons"
import { colors, globalStyles } from "@/styles/global"
import { useEffect, useMemo, useState } from "react"
import * as ImagePicker from 'expo-image-picker'
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router'
import { supabaseClient } from "@/configs/supabaseClient"
import { useUserStore } from "@/stores/userStore"
import { downloadFromBucket, uploadToBucket } from "../../utils/BucketServices"
import { TouchableOpacity } from "react-native"

import TagInput from "@/components/TagInput"

import { useQuery } from '@tanstack/react-query'

import fetchProfile from "@/utils/fetchProfile"

import fetchAllFolders from "@/utils/fetchAllFolders"

import { fetchMaterials } from "@/utils/fetchMaterials"

import { useLocalSearchParams } from "expo-router"
import * as Crypto from "expo-crypto"

const testAsset = require("@/testAssets/Probability and Statistics.png")

export default function AddMaterial() {

    const { fileChosenId } = useLocalSearchParams<{ fileChosenId: string }>()



    useEffect(() => {

        async function PutterFiler() {
            if (fileChosenId) {

                const row = dataMaterial?.find((item) => item.material_id?.trim()?.toLowerCase() === query?.trim()?.toLowerCase())
                if (!row) return

                const bucketPath = row.file_url
                const { data } = await supabaseClient.storage
                    .from('materials')
                    .createSignedUrl(bucketPath, 300)

                const url = data?.signedUrl
                if (!url) return

                const fileName = row.title ?? row.material_name ?? 'file'
                const isImage = /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(fileName)

                if (isImage) {
                    setAnswerPhotoUri(url)
                } else {
                    setAnswerFile({
                        name: fileName,
                        uri: url,
                        mimeType: fileName.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream',
                        size: 0,
                    } as DocumentPicker.DocumentPickerAsset)
                }
            }
        }

        PutterFiler()
    }, [])
    const userId = useUserStore((state) => state.userId)
    const router = useRouter();
    const [photoUri, setPhotoUri] = useState<string | null>(null)
    const [file, setFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null)

    const [isLogging, setIsLogging] = useState(false)
    const [isLoading, setIsLoading] = useState(false)


    const [addAnswerSheet, setAddAnswerSheet] = useState(false)
    const [selectedDescp, setSelectedDescp] = useState("")
    const [selectedFolder, setSelectedFolder] = useState("")

    const [answerPhotoUri, setAnswerPhotoUri] = useState<string | null>(null)
    const [answerfile, setAnswerFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null)

    const [query, setQuery] = useState("")


    const { data, error } = useQuery({
        queryKey: ["profile", userId],
        queryFn: () => fetchProfile(userId!),
        enabled: !!userId,
    });


    const { data: allFolders, error: error2 } = useQuery({
        queryKey: ["folders", userId],
        queryFn: () => fetchAllFolders(userId!),
        enabled: !!userId,
    });


    const { data: dataMaterial, error: errorMaterial } = useQuery({
        queryKey: ["materials", userId],
        queryFn: () => fetchMaterials(userId!),
        enabled: !!userId,
    });


    const pickImage = async (type: string) => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            quality: 1,
        })

        if (!result.canceled) {
            const selectedUri = result.assets[0].uri;
            type == "answer" ? setAnswerPhotoUri(selectedUri) : setPhotoUri(selectedUri)

        }
    }

    const pickFile = async (type: string) => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: '*/*',
                multiple: false,
            });

            if (!result.canceled) {
                const selectedFile = result.assets[0];

                type == "answer" ? setAnswerFile(selectedFile) : setFile(selectedFile)

            }
        } catch (error) {
            console.error('Error picking document:', error);
        }
    };




    function handleLogging() {
        setIsLogging(true)
    }

    async function handleSubmitLogs(tag: string, folder: string) {
        try {
            setIsLoading(true)
            console.log("1")
            await supabaseClient
                .from("topic_scores")
                .insert([{ user_id: userId, topic: tag, score: null }])

   
            const name = file?.name || 'image.jpg'
            const uri = file?.uri || photoUri

            if (!uri || !userId) {
                console.log("ABORT handleSubmitLogs — missing uri or userId")
                return
            }

            const materialId = Crypto.randomUUID()
            const bucketPath = await uploadToBucket(userId, materialId, uri)

     
            const {error} =  await supabaseClient
                .from("materials")
                .upsert({
                    user_id: userId,
                    material_name: name,
                    material_id: materialId,
                    file_path: bucketPath,
                    folder: folder,
                    topic: tag,
                    source_uri: uri,
                })
                console.log(error)
            const nameAns = answerfile?.name || 'image.jpg'
            const uriAns = file?.uri || answerPhotoUri
            if (uriAns && userId) {

                const answerMaterialId = Crypto.randomUUID()
                const ansBucketPath = await uploadToBucket(userId, materialId, uri)

                await supabaseClient
                    .from("materials")
                    .upsert({
                        user_id: userId,
                        material_name: name,
                        material_id: answerMaterialId,
                        file_path: ansBucketPath,
                        folder: folder,
                        topic: tag,
                        source_uri: uriAns,
                    })
            }



            router.push({
                    pathname: '/Index',
                })
        } catch (err) {
            console.log("failed to submit tags")
        } finally {
            setFile(null)
            setPhotoUri(null)
            setSelectedFolder("")
            setSelectedDescp("")
            setIsLogging(false)
            setIsLoading(false)
        }

    }


    const getBlobFromUri = (uri: string): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.onload = () => resolve(xhr.response as Blob);
            xhr.onerror = () => reject(new TypeError('Network request failed'));
            xhr.responseType = 'blob';
            xhr.open('GET', uri, true);
            xhr.send(null);
        });
    };


    const handleUpload = async (type: string) => {

        setIsLoading(true)
        try {

            const materialId = Crypto.randomUUID()

            const name = file?.name || 'image.jpg'
            const uri = file?.uri || photoUri

            if (!uri || !userId) {
                console.log("ABORT — uri:", uri, "userId:", userId)
                return
            }

            const bucketPath = await uploadToBucket(userId, materialId, uri)
            console.log("1")


            console.log(error)

            console.log("2")
            const formData = new FormData()

            if (photoUri) {
                console.log("3")

                const blob = await getBlobFromUri(photoUri);

                formData.append('file', blob, 'image.jpg');


            }


            if (file?.uri) {
                console.log("4")
                const fileBlob = await getBlobFromUri(file.uri)
                formData.append('file', fileBlob, file.name)
            }

            if (type == "marking") {
                if (answerPhotoUri) {
                    const ansBlob = await getBlobFromUri(answerPhotoUri)
                    formData.append('answerFile', ansBlob, 'answer.jpg')
                }

                if (answerfile?.uri) {
                    const ansFileBlob = await getBlobFromUri(answerfile.uri)
                    formData.append('answerFile', ansFileBlob, answerfile.name)
                }
            }


            formData.append('type', type)

            const response = await fetch(`${process.env.EXPO_PUBLIC_SERVER_URL}/api/analysis`, {
                method: "POST",
                body: formData,
            })
            console.log("5")
            // create material path here

            const data = await response.json()
            console.log(data)
            if (data?.content) {
                console.log("6")
                router.push({
                    pathname: '/Results',
                    params: { type: type, content: data.content, materialId: materialId, materialName: name, bucketPath: bucketPath, sourceUri: uri },
                })
            }

        } catch (err) {
            console.log("Error: ", err)
        } finally {
            setIsLoading(false)
        }
    }
    /*
    const testPhoto = function () {
        // Use a public image URL for testing — gives a real HTTP URI that fetch/FormData can handle
        setPhotoUri("https://picsum.photos/400/400")
    }
    */


    const allMaterials = useMemo(() => {
        if (!dataMaterial) return []
        return dataMaterial.map((item) => item.material_name)
    }, [dataMaterial])


    async function handleSubmit() {
        const row = dataMaterial?.find((item) => item.material_name?.trim().toLowerCase() === query?.trim().toLowerCase())
        if (!row) return

        const bucketPath = row.file_url
        const { data } = await supabaseClient.storage
            .from('materials')
            .createSignedUrl(bucketPath, 300)

        const url = data?.signedUrl
        if (!url) return

        const fileName = row.title ?? row.material_name ?? 'file'
        const isImage = /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(fileName)

        if (isImage) {
            setAnswerPhotoUri(url)
        } else {
            setAnswerFile({
                name: fileName,
                uri: url,
                mimeType: fileName.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream',
                size: 0,
            } as DocumentPicker.DocumentPickerAsset)
        }

        handleUpload("marking")
    }


    // console.log(dataMaterial)
    return (
        <ScrollView contentContainerStyle={{
            flexGrow: 1,
            alignItems: 'center',
            justifyContent: 'center',
        }}>
            {(isLoading) && (
                <View pointerEvents="none" style={{ position: 'absolute', zIndex: 10, top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)' }}>
                    <ActivityIndicator size="large" color="#ffffff" />
                </View>
            )}


            {isLogging ? (
                <View style={{
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 300,
                    gap: 6,
                }}>
                    <Text style={globalStyles.header}>
                        Give precise, descriptions to your stuff
                        Or match previous descriptions
                    </Text>
                    <TagInput allTags={data?.topic_tags ?? []} placeholder="Topic that this folder classifies under" query={selectedDescp} setQuery={setSelectedDescp} />

                    <TagInput allTags={allFolders ?? []} placeholder="Folder to place document under" query={selectedFolder} setQuery={setSelectedFolder} />

                    <Button onPress={() => handleSubmitLogs(selectedDescp, selectedFolder)} text={"Enter"}>

                    </Button>

                    <Button text="Back" onPress={() => { setIsLogging(false); setAddAnswerSheet(false); }}></Button>




                </View>
            ) : ((photoUri || file) ? (

                <View style={{
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 300,
                    gap: 6,
                }}>

                    {!addAnswerSheet ? (
                        <>
                            {photoUri && (
                                <Image source={{ uri: photoUri }} style={{ width: 250, height: 250, borderRadius: 8 }} />
                            )}
                            {file && (
                                <View style={{ padding: 20, backgroundColor: colors.surface, borderRadius: 8 }}>
                                    <Ionicons name="document" size={48} color={colors.text} />
                                    <Text style={{ color: colors.text, marginTop: 8 }}>{file.name}</Text>
                                </View>
                            )}

                            <Button width={300} text="Mark this, i have no answer sheet" onPress={() => handleUpload("markingNoAnswer")} disabled={isLoading} />

                            <Button width={300} text="Give the right answers" onPress={() => handleUpload("answers")} disabled={isLoading} />
                            <Button width={300} text="Create a MCQ quiz" onPress={() => handleUpload("mcq")} disabled={isLoading} />
                            <Button width={300} text="Provide key knowledge points" onPress={() => handleUpload("knowledge")} disabled={isLoading} />
                            <Button width={300} text="Skip and Store it" onPress={() => handleLogging()} disabled={isLoading} />

                            <Button width={300} text="Mark my quiz with answer sheet" onPress={() => setAddAnswerSheet(true)} disabled={isLoading} />
                            <Button text="Back" onPress={() => { setPhotoUri(null); setFile(null) }} disabled={isLoading}></Button>
                        </>

                    ) : (

                        <View>
                            



                            {(answerPhotoUri || answerfile) && (
                                <>
                                    {answerPhotoUri && (
                                    <Image source={{ uri: answerPhotoUri }} style={{ width: 250, height: 250, borderRadius: 8 }} />
                                    )}
                                    {answerfile && (
                                        <View style={{ padding: 20, backgroundColor: colors.surface, borderRadius: 8 }}>
                                            <Ionicons name="document" size={48} color={colors.text} />
                                            <Text style={{ color: colors.text, marginTop: 8 }}>{answerfile.name}</Text>
                                        </View>
                                    )}
                                    <Button text="Score paper" onPress={() => handleUpload("marking")} disabled={isLoading}></Button>

                                </>
                                
                            )}



                            <Button onPress={() => pickImage("answer")} width={200} disabled={isLoading}>
                                <Ionicons name="add" size={25} color={"#ffffff"} />
                                <Text style={{ color: "#ffffff", paddingLeft: 7 }}>
                                    New Material from Camera
                                </Text>
                            </Button>

                            <Button onPress={() => pickFile("answer")} width={200} disabled={isLoading}>
                                <Ionicons name="add" size={25} color={"#ffffff"} />
                                <Text style={{ color: "#ffffff", paddingLeft: 7 }}>
                                    New Material from Files
                                </Text>
                            </Button>


                            <View>
                                <Button onPress={() => handleSubmit()} width={200} disabled={isLoading}>
                                    <Ionicons name="add" size={25} color={"#ffffff"} />
                                    <Text style={{ color: "#ffffff", paddingLeft: 7 }}>
                                        New Material from Respository
                                    </Text>
                                </Button>
                                <TagInput allTags={allMaterials ?? []} query={query} setQuery={setQuery}>

                                </TagInput>


                            </View>

                        </View>
                    )}
                </View>


            ) : (

                <View style={{
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 16
                }}>
                    <Button onPress={() => pickImage("worksheet")} width={200}>
                        <Ionicons name="add" size={25} color={"#ffffff"} />
                        <Text style={{ color: "#ffffff", paddingLeft: 7 }}>
                            New Material from Camera
                        </Text>
                    </Button>
                    <Button onPress={() => pickImage("worksheet")} width={200}>
                        <Ionicons name="add" size={25} color={"#ffffff"} />
                        <Text style={{ color: "#ffffff", paddingLeft: 7 }}>
                            New Material from Files
                        </Text>
                    </Button>
                    {/* 
                    <Button onPress={testPhoto} width={200}>
                        <Text style={{ color: "#ffffff", paddingLeft: 7 }}>
                            TestPhoto
                        </Text>
                    </Button>

                    */}
                </View>

            ))}


        </ScrollView>
    )
}