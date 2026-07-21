
import { globalStyles } from "@/styles/global"
import { useState } from "react"
import { TextInput, Touchable, TouchableOpacity, Text } from "react-native"
import Button from "./Button"
import { View } from "react-native"
export default function TagInput({ allTags, onSubmit }: { allTags: string[]; onSubmit: (newTag: string | null) => void }) {
    const [query, setQuery] = useState('')
    const [isDropdown, setIsDropdown] = useState(false)


    const filtered = allTags.filter(tag =>
        tag.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 8)


    return (

        <>
            <TextInput
                style={globalStyles.textInput}
                placeholder='Questions involving directional derivatives'
                onChangeText={(str) => setQuery(str)}
                value={query}
                onFocus={() => setIsDropdown(true)}
            />

            {isDropdown && (
                <View style={{
                    position: 'absolute',
                    top: 10
                }}>
                    {
                        filtered.map((value: string, index: number) => (
                            <TouchableOpacity onPress={() => { setQuery(value); onSubmit(value); setIsDropdown(false) }}>
                                <Text>
                                    {value}
                                </Text>
                            </TouchableOpacity>
                        ))

                    }
                </View>
            )}


            <Button onPress={() => onSubmit(query || null)} text={"Enter"}>

            </Button>

        </>

    )

}