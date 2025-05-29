import React, { useState, useEffect } from "react";
import axios from "axios";
import styled from "styled-components";

const AddProject = () => {
  const [formData, setFormData] = useState({
    nom: "",
    responsable: "",
    date_debut: "",
    date_fin: "",
    budget: "",
    description: "",
  });

  const [admins, setAdmins] = useState([]);

  useEffect(() => {
    // Charger les utilisateurs ayant category = 'Admin'
    axios
      .get("http://localhost:4000/api/admins")
      .then((response) => setAdmins(response.data))
      .catch((error) =>
        console.error("Erreur lors du chargement des admins", error)
      );
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.post("http://localhost:4000/api/add-project", formData); // Supprime `const response =`
      alert("Projet ajouté avec succès");
      setFormData({
        nom: "",
        responsable: "",
        date_debut: "",
        date_fin: "",
        budget: "",
        description: "",
      });
    } catch (error) {
      alert("Erreur lors de l'ajout du projet");
    }
  };

  return (
    <StyledContainer>
      <StyledCard>
        <h1>Ajouter un Projet</h1>

        <form onSubmit={handleSubmit}>
          {/* Nom du projet */}
          <StyledInputWrapper>
            <label>Nom du projet :</label>
            <input
              type="text"
              name="nom"
              value={formData.nom}
              onChange={handleChange}
              placeholder="Nom du projet"
              required
            />
          </StyledInputWrapper>

          {/* Responsable */}
          <StyledInputWrapper>
            <label>Responsable :</label>
            <select
              name="responsable"
              value={formData.responsable}
              onChange={handleChange}
              required
            >
              <option value="">Sélectionner un responsable</option>
              {admins.map((admin) => (
                <option key={admin.id} value={admin.name}>
                  {admin.name}
                </option>
              ))}
            </select>
          </StyledInputWrapper>

          {/* Date de début */}
          <StyledInputWrapper>
            <label>Date de début :</label>
            <input
              type="date"
              name="date_debut"
              value={formData.date_debut}
              onChange={handleChange}
              required
            />
          </StyledInputWrapper>

          {/* Date de fin */}
          <StyledInputWrapper>
            <label>Date de fin :</label>
            <input
              type="date"
              name="date_fin"
              value={formData.date_fin}
              onChange={handleChange}
              required
            />
          </StyledInputWrapper>

          {/* Budget */}
          <StyledInputWrapper>
            <label>Budget :</label>
            <input
              type="number"
              name="budget"
              value={formData.budget}
              onChange={handleChange}
              placeholder="Budget"
              required
            />
          </StyledInputWrapper>

          {/* Description */}
          <StyledInputWrapper>
            <label>Description :</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Description du projet"
              required
            />
          </StyledInputWrapper>

          {/* Bouton Ajouter */}
          <StyledButton type="submit">Ajouter le projet</StyledButton>
        </form>
      </StyledCard>
    </StyledContainer>
  );
};

// Styled Components
const StyledContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f5f5;
`;

const StyledCard = styled.div`
  background: #ffffff;
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 600px;

  h1 {
    font-size: 24px;
    margin-bottom: 20px;
    color: #333333;
  }
`;

const StyledInputWrapper = styled.div`
  margin-bottom: 15px;

  label {
    display: block;
    font-weight: bold;
    margin-bottom: 5px;
    color: #555555;
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
  background: #007bff;
  color: #ffffff;
  font-size: 16px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background 0.3s ease;

  &:hover {
    background: #0056b3;
  }
`;

export default AddProject;