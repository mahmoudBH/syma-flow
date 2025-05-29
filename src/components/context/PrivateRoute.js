import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch("http://localhost:4000/check-session", {
          credentials: "include", // Permet d'envoyer les cookies de session
        });

        const data = await response.json();

        if (response.ok && data.sessionActive) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        setIsAuthenticated(false);
      }
    };

    if (token) {
      checkSession();
    } else {
      setIsAuthenticated(false);
    }
  }, [token]);

  if (isAuthenticated === null) {
    return <div>Loading...</div>; // Empêche l'affichage avant vérification
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

export default PrivateRoute;
