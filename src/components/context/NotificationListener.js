// src/components/NotificationListener.js
import { useContext, useEffect } from "react";
import { WebSocketContext } from "./WebSocketContext";

const NotificationListener = () => {
  const ws = useContext(WebSocketContext);

  useEffect(() => {
    if (!ws) return;

    // Dès que la connexion WS s'ouvre, on s'enregistre avec le nom d'utilisateur
    ws.onopen = () => {
      console.log("WS ouvert, enregistrement de l'utilisateur");
      // Récupère le `user` stocké dans localStorage (après login)
      const storedUser = JSON.parse(localStorage.getItem("user"));
      if (storedUser && storedUser.name) {
        ws.send(JSON.stringify({ type: "register", user: storedUser.name }));
      }
    };

    // À la réception d'un message, afficher une alerte si c'est pour nous
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "new_task") {
          alert(`Nouvelle tâche pour vous :\n"${msg.titre}" (Projet : ${msg.projet})`);
          // si vous avez un toast/snackbar, vous pouvez l’utiliser ici
        }
      } catch (err) {
        console.warn("WS message non JSON:", event.data);
      }
    };

    ws.onerror = (err) => {
      console.error("WS erreur :", err);
    };

    ws.onclose = () => {
      console.log("WS fermé");
    };

    // Pas de cleanup particulier ici : la fermeture du contexte fermera le socket
  }, [ws]);

  return null; // ce composant n'affiche rien
};

export default NotificationListener;
