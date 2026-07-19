import { View, Image, StyleSheet, Text, TextInput, TouchableOpacity} from 'react-native'
import { useAuthStore } from '@/stores/authStore'
import { colors } from '@/styles/global'
import { globalStyles } from '@/styles/global'
import Button from '@/components/button'

const CompanyLogo = require('../assets/CompanyLogo.png')

export default function AuthPage() {
    return (
        <View style={styles.container}>
            <View style={styles.frame}>
                <Image style={styles.authImage} source={CompanyLogo} />
                <Text style={styles.authText}>ProjectACSA</Text>

                <TextInput
                    style={globalStyles.textInput}
                    placeholder='email'
                />


                <TextInput
                    style={globalStyles.textInput}
                    placeholder='password'
                />

                <Button text='Login' onPress={() => console.log("yes")}/>


            </View>
        </View>
    )
}

const styles = StyleSheet.create({

    loginButton: {
        marginTop: 10,
        backgroundColor: colors.background,
        
    },

    authText: {
        color: colors.header,
        fontSize: 24,
        fontWeight: '700',
        marginVertical: 16,
    },

    container: {
        flex: 1,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },

    frame: {
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
    },

    authImage: {
        width: 120,
        height: 120,
        resizeMode: 'contain',
    }
})