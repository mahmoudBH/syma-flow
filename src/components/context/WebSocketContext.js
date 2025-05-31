// src/contexts/WebSocketContext.js
import React, { createContext, useEffect, useState } from "react";

export const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
  const [ws, setWs] = useState(null);

  useEffect(() => {
    // Ouvre la connexion WS dès que le Provider est monté
    const socket = new WebSocket("ws://localhost:4000");
    setWs(socket);

    // En cas de déconnexion / erreur, tu peux tenter une reconnexion si besoin
    socket.onclose = () => console.log("WSProvider : WS fermé");
    socket.onerror = (e) => console.error("WSProvider : erreur WS", e);

    return () => {
      socket.close();
    };
  }, []);

  return (
    <WebSocketContext.Provider value={ws}>
      {children}
    </WebSocketContext.Provider>
  );
};
