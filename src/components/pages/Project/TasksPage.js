import React, { useEffect, useState } from 'react';
import { Gantt, Task, ViewMode } from 'gantt-task-react';
import 'gantt-task-react/dist/index.css';
import axios from 'axios';
import { Container, Typography, Select, MenuItem, Box, CircularProgress } from '@mui/material';

const TasksPage = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProjectName, setSelectedProjectName] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  const validateDate = (date) => {
    return date instanceof Date && !isNaN(date.getTime());
  };

  useEffect(() => {
    setLoading(true);
    axios.get('http://localhost:4000/api/projets-rs')
      .then(response => {
        setProjects(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Erreur lors de la récupération des projets :', error);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (selectedProjectName) {
      setLoading(true);
      axios.get(`http://localhost:4000/api/tasks`, { params: { projet: selectedProjectName } })
        .then(response => {
          const formattedTasks = response.data
            .map(task => {
              const startDate = new Date(task.dateDebut);
              const endDate = new Date(task.dateFin);

              if (!validateDate(startDate) || !validateDate(endDate)) {
                console.warn(`Dates invalides pour la tâche ${task.id}:`, task);
                return null;
              }

              let barColor = '#f44336'; // Rouge pour "Non commencé"
              if (task.statut === 'En cours') barColor = '#2196F3'; // Bleu
              if (task.statut === 'Terminée') barColor = '#4CAF50'; // Vert

              return {
                id: task.id,
                name: task.titre,
                start: startDate,
                end: endDate,
                progress: task.statut === 'Terminée' ? 100 : task.statut === 'En cours' ? 50 : 0,
                styles: { progressColor: barColor, barColor },
              };
            })
            .filter(task => task !== null);

          setTasks(formattedTasks);
          setLoading(false);
        })
        .catch(error => {
          console.error('Erreur lors de la récupération des tâches :', error);
          setLoading(false);
        });
    }
  }, [selectedProjectName]);

  return (
    <Container maxWidth="lg">
      <Typography variant="h3" gutterBottom>
        Diagramme de Gantt des Projets
      </Typography>

      <Box sx={{ minWidth: 120, marginBottom: 4 }}>
        <Select
          fullWidth
          value={selectedProjectName || ''}
          onChange={(e) => setSelectedProjectName(e.target.value)}
          displayEmpty
          inputProps={{ 'aria-label': 'Sélectionnez un projet' }}
        >
          <MenuItem value="" disabled>
            Sélectionnez un projet
          </MenuItem>
          {projects.map(project => (
            <MenuItem key={project.id} value={project.nom}>
              {project.nom}
            </MenuItem>
          ))}
        </Select>
      </Box>

      {selectedProjectName && (
        <Box>
          <Typography variant="h4" gutterBottom>
            Diagramme de Gantt pour le Projet: {selectedProjectName}
          </Typography>
          {loading ? (
            <CircularProgress />
          ) : tasks.length > 0 ? (
            <Gantt
              tasks={tasks}
              viewMode={ViewMode.Day}
              onDateChange={(task, start, end) => {
                console.log('Date changed:', task, start, end);
              }}
              onTaskClick={(task) => console.log('Task clicked:', task)}
              onProgressChange={(task, progress) => {
                console.log('Progress changed:', task, progress);
              }}
            />
          ) : (
            <Typography>Aucune tâche à afficher pour ce projet.</Typography>
          )}
        </Box>
      )}
    </Container>
  );
};

export default TasksPage;