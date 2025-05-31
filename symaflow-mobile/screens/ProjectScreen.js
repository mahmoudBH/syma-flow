import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Modal, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const ProjectScreen = () => {
  const [projets, setProjets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [users, setUsers] = useState([]);
  const [profile, setProfile] = useState('');
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [expandedProjectId, setExpandedProjectId] = useState(null);
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

  // Récupérer les projets et les utilisateurs une fois que l'utilisateur est disponible
  const fetchProjetsAndUsers = async () => {
    if (!user) return;
    try {
      const [projetsResponse, usersResponse] = await Promise.all([
        axios.get('http://192.168.43.154:4000/api/projets-rs', {
          params: {
            responsable: user.name,
          },
        }),
        axios.get('http://192.168.43.154:4000/users'),
      ]);
      setProjets(projetsResponse.data);
      setUsers(usersResponse.data);
    } catch (err) {
      setError('Erreur lors du chargement des données.');
    } finally {
      setLoading(false);
      setRefreshing(false); // Désactiver l'indicateur de rafraîchissement
    }
  };

  useEffect(() => {
    fetchProjetsAndUsers();
  }, [user]);

  // Gestion du rafraîchissement
  const onRefresh = async () => {
    setRefreshing(true); // Activer l'indicateur de rafraîchissement
    await fetchProjetsAndUsers(); // Recharger les données
  };

  const handleAddTeam = (projectId) => {
    const equipe = selectedUsers.map((user) => ({
      id: user.id,
      name: user.name,
      role: user.profile,
    }));
    axios
      .post(`http://192.168.43.154:4000/projets/${projectId}/ajouter-equipe`, { equipe })
      .then((response) => {
        Alert.alert('Succès', 'Équipe ajoutée avec succès !');
        setShowAddTeam(false);
        setSelectedUsers([]);
      })
      .catch((err) => {
        Alert.alert('Erreur', "Erreur lors de l'ajout de l'équipe.");
      });
  };

  const toggleDetails = (projectId) => {
    setExpandedProjectId(expandedProjectId === projectId ? null : projectId);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#28a745" />
        <Text>Chargement en cours...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Mes Projets</Text>
      {projets.length > 0 ? (
        <FlatList
          data={projets}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.projectItem}>
              <Text style={styles.projectName}>{item.nom}</Text>
              <Text style={styles.projectStatus}>{item.statut}</Text>
              <TouchableOpacity onPress={() => toggleDetails(item.id)} style={styles.detailsButton}>
                <Text style={styles.detailsButtonText}>
                  {expandedProjectId === item.id ? 'Masquer les détails' : 'Afficher les détails'}
                </Text>
              </TouchableOpacity>
              {expandedProjectId === item.id && (
                <View style={styles.detailsContainer}>
                  <Text>
                    <Text style={styles.boldText}>Responsable :</Text> {item.responsable}
                  </Text>
                  <Text>
                    <Text style={styles.boldText}>Date de début :</Text> {item.date_debut}
                  </Text>
                  <Text>
                    <Text style={styles.boldText}>Date de fin :</Text> {item.date_fin}
                  </Text>
                  <Text>
                    <Text style={styles.boldText}>Budget :</Text> {item.budget.toFixed(2)} €
                  </Text>
                  <Text>
                    <Text style={styles.boldText}>Montant payé :</Text> {item.montant_payer.toFixed(2)} €
                  </Text>
                  <Text>
                    <Text style={styles.boldText}>Description :</Text> {item.description}
                  </Text>
                  <Text>
                    <Text style={styles.boldText}>Équipe :</Text>
                    <TouchableOpacity onPress={() => setShowAddTeam(true)} style={styles.addTeamButton}>
                      <Text style={styles.addTeamButtonText}>Ajouter une équipe</Text>
                    </TouchableOpacity>
                  </Text>
                </View>
              )}
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
        <Text style={styles.noProjects}>Aucun projet trouvé.</Text>
      )}
      <Modal visible={showAddTeam} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.label}>Choisir un profil :</Text>
            <Picker
              selectedValue={profile}
              onValueChange={(itemValue) => setProfile(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="Sélectionner un profil" value="" />
              <Picker.Item label="Developer" value="Developer" />
              <Picker.Item label="Designer" value="Designer" />
            </Picker>
            {profile && (
              <Picker
                selectedValue={null}
                onValueChange={(itemValue) =>
                  setSelectedUsers([...selectedUsers, users.find((user) => user.id === itemValue)])
                }
                style={styles.picker}
              >
                <Picker.Item label="Sélectionner un utilisateur" value="" />
                {users
                  .filter((user) => user.profile === profile)
                  .map((user) => (
                    <Picker.Item key={user.id} label={user.name} value={user.id} />
                  ))}
              </Picker>
            )}
            <TouchableOpacity onPress={() => handleAddTeam(expandedProjectId)} style={styles.addButton}>
              <Text style={styles.addButtonText}>Ajouter à l'équipe</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowAddTeam(false)} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};
// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f9f9f9',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  projectItem: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  projectName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  projectStatus: {
    fontSize: 14,
    color: '#666',
  },
  detailsButton: {
    marginTop: 10,
    backgroundColor: '#28a745',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  detailsButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  detailsContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  boldText: {
    fontWeight: 'bold',
  },
  addTeamButton: {
    marginTop: 10,
    backgroundColor: '#17a2b8',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  addTeamButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  noProjects: {
    textAlign: 'center',
    color: '#888',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  picker: {
    width: '100%',
    marginBottom: 20,
  },
  addButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  closeButton: {
    marginTop: 10,
    backgroundColor: '#dc3545',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default ProjectScreen;