import React, { useState, useEffect } from "react";
import axios from "axios";
import styled from "styled-components";

const Users = () => {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    category: "",
    profile: "",
  });

  const [categories, setCategories] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch categories and profiles from API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const categoryResponse = await axios.get("http://localhost:4000/categories");
        const profileResponse = await axios.get("http://localhost:4000/profiles");
        setCategories(categoryResponse.data);
        setProfiles(profileResponse.data);
      } catch (error) {
        console.error("Error loading data:", error);
        setMessage("Erreur lors du chargement des données.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post("http://localhost:4000/add-user", formData);
      setMessage(response.data.message);
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        category: "",
        profile: "",
      });
    } catch (error) {
      console.error("Error adding user:", error);
      setMessage("Erreur lors de l'ajout de l'utilisateur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <StyledContainer>
      <StyledCard>
        <h2>Ajouter un utilisateur</h2>
        {message && <StyledMessage>{message}</StyledMessage>}
        {loading && <StyledMessage>Chargement...</StyledMessage>}

        <form onSubmit={handleSubmit}>
          <StyledInputWrapper>
            <label>Nom :</label>
            <input
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              required
              placeholder="Entrez le nom"
            />
          </StyledInputWrapper>

          <StyledInputWrapper>
            <label>Prénom :</label>
            <input
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              required
              placeholder="Entrez le prénom"
            />
          </StyledInputWrapper>

          <StyledInputWrapper>
            <label>Email :</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Entrez l'email"
            />
          </StyledInputWrapper>

          <StyledInputWrapper>
            <label>Numéro de téléphone :</label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              placeholder="Entrez le numéro de téléphone"
            />
          </StyledInputWrapper>

          <StyledInputWrapper>
            <label>Catégorie :</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            >
              <option value="">Sélectionner une catégorie</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.category}>
                  {cat.category}
                </option>
              ))}
            </select>
          </StyledInputWrapper>

          <StyledInputWrapper>
            <label>Profil :</label>
            <select
              name="profile"
              value={formData.profile}
              onChange={handleChange}
              required
            >
              <option value="">Sélectionner un profil</option>
              {profiles.map((prof) => (
                <option key={prof.id} value={prof.profile}>
                  {prof.profile}
                </option>
              ))}
            </select>
          </StyledInputWrapper>

          <StyledButton type="submit" disabled={loading}>
            {loading ? "Chargement..." : "Ajouter"}
          </StyledButton>
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
  max-width: 500px;

  h2 {
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
  select {
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

const StyledMessage = styled.p`
  margin: 10px 0;
  padding: 10px;
  background: #f8d7da;
  color: #721c24;
  border-radius: 5px;
  text-align: center;
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

  &[disabled] {
    background: #cccccc;
    cursor: not-allowed;
  }
`;

export default Users;