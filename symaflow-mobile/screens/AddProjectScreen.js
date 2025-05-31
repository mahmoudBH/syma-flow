import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, StyleSheet, ActivityIndicator, RefreshControl } from "react-native";
import { Picker } from '@react-native-picker/picker';
import axios from "axios";

const AddProjectScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    nom: "",
    responsable: "",
    date_debut: "",
    date_fin: "",
    budget: "",
    description: "",
  });

  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true); // État pour gérer le chargement
  const [refreshing, setRefreshing] = useState(false); // État pour le rafraîchissement

  // Fonction pour charger les administrateurs depuis l'API
  const fetchAdmins = async () => {
    try {
      const response = await axios.get("http://192.168.43.154:4000/api/admins");
      setAdmins(response.data);
    } catch (error) {
      console.error("Erreur lors du chargement des admins", error);
      Alert.alert("Erreur", "Impossible de charger les administrateurs.");
    } finally {
      setLoading(false); // Désactiver l'indicateur de chargement
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  // Gestion du rafraîchissement
  const onRefresh = async () => {
    setRefreshing(true); // Activer l'indicateur de rafraîchissement
    await fetchAdmins(); // Recharger les administrateurs
    setRefreshing(false); // Désactiver l'indicateur de rafraîchissement
  };

  const handleChange = (key, value) => {
    setFormData({ ...formData, [key]: value });
  };

  const handleSubmit = async () => {
    if (!formData.nom || !formData.responsable || !formData.date_debut || !formData.date_fin || !formData.budget || !formData.description) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs.");
      return;
    }

    try {
      await axios.post("http://192.168.43.154:4000/api/add-project", formData);
      Alert.alert("Succès", "Projet ajouté avec succès !");
      setFormData({
        nom: "",
        responsable: "",
        date_debut: "",
        date_fin: "",
        budget: "",
        description: "",
      });
      navigation.goBack(); // Retour à l'écran précédent
    } catch (error) {
      Alert.alert("Erreur", "Échec de l'ajout du projet.");
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#28a745']} // Couleur de l'indicateur de rafraîchissement
          tintColor={'#28a745'}
        />
      }
    >
      {/* Indicateur de chargement */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#28a745" />
          <Text style={styles.loadingText}>Chargement des administrateurs...</Text>
        </View>
      ) : (
        <>
          <Text style={styles.title}>Ajouter un Projet</Text>

          {/* Nom du projet */}
          <TextInput
            style={styles.input}
            placeholder="Nom du projet"
            value={formData.nom}
            onChangeText={(value) => handleChange("nom", value)}
          />

          {/* Responsable */}
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.responsable}
              onValueChange={(value) => handleChange("responsable", value)}
              mode="dropdown"
              style={styles.picker}
            >
              <Picker.Item label="Sélectionner un responsable" value="" />
              {admins.map((admin) => (
                <Picker.Item key={admin.id} label={admin.name} value={admin.name} />
              ))}
            </Picker>
          </View>

          {/* Date de début */}
          <TextInput
            style={styles.input}
            placeholder="Date de début (YYYY-MM-DD)"
            value={formData.date_debut}
            onChangeText={(value) => handleChange("date_debut", value)}
          />

          {/* Date de fin */}
          <TextInput
            style={styles.input}
            placeholder="Date de fin (YYYY-MM-DD)"
            value={formData.date_fin}
            onChangeText={(value) => handleChange("date_fin", value)}
          />

          {/* Budget */}
          <TextInput
            style={styles.input}
            placeholder="Budget"
            value={formData.budget}
            onChangeText={(value) => handleChange("budget", value)}
            keyboardType="numeric"
          />

          {/* Description */}
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Description du projet"
            value={formData.description}
            onChangeText={(value) => handleChange("description", value)}
            multiline
            numberOfLines={4}
          />

          {/* Bouton Ajouter */}
          <TouchableOpacity style={styles.button} onPress={handleSubmit}>
            <Text style={styles.buttonText}>Ajouter le projet</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#F8F9FA",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#34495E",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#2C3E50",
    textShadowColor: "#BDC3C7",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderColor: "#E6E6E6",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  textarea: {
    height: 120,
    textAlignVertical: "top",
  },
  pickerContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 15,
    borderColor: "#E6E6E6",
    borderWidth: 1,
    paddingHorizontal: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  picker: {
    height: 50,
    color: "#34495E",
    fontSize: 16,
  },
  button: {
    backgroundColor: "#28a745",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default AddProjectScreen;