import React, { useEffect, useState } from "react";
import axios from "axios";

const Profile = () => {
  // Récupérer userId depuis localStorage (stocké à la connexion)
  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?.id;

  const [userData, setUserData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: ""
  });
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: ""
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!userId) return;
    axios.get(`http://localhost:4000/api/user/${userId}`)
      .then(res => {
        setUserData(res.data);
        setFormData({
          name: res.data.name,
          email: res.data.email,
          phone: res.data.phone
        });
      })
      .catch(err => console.error("Erreur de chargement:", err));
  }, [userId]);

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = e => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = e => {
    setSelectedFile(e.target.files[0]);
  };

  const handleSave = async e => {
    e.preventDefault();
    try {
      // Mise à jour infos utilisateur sans photo
      await axios.put(`http://localhost:4000/user/${userId}`, formData);

      // Si photo sélectionnée, upload photo
      if (selectedFile) {
        const formPhoto = new FormData();
        formPhoto.append("photo", selectedFile);
        await axios.post(`http://localhost:4000/api/upload-photo/${userId}`, formPhoto, {
            headers: { "Content-Type": "multipart/form-data" }
        });
        }


      // Recharger données utilisateur
      const res = await axios.get(`http://localhost:4000/api/user/${userId}`);
      setUserData(res.data);
      localStorage.setItem("user", JSON.stringify(res.data)); // Met à jour localStorage

      setIsEditing(false);
      setSelectedFile(null);
      setMessage("Profil mis à jour avec succès !");
    } catch (error) {
      console.error("Erreur lors de la mise à jour :", error.response?.data || error.message);
      setMessage("Erreur lors de la mise à jour.");
    }
  };

  const handleChangePassword = async e => {
  e.preventDefault();
  try {
    if (!passwordData.newPassword) {
      setMessage("Le nouveau mot de passe est requis.");
      return;
    }
    await axios.put(`http://localhost:4000/change-password/${userId}`, {
      password: passwordData.newPassword
    });
    setPasswordData({ oldPassword: "", newPassword: "" });
    setShowPasswordForm(false);
    setMessage("Mot de passe changé avec succès !");
  } catch (err) {
    console.error("Erreur de changement de mot de passe :", err.response?.data || err.message);
    setMessage(err.response?.data?.error || "Erreur lors du changement de mot de passe.");
  }
};


  if (!userData) return <p>Chargement...</p>;

  return (
    <div style={styles.container}>
      <h2>Mon Profil</h2>

      {userData.photo_url && (
        <img src={userData.photo_url.replace("localhost:3000", "localhost:4000")} alt="Profil" style={styles.photo} />
      )}

      {!isEditing ? (
        <>
          <p><strong>Nom :</strong> {userData.name}</p>
          <p><strong>Email :</strong> {userData.email}</p>
          <p><strong>Téléphone :</strong> {userData.phone}</p>
          <p><strong>Catégorie :</strong> {userData.category}</p>
          <p><strong>Profile :</strong> {userData.profile}</p>
          <button onClick={() => setIsEditing(true)} style={styles.button}>Modifier</button>
          <button
            onClick={() => setShowPasswordForm(!showPasswordForm)}
            style={styles.secondaryButton}
          >
            {showPasswordForm ? "Annuler" : "Changer le mot de passe"}
          </button>
        </>
      ) : (
        <form onSubmit={handleSave} style={styles.form}>
          <label>Nom :
            <input name="name" value={formData.name} onChange={handleChange} required />
          </label>
          <label>Email :
            <input name="email" type="email" value={formData.email} onChange={handleChange} required />
          </label>
          <label>Téléphone :
            <input name="phone" value={formData.phone} onChange={handleChange} required />
          </label>
          <label>Photo de profil :
            <input type="file" accept="image/*" onChange={handleFileChange} />
          </label>
          <button type="submit" style={styles.button}>Enregistrer</button>
          <button onClick={() => setIsEditing(false)} type="button" style={styles.cancelButton}>Annuler</button>
        </form>
      )}

      {showPasswordForm && (
        <form onSubmit={handleChangePassword} style={styles.form}>
          <label>Ancien mot de passe :
            <input
              type="password"
              name="oldPassword"
              value={passwordData.oldPassword}
              onChange={handlePasswordChange}
              required
            />
          </label>
          <label>Nouveau mot de passe :
            <input
              type="password"
              name="newPassword"
              value={passwordData.newPassword}
              onChange={handlePasswordChange}
              required
            />
          </label>
          <button type="submit" style={styles.button}>Valider le changement</button>
        </form>
      )}

      {message && <p>{message}</p>}
    </div>
  );
};

const styles = {
  container: {
    padding: 20,
    maxWidth: 600,
    margin: "auto",
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
  },
  photo: {
    width: 120,
    height: 120,
    objectFit: "cover",
    borderRadius: "50%",
    marginBottom: 20
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 10
  },
  button: {
    backgroundColor: "#007bff",
    color: "#fff",
    padding: 10,
    border: "none",
    borderRadius: 5,
    cursor: "pointer",
    marginTop: 10
  },
  secondaryButton: {
    backgroundColor: "#17a2b8",
    color: "#fff",
    padding: 10,
    border: "none",
    borderRadius: 5,
    cursor: "pointer",
    marginTop: 10
  },
  cancelButton: {
    backgroundColor: "#6c757d",
    color: "#fff",
    padding: 10,
    border: "none",
    borderRadius: 5,
    cursor: "pointer",
    marginTop: 10
  }
};

export default Profile;
