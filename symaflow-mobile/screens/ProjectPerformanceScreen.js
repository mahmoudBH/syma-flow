import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from "react-native";
import { BarChart } from "react-native-chart-kit";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ProjectPerformanceScreen = () => {
  const [projectData, setProjectData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); // État pour le rafraîchissement

  useEffect(() => {
    fetchProjectData();
  }, []);

  const fetchProjectData = async () => {
    try {
      const userData = await AsyncStorage.getItem("user");
      if (!userData) throw new Error("Utilisateur non trouvé");

      const user = JSON.parse(userData);
      const responsable = user.name;

      const response = await fetch(`http://192.168.1.16:4000/api/projets-rs?responsable=${responsable}`);
      if (!response.ok) throw new Error("Erreur lors de la récupération des projets");

      const data = await response.json();

      // Vérifier si les données sont valides
      if (!Array.isArray(data)) {
        throw new Error("Les données des projets ne sont pas au format attendu");
      }

      setProjectData(data);
    } catch (error) {
      console.error("Erreur lors du chargement des projets :", error.message);
      Alert.alert("Erreur", "Impossible de charger les données des projets.");
    } finally {
      setLoading(false);
      setRefreshing(false); // Désactiver l'indicateur de rafraîchissement
    }
  };

  // Gestion du rafraîchissement
  const onRefresh = async () => {
    setRefreshing(true); // Activer l'indicateur de rafraîchissement
    await fetchProjectData(); // Recharger les données
  };

  const renderBarChart = (projects) => {
    // Vérifier si projects est un tableau valide
    if (!Array.isArray(projects) || projects.length === 0) {
      return <Text style={styles.noDataText}>Aucun projet trouvé pour ce responsable.</Text>;
    }

    const labels = projects.map((project) => project.nom);
    const budgetData = projects.map((project) => project.budget || 0); // Gérer les valeurs manquantes
    const montantPayeData = projects.map((project) => project.montant_payer || 0); // Gérer les valeurs manquantes
    const depensesReellesData = projects.map((project) => project.depenses_reelles || 0); // Gérer les valeurs manquantes

    return (
      <View style={styles.chartSection}>
        <Text style={styles.chartTitle}>📊 Comparaison des Projets</Text>
        <BarChart
          data={{
            labels: labels,
            datasets: [
              {
                data: budgetData,
                color: (opacity = 1) => `rgba(34, 193, 195, ${opacity})`, // Couleur pour le budget
              },
              {
                data: montantPayeData,
                color: (opacity = 1) => `rgba(255, 99, 132, ${opacity})`, // Couleur pour le montant payé
              },
              {
                data: depensesReellesData,
                color: (opacity = 1) => `rgba(75, 192, 192, ${opacity})`, // Couleur pour les dépenses réelles
              },
            ],
          }}
          width={350} // Largeur du graphique
          height={220} // Hauteur du graphique
          yAxisLabel="€" // Ajouter un signe euro
          chartConfig={{
            backgroundColor: "#fff",
            backgroundGradientFrom: "#f0f0f0",
            backgroundGradientTo: "#f0f0f0",
            decimalPlaces: 2,
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            style: {
              borderRadius: 16,
            },
            propsForLabels: {
              fontSize: 14,
            },
            barColors: ["#22c1c3", "#ff6384", "#4bc0c0"], // Couleurs pour chaque série de données
          }}
          verticalLabelRotation={30}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📊 Suivi des Performances des Projets</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#28a745" />
      ) : (
        <ScrollView
          contentContainerStyle={styles.chartContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#28a745']} // Couleur de l'indicateur de rafraîchissement
              tintColor={'#28a745'}
            />
          }
        >
          {renderBarChart(projectData)}
        </ScrollView>
      )}
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  chartContainer: {
    alignItems: "center",
    justifyContent: "center",
    flexGrow: 1,
  },
  chartSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#34495E",
    textAlign: "center",
  },
  noDataText: {
    textAlign: "center",
    fontSize: 18,
    fontStyle: "italic",
    color: "#888",
    marginTop: 20,
  },
});

export default ProjectPerformanceScreen;