// src/components/PredictProject.js

import React, { useEffect, useState } from "react";
import axios from "axios";

const PredictProject = ({ projectId }) => {
  const [loading, setLoading] = useState(true);
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!projectId) return;

    const fetchPrediction = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          `http://localhost:5000/api/predict-project?project_id=${projectId}`
        );
        setPrediction(res.data);
      } catch (err) {
        console.error("Erreur Fetch Prediction :", err);
        setError("Impossible de récupérer la prédiction.");
      } finally {
        setLoading(false);
      }
    };

    fetchPrediction();
  }, [projectId]);

  if (loading) {
    return <p>Chargement de la prédiction…</p>;
  }
  if (error) {
    return <p style={{ color: "red" }}>{error}</p>;
  }
  if (!prediction) {
    return null;
  }

  const {
    predicted_duration_days,
    predicted_end_date,
    planned_end_date,
    risk_status,
  } = prediction;

  return (
    <div
      style={{
        border: "1px solid #ddd",
        padding: "16px",
        borderRadius: "8px",
        background: "#f9f9f9",
        marginTop: "16px",
        maxWidth: "400px",
      }}
    >
      <h3>📊 Analyse prédictive du projet</h3>
      <p>
        📆 Durée estimée par l’IA :{" "}
        <strong>{predicted_duration_days} jours</strong>
      </p>
      <p>
        📅 Date estimée de fin : <strong>{predicted_end_date}</strong>
      </p>
      <p>
        🔖 Date de fin planifiée : <strong>{planned_end_date}</strong>
      </p>
      <p>
        Statut :{" "}
        {risk_status === "retard" ? (
          <span style={{ color: "red", fontWeight: "bold" }}>
            ⚠️ Risque de retard
          </span>
        ) : (
          <span style={{ color: "green", fontWeight: "bold" }}>
            ✅ OK
          </span>
        )}
      </p>
    </div>
  );
};

export default PredictProject;
