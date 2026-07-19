import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet } from "react-native";


export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: true,
                title: 'Longitude',
            }} 
        >


           <Tabs.Screen name='Index'
                options={{
                    title: 'Home',
                    tabBarIcon: ({color, size}) => (
                        <Ionicons name='home' size={size} color={color}/>
                    )
                }}
            
            />

            <Tabs.Screen name='Materials'
                options={{
                    title: 'Materials',
                    tabBarIcon: ({color, size}) => (
                        <Ionicons name='document' size={size} color={color}/>
                    )
                }}
            
            />


            <Tabs.Screen name='AddMaterials'
                options={{
                    title: 'AddMaterial',
                    tabBarIcon: ({color, size}) => (
                        <Ionicons name='add' size={size} color={color}/>
                    )
                }}
            
            />

        </Tabs>
    )
}