// src/pages/GanttChart.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Gantt, ViewMode } from "gantt-task-react";
import "gantt-task-react/dist/index.css";
import styled from "styled-components";

const API = process.env.REACT_APP_API_BASE_URL || "http://localhost:4000";

// Map priorities to colors
const PRIORITY_COLOR = {
  Haute: "#e53e3e",
  Moyenne: "#ecc94b",
  Basse: "#48bb78",
};

export default function GanttChart() {
  const [projects, setProjects] = useState([]);
  const [activeId, setActiveId] = useState("");
  const [tasks, setTasks] = useState([]);
  const token = localStorage.getItem("token");

  // Load projects where user is responsible or member
  useEffect(() => {
    axios
      .get(`${API}/api/my-projects`, { headers: { Authorization: token } })
      .then((res) => setProjects(res.data))
      .catch((err) => console.error("Projets:", err));
  }, [token]);

  // When project changes, fetch its tasks
  useEffect(() => {
    if (!activeId) {
      setTasks([]);
      return;
    }
    axios
      .get(`${API}/api/project/${activeId}/tasks`, {
        headers: { Authorization: token },
      })
      .then((res) => {
        const mapped = res.data.map((t) => ({
          id: `${t.id}`,
          name: t.titre,
          start: new Date(t.dateDebut),
          end: new Date(t.dateFin),
          progress: 0,
          type: "task",
          project: `${t.project_id}`,
          // Show assignee, priority & status
          barChildren: `${t.assignee.trim()} • ${t.priorite} • ${t.statut}`,
          styles: {
            backgroundColor:
              (PRIORITY_COLOR[t.priorite] || "#3182ce") + "33",
            progressColor: PRIORITY_COLOR[t.priorite] || "#3182ce",
            progressSelectedColor:
              PRIORITY_COLOR[t.priorite] || "#3182ce",
          },
        }));
        setTasks(mapped);
      })
      .catch((err) => {
        console.error("Tâches:", err);
        setTasks([]);
      });
  }, [activeId, token]);

  return (
    <Page>
      <Header>Diagramme de Gantt</Header>
      <Controls>
        <Select
          value={activeId}
          onChange={(e) => setActiveId(e.target.value)}
        >
          <option value="">Sélectionner un projet…</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nom}
            </option>
          ))}
        </Select>
      </Controls>

      <Card>
        {activeId ? (
          tasks.length ? (
            <StyledGantt
              tasks={tasks}
              viewMode={ViewMode.Day}
              listCellWidth="180px"
            />
          ) : (
            <Message>Aucune tâche pour ce projet.</Message>
          )
        ) : (
          <Message>Choisissez un projet pour afficher le Gantt.</Message>
        )}
      </Card>
    </Page>
  );
}

// —— Styled Components ——

const Page = styled.div`
  background: #f0f2f5;
  min-height: 100vh;
  padding: 2rem;
  font-family: "Segoe UI", sans-serif;
`;

const Header = styled.h1`
  text-align: center;
  font-size: 2.25rem;
  color: #1e293b;
  margin-bottom: 1rem;
`;

const Controls = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 1.5rem;
`;

const Select = styled.select`
  padding: 0.75rem 1rem;
  border-radius: 8px;
  border: none;
  background: #ffffffdd;
  font-size: 1rem;
  min-width: 260px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.2s;
  &:focus {
    box-shadow: 0 0 0 3px #6366f1aa;
    outline: none;
  }
`;

const Card = styled.div`
  background: #ffffff;
  border-radius: 12px;
  padding: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
`;

const StyledGantt = styled(Gantt)`
  .gantt-table {
    background: #f9fafb;
  }
`;

const Message = styled.p`
  text-align: center;
  color: #64748b;
  font-size: 1.1rem;
  padding: 2rem 0;
`;
