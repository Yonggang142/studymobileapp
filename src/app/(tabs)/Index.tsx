import { Text } from 'react-native'
import { View } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuthStore } from '@/stores/authStore'
import { useEffect } from 'react'

export default function HomeScreen() {
    const router = useRouter();
    const userId = useAuthStore((state) => state.userId);

    useEffect(() => {
        if (!userId) {
            router.replace('/auth')
        }
    }, [userId])

    return (
        <View>
            <Text>Home</Text>
        </View>
    )
}