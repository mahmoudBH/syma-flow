import React, { useState } from "react";
import styled from "styled-components";

const Settings = () => {
  const [category, setCategory] = useState("");
  const [profile, setProfile] = useState("");

  const handleAddCategory = () => {
    if (!category) return alert("Veuillez entrer une catégorie");

    fetch("http://localhost:4000/add-category", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category }),
    })
      .then((response) => response.json())
      .then((data) => {
        alert(data.message);
        setCategory("");
      })
      .catch((error) => console.error("Erreur :", error));
  };

  const handleAddProfile = () => {
    if (!profile) return alert("Veuillez entrer un profil");

    fetch("http://localhost:4000/add-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile }),
    })
      .then((response) => response.json())
      .then((data) => {
        alert(data.message);
        setProfile("");
      })
      .catch((error) => console.error("Erreur :", error));
  };

  return (
    <StyledContainer>
      <StyledCard>
        <h2>Paramètres</h2>

        {/* Section Ajouter une Catégorie */}
        <StyledSection>
          <h3>Ajouter une Catégorie</h3>
          <input
            type="text"
            placeholder="Nom de la catégorie"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
          <StyledButton onClick={handleAddCategory}>Ajouter</StyledButton>
        </StyledSection>

        {/* Section Ajouter un Profil */}
        <StyledSection>
          <h3>Ajouter un Profil</h3>
          <input
            type="text"
            placeholder="Nom du profil"
            value={profile}
            onChange={(e) => setProfile(e.target.value)}
          />
          <StyledButton onClick={handleAddProfile}>Ajouter</StyledButton>
        </StyledSection>
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

  h2 {
    font-size: 24px;
    margin-bottom: 20px;
    color: #333333;
  }

  h3 {
    font-size: 20px;
    margin-bottom: 15px;
    color: #555555;
  }
`;

const StyledSection = styled.div`
  margin-bottom: 20px;

  input {
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
`;

const StyledButton = styled.button`
  display: block;
  width: 100%;
  padding: 10px;
  background: #007bff;
  color: #ffffff;
  font-size: 16px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  margin-top: 10px;
  transition: background 0.3s ease;

  &:hover {
    background: #0056b3;
  }
`;

export default Settings;    