import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const Task = () => {
  const [taches, setTaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [refreshing, setRefreshing] = useState(false); // État pour le rafraîchissement

  // Récupérer l'utilisateur connecté depuis AsyncStorage
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
        }
      } catch (err) {
        console.error('Erreur lors de la récupération de l\'utilisateur:', err);
      }
    };

    fetchUser();
  }, []);

  // Récupérer les tâches de l'utilisateur connecté
  const fetchTaches = async () => {
    if (!user) return;

    try {
      const response = await axios.get('http://192.168.1.16:4000/api/taches', {
        params: {
          assignee: user.name, // Filtrer par assignee
        },
      });
      setTaches(response.data);
    } catch (err) {
      setError('Erreur lors du chargement des tâches.');
    } finally {
      setLoading(false);
      setRefreshing(false); // Désactiver l'indicateur de rafraîchissement
    }
  };

  useEffect(() => {
    fetchTaches();
  }, [user]);

  // Gestion du rafraîchissement
  const onRefresh = async () => {
    setRefreshing(true); // Activer l'indicateur de rafraîchissement
    await fetchTaches(); // Recharger les données
  };

  // Fonction pour mettre à jour le statut d'une tâche
  const updateStatut = async (id, newStatut) => {
    try {
      await axios.put(`http://192.168.1.16:4000/api/taches/${id}/statut`, {
        statut: newStatut,
      });

      // Mettre à jour l'état local
      setTaches((prevTaches) =>
        prevTaches.map((tache) =>
          tache.id === id ? { ...tache, statut: newStatut } : tache
        )
      );

      Alert.alert('Succès', 'Statut mis à jour avec succès !');
    } catch (err) {
      console.error('Erreur lors de la mise à jour du statut :', err);
      Alert.alert('Erreur', 'Erreur lors de la mise à jour du statut.');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#28a745" />
        <Text style={styles.loadingText}>Chargement en cours...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Mes Tâches</Text>

      {taches.length > 0 ? (
        <FlatList
          data={taches}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.taskItem}>
              <Text style={styles.taskLabel}><Text style={styles.boldText}>Projet :</Text> {item.projet}</Text>
              <Text style={styles.taskLabel}><Text style={styles.boldText}>Titre :</Text> {item.titre}</Text>
              <Text style={styles.taskLabel}><Text style={styles.boldText}>Description :</Text> {item.description}</Text>
              <Text style={styles.taskLabel}><Text style={styles.boldText}>Priorité :</Text> {item.priorite}</Text>
              <Text style={styles.taskLabel}><Text style={styles.boldText}>Statut :</Text></Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={item.statut}
                  onValueChange={(itemValue) => updateStatut(item.id, itemValue)}
                  mode="dropdown"
                  style={styles.picker}
                >
                  <Picker.Item label="En attente" value="En attente" />
                  <Picker.Item label="En cours" value="En cours" />
                  <Picker.Item label="Terminée" value="Terminée" />
                </Picker>
              </View>
              <Text style={styles.taskLabel}><Text style={styles.boldText}>Date de début :</Text> {item.dateDebut}</Text>
              <Text style={styles.taskLabel}><Text style={styles.boldText}>Date de fin :</Text> {item.dateFin}</Text>
            </View>
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#28a745']} // Couleur de l'indicateur de rafraîchissement
              tintColor={'#28a745'}
            />
          }
        />
      ) : (
        <Text style={styles.noTasksText}>Aucune tâche trouvée.</Text>
      )}
    </View>
  );
};

// Styles
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
  taskItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  taskLabel: {
    fontSize: 16,
    color: '#4A4A4A',
    marginBottom: 8,
  },
  boldText: {
    fontWeight: 'bold',
    color: '#34495E',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E6E6E6',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    padding: 8,
    marginBottom: 15,
  },
  picker: {
    width: '100%',
    height: 50,
    color: '#34495E',
    fontSize: 16,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 20,
    color: '#888',
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
    color: '#E74C3C',
  },
  noTasksText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 20,
    color: '#888',
  },
});

export default Task;