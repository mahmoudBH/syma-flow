import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, RefreshControl } from "react-native";
import { Calendar } from "react-native-calendars";
import AsyncStorage from "@react-native-async-storage/async-storage";

const CalendarScreen = () => {
  const [selectedDate, setSelectedDate] = useState("");
  const [events, setEvents] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); // État pour le rafraîchissement

  // Fonction pour charger les données utilisateur et les événements
  const fetchUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem("user");
      if (!userData) throw new Error("Utilisateur non trouvé");

      const user = JSON.parse(userData);
      const assignee = user.name;

      // Récupérer les tâches
      const tasksResponse = await fetch(`http://192.168.43.154:4000/api/taches?assignee=${assignee}`);
      const tasksData = await tasksResponse.json();

      // Récupérer les réunions
      const reunionsResponse = await fetch(`http://192.168.43.154:4000/api/reunions`);
      const reunionsData = await reunionsResponse.json();

      // Convertir les participants JSON en tableau JavaScript
      const reunionsWithParsedParticipants = reunionsData.map(reunion => ({
        ...reunion,
        participants: reunion.participants ? JSON.parse(reunion.participants) : [],
      }));

      // Filtrer les réunions où l'utilisateur est un participant
      const filteredReunions = reunionsWithParsedParticipants.filter(reunion => {
        if (Array.isArray(reunion.participants)) {
          return reunion.participants.some(participant => participant.name === assignee);
        }
        return false;
      });

      // Fusionner les tâches et les réunions
      const formattedEvents = {};
      [...tasksData, ...filteredReunions].forEach(event => {
        const startDate = event.date_reunion ? event.date_reunion.split("T")[0] : null; // Utiliser date_reunion pour les réunions
        const endDate = event.dateFin ? event.dateFin.split("T")[0] : null;

        if (startDate) {
          if (!formattedEvents[startDate]) formattedEvents[startDate] = [];
          formattedEvents[startDate].push({
            name: event.titre,
            type: event.participants ? "reunion" : "task", // Distinction entre réunion et tâche
            priority: event.priorite || "Moyenne",
            status: event.statut || "En attente",
          });
        }

        if (endDate && startDate !== endDate) {
          if (!formattedEvents[endDate]) formattedEvents[endDate] = [];
          formattedEvents[endDate].push({
            name: event.titre,
            type: event.participants ? "reunion" : "task",
            priority: event.priorite || "Moyenne",
            status: event.statut || "En attente",
          });
        }
      });

      setEvents(formattedEvents);
    } catch (error) {
      console.error("Erreur lors du chargement des événements :", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  // Gestion du rafraîchissement
  const onRefresh = async () => {
    setRefreshing(true); // Activer l'indicateur de rafraîchissement
    await fetchUserData(); // Recharger les données
    setRefreshing(false); // Désactiver l'indicateur de rafraîchissement
  };

  // Définir la couleur des événements
  const getEventColor = (type, priority) => {
    if (type === "reunion") return "#007BFF"; // Bleu pour les réunions
    switch (priority.toLowerCase()) {
      case "haute":
        return "#FF5733"; // Rouge vif pour les tâches
      case "moyenne":
        return "#FFC300"; // Jaune doré
      case "basse":
        return "#4CAF50"; // Vert clair
      default:
        return "#28a745"; // Vert intense
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📅 Calendrier des Événements</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#28a745" />
      ) : (
        <>
          <Calendar
            onDayPress={(day) => setSelectedDate(day.dateString)}
            markedDates={{
              ...Object.keys(events).reduce((acc, date) => {
                acc[date] = { marked: true, dotColor: "#28a745" };
                return acc;
              }, {}),
              [selectedDate]: { selected: true, selectedColor: "#28a745" },
            }}
            theme={{
              arrowColor: "#28a745",
              textSectionTitleColor: "#2C3E5E",
              textDayFontSize: 16,
              textDayFontWeight: "bold",
              todayTextColor: "#FF5733",
            }}
          />

          <ScrollView
            style={styles.eventContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#28a745']} // Couleur de l'indicateur de rafraîchissement
                tintColor={'#28a745'}
              />
            }
          >
            <Text style={styles.subtitle}>
              📌 Événements du {selectedDate || "jour sélectionné"}
            </Text>
            {events[selectedDate]?.length ? (
              events[selectedDate].map((event, index) => (
                <View
                  key={index}
                  style={[
                    styles.eventItem,
                    { backgroundColor: getEventColor(event.type, event.priority) },
                  ]}
                >
                  <Text style={styles.eventText}>
                    {event.type === "reunion" ? "🎉 Réunion : " : "📋 Tâche : "}
                    {event.name}
                  </Text>
                  <Text style={styles.eventStatus}>
                    {event.type === "reunion"
                      ? "👥 Participants inclus"
                      : `🟢 ${event.status}`}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.noEvent}>Aucun événement prévu</Text>
            )}
          </ScrollView>
        </>
      )}
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    padding: 20,
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
  eventContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  eventItem: {
    padding: 15,
    borderRadius: 10,
    marginVertical: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  eventText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  eventStatus: {
    fontSize: 14,
    fontStyle: "italic",
    color: "#FFFFFF",
    marginTop: 5,
  },
  noEvent: {
    fontSize: 16,
    fontStyle: "italic",
    color: "#888",
    textAlign: "center",
    marginTop: 10,
  },
});

export default CalendarScreen;