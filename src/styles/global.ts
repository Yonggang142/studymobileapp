
import { StyleSheet } from 'react-native';

export const colors = {
  background: '#fefdfd',
  header: '#070707',
  surface: '#fefefe',
  primary: '#007AFF',
  text: '#070707',
  textSecondary: '#f4f4f5',
  alert: '#ff5252',
  Borders: "#1f1f1f"
};


export const globalStyles = StyleSheet.create({

  textInput: {
    
    height: 50,
    width: 300,
    borderColor: colors.Borders,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderRadius: 8,
    fontSize: 16,
    backgroundColor:'rgb(250, 249, 249)',
  },

  errorText : {
    color: "rgb(236, 60, 60)"
  },

  text: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },


  header: {
    fontSize: 26,
    fontWeight: 'bold',
    color: 'black',
  },





})
