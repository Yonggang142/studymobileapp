import { Stack } from 'expo-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabaseClient } from '@/configs/supabaseClient';
import { useUserStore } from '@/stores/userStore';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';

export default function RootLayout() {
    const router = useRouter()
    const setUserId = useUserStore((state) => state.setUserId)
    const setLoading = useUserStore((state) => state.setLoading)
    const toastMessage = useUserStore((state) => state.toastMessage)
    const queryClient = new QueryClient()
    const userId = useUserStore((state) => state.userId)
    const loading = useUserStore((state) => state.loading)

    useEffect(() => {
        if (!loading && !userId) {
            router.replace('/Auth')
        }
    }, [loading, userId])


    useEffect(() => {
        async function checkSession() {
            const { data, error } = await supabaseClient.auth.getSession()
      
            if (data.session?.user) {
                setUserId(data.session.user.id)
      
            }
            setLoading(false)
       
        }
        checkSession()
    }, [])

    return (
        <QueryClientProvider client={queryClient} >
            <View style={{ flex: 1 }}>
                <Stack
                    screenOptions={{
                        headerShown: false,
                        title: 'Longitude',
                    }} 
                >
                    <Stack.Screen name='(tabs)' options={{ headerShown: false }}/>
                    <Stack.Screen name='Results' options={{ headerShown: false, title: 'Results' }}/>
                </Stack>
                {toastMessage && (
                    <View style={styles.toast}>
                        <Text style={styles.toastText}>{toastMessage}</Text>
                    </View>
                )}
            </View>
        </QueryClientProvider>
    )
}

const styles = StyleSheet.create({
    toast: {
        position: 'absolute',
        bottom: 40,
        left: 20,
        right: 20,
        backgroundColor: '#4caf50',
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
        zIndex: 999,
    },
    toastText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
})