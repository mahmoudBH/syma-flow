// src/pages/Archive.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styled from 'styled-components';

const API = process.env.REACT_APP_API_BASE_URL || 'http://localhost:4000';

const Archive = () => {
  const [projects, setProjects]   = useState([]);
  const [documents, setDocuments] = useState([]);

  // Charger l’archive complète
  useEffect(() => {
    axios.get(`${API}/api/archive`)
      .then(res => {
        setProjects(res.data.projects);
        setDocuments(res.data.documents);
      })
      .catch(console.error);
  }, []);

  // Construire un mapping projectId→nom
  const projectMap = projects.reduce((acc, p) => {
    acc[p.id] = p.nom;
    return acc;
  }, {});

  return (
    <Container>
      <h1>Archives</h1>

      <Section>
        <h2>Projets archivés</h2>
        {projects.length === 0
          ? <p>Aucun projet archivé.</p>
          : projects.map(p => (
            <Card key={p.id}>
              <strong>{p.nom}</strong><br/>
              <small>{p.date_debut} → {p.date_fin}</small>
            </Card>
          ))
        }
      </Section>

      <Section>
        <h2>Documents archivés</h2>
        {documents.length === 0
          ? <p>Aucun document archivé.</p>
          : (
            <DocsTable>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Projet</th>
                  <th>Expéditeur</th>
                  <th>Type</th>
                  <th>Objet</th>
                  <th>Date d'ajout</th>
                  <th>Fichier</th>
                </tr>
              </thead>
              <tbody>
                {documents.map(doc => (
                  <tr key={doc.id}>
                    <td>{doc.id}</td>
                    <td>{projectMap[doc.project_id] || doc.project_id}</td>
                    <td>{doc.expediteur}</td>
                    <td>{doc.type_name}</td>
                    <td>{doc.objet}</td>
                    <td>{new Date(doc.created_at).toLocaleString()}</td>
                    <td>
                      <a
                        href={`${API}/${doc.file.replace(/\\\\/g, '/')}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Voir
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </DocsTable>
          )
        }
      </Section>
    </Container>
  );
};

export default Archive;

/* Styled Components */
const Container = styled.div`padding:2rem;`;
const Section = styled.div`margin-bottom:2rem;`;
const Card = styled.div`
  background: var(--glass-light);
  padding:1rem; margin-bottom:1rem; border-radius:1rem;
`;
const DocsTable = styled.table`
  width:100%; border-collapse:collapse;
  th,td{padding:.75rem;border:1px solid #ddd;text-align:left;}
  th{background:var(--primary);color:#fff;}
  tbody tr:hover{background: rgba(99,102,241,0.1);}
`;
