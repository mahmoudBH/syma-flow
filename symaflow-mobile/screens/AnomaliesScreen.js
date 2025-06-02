import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from "react-native";

export default function AnomaliesScreen() {
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://192.168.43.154:4000/anomalies")
      .then(async (res) => {
        const text = await res.text();
        try {
          const json = JSON.parse(text);
          setAnomalies(json.anomalies || []);
        } catch (e) {
          console.error("Parse JSON error:", e);
          console.log("Réponse reçue:", text);
        } finally {
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Erreur fetch:", err);
        setLoading(false);
      });
  }, []);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.type}>{item.type}</Text>
      <Text>{item.message}</Text>
    </View>
  );

  const renderHeader = () => (
    <Text style={styles.title}>Anomalies détectées</Text>
  );

  const renderEmpty = () => (
    <Text style={styles.empty}>Aucune anomalie détectée.</Text>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <FlatList
      data={anomalies}
      keyExtractor={(item, index) => index.toString()}
      renderItem={renderItem}
      ListHeaderComponent={renderHeader}
      ListEmptyComponent={renderEmpty}
      contentContainerStyle={
        anomalies.length === 0 ? styles.center : styles.contentContainer
      }
    />
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 12,
  },
  empty: {
    fontSize: 16,
    color: "#777",
    marginTop: 20,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#f2f2f2",
    padding: 12,
    borderRadius: 8,
    marginVertical: 6,
  },
  type: {
    fontWeight: "bold",
    color: "#d32f2f",
    marginBottom: 4,
  },
});
