import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from "react-native";
import { Calendar } from "react-native-calendars";
import AsyncStorage from "@react-native-async-storage/async-storage";

const CalendarScreen = () => {
  const [selectedDate, setSelectedDate] = useState("");
  const [events, setEvents] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Charger l'utilisateur et récupérer tâches + réunions
  const fetchUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem("user");
      if (!userData) throw new Error("Utilisateur non trouvé");

      const user = JSON.parse(userData);
      const assignee = user.name;

      // 1. Récupérer les tâches dont on est l'assignee
      const tasksResponse = await fetch(
        `http://192.168.43.154:4000/api/taches?assignee=${encodeURIComponent(
          assignee
        )}`
      );
      const tasksData = await tasksResponse.json();

      // 2. Récupérer toutes les réunions (incluant le champ 'responsable')
      const reunionsResponse = await fetch(
        `http://192.168.43.154:4000/api/reunions`
      );
      const reunionsData = await reunionsResponse.json();

      // 3. Parser le JSON stocké dans `participants` et filtrer uniquement
      //    celles où l'utilisateur figure dans participants OR est responsable.
      const reunionsWithParsed = reunionsData.map((r) => {
        let participantsArray = [];
        try {
          participantsArray = r.participants ? JSON.parse(r.participants) : [];
        } catch {
          participantsArray = [];
        }
        return {
          ...r,
          participants: participantsArray,
          // `responsable` est déjà présent grâce à la jointure dans l’API
        };
      });

      const filteredReunions = reunionsWithParsed.filter((r) => {
        // Si l'utilisateur est dans la liste `participants`
        const inParticipants = Array.isArray(r.participants)
          ? r.participants.some((p) => p.name === assignee)
          : false;
        // OU si l'utilisateur est le responsable du projet
        const isResponsable = r.responsable === assignee;
        return inParticipants || isResponsable;
      });

      // 4. Construire l'objet `formattedEvents` en fusionnant tâches + réunions
      const formattedEvents = {};
      // 4a. Traiter d'abord les tâches
      tasksData.forEach((task) => {
        const startDate = task.dateDebut
          ? task.dateDebut.split("T")[0]
          : null;
        const endDate = task.dateFin
          ? task.dateFin.split("T")[0]
          : null;

        if (startDate) {
          if (!formattedEvents[startDate]) formattedEvents[startDate] = [];
          formattedEvents[startDate].push({
            name: task.titre,
            type: "task",
            priority: task.priorite || "Moyenne",
            status: task.statut || "En attente",
            // Pas de responsable pour une tâche ici
          });
        }
        // Si dateFin existe et diffère de dateDebut, on ajoute un deuxième événement
        if (endDate && endDate !== startDate) {
          if (!formattedEvents[endDate]) formattedEvents[endDate] = [];
          formattedEvents[endDate].push({
            name: task.titre,
            type: "task",
            priority: task.priorite || "Moyenne",
            status: task.statut || "En attente",
          });
        }
      });

      // 4b. Traiter ensuite les réunions filtrées
      filteredReunions.forEach((reunion) => {
        // On récupère date_reunion sous forme ISO ("YYYY-MM-DDTHH:mm:ss.sssZ")
        // On en garde uniquement la partie date
        const startDate = reunion.date_reunion
          ? reunion.date_reunion.split("T")[0]
          : null;
        // Pas de dateFin pour les réunions, donc on n'en tient pas compte ici

        if (startDate) {
          if (!formattedEvents[startDate]) formattedEvents[startDate] = [];
          formattedEvents[startDate].push({
            name: reunion.titre,
            type: "reunion",
            priority: null, // Optionnel, pas de priorité pour une réunion
            status: null,
            responsible: reunion.responsable, // On ajoute le responsable ici
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

  // Rafraîchissement manuel
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserData();
    setRefreshing(false);
  };

  // Couleur selon type/priorité
  const getEventColor = (type, priority) => {
    if (type === "reunion") return "#007BFF"; // bleu pour réunion
    switch ((priority || "").toLowerCase()) {
      case "haute":
        return "#FF5733"; // rouge pour tâche prioritaire
      case "moyenne":
        return "#FFC300"; // jaune
      case "basse":
        return "#4CAF50"; // vert
      default:
        return "#28a745";
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📅 Calendrier des Événements</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#28a745" />
      ) : (
        <>
          {/* Calendrier avec points marqués */}
          <Calendar
            onDayPress={(day) => setSelectedDate(day.dateString)}
            markedDates={{
              ...Object.keys(events).reduce((acc, date) => {
                acc[date] = { marked: true, dotColor: "#28a745" };
                return acc;
              }, {}),
              [selectedDate]: {
                ...(events[selectedDate]
                  ? { selected: true, selectedColor: "#28a745" }
                  : {}),
              },
            }}
            theme={{
              arrowColor: "#28a745",
              textSectionTitleColor: "#2C3E5E",
              textDayFontSize: 16,
              textDayFontWeight: "bold",
              todayTextColor: "#FF5733",
            }}
          />

          {/* Liste des événements pour la date sélectionnée */}
          <ScrollView
            style={styles.eventContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#28a745"]}
                tintColor={"#28a745"}
              />
            }
          >
            <Text style={styles.subtitle}>
              📌 Événements du {selectedDate || "jour sélectionné"}
            </Text>

            {events[selectedDate] && events[selectedDate].length > 0 ? (
              events[selectedDate].map((event, index) => (
                <View
                  key={index}
                  style={[
                    styles.eventItem,
                    {
                      backgroundColor: getEventColor(event.type, event.priority),
                    },
                  ]}
                >
                  <Text style={styles.eventText}>
                    {event.type === "reunion"
                      ? "🎉 Réunion : "
                      : "📋 Tâche : "}
                    {event.name}
                  </Text>
                  {event.type === "reunion" && event.responsible ? (
                    <Text style={styles.eventResponsible}>
                      👤 Responsable : {event.responsible}
                    </Text>
                  ) : (
                    <Text style={styles.eventStatus}>
                      🟢 {event.status}
                    </Text>
                  )}
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
  subtitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2C3E50",
    marginVertical: 10,
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
  eventResponsible: {
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
