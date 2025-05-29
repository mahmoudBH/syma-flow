// src/pages/ProjectInvoices.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styled from 'styled-components';

const API = process.env.REACT_APP_API_BASE_URL || 'http://localhost:4000';

export default function ProjectInvoices() {
  const [projects, setProjects] = useState([]);
  const [invoicesByProject, setInvoicesByProject] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');

  useEffect(() => {
    axios.get(`${API}/api/my-projects`, {
      headers: { Authorization: token }
    })
    .then(res => {
      setProjects(res.data);
      return res.data;
    })
    .then(projs =>
      Promise.all(projs.map(p =>
        axios.get(`${API}/api/project/${p.id}/invoices`, {
          headers: { Authorization: token }
        }).then(r => ({ projectId: p.id, invoices: r.data }))
      ))
    )
    .then(all => {
      const map = {};
      all.forEach(({ projectId, invoices }) => {
        map[projectId] = invoices;
      });
      setInvoicesByProject(map);
      setLoading(false);
    })
    .catch(err => {
      console.error(err);
      setError('Erreur lors du chargement des factures.');
      setLoading(false);
    });
  }, [token]);

  if (loading) return <Message>Chargement en cours…</Message>;
  if (error)   return <Message>{error}</Message>;

  return (
    <Container>
      <Title>Factures par Projet</Title>
      {projects.map(proj => (
        <Card key={proj.id}>
          <Header>
            <h2>{proj.nom}</h2>
            <small>{proj.date_debut} → {proj.date_fin}</small>
          </Header>
          <Table>
            <thead>
              <tr>
                <Th>#</Th>
                <Th>Expéditeur</Th>
                <Th>Type</Th>
                <Th>Date</Th>
                <Th>Échéance</Th>
                <Th>Total TTC</Th>
                <Th>Destinataire</Th>
                <Th>Importée le</Th>
                <Th>Voir</Th>
              </tr>
            </thead>
            <tbody>
              {(invoicesByProject[proj.id] || []).map(inv => (
                <tr key={inv.id}>
                  <Td>{inv.id}</Td>
                  <Td>{inv.expediteur}</Td>
                  <Td>{inv.type_libelle}</Td>
                  <Td>{inv.date_facturation}</Td>
                  <Td>{inv.echeance || '—'}</Td>
                  <Td>{inv.total_ttc} €</Td>
                  <Td>{inv.destinataire}</Td>
                  <Td>{new Date(inv.created_at).toLocaleString()}</Td>
                  <Td>
                    {inv.file
                      ? <a
                          href={`${API}/factures/${inv.file}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Voir
                        </a>
                      : '—'}
                  </Td>
                </tr>
              ))}
              {!(invoicesByProject[proj.id] || []).length && (
                <tr>
                  <Td colSpan="9" style={{ textAlign:'center' }}>
                    Aucune facture pour ce projet.
                  </Td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card>
      ))}
    </Container>
  );
}


const Container = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  font-family: "Segoe UI", sans-serif;
`;

const Title = styled.h1`
  text-align: center;
  color: #1e293b;
  margin-bottom: 2rem;
`;

const Card = styled.div`
  background: #fff;
  border-radius: 8px;
  margin-bottom: 2rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
`;

const Header = styled.div`
  background: #4f46e5;
  color: white;
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  h2 { margin:0; }
  small { opacity: 0.8; }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  tr:nth-child(even) { background: #f9fafb; }
`;

const Th = styled.th`
  text-align: left;
  padding: 0.75rem 1rem;
  background: #eef2ff;
  color: #374151;
  font-weight: 600;
`;

const Td = styled.td`
  padding: 0.75rem 1rem;
  color: #4b5563;
  border-top: 1px solid #e5e7eb;
`;

const Message = styled.p`
  text-align: center;
  color: #64748b;
  margin-top: 2rem;
  font-size: 1.1rem;
`;
