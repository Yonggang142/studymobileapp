import { colors, globalStyles } from "@/styles/global"
import { TouchableOpacity, Text } from "react-native"
import { StyleSheet } from "react-native"


interface ButtonProps {
    text?: string,
    onPress: () => void,
    children?: React.ReactNode
    disabled?: boolean
}

export default function HollowButton({ text, onPress, children, disabled }: ButtonProps) {
    return (
        <TouchableOpacity onPress={onPress} disabled={disabled} style={[styles.button, disabled && { opacity: 0.5 }]}>
            <Text style={styles.text}>
                { children ?? text }
            </Text>
        </TouchableOpacity>
    )
}

const styles =  StyleSheet.create({

    button: {
        height: 50,
        width: 300,
        borderColor: colors.Borders,
        paddingHorizontal: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 8,
        marginTop: 20,
        backgroundColor: colors.background,
    },

    text: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.textSecondary
    }

})