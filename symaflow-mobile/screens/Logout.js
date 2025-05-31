import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Logout = ({ setIsLoggedIn }) => {
  const handleLogout = async () => {
    try {
      const response = await fetch('http://192.168.43.154:4000/api/logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to log out.');
      }

      const data = await response.json();

      if (data.success) {
        // Remove token and user details from AsyncStorage
        await AsyncStorage.multiRemove(['token', 'firstname', 'lastname', 'profile_photo']);
        Alert.alert('Succès', 'Déconnexion réussie!');
        setIsLoggedIn(false); // Update login state to false

        // Call checkAsyncStorage to verify removal
        checkAsyncStorage();
      } else {
        Alert.alert('Erreur', data.message);
      }
    } catch (error) {
      Alert.alert('Erreur', error.message || 'Une erreur est survenue.');
      console.error('Logout Error:', error);
    }
  };

  // Function to check AsyncStorage values
  const checkAsyncStorage = async () => {
    try {
      const firstname = await AsyncStorage.getItem('firstname');
      const lastname = await AsyncStorage.getItem('lastname');
      const profile_photo = await AsyncStorage.getItem('profile_photo');

    } catch (error) {
      console.error('Erreur lors de la lecture d\'AsyncStorage:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.message}>Êtes-vous sûr de vouloir vous déconnecter ?</Text>
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.buttonText}>Déconnexion</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  message: {
    fontSize: 18,
    marginBottom: 20,
  },
  logoutButton: {
    backgroundColor: 'royalblue',
    padding: 12,
    borderRadius: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default Logout;