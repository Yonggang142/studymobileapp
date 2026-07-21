
import { View, Text, Image, ScrollView } from "react-native"
import Button from "@/components/Button"
import { Ionicons } from "@expo/vector-icons"
import { colors } from "@/styles/global"
import { useEffect, useState } from "react"
import * as ImagePicker from 'expo-image-picker'
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router'

export default function AddMaterial() {
    const router = useRouter();
    const [photoUri, setPhotoUri] = useState<string | null>(null)
    const [file, setFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null)

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

    const handleUpload = async (type: string) => {
        try {
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

            const data = await response.json()
            
            if (data?.content) {
                router.push({
                    pathname: '/Results',
                    params: { type: type, content: data.content },
                })
            }

        } catch (err) {
            console.log("Error: ", err)
        } finally {
            

        }
    }

    const testPhoto = function() {
        setPhotoUri(".....")
    }

    return (
        <View style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
        }}>
            {(photoUri || file) ? (

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
                    <Button width={300} text="Skip and Store it" onPress={() => handleUpload("knowledge")} />
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

            )}
        </View>
    )
}