import { Text } from 'react-native'
import { View } from 'react-native'
import { useRouter } from 'expo-router'
import { useUserStore } from '@/stores/userStore'
import { useEffect } from 'react'

import { useQuery } from '@tanstack/react-query'
import { supabaseClient } from '@/configs/supabaseClient'

import fetchProfile from '@/utils/fetchProfile'

export default function HomeScreen() {
    const router = useRouter();
    const userId = useUserStore((state) => state.userId);

    useUserStore

    useEffect(() => {
        if (!userId) {
            router.replace('/Auth')
        }
    }, [userId])

    const { data, error } = useQuery({
        queryKey: [userId],
        queryFn: () => fetchProfile(userId!),
        enabled: !!userId,
    });

    return (
        <View>
            <Text>Home</Text>
        </View>
    )
}