import React, { useState, useEffect } from "react";
import { View, Text, Button, StyleSheet, Alert, ScrollView, ActivityIndicator, RefreshControl } from "react-native";
import { Picker } from '@react-native-picker/picker';
import { Checkbox } from "react-native-paper"; // Utilisation de Checkbox de react-native-paper
import { TextInput } from "react-native";
import { Calendar } from "react-native-calendars";
import axios from "axios";

const AjouterReunionScreen = ({ navigation }) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [titre, setTitre] = useState("");
  const [lieu, setLieu] = useState("");
  const [description, setDescription] = useState("");
  const [projets, setProjets] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [equipe, setEquipe] = useState([]);
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [refreshing, setRefreshing] = useState(false); // État pour le rafraîchissement

  // Rafraîchir les projets
  const onRefresh = async () => {
    setRefreshing(true); // Activer l'indicateur de rafraîchissement
    try {
      const response = await axios.get("http://192.168.1.145:4000/api/projets-rs");
      setProjets(response.data);
    } catch (error) {
      console.error("Erreur lors de la récupération des projets:", error);
      Alert.alert("Erreur", "Impossible de récupérer les projets");
    } finally {
      setRefreshing(false); // Désactiver l'indicateur de rafraîchissement
    }
  };

  useEffect(() => {
    const fetchProjets = async () => {
      try {
        const response = await axios.get("http://192.168.1.145:4000/api/projets-rs");
        setProjets(response.data);
      } catch (error) {
        console.error("Erreur lors de la récupération des projets:", error);
        Alert.alert("Erreur", "Impossible de récupérer les projets");
      }
    };
    fetchProjets();
  }, []);

  const handleDateSelect = (day) => {
    setSelectedDate(day.dateString);
  };

  const handleProjetChange = (projetId) => {
    setSelectedProject(projetId);

    const projet = projets.find((p) => p.id === projetId);
    if (projet && Array.isArray(projet.equipe)) {
      const membresEquipe = projet.equipe.flat();
      setEquipe(membresEquipe);
    } else {
      setEquipe([]);
    }
    setSelectedParticipants([]);
  };

  const toggleParticipant = (participantId) => {
    if (selectedParticipants.includes(participantId)) {
      setSelectedParticipants(selectedParticipants.filter(id => id !== participantId));
    } else {
      setSelectedParticipants([...selectedParticipants, participantId]);
    }
  };

  const handleAddMeeting = async () => {
    if (
      !selectedDate ||
      !titre ||
      !lieu ||
      !description ||
      !selectedProject ||
      selectedParticipants.length === 0
    ) {
      Alert.alert("Erreur", "Tous les champs doivent être remplis");
      return;
    }

    try {
      const participantsJson = JSON.stringify(
        equipe
          .filter(membre => selectedParticipants.includes(membre.id))
          .map(membre => ({ id: membre.id, name: membre.name }))
      );

      const response = await axios.post("http://192.168.43.154:4000/api/ajouter-reunion", {
        id_project: selectedProject,
        titre,
        date_reunion: selectedDate,
        lieu,
        participants: participantsJson,
        description,
      });

      if (response.status === 201) {
        Alert.alert("Succès", "Réunion ajoutée avec succès");
        navigation.goBack();
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout de la réunion :", error);
      Alert.alert("Erreur", "Une erreur est survenue lors de l'ajout de la réunion");
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
      <Text style={styles.title}>Ajouter une Réunion</Text>

      <Calendar
        onDayPress={handleDateSelect}
        markedDates={{
          [selectedDate]: { selected: true, selectedColor: "#28a745" },
        }}
        theme={{
          arrowColor: "#28a745",
          textSectionTitleColor: "#34495E",
          textDayFontSize: 16,
          textDayFontWeight: "bold",
          todayTextColor: "#FF5733",
        }}
      />

      <Text style={styles.label}>Sélectionner un projet</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedProject}
          onValueChange={handleProjetChange}
          mode="dropdown"
          style={styles.picker}
        >
          <Picker.Item label="Sélectionner un projet" value={null} />
          {projets.map((projet) => (
            <Picker.Item key={projet.id} label={projet.nom} value={projet.id} />
          ))}
        </Picker>
      </View>

      <View style={styles.selectedParticipantsContainer}>
        <Text style={styles.label}>Participants sélectionnés :</Text>
        {selectedParticipants.length > 0 ? (
          selectedParticipants.map((id) => {
            const participant = equipe.find(membre => membre.id === id);
            return (
              <View key={id} style={styles.selectedParticipantItem}>
                <Text style={styles.participantName}>{participant?.name}</Text>
              </View>
            );
          })
        ) : (
          <Text style={styles.noParticipants}>Aucun participant sélectionné</Text>
        )}
      </View>

      <Text style={styles.label}>Sélectionner les participants</Text>
      <View style={styles.participantsContainer}>
        {equipe.length > 0 ? (
          equipe.map((membre) => (
            <View key={membre.id} style={styles.participantItem}>
              <Checkbox
                status={selectedParticipants.includes(membre.id) ? "checked" : "unchecked"}
                onPress={() => toggleParticipant(membre.id)}
              />
              <Text style={styles.participantName}>{membre.name}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.noParticipants}>Aucun membre dans cette équipe</Text>
        )}
      </View>

      <TextInput
        style={styles.input}
        placeholder="Titre de la réunion"
        value={titre}
        onChangeText={setTitre}
      />

      <TextInput
        style={styles.input}
        placeholder="Lieu de la réunion"
        value={lieu}
        onChangeText={setLieu}
      />

      <TextInput
        style={[styles.input, styles.textarea]}
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
        multiline
      />

      <Button title="Ajouter la réunion" onPress={handleAddMeeting} color="#28a745" />
    </ScrollView>
  );
};

// Styles (identique à votre code précédent)
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#F8F9FA",
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
  label: {
    fontSize: 18,
    fontWeight: "600",
    color: "#34495E",
    marginTop: 10,
    marginBottom: 5,
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
  participantsContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 15,
    borderColor: "#E6E6E6",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    padding: 10,
  },
  participantItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  participantName: {
    fontSize: 16,
    color: "#34495E",
  },
  noParticipants: {
    textAlign: "center",
    fontStyle: "italic",
    color: "#888",
    marginTop: 10,
  },
  selectedParticipantsContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 15,
    borderColor: "#E6E6E6",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    padding: 10,
  },
  selectedParticipantItem: {
    backgroundColor: "#E6F7FF",
    borderRadius: 8,
    padding: 10,
    marginBottom: 5,
    flexDirection: "row",
    alignItems: "center",
  },
});

export default AjouterReunionScreen;