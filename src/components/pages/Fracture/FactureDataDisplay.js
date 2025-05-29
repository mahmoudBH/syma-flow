// components/pages/Fracture/FactureDataDisplay.js
import React from "react";

const FactureDataDisplay = ({ factureData }) => {
  if (!factureData) {
    return <p>Aucune donnée de facture disponible.</p>;
  }

  return (
    <div style={styles.container}>
      <h3 style={styles.header}>Données de la Facture</h3>
      <div style={styles.card}>
        <div style={styles.field}>
          <strong>Date de Facturation :</strong>
          <span>{factureData.dateFacturation?.text || "Non disponible"}</span>
        </div>
        <div style={styles.field}>
          <strong>Échéance :</strong>
          <span>{factureData.echeance?.text || "Non disponible"}</span>
        </div>
        <div style={styles.field}>
          <strong>Total TTC :</strong>
          <span>{factureData.totalTTC?.text || "Non disponible"}</span>
        </div>
        <div style={styles.field}>
          <strong>Destinataire :</strong>
          <span>{factureData.destinataire?.text || "Non disponible"}</span>
        </div>
      </div>
    </div>
  );
};

// Styles pour le composant
const styles = {
  container: {
    marginTop: "20px",
    padding: "20px",
    fontFamily: "Arial, sans-serif",
  },
  header: {
    fontSize: "24px",
    color: "#333",
    marginBottom: "20px",
  },
  card: {
    backgroundColor: "#f9f9f9",
    border: "1px solid #ddd",
    borderRadius: "8px",
    padding: "20px",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
  },
  field: {
    marginBottom: "15px",
    fontSize: "16px",
  },
};

export default FactureDataDisplay;