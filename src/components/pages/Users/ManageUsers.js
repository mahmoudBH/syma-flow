// ManageUsers.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import styled from "styled-components";

const ManageUsers = () => {
  const [users, setUsers]             = useState([]);
  const [categories, setCategories]   = useState([]);
  const [profiles, setProfiles]       = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData]       = useState({
    name: "", email: "", phone: "", category: "", profile: ""
  });
  const [newPassword, setNewPassword] = useState("");

  // Chargement initial
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [uRes, cRes, pRes] = await Promise.all([
          axios.get("http://localhost:4000/users"),
          axios.get("http://localhost:4000/categories"),
          axios.get("http://localhost:4000/profiles")
        ]);
        setUsers(uRes.data);
        setCategories(cRes.data);
        setProfiles(pRes.data);
      } catch (err) {
        console.error("Chargement impossible :", err);
      }
    };
    fetchData();
  }, []);

  // Sélection pour modification
  const handleSelect = user => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone,
      category: user.category,
      profile: user.profile
    });
    setNewPassword("");
  };

  // Toggle actif/inactif
  const handleToggleActive = async (id, current) => {
    try {
      await axios.put(`http://localhost:4000/update-user/${id}`, {
        ...users.find(u => u.id === id),
        is_active: current ? 0 : 1
      });
      const uRes = await axios.get("http://localhost:4000/users");
      setUsers(uRes.data);
    } catch (err) {
      console.error(err);
      alert("Impossible de changer l'état");
    }
  };

  // Suppression
  const handleDelete = async id => {
    if (!window.confirm("Supprimer cet utilisateur ?")) return;
    try {
      await axios.delete(`http://localhost:4000/delete-user/${id}`);
      setUsers(users.filter(u => u.id !== id));
      if (selectedUser?.id === id) setSelectedUser(null);
    } catch (err) {
      console.error(err);
      alert("Impossible de supprimer l'utilisateur");
    }
  };

  // Gestion formulaire
  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(f => ({ ...f, [name]: value }));
  };
  const handleSave = async e => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:4000/update-user/${selectedUser.id}`, {
        ...formData,
        is_active: selectedUser.is_active
      });
      alert("Utilisateur mis à jour");
      const uRes = await axios.get("http://localhost:4000/users");
      setUsers(uRes.data);
      setSelectedUser(null);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la mise à jour");
    }
  };
  const handlePasswordChange = async e => {
    e.preventDefault();
    if (!newPassword) return alert("Veuillez saisir un mot de passe");
    try {
      await axios.put(`http://localhost:4000/change-password/${selectedUser.id}`, { password: newPassword });
      alert("Mot de passe mis à jour");
      setNewPassword("");
    } catch (err) {
      console.error(err);
      alert("Erreur lors du changement de mot de passe");
    }
  };

  return (
    <Container>
      <Card>
        <h2>Gestion des utilisateurs</h2>

        {/* Liste */}
        <Section>
          <h3>Liste des utilisateurs</h3>
          <ul>
            {users.map(u => (
              <li key={u.id}>
                <UserInfo>
                  <span>
                    {u.name} ({u.email}) – {u.category}
                  </span>
                  <label>
                    <input
                      type="checkbox"
                      checked={u.is_active === 1}
                      onChange={() => handleToggleActive(u.id, u.is_active === 1)}
                    />{" "}
                    Actif
                  </label>
                  <button onClick={() => handleSelect(u)}>Modifier</button>
                  <button className="delete" onClick={() => handleDelete(u.id)}>
                    Supprimer
                  </button>
                </UserInfo>
              </li>
            ))}
          </ul>
        </Section>

        {/* Formulaire de modification */}
        {selectedUser && (
          <>
            <Section>
              <h3>Modifier {selectedUser.name}</h3>
              <form onSubmit={handleSave}>
                <InputWrapper>
                  <label>Nom</label>
                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </InputWrapper>
                <InputWrapper>
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </InputWrapper>
                <InputWrapper>
                  <label>Téléphone</label>
                  <input
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </InputWrapper>
                <InputWrapper>
                  <label>Catégorie</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                  >
                    <option value="">--</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.category}>
                        {c.category}
                      </option>
                    ))}
                  </select>
                </InputWrapper>
                <InputWrapper>
                  <label>Profil</label>
                  <select
                    name="profile"
                    value={formData.profile}
                    onChange={handleChange}
                    required
                  >
                    <option value="">--</option>
                    {profiles.map(p => (
                      <option key={p.id} value={p.profile}>
                        {p.profile}
                      </option>
                    ))}
                  </select>
                </InputWrapper>
                <Button type="submit">Enregistrer</Button>
              </form>
            </Section>

            <Section>
              <h3>Changer le mot de passe</h3>
              <form onSubmit={handlePasswordChange}>
                <InputWrapper>
                  <label>Nouveau mot de passe</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Laissez vide pour annuler"
                    required
                  />
                </InputWrapper>
                <Button type="submit">Mettre à jour le mot de passe</Button>
              </form>
            </Section>
          </>
        )}
      </Card>
    </Container>
  );
};

export default ManageUsers;

/* Styled Components (inchangés sauf ajout .delete) */

const Container = styled.div`
  display: flex; justify-content: center; padding: 2rem;
  background: var(--bg-light); min-height: 100vh;
`;
const Card = styled.div`
  background: var(--glass-light); padding: 2rem; border-radius: 1rem;
  box-shadow: 0 10px 20px rgba(0,0,0,0.1); max-width: 800px; width: 100%;
`;
const Section = styled.div`
  margin-bottom: 2rem;
  h3 { margin-bottom: 1rem; }
  ul { list-style:none; padding:0; li+li{margin-top:.75rem;} }
`;
const UserInfo = styled.div`
  display:flex; align-items:center; span{flex:1;}
  button{margin-left:.5rem;}
  .delete{background:#e53e3e;color:#fff;}
`;
const InputWrapper = styled.div`
  margin-bottom:1rem;
  label{display:block;margin-bottom:.25rem;}
  input,select{width:100%;padding:.5rem;border:1px solid #ccc;border-radius:.5rem;}
`;
const Button = styled.button`
  margin-top:.5rem;padding:.75rem 1.5rem;border-radius:.5rem;
  background:var(--primary);color:#fff;
  &:hover{background:var(--secondary);}
`;
