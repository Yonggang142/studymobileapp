import { colors, globalStyles } from "@/styles/global"
import { TouchableOpacity, Text } from "react-native"
import { StyleSheet } from "react-native"


interface ButtonProps {
    text?: string,
    onPress: () => void,
    children?: React.ReactNode
}

export default function HollowButton({ text, onPress, children }: ButtonProps) {
    return (
        <TouchableOpacity onPress={onPress} style={styles.button}>
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
        borderColor: colors.buttonBorders,
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