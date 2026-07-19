import { TouchableOpacity, Text } from "react-native"
import { StyleSheet } from "react-native"


interface ButtonProps {
    text: string,
    onPress: () => void,
}

export default function Button({ text, onPress }: ButtonProps) {

    return (
        <TouchableOpacity onPress={onPress}>
            <Text>
                {text}
            </Text>
        </TouchableOpacity>
    )


}

const styles =  StyleSheet.create({

    button: {
        backgroundColor: '#4fc3f7',
        borderRadius: 4,
    }



})