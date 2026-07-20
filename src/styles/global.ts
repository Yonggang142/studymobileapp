
import { StyleSheet } from 'react-native';

export const colors = {
  background: '#fefdfd',
  header: '#070707',
  surface: '#2a2a4a',
  primary: '#007AFF',
  text: '#070707',
  textSecondary: '#f4f4f5',
  alert: '#ff5252',
  buttonBorders: "#a5a7a7"
};


export const globalStyles = StyleSheet.create({

  textInput: {
    
    height: 50,
    width: 300,
    borderColor: colors.buttonBorders,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderRadius: 8,
    fontSize: 16,
    backgroundColor:'rgb(250, 249, 249)',
  },

  errorText : {
    color: "rgb(236, 60, 60)"
  }





})