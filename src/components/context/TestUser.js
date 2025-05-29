import React, { useState, useEffect } from "react";
import axios from "axios";

const TestUser = () => {
  const [category, setCategory] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Récupérer le token du localStorage ou d'un autre endroit
    const token = localStorage.getItem("token");

    if (token) {
      // Appeler l'API pour récupérer la catégorie
      axios
        .get("http://localhost:4000/api/get-category", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then((response) => {
          setCategory(response.data.category);
        })
        .catch((err) => {
          console.error("Erreur lors de la récupération de la catégorie :", err);
          setError("Erreur lors de la récupération de la catégorie.");
        });
    } else {
      setError("Token non trouvé.");
    }
  }, []);

  return (
    <div>
      <h1>Catégorie de l'utilisateur</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {category ? (
        <p>Catégorie : {category}</p>
      ) : (
        <p>Chargement de la catégorie...</p>
      )}
    </div>
  );
};

export default TestUser;
