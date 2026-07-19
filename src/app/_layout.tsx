import { Stack } from 'expo-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export default function RootLayout() {

    const queryClient = new QueryClient()
    return (
        <QueryClientProvider client={queryClient} >
            <Stack
                screenOptions={{
                    headerShown: false,
                    title: 'Longitude',
                }} 
            >

                <Stack.Screen name='(tabs)'/>

            </Stack>
        </QueryClientProvider>

    )
}