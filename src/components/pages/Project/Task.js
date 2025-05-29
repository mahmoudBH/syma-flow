// src/pages/Task.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import styled from "styled-components";
import {
  DragDropContext,
  Droppable,
  Draggable,
} from "@hello-pangea/dnd";

const API = process.env.REACT_APP_API_BASE_URL || "http://localhost:4000";

const STATUSES = ["En attente", "En cours", "Terminée"];

export default function Task() {
  const [projects, setProjects] = useState([]);
  const [tasksByStatus, setTasksByStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const token = localStorage.getItem("token");

  useEffect(() => {
    axios
      .get(`${API}/api/my-projects`, {
        headers: { Authorization: token },
      })
      .then((res) => {
        setProjects(res.data);
        return res.data;
      })
      .then((projs) => {
        return Promise.all(
          projs.map((p) =>
            axios
              .get(`${API}/api/project/${p.id}/tasks`, {
                headers: { Authorization: token },
              })
              .then((r) => r.data)
          )
        );
      })
      .then((allTasksArrays) => {
        const allTasks = allTasksArrays.flat();
        const grouped = {};
        STATUSES.forEach((s) => (grouped[s] = []));
        allTasks.forEach((t) => grouped[t.statut]?.push(t));
        setTasksByStatus(grouped);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Erreur lors du chargement des tâches.");
        setLoading(false);
      });
  }, [token]);

  const handleDragEnd = (result) => {
    const { source, destination, draggableId } = result;
    if (!destination || source.droppableId === destination.droppableId) return;

    const movedTask = tasksByStatus[source.droppableId].find(
      (t) => t.id.toString() === draggableId
    );

    // Remove from old status
    const newSource = [...tasksByStatus[source.droppableId]];
    newSource.splice(source.index, 1);

    // Add to new status
    const newDestination = [...tasksByStatus[destination.droppableId]];
    movedTask.statut = destination.droppableId;
    newDestination.splice(destination.index, 0, movedTask);

    // Update state
    setTasksByStatus((prev) => ({
      ...prev,
      [source.droppableId]: newSource,
      [destination.droppableId]: newDestination,
    }));

    // Update backend
    axios
      .put(
        `${API}/api/taches/${movedTask.id}/statut`,
        { statut: destination.droppableId },
        { headers: { Authorization: token } }
      )
      .catch((err) => {
        console.error(err);
        alert("Erreur lors de la mise à jour du statut.");
      });
  };

  if (loading) return <Message>Chargement en cours…</Message>;
  if (error) return <Message>{error}</Message>;

  return (
    <Container>
      <Title>Tableau Kanban - Mes Tâches</Title>
      <DragDropContext onDragEnd={handleDragEnd}>
        <KanbanBoard>
          {STATUSES.map((status) => (
            <Droppable droppableId={status} key={status}>
              {(provided) => (
                <Column ref={provided.innerRef} {...provided.droppableProps}>
                  <ColumnTitle>{status}</ColumnTitle>
                  {tasksByStatus[status]?.map((task, index) => (
                    <Draggable
                      draggableId={task.id.toString()}
                      index={index}
                      key={task.id}
                    >
                      {(provided) => (
                        <TaskCard
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                        >
                          <h4>{task.titre}</h4>
                          <p>{task.description}</p>
                          <small>Assigné à: {task.assignee}</small>
                          <p>
                            Priorité: <strong>{task.priorite}</strong>
                          </p>
                          <Dates>
                            {task.dateDebut} → {task.dateFin}
                          </Dates>
                        </TaskCard>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </Column>
              )}
            </Droppable>
          ))}
        </KanbanBoard>
      </DragDropContext>
    </Container>
  );
}
const Container = styled.div`
  padding: 2rem;
  font-family: "Segoe UI", sans-serif;
`;

const Title = styled.h1`
  text-align: center;
  margin-bottom: 2rem;
`;

const KanbanBoard = styled.div`
  display: flex;
  gap: 1rem;
  overflow-x: auto;
`;

const Column = styled.div`
  flex: 1;
  background: #f1f5f9;
  padding: 1rem;
  border-radius: 8px;
  min-width: 300px;
`;

const ColumnTitle = styled.h2`
  font-size: 1.2rem;
  margin-bottom: 1rem;
  color: #334155;
`;

const TaskCard = styled.div`
  background: white;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  box-shadow: 0 1px 4px rgba(0,0,0,0.1);
`;

const Dates = styled.p`
  font-size: 0.8rem;
  color: #64748b;
`;

const Message = styled.p`
  text-align: center;
  color: #64748b;
  margin-top: 2rem;
  font-size: 1.1rem;
`;
