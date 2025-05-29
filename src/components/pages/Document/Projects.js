// src/pages/Projects.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styled from 'styled-components';

const API = process.env.REACT_APP_API_BASE_URL || 'http://localhost:4000';

const Projects = () => {
  const [projects, setProjects]         = useState([]);
  const [docsByProject, setDocsByProject] = useState({});

  // 1) Charger les projets actifs
  useEffect(() => {
    axios.get(`${API}/api/projects-active`)
      .then(res => {
        setProjects(res.data);
        res.data.forEach(p => fetchDocs(p.id));
      })
      .catch(console.error);
  }, []);

  // 2) Charger les docs pour un projet
  const fetchDocs = projectId => {
    axios.get(`${API}/api/project/${projectId}/documents`)
      .then(res =>
        setDocsByProject(prev => ({
          ...prev,
          [projectId]: res.data
        }))
      )
      .catch(console.error);
  };

  return (
    <Container>
      <h1>Projets en cours</h1>
      {projects.map(proj => (
        <ProjectCard key={proj.id}>
          <Header>
            <h2>{proj.nom}</h2>
            <small>{proj.date_debut} → {proj.date_fin}</small>
          </Header>

          <DocsTable>
            <thead>
              <tr>
                <th>ID</th>
                <th>Expéditeur</th>
                <th>Type</th>
                <th>Objet</th>
                <th>Date d'ajout</th>
                <th>Fichier</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              { (docsByProject[proj.id] || []).map(doc => (
                <tr key={doc.id}>
                  <td>{doc.id}</td>
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
                  <td>{doc.statut || '–'}</td>
                </tr>
              )) }
            </tbody>
          </DocsTable>
        </ProjectCard>
      ))}
    </Container>
  );
};

export default Projects;

/* Styled Components */
const Container = styled.div`padding:2rem;`;
const ProjectCard = styled.div`
  background: var(--glass-light);
  backdrop-filter: blur(8px);
  margin-bottom:2rem;
  padding:1.5rem;
  border-radius:1rem;
  box-shadow:0 10px 20px rgba(0,0,0,0.1);
`;
const Header = styled.div`
  display:flex; justify-content:space-between; align-items:center;
  h2{margin:0;}
  small{color:#666;}
`;
const DocsTable = styled.table`
  width:100%; border-collapse:collapse; margin-top:1rem;
  th,td{padding:.75rem;border-bottom:1px solid #ddd;text-align:left;}
  th{background:var(--primary);color:#fff;}
  tbody tr:hover{background: rgba(99,102,241,0.1);}
`;
