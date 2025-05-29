import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Projets = () => {
  const [projets, setProjets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [users, setUsers] = useState([]);
  const [profile, setProfile] = useState('');
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [expandedProjectId, setExpandedProjectId] = useState(null);

  // Récupérer l'utilisateur connecté depuis localStorage
  const user = JSON.parse(localStorage.getItem('user'));

  // Récupérer les projets au chargement de la page
  useEffect(() => {
    const fetchProjets = async () => {
      try {
        const response = await axios.get('http://localhost:4000/api/projets-rs', {
          params: {
            responsable: user.name, // Filtrer par responsable
          },
        });
        setProjets(response.data);
        setLoading(false);
      } catch (err) {
        setError('Erreur lors du chargement des projets.');
        setLoading(false);
      }
    };

    const fetchUsers = async () => {
      try {
        const response = await axios.get('http://localhost:4000/users');
        setUsers(response.data);
      } catch (err) {
        console.error('Erreur lors de la récupération des utilisateurs:', err);
      }
    };

    fetchProjets();
    fetchUsers();
  }, [user.name]);

  // Gérer l'ajout d'une équipe à un projet
  const handleAddTeam = (projectId) => {
    const equipe = selectedUsers.map((user) => ({
      id: user.id,
      name: user.name,
      role: user.profile, // Profils (par exemple: Developer, Designer, etc.)
    }));

    axios
      .post(`http://localhost:4000/projets/${projectId}/ajouter-equipe`, { equipe })
      .then((response) => {
        alert('Équipe ajoutée avec succès !');
        setShowAddTeam(false);
        setSelectedUsers([]); // Réinitialiser la sélection des utilisateurs
      })
      .catch((err) => {
        alert("Erreur lors de l'ajout de l'équipe.");
      });
  };

  // Gérer l'affichage des détails d'un projet
  const toggleDetails = (projectId) => {
    setExpandedProjectId(expandedProjectId === projectId ? null : projectId);
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
                      {expandedProjectId === projet.id ? 'Masquer les détails' : 'Afficher les détails'}
                    </button>
                  </td>
                </tr>
                {expandedProjectId === projet.id && (
                  <tr>
                    <td colSpan="3" style={styles.detailsCell}>
                      <div style={styles.detailsContainer}>
                        <p><strong>Responsable :</strong> {projet.responsable}</p>
                        <p><strong>Date de début :</strong> {projet.date_debut}</p>
                        <p><strong>Date de fin :</strong> {projet.date_fin}</p>
                        <p><strong>Budget :</strong> {projet.budget.toFixed(2)} €</p>
                        <p><strong>Montant payé :</strong> {projet.montant_payer.toFixed(2)} €</p>
                        <p><strong>Description :</strong> {projet.description}</p>
                        <p>
                          <strong>Équipe :</strong>
                          <button
                            onClick={() => setShowAddTeam(true)}
                            style={styles.addTeamButton}
                          >
                            Ajouter une équipe
                          </button>
                        </p>
                        {showAddTeam && (
                          <div style={styles.addTeamForm}>
                            <label style={styles.label}>Choisir un profil :</label>
                            <select
                              onChange={(e) => setProfile(e.target.value)}
                              style={styles.select}
                            >
                              <option value="">Sélectionner un profil</option>
                              <option value="Developer">Developer</option>
                              <option value="Designer">Designer</option>
                            </select>
                            {profile && (
                              <select
                                onChange={(e) =>
                                  setSelectedUsers([...selectedUsers, users.find((user) => user.id === parseInt(e.target.value))])
                                }
                                style={styles.select}
                              >
                                <option value="">Sélectionner un utilisateur</option>
                                {users
                                  .filter((user) => user.profile === profile)
                                  .map((user) => (
                                    <option key={user.id} value={user.id}>
                                      {user.name}
                                    </option>
                                  ))}
                              </select>
                            )}
                            <button
                              onClick={() => handleAddTeam(projet.id)}
                              style={styles.addButton}
                            >
                              Ajouter à l'équipe
                            </button>
                          </div>
                        )}
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

// Styles
const styles = {
  container: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
  },
  header: {
    fontSize: '2rem',
    color: '#333',
    textAlign: 'center',
    marginBottom: '20px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginBottom: '20px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
  },
  tableHeader: {
    backgroundColor: '#007bff',
    color: '#fff',
    padding: '12px',
    textAlign: 'left',
  },
  tableRow: {
    borderBottom: '1px solid #ddd',
    '&:hover': {
      backgroundColor: '#f1f1f1',
    },
  },
  tableCell: {
    padding: '12px',
    textAlign: 'left',
  },
  detailsButton: {
    backgroundColor: '#28a745',
    color: 'white',
    padding: '8px 16px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
    '&:hover': {
      backgroundColor: '#218838',
    },
  },
  detailsCell: {
    padding: '0',
  },
  detailsContainer: {
    padding: '20px',
    backgroundColor: '#f1f1f1',
    borderTop: '1px solid #ddd',
  },
  addTeamButton: {
    backgroundColor: '#17a2b8',
    color: 'white',
    padding: '8px 16px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    marginLeft: '10px',
    transition: 'background-color 0.3s',
    '&:hover': {
      backgroundColor: '#138496',
    },
  },
  addTeamForm: {
    marginTop: '10px',
    padding: '10px',
    backgroundColor: '#fff',
    borderRadius: '5px',
    border: '1px solid #ddd',
  },
  label: {
    display: 'block',
    marginBottom: '5px',
    fontWeight: 'bold',
  },
  select: {
    width: '100%',
    padding: '8px',
    marginBottom: '10px',
    borderRadius: '5px',
    border: '1px solid #ddd',
    fontSize: '14px',
  },
  addButton: {
    backgroundColor: '#007bff',
    color: 'white',
    padding: '8px 16px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
    '&:hover': {
      backgroundColor: '#0056b3',
    },
  },
  noProjects: {
    textAlign: 'center',
    color: '#888',
    fontSize: '1.2rem',
  },
};

export default Projets;