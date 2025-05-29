import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ActivityIndicator, View, AppState, ScrollView, RefreshControl, Text } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from 'expo-notifications';
import { Audio } from 'expo-av';
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

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

// Contexte pour partager l'état de rafraîchissement
const RefreshContext = React.createContext();

const App = () => {
  const [sound, setSound] = useState();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allowedScreens, setAllowedScreens] = useState([]);
  const [drawerKey, setDrawerKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false); // État global pour le rafraîchissement

  const fetchUser = async () => {
    try {
      const userData = await AsyncStorage.getItem("user");
      if (userData) {
        const user = JSON.parse(userData);
        setUser(user);

        const screensByCategory = {
          "Admin": [
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
          ],
          "Utilisateur": [
            { name: "Home", component: HomeScreen },
            { name: "Profile", component: ProfileScreen },
            { name: "projet", component: ProjectScreen },
            { name: "Task", component: Task },
            { name: "Calendrier", component: CalendarScreen },
            { name: "project performance", component: ProjectPerformanceScreen },
          ],
        };

        const screens = screensByCategory[user.category] || screensByCategory["Utilisateur"];
        setAllowedScreens(screens);
      } else {
        setAllowedScreens([{ name: "Home", component: HomeScreen }]);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des données utilisateur", error);
      setAllowedScreens([{ name: "Home", component: HomeScreen }]);
    } finally {
      setLoading(false);
      setDrawerKey(prevKey => prevKey + 1);
    }
  };

  useEffect(() => {
    fetchUser();

    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        fetchUser();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Fonction pour gérer le rafraîchissement global
  const onRefresh = async () => {
    setRefreshing(true); // Activer l'indicateur de rafraîchissement
    await fetchUser(); // Re-récupérer les données utilisateur et les écrans
    setRefreshing(false); // Désactiver l'indicateur de rafraîchissement
  };

  useEffect(() => {
    const ws = new WebSocket('ws://192.168.1.14:4000');

    ws.onopen = () => {
      console.log('WebSocket connecté');
    };

    ws.onmessage = async (event) => {
      const message = event.data;
      if (message !== "Connexion établie") {
        console.log('Message reçu: ', message);
      }

      const { sound } = await Audio.Sound.createAsync(
        require('./assets/rabi3-bouden.mp3')
      );
      setSound(sound);
      await sound.playAsync();

      await Notifications.presentNotificationAsync({
        title: 'Nouvelle Notification',
        body: message,
        data: { message },
      });
    };

    ws.onerror = (error) => {
      console.error('Erreur WebSocket: ', error.message);
    };

    ws.onclose = () => {
      console.log('WebSocket fermé');
    };

    return () => {
      ws.close();
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  useEffect(() => {
    const registerForPushNotifications = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status === 'granted') {
        const token = await Notifications.getExpoPushTokenAsync();
        console.log("Push token:", token);
      } else {
        alert("Permission de notification refusée!");
      }
    };

    registerForPushNotifications();
  }, []);

  const CustomDrawer = ({ navigation }) => {
    const { refreshing, onRefresh } = React.useContext(RefreshContext);

    const screensToRender = allowedScreens.length > 0 ? allowedScreens : [{ name: "Home", component: HomeScreen }];

    return (
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#28a745']} // Couleur de l'indicateur de rafraîchissement
            tintColor={'#28a745'}
          />
        }
      >
        <Drawer.Navigator initialRouteName="Home">
          {screensToRender.map((screen, index) => (
            <Drawer.Screen
              key={index}
              name={screen.name}
              component={screen.component}
            />
          ))}
        </Drawer.Navigator>
      </ScrollView>
    );
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <RefreshContext.Provider value={{ refreshing, onRefresh }}>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Login">
            <Stack.Screen
              name="Login"
              component={(props) => (
                <LoginScreen
                  {...props}
                  onRefresh={onRefresh} // Passer la fonction onRefresh
                />
              )}
              options={{ headerShown: false }}
            />
            <Stack.Screen name="Drawer" component={CustomDrawer} key={drawerKey} options={{ headerShown: false }} />
          </Stack.Navigator>
        </NavigationContainer>
      </RefreshContext.Provider>
    </SafeAreaProvider>
  );
};

export default App;