import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styled from 'styled-components';

const AddDocument = () => {
  const [expediteur, setExpediteur] = useState('');
  const [destinateur, setDestinateur] = useState('');
  const [type, setType] = useState('');
  const [objet, setObjet] = useState('');
  const [file, setFile] = useState(null);
  const [projectId, setProjectId] = useState('');  
  const [documentTypes, setDocumentTypes] = useState([]);
  const [projets, setProjets] = useState([]);
  const [usersAndAdmins, setUsersAndAdmins] = useState([]);
  const [message, setMessage] = useState('');

  // 1) Récupère l’utilisateur (token + user) dans localStorage
  useEffect(() => {
    const rawUser = localStorage.getItem('user');
    if (rawUser) {
      const u = JSON.parse(rawUser);
      setExpediteur(u.name || '');
    }
    // Charger les données nécessaires pour le formulaire
    fetchDocumentTypes();
    fetchProjets();
    fetchUsersAndAdmins();
  }, []);

  // Utilitaire pour renvoyer l’en-tête Authorization
  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('Aucun token trouvé. Veuillez vous reconnecter.');
      return null;
    }
    return { Authorization: `Bearer ${token}` };
  };

  // 2) Charger les types de documents
  const fetchDocumentTypes = async () => {
    try {
      const headers = getAuthHeader();
      // Si la route n’est pas protégée, on peut omettre headers
      const response = await axios.get(
        'http://localhost:4000/api/document-types',
        headers ? { headers } : {}
      );
      setDocumentTypes(response.data);
    } catch (err) {
      console.error('Erreur GET /api/document-types:', err.response || err);
    }
  };
  // 3) Charger les projets (nouvelle route /api/my-projects au lieu de /api/projets-rs)
  const fetchProjets = async () => {
    try {
      const headers = getAuthHeader();
      const response = await axios.get(
        'http://localhost:4000/api/my-projects',
        headers ? { headers } : {}
      );
      // On suppose que chaque projet a { id, nom, ... }
      setProjets(response.data);
    } catch (err) {
      console.error('Erreur GET /api/my-projects:', err.response || err);
    }
  };

  // 4) Charger tous les utilisateurs ET tous les admins, puis fusionner
  const fetchUsersAndAdmins = async () => {
    try {
      const headers = getAuthHeader();
      // On suppose que /api/users et /api/admins existent
      const [uRes, aRes] = await Promise.all([
        axios.get('http://localhost:4000/api/users', headers ? { headers } : {}),
        axios.get('http://localhost:4000/api/admins', headers ? { headers } : {}),
      ]);
      const combined = [
        ...uRes.data.map((u) => ({ id: u.id, name: u.name })),
        ...aRes.data.map((a) => ({ id: a.id, name: a.name })),
      ];
      setUsersAndAdmins(combined);
    } catch (err) {
      console.error('Erreur GET /api/users ou /api/admins:', err.response || err);
    }
  };

  // 5) Lorsque le formulaire est soumis
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!destinateur || !type || !objet || !file || !projectId) {
      setMessage('Tous les champs sont requis.');
      return;
    }

    const headers = getAuthHeader();
    if (!headers) {
      setMessage('Vous devez vous reconnecter.');
      return;
    }

    // Construire le FormData pour multipart/form-data
    const formData = new FormData();
    formData.append('expediteur', expediteur);
    formData.append('destinateur', destinateur);
    formData.append('type', type);
    formData.append('objet', objet);
    formData.append('file', file);
    formData.append('project_id', projectId);
    formData.append('statut', 'En attente');

    try {
      const res = await axios.post(
        'http://localhost:4000/api/document/add',
        formData,
        {
          headers: {
            ...headers,
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      setMessage(res.data.message);
      // Réinitialiser le formulaire si besoin
      setDestinateur('');
      setType('');
      setObjet('');
      setFile(null);
      setProjectId('');
    } catch (err) {
      console.error('Erreur POST /api/document/add:', err.response || err);
      setMessage("Erreur lors de l'ajout du document.");
    }
  };

  return (
    <Container>
      <Card>
        <h1>Ajouter un document</h1>
        {message && <Message>{message}</Message>}

        <form onSubmit={handleSubmit}>
          {/* Expéditeur (readonly) */}
          <Field>
            <label>Expéditeur</label>
            <input type="text" value={expediteur} readOnly />
          </Field>

          {/* Destinateur (utilisateur ou admin) */}
          <Field>
            <label>Destinateur</label>
            <select
              value={destinateur}
              onChange={(e) => setDestinateur(e.target.value)}
              required
            >
              <option value="">Sélectionner</option>
              {usersAndAdmins.map((u) => (
                <option key={u.id} value={u.name}>
                  {u.name}
                </option>
              ))}
            </select>
          </Field>

          {/* Type de document */}
          <Field>
            <label>Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              required
            >
              <option value="">Sélectionner</option>
              {documentTypes.map((dt) => (
                // On suppose que dt a { id, type_name }
                <option key={dt.id} value={dt.id}>
                  {dt.type_name}
                </option>
              ))}
            </select>
          </Field>

          {/* Objet */}
          <Field>
            <label>Objet</label>
            <input
              type="text"
              value={objet}
              onChange={(e) => setObjet(e.target.value)}
              required
            />
          </Field>

          {/* Fichier à uploader */}
          <Field>
            <label>Fichier</label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
              accept="application/pdf, image/*"
              required
            />
          </Field>

          {/* Sélection du projet (par ID) */}
          <Field>
            <label>Projet</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              required
            >
              <option value="">Sélectionner</option>
              {projets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nom}
                </option>
              ))}
            </select>
          </Field>

          <Button type="submit">Ajouter</Button>
        </form>
      </Card>
    </Container>
  );
};

export default AddDocument;


/* —————————————————————— */
/* Styles (styled-components) */
const Container = styled.div`
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f0f2f5;
`;

const Card = styled.div`
  width: 480px;
  padding: 24px;
  background: rgba(255, 255, 255, 0.85);
  border-radius: 12px;
  box-shadow: 0 4px 14px rgba(0,0,0,0.1);
`;

const Field = styled.div`
  margin-bottom: 1rem;
  label {
    display: block;
    margin-bottom: 6px;
    font-weight: 600;
    color: #333;
  }
  input[type="text"],
  select,
  input[type="file"] {
    width: 100%;
    padding: 8px 10px;
    font-size: 14px;
    border: 1px solid #ccc;
    border-radius: 6px;
    outline: none;
  }
  input[type="text"]:focus,
  select:focus {
    border-color: #007bff;
    box-shadow: 0 0 5px rgba(0, 123, 255, 0.2);
  }
`;

const Button = styled.button`
  background-color: #007bff;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  padding: 10px 0;
  width: 100%;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  margin-top: 12px;
  transition: background 0.25s;
  &:hover {
    background-color: #0056b3;
  }
`;

const Message = styled.p`
  margin-bottom: 1rem;
  color: #d32f2f;
`;

