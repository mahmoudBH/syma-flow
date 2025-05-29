// src/pages/DeploymentDiagram.jsx
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

export default function DeploymentDiagram() {
  const [projects, setProjects] = useState([]);
  const [selProj, setSelProj]     = useState("");
  const [nodes, setNodes]         = useState([]);
  const [edges, setEdges]         = useState([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const token = localStorage.getItem("token");

  // 1) Charger la liste des projets
  useEffect(() => {
    axios
      .get(`${API}/api/my-projects`, { headers: { Authorization: token } })
      .then((res) => setProjects(res.data))
      .catch((err) => {
        console.error(err);
        setError("Impossible de charger les projets.");
      });
  }, [token]);

  // 2) Charger diagramme de déploiement pour le projet sélectionné
  useEffect(() => {
    if (!selProj) return;
    setLoading(true);
    axios
      .get(`${API}/api/project/${selProj}/deployment`, {
        headers: { Authorization: token },
      })
      .then((res) => {
        // Format React Flow
        setNodes(
          res.data.nodes.map((n) => ({
            id: n.id,
            data: { label: n.label },
            position: n.position,
            style: { padding: 10, border: "1px solid #222", borderRadius: 5 },
          }))
        );
        setEdges(
          res.data.edges.map((e) => ({
            id: e.id,
            source: e.source,
            target: e.target,
            animated: true,
          }))
        );
      })
      .catch((err) => {
        console.error(err);
        // fallback minimal template
        const tpl = {
          nodes: [
            { id: "client", label: "Client", position: { x: 0, y: 100 } },
            { id: "lb",     label: "Load Balancer", position: { x: 200, y: 100 } },
            { id: "web",    label: "Web Server",    position: { x: 400, y: 100 } },
            { id: "db",     label: "Database",      position: { x: 600, y: 100 } },
          ],
          edges: [
            { id: "e1", source: "client", target: "lb" },
            { id: "e2", source: "lb",     target: "web" },
            { id: "e3", source: "web",    target: "db" },
          ],
        };
        setNodes(
          tpl.nodes.map((n) => ({
            id: n.id,
            data: { label: n.label },
            position: n.position,
            style: { padding: 10, border: "1px solid #555", borderRadius: 5 },
          }))
        );
        setEdges(
          tpl.edges.map((e) => ({
            id: e.id,
            source: e.source,
            target: e.target,
            animated: true,
          }))
        );
      })
      .finally(() => setLoading(false));
  }, [selProj, token]);

  // Handlers React Flow (pour drag’n’drop de nœuds, si besoin)
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
    <Page>
      <Title>Diagramme de Déploiement</Title>

      {error && <Error>{error}</Error>}

      <ProjectSelect
        value={selProj}
        onChange={(e) => setSelProj(e.target.value)}
      >
        <option value="">-- Choisissez un projet --</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nom}
          </option>
        ))}
      </ProjectSelect>

      {loading ? (
        <Loader>Chargement…</Loader>
      ) : selProj ? (
        <GraphWrapper>
          <ReactFlowProvider>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              fitView
              style={{ width: "100%", height: "100%" }}
            >
              <MiniMap nodeStrokeColor={(n) => "#0041d0"} />
              <Controls />
              <Background gap={12} />
            </ReactFlow>
          </ReactFlowProvider>
        </GraphWrapper>
      ) : (
        <Hint>Sélectionnez un projet pour voir son déploiement</Hint>
      )}
    </Page>
  );
}

// —— Styled Components ——

const Page = styled.div`
  padding: 2rem;
  background: #f5f7fa;
  min-height: 100vh;
  font-family: "Segoe UI", sans-serif;
`;

const Title = styled.h1`
  text-align: center;
  color: #1e293b;
`;

const Error = styled.div`
  margin: 1rem auto;
  color: #b91c1c;
  text-align: center;
`;

const ProjectSelect = styled.select`
  display: block;
  margin: 1rem auto 2rem;
  padding: 0.75rem;
  border-radius: 6px;
  border: 1px solid #cbd5e1;
  background: #fff;
  font-size: 1rem;
`;

const Loader = styled.div`
  text-align: center;
  color: #475569;
  margin-top: 2rem;
`;

const GraphWrapper = styled.div`
  width: 100%;
  height: 600px;
  border: 2px solid #cbd5e1;
  border-radius: 8px;
  background: #ffffff;
  position: relative;
`;

const Hint = styled.div`
  text-align: center;
  color: #64748b;
  margin-top: 2rem;
`;
