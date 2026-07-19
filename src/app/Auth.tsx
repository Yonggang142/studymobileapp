import { View, Image, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native'
import { useUserStore } from '@/stores/userStore'
import { colors } from '@/styles/global'
import { globalStyles } from '@/styles/global'
import Button from '@/components/Button'

import { supabaseClient } from '@/configs/supabaseClient'
import { useState } from 'react'

import { Router } from 'expo-router/build/react-navigation'



const CompanyLogo = require('../assets/CompanyLogo.png')
import { useRouter } from 'expo-router'

export default function AuthPage() {
    const router = useRouter()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [isSignIn, setIsSignIn] = useState(true)

    const setUserId = useUserStore((state) => state.setUserId)

    async function handleSignUp() {
        try {

            const { data, error } = await supabaseClient.auth.signUp({
                email: email,
                password: password,
            });

            if (error) {
                console.log("error: ", error)
            }
            
            handleSignIn()

        } catch (err) {
            console.log("error: ", err)
        } 

    }


    async function handleSignIn() {

        try {

            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) {
                console.log("error: ", error)
            }
            
            setUserId(data.session?.user?.id || null)
            router.replace('/Auth')

        } catch (err) {
            console.log("error: ", err)
        }

    }


    return (
        <View style={styles.container}>
            {isSignIn ? (
                <View style={styles.signInFrame}>
                    <Image style={styles.authImage} source={CompanyLogo} />
                    <Text style={styles.authText}>ProjectACSA</Text>

                    <TextInput
                        style={globalStyles.textInput}
                        placeholder='email'
                    />


                    <TextInput
                        style={globalStyles.textInput}
                        placeholder='password'
                    />

                    <Button text='Login' onPress={handleSignIn} />

                    <View style={styles.textFrame}>
                        <Text style={styles.text}>
                            Don't have an account?
                        </Text>

                        <TouchableOpacity onPress={() => setIsSignIn(false)}>
                            <Text style={styles.link}>
                                Sign Up
                            </Text>
                        </TouchableOpacity>
                    </View>


                </View>
            ) : (
                <View style={styles.signInFrame}>
                    <Image style={styles.authImage} source={CompanyLogo} />
                    <Text style={styles.authText}>ProjectACSA</Text>

                    <TextInput
                        style={globalStyles.textInput}
                        placeholder='email'
                    />


                    <TextInput
                        style={globalStyles.textInput}
                        placeholder='password'
                    />

                    <Button text='Sign Up' onPress={handleSignUp} />

                    <View style={styles.textFrame}>
                        <Text>
                            Have an existing account?
                        </Text>

                        <TouchableOpacity onPress={() => setIsSignIn(true)}>
                            <Text style={styles.link}>
                                Sign In 
                            </Text>
                        </TouchableOpacity>
                    </View>


                </View>
            )}


        </View>
    )
}

const styles = StyleSheet.create({

    textFrame: {
        marginTop: 10,
        flexDirection: "row",
        gap: 10
    },

    loginButton: {
        marginTop: 10,
        backgroundColor: colors.background,

    },

    authText: {
        color: colors.header,
        fontSize: 24,
        fontWeight: '700',
        marginVertical: 16,
    },

    container: {
        flex: 1,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },

    signInFrame: {
        gap: 10,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
    },

    authImage: {
        width: 120,
        height: 120,
        resizeMode: 'contain',
    },

    link: {
        color: colors.primary
    },

    text: {
        color: colors.text
    }
})