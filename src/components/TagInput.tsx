
import { globalStyles } from "@/styles/global"
import { useState } from "react"
import { TextInput, Touchable, TouchableOpacity, Text } from "react-native"
import Button from "./Button"
import { View } from "react-native"
export default function TagInput({ allTags, query, setQuery, placeholder }: { 
    allTags: string[]; 
    query: string; 
    setQuery: (value: string) => void;
    placeholder?: string;
}) {
    const [isDropdown, setIsDropdown] = useState(false)


    const filtered = allTags.filter(tag =>
        tag?.toLowerCase()?.includes(query.toLowerCase())
    ).slice(0, 8)


    return (

        <View style={{ position: 'relative' }}>
            <TextInput
                style={[globalStyles.textInput, { height: undefined, minHeight: 50 }]}
                placeholder={placeholder ?? ""}
                onChangeText={(str) => setQuery(str)}
                value={query}
                onFocus={() => setIsDropdown(true)}
                multiline
            />

            {isDropdown && (
                <View style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: '#fff',
                    zIndex: 100,
                    elevation: 5,
                    paddingHorizontal: 3,
                    paddingVertical: 5,
                    borderRadius: 5
                }}>
                    {
                        filtered.map((value: string, index: number) => (
                            <TouchableOpacity key={index} onPress={() => { setQuery(value); setIsDropdown(false) }}>
                                <Text>
                                    {value}
                                </Text>
                            </TouchableOpacity>
                        ))

                    }
                </View>
            )}



        </View>

    )

}
