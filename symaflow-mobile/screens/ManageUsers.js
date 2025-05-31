import React, { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, Alert, ScrollView, ActivityIndicator, RefreshControl } from "react-native";
import { Picker } from '@react-native-picker/picker';
import axios from "axios";

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    category: "",
    profile: "",
    password: "",
  });
  const [loading, setLoading] = useState(true); // État pour gérer le chargement
  const [refreshing, setRefreshing] = useState(false); // État pour le rafraîchissement

  // Fonction pour charger les données depuis l'API
  const fetchData = async () => {
    try {
      const usersResponse = await axios.get("http://192.168.1.145:4000/users");
      const categoriesResponse = await axios.get("http://192.168.1.145:4000/categories");
      const profilesResponse = await axios.get("http://192.168.1.145:4000/profiles");
      setUsers(usersResponse.data);
      setCategories(categoriesResponse.data);
      setProfiles(profilesResponse.data);
    } catch (error) {
      console.error("Erreur lors du chargement des données :", error);
      Alert.alert("Erreur", "Impossible de charger les données.");
    } finally {
      setLoading(false); // Désactiver l'indicateur de chargement
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Gestion du rafraîchissement
  const onRefresh = async () => {
    setRefreshing(true); // Activer l'indicateur de rafraîchissement
    await fetchData(); // Recharger les données
    setRefreshing(false); // Désactiver l'indicateur de rafraîchissement
  };

  const handleChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleUserSelection = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone,
      category: user.category,
      profile: user.profile,
      password: "",
    });
  };

  const handleSubmit = async () => {
    try {
      const response = await axios.put(
        `http://192.168.1.145:4000/update-user/${selectedUser.id}`,
        formData
      );
      Alert.alert("Succès", response.data.message);
      setSelectedUser(null);
      setFormData({
        name: "",
        email: "",
        phone: "",
        category: "",
        profile: "",
        password: "",
      });
      await fetchData(); // Rafraîchir les données après mise à jour
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'utilisateur :", error);
      Alert.alert("Erreur", "Erreur lors de la mise à jour");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Gestion des utilisateurs</Text>
      <Text style={styles.subHeader}>Liste des utilisateurs</Text>

      {/* Indicateur de chargement */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#28a745" />
          <Text style={styles.loadingText}>Chargement des données...</Text>
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.userItem}>
              <Text style={styles.userText} numberOfLines={1} ellipsizeMode="tail">
                {item.name} - {item.email} - {item.category}
              </Text>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => handleUserSelection(item)}
              >
                <Text style={styles.editButtonText}>Modifier</Text>
              </TouchableOpacity>
            </View>
          )}
          ListHeaderComponent={
            selectedUser && (
              <View style={styles.formContainer}>
                <Text style={styles.formHeader}>Modifier l'utilisateur</Text>

                {/* Champs du formulaire */}
                <TextInput
                  style={styles.input}
                  placeholder="Nom et Prénom"
                  value={formData.name}
                  onChangeText={(text) => handleChange("name", text)}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  value={formData.email}
                  onChangeText={(text) => handleChange("email", text)}
                  keyboardType="email-address"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Numéro de téléphone"
                  value={formData.phone}
                  onChangeText={(text) => handleChange("phone", text)}
                  keyboardType="phone-pad"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Mot de passe (laissez vide pour ne pas modifier)"
                  value={formData.password}
                  onChangeText={(text) => handleChange("password", text)}
                  secureTextEntry
                />

                {/* Sélecteurs */}
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={formData.category}
                    onValueChange={(itemValue) => handleChange("category", itemValue)}
                    mode="dropdown"
                    style={styles.picker}
                  >
                    <Picker.Item label="Sélectionner une catégorie" value="" />
                    {categories.map((cat) => (
                      <Picker.Item key={cat.id} label={cat.category} value={cat.category} />
                    ))}
                  </Picker>
                </View>

                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={formData.profile}
                    onValueChange={(itemValue) => handleChange("profile", itemValue)}
                    mode="dropdown"
                    style={styles.picker}
                  >
                    <Picker.Item label="Sélectionner un profil" value="" />
                    {profiles.map((prof) => (
                      <Picker.Item key={prof.id} label={prof.profile} value={prof.profile} />
                    ))}
                  </Picker>
                </View>

                {/* Bouton Sauvegarder */}
                <TouchableOpacity style={styles.saveButton} onPress={handleSubmit}>
                  <Text style={styles.saveButtonText}>Sauvegarder</Text>
                </TouchableOpacity>
              </View>
            )
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#28a745']} // Couleur de l'indicateur de rafraîchissement
              tintColor={'#28a745'}
            />
          }
        />
      )}
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    padding: 20,
  },
  header: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 20,
    textShadowColor: '#BDC3C7',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  subHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: '#34495E',
    marginBottom: 10,
  },
  userItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 60,
  },
  userText: {
    fontSize: 16,
    color: '#4A4A4A',
    flex: 1,
    paddingRight: 10,
  },
  editButton: {
    backgroundColor: '#28a745',
    padding: 8,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  formContainer: {
    marginTop: 20,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  formHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E6E6E6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    backgroundColor: '#F9F9F9',
    fontSize: 16,
    color: '#4A4A4A',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E6E6E6',
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: '#F9F9F9',
    paddingHorizontal: 8,
  },
  picker: {
    width: '100%',
    height: 50,
    color: '#34495E',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ManageUsers;