import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styled from 'styled-components';

const AddDocument = () => {
  const [expediteur, setExpediteur] = useState('');
  const [destinateur, setDestinateur] = useState('');
  const [type, setType] = useState('');
  const [objet, setObjet] = useState('');
  const [file, setFile] = useState(null);
  const [projectId, setProjectId] = useState('');  // ← on stocke l'ID
  const [documentTypes, setDocumentTypes] = useState([]);
  const [projets, setProjets] = useState([]);
  const [usersAndAdmins, setUsersAndAdmins] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Expéditeur depuis le token...
    const user = JSON.parse(localStorage.getItem('user')) || {};
    setExpediteur(user.name || 'Inconnu');

    // Charger documentTypes, projets, users/admins...
    axios.get('http://localhost:4000/api/document-types').then(r => setDocumentTypes(r.data));
    axios.get('http://localhost:4000/api/projets-rs').then(r => setProjets(r.data));
    Promise.all([axios.get('http://localhost:4000/api/users'), axios.get('http://localhost:4000/api/admins')])
      .then(([uRes, aRes]) => {
        setUsersAndAdmins([
          ...uRes.data.map(u => ({ id: u.id, name: u.name })),
          ...aRes.data.map(a => ({ id: a.id, name: a.name }))
        ]);
      });
  }, []);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!destinateur || !type || !objet || !file || !projectId) {
      setMessage('Tous les champs sont requis.');
      return;
    }

    const formData = new FormData();
    formData.append('expediteur', expediteur);
    formData.append('destinateur', destinateur);
    formData.append('type', type);
    formData.append('objet', objet);
    formData.append('file', file);
    formData.append('project_id', projectId);  // ← on envoie l'ID
    formData.append('statut', 'En attente');

    try {
      const res = await axios.post('http://localhost:4000/api/document/add', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessage(res.data.message);
    } catch (err) {
      console.error(err);
      setMessage('Erreur lors de l\'ajout du document.');
    }
  };

  return (
    <Container>
      <Card>
        <h1>Ajouter un document</h1>
        {message && <Message>{message}</Message>}

        <form onSubmit={handleSubmit}>
          <Field>
            <label>Expéditeur</label>
            <input type="text" value={expediteur} readOnly />
          </Field>

          <Field>
            <label>Destinateur</label>
            <select
              value={destinateur}
              onChange={e => setDestinateur(e.target.value)}
            >
              <option value="">Sélectionner</option>
              {usersAndAdmins.map(u => (
                <option key={u.id} value={u.name}>
                  {u.name}
                </option>
              ))}
            </select>
          </Field>

          <Field>
            <label>Type</label>
            <select value={type} onChange={e => setType(e.target.value)}>
              <option value="">Sélectionner</option>
              {documentTypes.map(dt => (
                <option key={dt.id} value={dt.id}>
                  {dt.type_name}
                </option>
              ))}
            </select>
          </Field>

          <Field>
            <label>Objet</label>
            <input
              type="text"
              value={objet}
              onChange={e => setObjet(e.target.value)}
            />
          </Field>

          <Field>
            <label>Fichier</label>
            <input
              type="file"
              onChange={e => setFile(e.target.files[0])}
            />
          </Field>

          <Field>
            <label>Projet</label>
            <select
              value={projectId}
              onChange={e => setProjectId(e.target.value)}
            >
              <option value="">Sélectionner</option>
              {projets.map(p => (
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

/* styles... */
const Container = styled.div`/* centré fullscreen */`;
const Card = styled.div`/* glassmorphism style */`;
const Field = styled.div`margin-bottom:1rem; label{display:block;}`; 
const Button = styled.button`/* bouton bleu */`;
const Message = styled.p`color:#d00;`;
