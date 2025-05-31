// CustomDrawer.js
import React, { useContext } from "react";
import { ScrollView, RefreshControl, View, Text, StyleSheet } from "react-native";
import { createDrawerNavigator, DrawerItemList } from "@react-navigation/drawer";
import { RefreshContext } from "./App";

// Import des écrans
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

const Drawer = createDrawerNavigator();

const componentMap = {
  HomeScreen,
  ProfileScreen,
  AddProjectScreen,
  ProjectScreen,
  AddTask,
  Task,
  ManageUsers,
  CalendarScreen,
  ProjectPerformanceScreen,
  AjouterReunionScreen,
  AnomaliesScreen,
};

function CustomDrawerContent(props) {
  const { refreshing, onRefresh } = useContext(RefreshContext);
  return (
    <ScrollView
      {...props}
      contentContainerStyle={styles.scroll}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={["#5E72E4"]}
          tintColor="#5E72E4"
        />
      }
    >
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>SymaFlow</Text>
      </View>
      <DrawerItemList {...props} />
    </ScrollView>
  );
}

export default function CustomDrawer({ allowedScreens }) {
  const screensToRender =
    allowedScreens && allowedScreens.length > 0
      ? allowedScreens
      : [{ name: "Home", component: "HomeScreen" }];

  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: styles.drawer,
        drawerActiveTintColor: "#5E72E4",
        drawerInactiveTintColor: "#495057",
        drawerLabelStyle: styles.label,
        sceneContainerStyle: { backgroundColor: '#F8F9FA' },
      }}
    >
      {screensToRender.map((screen, idx) => {
        const Component = componentMap[screen.component];
        return (
          <Drawer.Screen
            key={idx}
            name={screen.name}
            component={Component}
          />
        );
      })}
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, paddingTop: 20, backgroundColor: '#F8F9FA' },
  drawer: {
    backgroundColor: "#FFFFFF",
    width: 240,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: -16,
  },
  headerContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#5E72E4',
  },
});
