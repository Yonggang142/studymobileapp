import { colors, globalStyles } from "@/styles/global"
import { TouchableOpacity, Text } from "react-native"
import { StyleSheet } from "react-native"


interface ButtonProps {
    text?: string
    onPress: () => void
    children?: React.ReactNode
    width?: number
}

export default function Button({ text, onPress, children, width }: ButtonProps) {
    return (
        <TouchableOpacity onPress={onPress} style={[styles.button, width !== undefined && { width }]}>
            {children ? (
                children
            ) : (
                <Text style={styles.text}>{text}</Text>
            )}
        </TouchableOpacity>
    )
}

const styles =  StyleSheet.create({

    button: {
        width: 300,
        borderColor: colors.buttonBorders,
        paddingHorizontal: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 8,
        marginTop: 7,
        backgroundColor: colors.primary,
        flexDirection: "row",
        paddingVertical: 10,
        alignSelf: "center"
    },

    text: {
        textAlign: "center",
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.textSecondary,
    }

})