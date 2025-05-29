import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from "react-native";

const ProfileScreen = () => {
    const [refreshing, setRefreshing] = useState(false); // État pour le rafraîchissement

    // Fonction pour simuler le rafraîchissement
    const onRefresh = () => {
        setRefreshing(true); // Activer l'indicateur de rafraîchissement
        setTimeout(() => {
            setRefreshing(false); // Désactiver l'indicateur après un court délai
        }, 2000); // Simule une action de chargement (2 secondes)
    };

    return (
        <ScrollView
            contentContainerStyle={styles.container}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={['#28a745']} // Couleur de l'indicateur de rafraîchissement
                    tintColor={'#28a745'}
                />
            }
        >
            {/* Contenu original */}
            <Text style={styles.title}>Page de Profil</Text>
            <Text style={styles.text}>Bienvenue sur la page de votre profil.</Text>

            {/* Indicateur de chargement pendant le rafraîchissement */}
            {refreshing && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#28a745" />
                </View>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f5f5f5",
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
    },
    text: {
        fontSize: 18,
        color: "#555",
    },
    loadingContainer: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(255, 255, 255, 0.8)", // Fond semi-transparent
    },
});

export default ProfileScreen;