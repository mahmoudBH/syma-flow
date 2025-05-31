// src/components/NotificationListener.js
import { useContext, useEffect } from "react";
import { WebSocketContext } from "./WebSocketContext";

const NotificationListener = () => {
  const ws = useContext(WebSocketContext);

  useEffect(() => {
    if (!ws) return;

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "new_task") {
          alert(`Nouvelle tâche : ${msg.titre} (projet : ${msg.projet})`);
          // ou utiliser un toast / snackbar
        }
      } catch {
        console.warn("WS non JSON :", event.data);
      }
    };
  }, [ws]);

  return null; // ce composant n'affiche rien à l'écran
};

export default NotificationListener;
