import { colors, globalStyles } from "@/styles/global"
import { Ionicons } from "@expo/vector-icons"
import { TouchableOpacity, Text } from "react-native"
import { StyleSheet } from "react-native"
import type { ComponentProps } from "react"


type IconName = ComponentProps<typeof Ionicons>['name']

interface ButtonProps {
    text?: string
    onPress: () => void
    children?: React.ReactNode
    width?: number
    disabled?: boolean
    iconName?: IconName
}

export default function Button({ text, onPress, width, disabled, iconName }: ButtonProps) {
    return (
        <TouchableOpacity onPress={onPress} disabled={disabled} style={[styles.button, width !== undefined && { width }, disabled && { opacity: 0.5 }]}>
            {iconName && <Ionicons name={iconName} size={30} color={"#ffffff"} />}
            <Text style={styles.text}>{text}</Text>
            
        </TouchableOpacity>
    )
}

const styles =  StyleSheet.create({

    button: {
        width: 300,
        gap: 5,
        paddingHorizontal: 30,
        justifyContent: 'center',
        alignItems: 'center',
        borderColor: '#a120f8',
        borderWidth: 2,
        borderRadius: 25,
        marginTop: 5,
        backgroundColor: '#b15beb',
        flexDirection: "row",
        paddingVertical: 7,
        alignSelf: "center"
    },

    text: {
        textAlign: "center",
        fontSize: 18,

        fontWeight: 'semibold',
        color: colors.textSecondary,
    }

})
