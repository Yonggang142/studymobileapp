import { Stack } from 'expo-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabaseClient } from '@/configs/supabaseClient';
import { useUserStore } from '@/stores/userStore';
import { useRouter } from 'expo-router';
export default function RootLayout() {
    const router = useRouter()
    const setUserId = useUserStore((state) => state.setUserId)
    const setLoading = useUserStore((state) => state.setLoading)
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
            <Stack
                screenOptions={{
                    headerShown: false,
                    title: 'Longitude',
                }} 
            >
                <Stack.Screen name='(tabs)'/>
                <Stack.Screen name='Results' options={{ headerShown: true, title: 'Results' }}/>
            </Stack>
        </QueryClientProvider>

    )
}