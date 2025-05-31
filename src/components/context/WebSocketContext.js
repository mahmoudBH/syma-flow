// src/contexts/WebSocketContext.js
import React, { createContext, useEffect, useState } from "react";

export const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
  const [ws, setWs] = useState(null);

  useEffect(() => {
    // adapte l'URL si tu as un path spécifique
    const socket = new WebSocket("ws://localhost:4000");
    socket.onopen = () => console.log("WS connecté");
    socket.onerror = (err) => console.error("WS erreur", err);
    socket.onclose = () => console.log("WS fermé");

    setWs(socket);
    return () => socket.close();
  }, []);

  return (
    <WebSocketContext.Provider value={ws}>
      {children}
    </WebSocketContext.Provider>
  );
};
