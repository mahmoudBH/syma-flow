// src/pages/TaskFlow.jsx
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import ReactFlow, {
  ReactFlowProvider,
  MiniMap,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
} from "react-flow-renderer";
import styled from "styled-components";

const API = process.env.REACT_APP_API_BASE_URL || "http://localhost:4000";

export default function TaskFlow() {
  const [projects, setProjects] = useState([]);
  const [currentProj, setCurrentProj] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const token = localStorage.getItem("token");

  // Charger projets
  useEffect(() => {
    axios
      .get(`${API}/api/my-projects`, { headers: { Authorization: token } })
      .then((r) => setProjects(r.data))
      .catch(console.error);
  }, [token]);

  // Charger tâches du projet sélectionné
  useEffect(() => {
    if (!currentProj) return;
    axios
      .get(`${API}/api/project/${currentProj}/tasks`, {
        headers: { Authorization: token },
      })
      .then((r) => setTasks(r.data))
      .catch(console.error);
  }, [currentProj, token]);

  // Convertir tâches en nœuds et arêtes
  useEffect(() => {
    const sorted = [...tasks].sort(
      (a, b) => new Date(a.dateDebut) - new Date(b.dateDebut)
    );
    const n = sorted.map((t, idx) => ({
      id: t.id.toString(),
      data: { label: `${t.titre}\n(${t.assignee})` },
      position: { x: idx * 200, y: (idx % 2) * 150 },
    }));
    const e = sorted.slice(1).map((t, idx) => ({
      id: `e${sorted[idx].id}-${t.id}`,
      source: sorted[idx].id.toString(),
      target: t.id.toString(),
      type: "smoothstep",
      animated: true,
    }));
    setNodes(n);
    setEdges(e);
  }, [tasks]);

  // Handlers React Flow
  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );
  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );
  const onConnect = useCallback(
    (connection) => setEdges((eds) => addEdge(connection, eds)),
    []
  );

  return (
    <Container>
      <Header>Visualisation Flow des Tâches</Header>
      <Select
        value={currentProj || ""}
        onChange={(e) => setCurrentProj(e.target.value)}
      >
        <option value="">Sélectionnez un projet…</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nom}
          </option>
        ))}
      </Select>

      <GraphArea>
        {currentProj ? (
          <ReactFlowProvider>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              fitView
            >
              <MiniMap />
              <Controls />
              <Background gap={16} />
            </ReactFlow>
          </ReactFlowProvider>
        ) : (
          <Placeholder>
            Choisissez un projet pour visualiser son diagramme de tâches.
          </Placeholder>
        )}
      </GraphArea>
    </Container>
  );
}

// —— Styled Components ——

const Container = styled.div`
  padding: 2rem;
  background: #f0f4f8;
  min-height: 100vh;
  font-family: "Segoe UI", sans-serif;
`;

const Header = styled.h1`
  text-align: center;
  color: #1e293b;
  margin-bottom: 1rem;
`;

const Select = styled.select`
  display: block;
  margin: 0 auto 1.5rem;
  padding: 0.75rem;
  border-radius: 6px;
  border: 1px solid #cbd5e1;
  background: #fff;
`;

const GraphArea = styled.div`
  height: 600px;
  border: 2px solid #cbd5e1;
  border-radius: 8px;
  background: #ffffff;
`;

const Placeholder = styled.div`
  color: #64748b;
  text-align: center;
  padding-top: 2rem;
`;
