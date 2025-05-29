import React, { useState, useEffect } from "react";
import axios from "axios";
import styled from "styled-components";

const AddTask = () => {
  const [projets, setProjets] = useState([]);
  const [selectedProjet, setSelectedProjet] = useState("");
  const [equipe, setEquipe] = useState([]);
  const [assignee, setAssignee] = useState("");
  const [expediteur, setExpediteur] = useState("");
  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [priorite, setPriorite] = useState("Moyenne");
  const [statut, setStatut] = useState("En attente");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [error, setError] = useState("");

  // Récupérer l'utilisateur connecté depuis localStorage
  const user = JSON.parse(localStorage.getItem("user"));

  // Récupérer les projets du responsable connecté
  useEffect(() => {
    const fetchProjets = async () => {
      try {
        const response = await axios.get("http://localhost:4000/api/projets-rs", {
          params: {
            responsable: user.name, // Filtrer par responsable
          },
        });
        setProjets(response.data);
        console.log("Projets récupérés :", response.data); // Log pour vérifier les projets
      } catch (err) {
        setError("Erreur lors du chargement des projets");
      }
    };

    fetchProjets();

    // Récupérer l'utilisateur connecté pour l'expéditeur
    if (user) {
      setExpediteur(user.name);
    }
  }, [user]);

  // Mettre à jour l'équipe quand un projet est sélectionné
  const handleProjetChange = (e) => {
    const projetNom = e.target.value;
    setSelectedProjet(projetNom);

    // Trouver le projet sélectionné
    const projet = projets.find((p) => p.nom === projetNom);
    if (projet && projet.equipe) {
      setEquipe(projet.equipe); // L'équipe est déjà un tableau d'objets
      console.log("Équipe récupérée :", projet.equipe); // Log pour vérifier l'équipe
    } else {
      setEquipe([]); // Si pas d'équipe, réinitialiser
    }
  };

  // Soumettre la tâche au backend
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!selectedProjet || !expediteur || !assignee || !titre || !description) {
      setError("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    const nouvelleTache = {
      projet: selectedProjet,
      expediteur,
      assignee,
      titre,
      description,
      priorite,
      statut,
      dateDebut,
      dateFin,
    };

    axios
      .post("http://localhost:4000/api/taches", nouvelleTache)
      .then(() => {
        alert("Tâche ajoutée avec succès !");
        // Réinitialiser le formulaire
        setSelectedProjet("");
        setAssignee("");
        setTitre("");
        setDescription("");
        setPriorite("Moyenne");
        setStatut("En attente");
        setDateDebut("");
        setDateFin("");
      })
      .catch(() => setError("Erreur lors de l'ajout de la tâche."));
  };

  return (
    <StyledContainer>
      <h2>Ajouter une Tâche</h2>

      {error && <StyledError>{error}</StyledError>}

      <form onSubmit={handleSubmit}>
        {/* Sélection du projet */}
        <StyledInputWrapper>
          <label>Projet :</label>
          <select value={selectedProjet} onChange={handleProjetChange} required>
            <option value="">Sélectionnez un projet</option>
            {projets.map((projet) => (
              <option key={projet.id} value={projet.nom}>
                {projet.nom}
              </option>
            ))}
          </select>
        </StyledInputWrapper>

        {/* Expediteur (Reporter) - récupéré automatiquement */}
        <StyledInputWrapper>
          <label>Reporter :</label>
          <input type="text" value={expediteur} disabled />
        </StyledInputWrapper>

        {/* Assignee (Assigné) - sélection parmi l'équipe */}
        <StyledInputWrapper>
          <label>Assigné :</label>
          <select value={assignee} onChange={(e) => setAssignee(e.target.value)} required>
            <option value="">Sélectionnez un membre</option>
            {equipe.length > 0 ? (
              equipe.map((membre, index) => (
                <option key={index} value={membre.name}>
                  {membre.name} ({membre.role})
                </option>
              ))
            ) : (
              <option value="">Aucun membre dans l'équipe</option>
            )}
          </select>
        </StyledInputWrapper>

        {/* Titre */}
        <StyledInputWrapper>
          <label>Titre :</label>
          <input
            type="text"
            value={titre}
            onChange={(e) => setTitre(e.target.value)}
            required
          />
        </StyledInputWrapper>

        {/* Description */}
        <StyledInputWrapper>
          <label>Description :</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </StyledInputWrapper>

        {/* Priorité */}
        <StyledInputWrapper>
          <label>Priorité :</label>
          <select value={priorite} onChange={(e) => setPriorite(e.target.value)}>
            <option value="Basse">Basse</option>
            <option value="Moyenne">Moyenne</option>
            <option value="Haute">Haute</option>
          </select>
        </StyledInputWrapper>

        {/* Statut */}
        <StyledInputWrapper>
          <label>Statut :</label>
          <select value={statut} onChange={(e) => setStatut(e.target.value)}>
            <option value="En attente">En attente</option>
            <option value="En cours">En cours</option>
            <option value="Terminée">Terminée</option>
          </select>
        </StyledInputWrapper>

        {/* Date de début */}
        <StyledInputWrapper>
          <label>Date de début :</label>
          <input
            type="date"
            value={dateDebut}
            onChange={(e) => setDateDebut(e.target.value)}
          />
        </StyledInputWrapper>

        {/* Date de fin */}
        <StyledInputWrapper>
          <label>Date de fin :</label>
          <input
            type="date"
            value={dateFin}
            onChange={(e) => setDateFin(e.target.value)}
          />
        </StyledInputWrapper>

        {/* Bouton Ajouter Tâche */}
        <StyledButton type="submit">Ajouter Tâche</StyledButton>
      </form>
    </StyledContainer>
  );
};

// Styled Components
const StyledContainer = styled.div`
  max-width: 600px;
  margin: 50px auto;
  padding: 20px;
  background-color: #ffffff;
  border-radius: 10px;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
`;

const StyledError = styled.p`
  color: #e74c3c;
  font-weight: bold;
  margin-bottom: 15px;
`;

const StyledInputWrapper = styled.div`
  margin-bottom: 15px;

  label {
    display: block;
    font-weight: bold;
    margin-bottom: 5px;
    color: #333333;
  }

  input,
  select,
  textarea {
    width: 100%;
    padding: 10px;
    border: 1px solid #cccccc;
    border-radius: 5px;
    font-size: 16px;
    outline: none;

    &:focus {
      border-color: #007bff;
      box-shadow: 0px 0px 5px rgba(0, 123, 255, 0.2);
    }
  }

  textarea {
    resize: vertical;
    min-height: 100px;
  }
`;

const StyledButton = styled.button`
  width: 100%;
  padding: 10px;
  background-color: #28a745;
  color: #ffffff;
  font-size: 16px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #218838;
  }
`;

export default AddTask;