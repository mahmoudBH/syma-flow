import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  Alert,
  Dimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/MaterialIcons";

const HomeScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [numColumns, setNumColumns] = useState(3);
  const [windowWidth, setWindowWidth] = useState(Dimensions.get('window').width);

  useEffect(() => {
    const updateLayout = ({ window }) => {
      const width = window.width;
      setWindowWidth(width);
      const isTablet = width >= 768;
      setNumColumns(isTablet ? 4 : 3);
    };

    const subscription = Dimensions.addEventListener('change', updateLayout);
    updateLayout({ window: Dimensions.get('window') });

    return () => subscription?.remove();
  }, []);

  const fetchUser = async () => {
    try {
      const data = await AsyncStorage.getItem("user");
      if (data) setUser(JSON.parse(data));
    } catch (e) {
      console.error("Fetching user failed:", e);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchUser();
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.clear();
      navigation.replace("Login");
    } catch {
      Alert.alert("Erreur", "Impossible de se déconnecter");
    }
  };

  const screensByCategory = {
    Admin: [
      { name: "Home", label: "Accueil", icon: "home" },
      { name: "Profile", label: "Profil", icon: "person" },
      { name: "Ajouter Projet", label: "Ajouter Projet", icon: "add-box" },
      { name: "Add Task", label: "Add Task", icon: "add-task" },
      { name: "project meeting", label: "Réunion", icon: "group" },
      { name: "projet", label: "Projets", icon: "folder" },
      { name: "Task", label: "Tâches", icon: "assignment" },
      { name: "Manage Users", label: "Utilisateurs", icon: "manage-accounts" },
      { name: "Calendrier", label: "Calendrier", icon: "calendar-today" },
      { name: "project performance", label: "Performances", icon: "show-chart" },
      { name: "Anomalies", label: "Anomalies", icon: "warning" },
    ],
    Utilisateur: [
      { name: "Home", label: "Accueil", icon: "home" },
      { name: "Profile", label: "Profil", icon: "person" },
      { name: "projet", label: "Projets", icon: "folder" },
      { name: "Task", label: "Tâches", icon: "assignment" },
      { name: "Calendrier", label: "Calendrier", icon: "calendar-today" },
      { name: "project performance", label: "Performances", icon: "show-chart" },
    ],
  };

  const screens = user
    ? screensByCategory[user.category] || screensByCategory.Utilisateur
    : [];

  const renderCard = ({ item }) => {
    const cardMaxWidth = windowWidth / numColumns - 24; // accounting for padding/margin
    return (
      <TouchableOpacity
        style={[styles.card, { maxWidth: cardMaxWidth }]}
        onPress={() => navigation.navigate(item.name.trim())}
        activeOpacity={0.9}
      >
        <View style={styles.iconWrapper}>
          <Icon name={item.icon} size={26} color="#5E72E4" />
        </View>
        <Text style={styles.cardLabel}>{item.label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Text style={styles.welcome}>Bonjour,</Text>
          <Text style={styles.username}>{user?.name || "Utilisateur"}</Text>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{user?.category || "Utilisateur"}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutIcon}>
          <Icon name="logout" size={24} color="#6C757D" />
        </TouchableOpacity>
      </View>

      <FlatList
        key={`columns-${numColumns}`}
        data={screens}
        keyExtractor={(_, i) => i.toString()}
        renderItem={renderCard}
        numColumns={numColumns}
        columnWrapperStyle={numColumns > 1 ? styles.row : null}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#5E72E4"]}
            tintColor="#5E72E4"
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8F9FA" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 24,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E9ECEF",
  },
  userInfo: { flex: 1 },
  welcome: { fontSize: 16, color: "#6C757D", marginBottom: 4 },
  username: { fontSize: 24, fontWeight: "700", color: "#212529", marginBottom: 8 },
  categoryBadge: {
    backgroundColor: "#E9ECEF",
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 12,
    alignSelf: "flex-start",
  },
  categoryText: { fontSize: 12, fontWeight: "600", color: "#495057" },
  logoutIcon: { padding: 8, marginTop: 4 },
  list: { padding: 16, paddingTop: 8 },
  row: { justifyContent: 'space-between', marginBottom: 16 },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    margin: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F1F3F5",
    flex: 1,
    minWidth: 100,
  },
  iconWrapper: {
    backgroundColor: "#F0F4FF",
    borderRadius: 12,
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: "#495057",
    textAlign: "center",
  },
});

export default HomeScreen;
