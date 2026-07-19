import { Stack } from 'expo-router'


export default function RootLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                title: 'Longitude',
            }} 
        >

            <Stack.Screen name='(tabs)'/>

        </Stack>
    )
}