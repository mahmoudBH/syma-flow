import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Button, Alert, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const AddTask = () => {
  const [projets, setProjets] = useState([]);
  const [selectedProjet, setSelectedProjet] = useState("");
  const [equipe, setEquipe] = useState([]);
  const [assignee, setAssignee] = useState("");
  const [expediteur, setExpediteur] = useState("");
  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [priorite, setPriorite] = useState("Moyenne");
  const [statut, setStatut] = useState("En attente");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true); // État pour gérer le chargement
  const [refreshing, setRefreshing] = useState(false); // État pour le rafraîchissement

  // Récupérer l'utilisateur connecté depuis AsyncStorage
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await AsyncStorage.getItem("user");
        if (userData) {
          const parsedUser = JSON.parse(userData);
          setExpediteur(parsedUser.name); // Définir l'expéditeur
        }
      } catch (err) {
        console.error("Erreur lors de la récupération de l'utilisateur:", err);
      }
    };

    fetchUser();
  }, []);

  // Récupérer les projets du responsable connecté
  const fetchProjets = async () => {
    try {
      const userData = await AsyncStorage.getItem("user");
      if (userData) {
        const parsedUser = JSON.parse(userData);
        const response = await axios.get("http://192.168.1.14:4000/api/projets-rs", {
          params: {
            responsable: parsedUser.name, // Filtrer par responsable
          },
        });
        setProjets(response.data);
        console.log("Projets récupérés :", response.data); // Log pour vérifier les projets
      }
    } catch (err) {
      setError("Erreur lors du chargement des projets");
    } finally {
      setLoading(false); // Désactiver l'indicateur de chargement
    }
  };

  useEffect(() => {
    fetchProjets();
  }, []);

  // Gestion du rafraîchissement
  const onRefresh = async () => {
    setRefreshing(true); // Activer l'indicateur de rafraîchissement
    await fetchProjets(); // Recharger les projets
    setRefreshing(false); // Désactiver l'indicateur de rafraîchissement
  };

  // Mettre à jour l'équipe quand un projet est sélectionné
  const handleProjetChange = (projetNom) => {
    setSelectedProjet(projetNom);

    // Trouver le projet sélectionné
    const projet = projets.find((p) => p.nom === projetNom);
    if (projet && projet.equipe) {
      setEquipe(projet.equipe); // L'équipe est déjà un tableau d'objets
      console.log("Équipe récupérée"); // Log pour vérifier l'équipe
    } else {
      setEquipe([]); // Si pas d'équipe, réinitialiser
    }
  };

  // Soumettre la tâche au backend
  const handleSubmit = () => {
    if (!selectedProjet || !expediteur || !assignee || !titre || !description) {
      setError("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    const nouvelleTache = {
      projet: selectedProjet,
      expediteur,
      assignee,
      titre,
      description,
      priorite,
      statut,
      dateDebut,
      dateFin,
    };

    axios
      .post("http://192.168.1.16:4000/api/taches", nouvelleTache)
      .then(() => {
        Alert.alert("Succès", "Tâche ajoutée avec succès !");
        // Réinitialiser le formulaire
        setSelectedProjet("");
        setAssignee("");
        setTitre("");
        setDescription("");
        setPriorite("Moyenne");
        setStatut("En attente");
        setDateDebut("");
        setDateFin("");
      })
      .catch(() => setError("Erreur lors de l'ajout de la tâche."));
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
          <Text style={styles.loadingText}>Chargement des projets...</Text>
        </View>
      ) : (
        <>
          <Text style={styles.header}>Ajouter une Tâche</Text>

          {error && <Text style={styles.error}>{error}</Text>}

          {/* Formulaire */}
          <View style={styles.formContainer}>
            {/* Sélection du projet */}
            <Text style={styles.label}>Projet :</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedProjet}
                onValueChange={handleProjetChange}
                mode="dropdown"
                style={styles.picker}
              >
                <Picker.Item label="Sélectionnez un projet" value="" />
                {projets.map((projet) => (
                  <Picker.Item 
                    key={projet.id} 
                    label={projet.nom} 
                    value={projet.nom} 
                    style={styles.pickerItem}
                  />
                ))}
              </Picker>
            </View>

            {/* Expediteur */}
            <Text style={styles.label}>Reporter :</Text>
            <TextInput
              style={styles.input}
              value={expediteur}
              editable={false}
            />

            {/* Assignee */}
            <Text style={styles.label}>Assignee :</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={assignee}
                onValueChange={(itemValue) => setAssignee(itemValue)}
                mode="dropdown"
                style={styles.picker}
              >
                <Picker.Item label="Sélectionnez un membre" value="" />
                {equipe.map((membre, index) => (
                  <Picker.Item 
                    key={index} 
                    label={`${membre.name} (${membre.role})`} 
                    value={membre.name} 
                    style={styles.pickerItem}
                  />
                ))}
              </Picker>
            </View>

            {/* Titre */}
            <Text style={styles.label}>Titre :</Text>
            <TextInput
              style={styles.input}
              value={titre}
              onChangeText={setTitre}
              placeholder="Entrez le titre"
            />

            {/* Description */}
            <Text style={styles.label}>Description :</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Entrez la description"
              multiline
            />

            {/* Priorité */}
            <Text style={styles.label}>Priorité :</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={priorite}
                onValueChange={setPriorite}
                mode="dropdown"
                style={styles.picker}
              >
                <Picker.Item label="Basse" value="Basse" style={styles.pickerItem} />
                <Picker.Item label="Moyenne" value="Moyenne" style={styles.pickerItem} />
                <Picker.Item label="Haute" value="Haute" style={styles.pickerItem} />
              </Picker>
            </View>

            {/* Statut */}
            <Text style={styles.label}>Statut :</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={statut}
                onValueChange={setStatut}
                mode="dropdown"
                style={styles.picker}
              >
                <Picker.Item label="En attente" value="En attente" style={styles.pickerItem} />
                <Picker.Item label="En cours" value="En cours" style={styles.pickerItem} />
                <Picker.Item label="Terminée" value="Terminée" style={styles.pickerItem} />
              </Picker>
            </View>

            {/* Date de début */}
            <Text style={styles.label}>Date de début :</Text>
            <TextInput
              style={styles.input}
              value={dateDebut}
              onChangeText={setDateDebut}
              placeholder="YYYY-MM-DD"
            />

            {/* Date de fin */}
            <Text style={styles.label}>Date de fin :</Text>
            <TextInput
              style={styles.input}
              value={dateFin}
              onChangeText={setDateFin}
              placeholder="YYYY-MM-DD"
            />

            {/* Bouton d'envoi */}
            <TouchableOpacity style={styles.button} onPress={handleSubmit}>
              <Text style={styles.buttonText}>Ajouter Tâche</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </ScrollView>
  );
};


const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 20,
  },
  header: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 40,
    textAlign: 'center',
    textShadowColor: '#BDC3C7',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  formContainer: {
    gap: 20,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: '#34495E',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6E6E6',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#4A4A4A',
    shadowColor: '#E6E6E6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  textArea: {
    height: 150,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6E6E6',
    borderRadius: 12,
    padding: 8,
    shadowColor: '#E6E6E6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  picker: {
    width: '100%',
    height: 50,
    paddingLeft: 12,
  },
  pickerItem: {
    fontSize: 16,
    color: '#4A4A4A',
  },
  error: {
    color: '#E74C3C',
    fontWeight: 'bold',
    textAlign: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#FFEBEE',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#2ECC71',
    borderRadius: 24,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
});

export default AddTask;