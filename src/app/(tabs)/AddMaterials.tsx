
import { View, Text, Image, ScrollView } from "react-native"
import Button from "@/components/Button"
import { Ionicons } from "@expo/vector-icons"
import { colors, globalStyles } from "@/styles/global"
import { useEffect, useState } from "react"
import * as ImagePicker from 'expo-image-picker'
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router'
import { supabaseClient } from "@/configs/supabaseClient"
import { useUserStore } from "@/stores/userStore"
import { uploadToBucket } from "../../utils/BucketServices"
import { TouchableOpacity } from "react-native"

import TagInput from "@/components/TagInput"

import { useQuery } from '@tanstack/react-query'

import fetchProfile from "@/utils/fetchProfile"

export default function AddMaterial() {
    

    const userId = useUserStore((state) => state.userId)
    const router = useRouter();
    const [photoUri, setPhotoUri] = useState<string | null>(null)
    const [file, setFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null)

    const [isLogging, setIsLogging] = useState(false)


    const { data, error } = useQuery({
        queryKey: [userId],
        queryFn: () => fetchProfile(userId!),
        enabled: !!userId,
    });


    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            quality: 1,
        })

        if (!result.canceled) {
            const selectedUri = result.assets[0].uri;
            setPhotoUri(selectedUri);
        }
    }

    const pickFile = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: '*/*',
                multiple: false,
            });

            if (!result.canceled) {
                const selectedFile = result.assets[0];
                setFile(selectedFile);
            }
        } catch (error) {
            console.error('Error picking document:', error);
        }
    };


    function handleLogging() {
        setIsLogging(true)
    }

    async function handleSubmitLogs(newTag: string | null) {
        try {
            if (newTag) {

                await supabaseClient
                    .from("topic_scores")
                    .insert([
                        { user_id: userId, topic: newTag, score: null }
                    ])
            }

            handleUpload("log")
        } catch (err) {
            console.log("failed to submit tags")
        } finally {
            setIsLogging(false)
        }
    }

    const handleUpload = async (type: string) => {
        try {

            const materialId = crypto.randomUUID()

            const name = file?.name || 'image.jpg'
            const uri = file?.uri || photoUri

            if (!uri || !userId) return

            const bucketPath = await uploadToBucket(userId, materialId, uri)

            await supabaseClient
                .from("materials")
                .insert({
                    user_id: userId,
                    title: name,
                    id: materialId,
                    file_url: bucketPath,
                })

            if (type == "log") {
                return
            }



            const formData = new FormData()

            if (photoUri) {
                formData.append('file', {
                    uri: photoUri,
                    name: 'image.jpg',
                    type: 'image/jpeg',
                } as any)
            }


            if (file?.uri) {
                formData.append('file', {
                    uri: file.uri,
                    name: file.name,
                    type: file.mimeType ?? 'application/octet-stream',
                } as any)
            }



            formData.append('type', type)

            const response = await fetch(`${process.env.EXPO_PUBLIC_SERVER_URL}/api/analysis`, {
                method: "POST",
                body: formData,
            })

            // create material path here

            const data = await response.json()

            if (data?.content) {

                const parsed = JSON.parse(data.content)



                router.push({
                    pathname: '/Results',
                    params: { type: type, content: data.content, materialId: materialId },
                })
            }

        } catch (err) {
            console.log("Error: ", err)
        } finally {


        }
    }

    const testPhoto = function () {
        setPhotoUri(".....")
    }

    return (
        <View style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
        }}>
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
                    <TagInput allTags={data?.topic_tags ?? []} onSubmit={handleSubmitLogs}/>
                    
                </View>
            ) : ((photoUri || file) ? (

                    <View style={{
                        flex: 1,
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 300,
                        gap: 6,
                    }}>
                        {photoUri && (
                            <Image source={{ uri: photoUri }} style={{ width: 250, height: 250, borderRadius: 8 }} />
                        )}
                        {file && (
                            <View style={{ padding: 20, backgroundColor: colors.surface, borderRadius: 8 }}>
                                <Ionicons name="document" size={48} color={colors.text} />
                                <Text style={{ color: colors.text, marginTop: 8 }}>{file.name}</Text>
                            </View>
                        )}

                        <Button width={300} text="Give the right answers" onPress={() => handleUpload("answers")} />
                        <Button width={300} text="Create a MCQ quiz" onPress={() => handleUpload("mcq")} />
                        <Button width={300} text="Provide key knowledge points" onPress={() => handleUpload("knowledge")} />
                        <Button width={300} text="Skip and Store it" onPress={() => handleLogging()} />
                    </View>


                ) : (

                    <View style={{
                        flex: 1,
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 16
                    }}>
                        <Button onPress={pickImage} width={200}>
                            <Ionicons name="add" size={25} color={"#ffffff"} />
                            <Text style={{ color: "#ffffff", paddingLeft: 7 }}>
                                New Material from Camera
                            </Text>
                        </Button>
                        <Button onPress={pickFile} width={200}>
                            <Ionicons name="add" size={25} color={"#ffffff"} />
                            <Text style={{ color: "#ffffff", paddingLeft: 7 }}>
                                New Material from Files
                            </Text>
                        </Button>

                        <Button onPress={testPhoto} width={200}>
                            <Text style={{ color: "#ffffff", paddingLeft: 7 }}>
                                TestPhoto
                            </Text>
                        </Button>
                    </View>

                ))}


        </View>
    )
}