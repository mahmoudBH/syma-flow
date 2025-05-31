// App.js
import React, { useEffect, useState, createContext } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  ActivityIndicator,
  View,
  AppState,
  ScrollView,
  RefreshControl,
  Text,
  StyleSheet,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Audio } from "expo-av";

import LoginScreen from "./screens/LoginScreen";
import HomeScreen from "./screens/HomeScreen";
import ProfileScreen from "./screens/ProfileScreen";
import AddProjectScreen from "./screens/AddProjectScreen";
import ProjectScreen from "./screens/ProjectScreen";
import AddTask from "./screens/AddTask";
import Task from "./screens/Task";
import ManageUsers from "./screens/ManageUsers";
import CalendarScreen from "./screens/CalendarScreen";
import ProjectPerformanceScreen from "./screens/ProjectPerformanceScreen";
import AjouterReunionScreen from "./screens/ProjectMeetingsScreen";
import AnomaliesScreen from "./screens/AnomaliesScreen";

// Polyfill Dimensions.removeEventListener
import { Dimensions } from "react-native";
if (!Dimensions.removeEventListener) Dimensions.removeEventListener = () => {};

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();
export const RefreshContext = createContext();

const App = () => {
  const [sound, setSound] = useState();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allowedScreens, setAllowedScreens] = useState([]);
  const [drawerKey, setDrawerKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  // Charger l'utilisateur et configurer les écrans
  const fetchUser = async () => {
    try {
      const raw = await AsyncStorage.getItem("user");
      const u = raw ? JSON.parse(raw) : null;
      setUser(u);
      const screensByCategory = {
        Admin: [
          { name: "Home", component: HomeScreen },
          { name: "Profile", component: ProfileScreen },
          { name: "Ajouter Projet", component: AddProjectScreen },
          { name: "Add Task", component: AddTask },
          { name: "project meeting", component: AjouterReunionScreen },
          { name: "projet", component: ProjectScreen },
          { name: "Task", component: Task },
          { name: "Manage Users", component: ManageUsers },
          { name: "Calendrier", component: CalendarScreen },
          { name: "project performance", component: ProjectPerformanceScreen },
          { name: "Anomalies", component: AnomaliesScreen },
        ],
        Utilisateur: [
          { name: "Home", component: HomeScreen },
          { name: "Profile", component: ProfileScreen },
          { name: "projet", component: ProjectScreen },
          { name: "Task", component: Task },
          { name: "Calendrier", component: CalendarScreen },
          { name: "project performance", component: ProjectPerformanceScreen },
        ],
      };
      setAllowedScreens(u?.category ? screensByCategory[u.category] : screensByCategory.Utilisateur);
    } catch (e) {
      console.error(e);
      setAllowedScreens([{ name: "Home", component: HomeScreen }]);
    } finally {
      setLoading(false);
      setDrawerKey((k) => k + 1);
    }
  };

  // Rafraîchissement global
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUser();
    setRefreshing(false);
  };

  // Effet initial & foreground
  useEffect(() => {
    fetchUser();
    const sub = AppState.addEventListener("change", (state) => state === "active" && fetchUser());
    return () => sub.remove();
  }, []);

  // WebSocket pour notifications de nouvelle tâche
  useEffect(() => {
    const ws = new WebSocket("ws://192.168.43.154:4000");
    ws.onopen = () => console.log("WS connecté");
    ws.onmessage = async ({ data }) => {
      try {
        const msg = JSON.parse(data);
        if (msg.type === "new_task") {
          // Jouer un son
          const { sound } = await Audio.Sound.createAsync(require("./assets/notification-iphone.mp3"));
          setSound(sound);
          await sound.playAsync();
          // Afficher notification locale
          await Notifications.presentNotificationAsync({
            title: "Nouvelle tâche",
            body: `${msg.titre} (${msg.projet})`,
          });
        }
      } catch {
        console.warn("Message WS non JSON:", data);
      }
    };
    ws.onerror = (e) => console.error("WS erreur", e.message);
    ws.onclose = () => console.log("WS fermé");
    return () => {
      ws.close();
      if (sound) sound.unloadAsync();
    };
  }, [sound]);

  // Permissions notifications
  useEffect(() => {
    Notifications.requestPermissionsAsync();
    Notifications.getExpoPushTokenAsync().then((t) => console.log("Push token:", t));
  }, []);

  if (loading) {
    return <View style={styles.loading}><ActivityIndicator size="large" color="#0000ff" /></View>;
  }

  const CustomDrawer = ({ navigation }) => {
    const { refreshing, onRefresh } = React.useContext(RefreshContext);
    const screens = allowedScreens.length ? allowedScreens : [{ name: "Home", component: HomeScreen }];
    return (
      <View style={styles.drawerContainer}>
        <View style={styles.drawerHeader}><Text style={styles.drawerTitle}>SymaFlow</Text></View>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#5E72E4"]} tintColor="#5E72E4" />}
        >
          <Drawer.Navigator
            screenOptions={{
              headerShown: false,
              drawerStyle: styles.drawerStyle,
              drawerActiveTintColor: '#5E72E4',
              drawerInactiveTintColor: '#495057',
              drawerLabelStyle: styles.drawerLabel,
              sceneContainerStyle: { backgroundColor: '#F8F9FA' }
            }}
          >
            {screens.map((s, i) => (
              <Drawer.Screen key={i} name={s.name} component={s.component} />
            ))}
          </Drawer.Navigator>
        </ScrollView>
      </View>
    );
  };

  return (
    <SafeAreaProvider>
      <RefreshContext.Provider value={{ refreshing, onRefresh }}>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Login">
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Drawer" component={CustomDrawer} key={drawerKey} options={{ headerShown: false }} />
          </Stack.Navigator>
        </NavigationContainer>
      </RefreshContext.Provider>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  drawerContainer: { flex: 1, backgroundColor: '#F8F9FA' },
  drawerHeader: { backgroundColor: '#FFF', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E9ECEF' },
  drawerTitle: { fontSize: 24, fontWeight: '700', color: '#5E72E4', textAlign: 'center' },
  drawerStyle: { backgroundColor: '#FFF', width: 240 },
  drawerLabel: { fontSize: 16, fontWeight: '500', marginLeft: -8 },
});

export default App;
