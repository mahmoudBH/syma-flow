// src/pages/Projets.js  (ou src/components/Projets.js selon votre arborescence)

import React, { useState, useEffect } from "react";
import axios from "axios";
import PredictProject from "../Analyse/PredictDuration"; // ← Import du composant prédiction

const Projets = () => {
  const [projets, setProjets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [users, setUsers] = useState([]);
  const [profile, setProfile] = useState("");
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [expandedProjectId, setExpandedProjectId] = useState(null);

  // Récupérer l’utilisateur stocké (contenant { name, ... })
  const user = JSON.parse(localStorage.getItem("user"));

  // Fonction utilitaire pour récupérer l’en-tête Authorization
  const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.warn("Aucun token dans localStorage. Veuillez vous reconnecter.");
      return null;
    }
    return { Authorization: `Bearer ${token}` };
  };

  useEffect(() => {
    // 1) Récupérer mes projets via /api/my-projects
    const fetchProjets = async () => {
      setLoading(true);
      const headers = getAuthHeader();
      if (!headers) {
        setError("Accès impossible : pas de token.");
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(
          "http://localhost:4000/api/my-projects",
          { headers }
        );
        setProjets(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Erreur API /api/my-projects :", err.response || err);
        setError("Erreur lors du chargement des projets.");
        setLoading(false);
      }
    };

    // 2) Récupérer la liste globale des utilisateurs (tous profils confondus)
    const fetchUsers = async () => {
      try {
        const response = await axios.get("http://localhost:4000/users");
        setUsers(response.data);
      } catch (err) {
        console.error("Erreur lors de la récupération des utilisateurs :", err);
      }
    };

    fetchProjets();
    fetchUsers();
  }, [user?.name]);

  // Gérer l’ajout d’une équipe à un projet (pour le responsable uniquement)
  const handleAddTeam = (projectId) => {
    const headers = getAuthHeader();
    if (!headers) {
      alert("Vous devez être connecté pour ajouter une équipe.");
      return;
    }

    // Construit la liste "equipe" au format attendu par l’API
    const equipe = selectedUsers.map((u) => ({
      id: u.id,
      name: u.name,
      role: u.profile, // ex : "Developer" ou "Designer"
    }));

    axios
      .post(
        `http://localhost:4000/api/projets/${projectId}/ajouter-equipe`,
        { equipe },
        { headers }
      )
      .then(() => {
        alert("Équipe ajoutée avec succès !");
        setShowAddTeam(false);
        setSelectedUsers([]);

        // Recharger immédiatement la liste des projets
        return axios.get("http://localhost:4000/api/my-projects", { headers });
      })
      .then((res) => {
        setProjets(res.data);
      })
      .catch((err) => {
        console.error(
          "Erreur API /api/projets/{id}/ajouter-equipe :",
          err.response || err
        );
        alert("Erreur lors de l'ajout de l'équipe.");
      });
  };

  // Affichage/Masquage des détails d’un projet
  const toggleDetails = (projectId) => {
    // Si on clique sur un projet déjà ouvert, on ferme et réinitialise le formulaire
    if (expandedProjectId === projectId) {
      setExpandedProjectId(null);
      setShowAddTeam(false);
      setSelectedUsers([]);
      setProfile("");
    } else {
      setExpandedProjectId(projectId);
      setShowAddTeam(false);
      setSelectedUsers([]);
      setProfile("");
    }
  };

  if (loading) {
    return <div>Chargement en cours...</div>;
  }
  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>Mes Projets</h1>

      {projets.length > 0 ? (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.tableHeader}>Nom</th>
              <th style={styles.tableHeader}>Statut</th>
              <th style={styles.tableHeader}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {projets.map((projet) => (
              <React.Fragment key={projet.id}>
                <tr style={styles.tableRow}>
                  <td style={styles.tableCell}>{projet.nom}</td>
                  <td style={styles.tableCell}>{projet.statut}</td>
                  <td style={styles.tableCell}>
                    <button
                      onClick={() => toggleDetails(projet.id)}
                      style={styles.detailsButton}
                    >
                      {expandedProjectId === projet.id
                        ? "Masquer les détails"
                        : "Afficher les détails"}
                    </button>
                  </td>
                </tr>

                {expandedProjectId === projet.id && (
                  <tr>
                    <td colSpan="3" style={styles.detailsCell}>
                      <div style={styles.detailsContainer}>
                        {/* Informations de base du projet */}
                        <p>
                          <strong>Responsable :</strong> {projet.responsable}
                        </p>
                        <p>
                          <strong>Date de début :</strong> {projet.date_debut}
                        </p>
                        <p>
                          <strong>Date de fin :</strong> {projet.date_fin}
                        </p>
                        <p>
                          <strong>Budget :</strong> {projet.budget.toFixed(2)} €
                        </p>
                        <p>
                          <strong>Montant payé :</strong>{" "}
                          {projet.montant_payer.toFixed(2)} €
                        </p>
                        <p>
                          <strong>Description :</strong> {projet.description}
                        </p>

                        {/* Affichage de l’équipe actuelle */}
                        <p>
                          <strong>Équipe actuelle :</strong>
                          {projet.equipe.length > 0 ? (
                            projet.equipe.map((membre) => (
                              <span
                                key={membre.id}
                                style={{ marginLeft: "10px" }}
                              >
                                • {membre.name} ({membre.role})
                              </span>
                            ))
                          ) : (
                            <span
                              style={{
                                marginLeft: "10px",
                                fontStyle: "italic",
                              }}
                            >
                              (pas encore d’équipe)
                            </span>
                          )}
                        </p>

                        {/* Si l'utilisateur connecté est le responsable, on affiche le bouton de gestion */}
                        {user?.name === projet.responsable && (
                          <>
                            <p>
                              <strong>Gérer l’équipe :</strong>
                              <button
                                onClick={() => setShowAddTeam(true)}
                                style={styles.addTeamButton}
                              >
                                Ajouter / Modifier
                              </button>
                            </p>

                            {showAddTeam && (
                              <div style={styles.addTeamForm}>
                                <label style={styles.label}>
                                  Choisir un profil :
                                </label>
                                <select
                                  onChange={(e) =>
                                    setProfile(e.target.value)
                                  }
                                  style={styles.select}
                                  defaultValue=""
                                >
                                  <option value="">
                                    Sélectionner un profil
                                  </option>
                                  <option value="Developer">Developer</option>
                                  <option value="Designer">Designer</option>
                                </select>
                                {profile && (
                                  <select
                                    onChange={(e) =>
                                      setSelectedUsers([
                                        ...selectedUsers,
                                        users.find(
                                          (u) =>
                                            u.id === parseInt(e.target.value)
                                        ),
                                      ])
                                    }
                                    style={styles.select}
                                    defaultValue=""
                                  >
                                    <option value="">
                                      Sélectionner un utilisateur
                                    </option>
                                    {users
                                      .filter((u) => u.profile === profile)
                                      .map((u) => (
                                        <option key={u.id} value={u.id}>
                                          {u.name}
                                        </option>
                                      ))}
                                  </select>
                                )}
                                <button
                                  onClick={() => handleAddTeam(projet.id)}
                                  style={styles.addButton}
                                >
                                  Valider l’équipe
                                </button>
                              </div>
                            )}
                          </>
                        )}
                        {/* Fin condition : seul le responsable peut gérer l’équipe */}

                        {/* ───────> ICI on insère la partie prédiction IA <─────── */}
                        <PredictProject projectId={projet.id} />
                        {/* ───────────────────────────────────────────────────────── */}

                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      ) : (
        <p style={styles.noProjects}>Aucun projet trouvé.</p>
      )}
    </div>
  );
};

// Styles (identiques à votre version précédente)
const styles = {
  container: {
    padding: "20px",
    maxWidth: "1200px",
    margin: "0 auto",
    fontFamily: "Arial, sans-serif",
    backgroundColor: "#f9f9f9",
    borderRadius: "8px",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
  },
  header: {
    fontSize: "2rem",
    color: "#333",
    textAlign: "center",
    marginBottom: "20px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginBottom: "20px",
    backgroundColor: "#fff",
    borderRadius: "8px",
    overflow: "hidden",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
  },
  tableHeader: {
    backgroundColor: "#007bff",
    color: "#fff",
    padding: "12px",
    textAlign: "left",
  },
  tableRow: {
    borderBottom: "1px solid #ddd",
  },
  tableCell: {
    padding: "12px",
    textAlign: "left",
  },
  detailsButton: {
    backgroundColor: "#28a745",
    color: "white",
    padding: "8px 16px",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    transition: "background-color 0.3s",
  },
  detailsCell: {
    padding: "0",
  },
  detailsContainer: {
    padding: "20px",
    backgroundColor: "#f1f1f1",
    borderTop: "1px solid #ddd",
  },
  addTeamButton: {
    backgroundColor: "#17a2b8",
    color: "white",
    padding: "8px 16px",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    marginLeft: "10px",
    transition: "background-color 0.3s",
  },
  addTeamForm: {
    marginTop: "10px",
    padding: "10px",
    backgroundColor: "#fff",
    borderRadius: "5px",
    border: "1px solid #ddd",
  },
  label: {
    display: "block",
    marginBottom: "5px",
    fontWeight: "bold",
  },
  select: {
    width: "100%",
    padding: "8px",
    marginBottom: "10px",
    borderRadius: "5px",
    border: "1px solid #ddd",
    fontSize: "14px",
  },
  addButton: {
    backgroundColor: "#007bff",
    color: "white",
    padding: "8px 16px",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    transition: "background-color 0.3s",
  },
  noProjects: {
    textAlign: "center",
    color: "#888",
    fontSize: "1.2rem",
  },
};

export default Projets;
