import { View, Image, StyleSheet, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useUserStore } from '@/stores/userStore'
import { colors } from '@/styles/global'
import { globalStyles } from '@/styles/global'
import Button from '@/components/Button'

import { supabaseClient } from '@/config/supabaseClient'
import { useState } from 'react'

import { Ionicons } from '@expo/vector-icons'
import { Provider } from '@supabase/supabase-js';

const CompanyLogo = require('../assets/CompanyLogo.png')
import { useRouter } from 'expo-router'

import HollowButton from '@/components/HollowButton'

import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import fetchProfile from '@/utils/fetchProfile'

import { useRef } from 'react'


export default function AuthPage() {
    const router = useRouter()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [isSignIn, setIsSignIn] = useState(true)
    const [errorMsg, setErrorMsg] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    const errorRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const setUserId = useUserStore((state) => state.setUserId)



    async function OAuthSignIn(provider : Provider) {
        setIsLoading(true)
        try {
        const redirectUrl = Linking.createURL('/auth/callback');

        const { data, error } = await supabaseClient.auth.signInWithOAuth({ 
            provider: provider,
            options: {
                redirectTo: redirectUrl,
                skipBrowserRedirect: true,
            }, 
        });


        if (error) {
            throw new Error(error.message);
        }

        if (data?.url) {
            // Open WebBrowser to handle google auth
            const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
            // Automatically return a url if successfully login
            if (result.type === 'success') {
                const { url } = result;
                const params = Object.fromEntries(new URLSearchParams(url.replace('#', '?')));
                const { access_token, refresh_token } = params;

                if (!access_token || !refresh_token) {
                    throw new Error('No access or refresh token');
                }

                const { data: sessionData, error: sessionError } = await supabaseClient.auth.setSession({
                    access_token,
                    refresh_token,
                });

                const session = sessionData.session;

                if (session?.user) {
                    setUserId(session.user.id);
                    router.replace('/Index');
                }
            }
        }
        } catch (err) {
            setErrorMsg("OAuth sign in failed")
            console.error(err)
            useUserStore.getState().showToast("OAuth failed")
        } finally {
            setIsLoading(false)
        }
    }

    async function handleSignUp() {
        setIsLoading(true)
        try {
            const { data, error } = await supabaseClient.auth.signUp({
                email: email,
                password: password,
            });

            if (error) {
                setErrorMsg(error.message)
                return
            }
            
            if (data.session?.user) {
                setUserId(data.session.user.id)
                await fetchProfile(data.session.user.id) 
                router.replace('/Index')
            }
            
        } catch (err) {

            setErrorMsg("Failed to sign up, please try again")
            useUserStore.getState().showToast("Sign up failed")
            if (errorRef.current) {
                clearTimeout(errorRef.current);
            }

            errorRef.current = setTimeout(() => {
                setErrorMsg("")
            }, 3000);
            
            console.log("error: ", err)
        } finally {
            setIsLoading(false)
            setPassword("")
            setEmail("")
        }

    }


    async function handleSignIn() {
        setIsLoading(true)
        try {

            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) {
                setErrorMsg(error.message)

                if (errorRef.current) {
                    clearTimeout(errorRef.current);
                }

                errorRef.current = setTimeout(() => {
                    setErrorMsg("")
                }, 3000);

                return
            }
            
            setUserId(data.session?.user?.id || null)

            await fetchProfile(data.session.user.id) 
            router.replace('/Index')

        } catch (err) {
            setErrorMsg("Account does not exist")
            useUserStore.getState().showToast("Sign in failed")
            console.log("error: ", err)
        } finally {
            setIsLoading(false)
            setPassword("")
            setEmail("")
        }

    }


    return (
        <View style={styles.container}>
            {isLoading && (
                <View style={{ position: 'absolute', zIndex: 10, top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)' }}>
                    <ActivityIndicator size="large" color={colors.text} />
                </View>
            )}
            {isSignIn ? (
                <View style={styles.signInFrame}>
                    <Image style={styles.authImage} source={CompanyLogo} />
                    <Text style={styles.authText}>ProjectACSA</Text>


                    
                    <HollowButton onPress={() => OAuthSignIn('google')} disabled={isLoading}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Image
                                source={{ uri: 'https://developers.google.com/static/identity/images/g-logo.png' }}
                                style={{ width: 18, height: 18 }}
                            />
                            <Text style={styles.text}>Google</Text>
                        </View>
                    </HollowButton>



                    <Text style={{
                        alignSelf: "baseline",
                        fontSize: 17,
                        fontWeight: "bold",
                        marginTop: 10
                    }}>
                        Email
                    </Text>

                    <TextInput
                        style={globalStyles.textInput}
                        placeholder='Enter your email'
                        onChangeText={(str) => setEmail(str)}
                        value={email}
                    />

                    <Text style={{
                        alignSelf: "baseline",
                        fontSize: 17,
                        fontWeight: "bold",
                        marginTop: 6
                    }}>
                        Password
                    </Text>
                    <TextInput
                        style={globalStyles.textInput}
                        placeholder='Enter your password'
                        secureTextEntry
                        onChangeText={(str) => setPassword(str)}
                        value={password}
                    />

                    <Button text='Login' onPress={handleSignIn} disabled={isLoading} />

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

                    
                    <Text style={globalStyles.errorText}>
                        {errorMsg}
                    </Text>



                    


                </View>
            ) : (
                <View style={styles.signInFrame}>
                    <Image style={styles.authImage} source={CompanyLogo} />
                    <Text style={styles.authText}>ProjectACSA</Text>
                   
                    <HollowButton onPress={() => OAuthSignIn('google')} disabled={isLoading}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Image
                                source={{ uri: 'https://developers.google.com/static/identity/images/g-logo.png' }}
                                style={{ width: 18, height: 18 }}
                            />
                            <Text style={styles.text}>Google</Text>
                        </View>
                    </HollowButton>

                    
                    <Text style={{
                        alignSelf: "baseline",
                        fontSize: 17,
                        fontWeight: "bold",
                        marginTop: 10
                    }}>
                        Email
                    </Text>


                    <TextInput
                        style={globalStyles.textInput}
                        placeholder='Enter your email'
                        onChangeText={(str) => setEmail(str)}
                        value={email}
                    />

                    <Text style={{
                        alignSelf: "baseline",
                        fontSize: 17,
                        fontWeight: "bold",
                        marginTop: 6
                    }}>
                        Password
                    </Text>

                    <TextInput
                        style={globalStyles.textInput}
                        placeholder='Enter your password'
                        secureTextEntry
                        onChangeText={(str) => setPassword(str)}
                        value={password}
                    />

                    <Button text='Sign Up' onPress={handleSignUp} disabled={isLoading} />

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


                                      
                    <Text style={globalStyles.errorText}>
                        {errorMsg}
                    </Text>


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
        marginTop: 10,
        marginBottom: 8
    },

    container: {
        flex: 1,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },

    signInFrame: {
        gap: 7,
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
