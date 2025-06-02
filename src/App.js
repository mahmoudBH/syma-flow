import React from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import Login from "./components/pages/Login";
import ForgotPassword from "./components/pages/ForgotPassword"; // Import de la page ForgotPassword
import Dashboard from "./components/pages/Home";
import Profile from "./components/pages/Profile";
import AddUsers from "./components/pages/Users/AddUsers"; // Import AddUsers page
import ManageUsers from "./components/pages/Users/ManageUsers"; // Import ManageUsers page
import UsersSettings from "./components/pages/Users/UsersSettings"; // Import UsersSettings page
import DocumentSettings from "./components/pages/Document/DocumentSettings";
import AddDocument from "./components/pages/Document/AddDocument";
import Archive from "./components/pages/Document/Archive";
import Projects from "./components/pages/Document/Projects";
import FactureTypes from "./components/pages/Fracture/FactureTypes";
import ProjectInvoices from "./components/pages/Fracture/AddFacture";
import ViewPDF from "./components/pages/Fracture/ViewPDF";
import UploadInvoice from "./components/pages/Fracture/FacturePage";
import AddProject from "./components/pages/Project/AddProject";
import Projets from "./components/pages/Project/Projets";
import AddTask from "./components/pages/Project/AddTask";
import TaskList from "./components/pages/Project/Task";
import TaskFlow from "./components/pages/Project/TaskFlow";
import DeploymentDiagram from"./components/pages/Project/DeploymentDiagram";
import PredictDuration from "./components/pages/Analyse/PredictDuration";

import PrivateRoute from "./components/context/PrivateRoute";
import Layout from "./components/Layout/Layout";
import { ThemeProvider } from "./components/context/ThemeProvider";
import UploadAndSignPdf from "./components/pages/Fracture/UploadAndSignPdf"; // Assurez-vous que le chemin est correct
import GanttPage from "./components/pages/Project/Gantt"; // Nouvelle page
import TasksPage from './components/pages/Project/TasksPage'; // Importez le composant TasksPage
import { WebSocketProvider, WebSocketContext } from "./components/context/WebSocketContext";
import NotificationListener from "./components/context/NotificationListener"

const App = () => {
  return (
    <Router>
      <WebSocketProvider>
        <NotificationListener />
      <ThemeProvider>
        <Routes>
          {/* Rediriger vers /login par défaut */}
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} /> {/* Nouvelle route */}

          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route path="home" element={<Dashboard />} />
            <Route path="profile" element={<Profile />} />
            <Route path="/users/add" element={<AddUsers />} />
            <Route path="/users/manage" element={<ManageUsers />} />
            <Route path="/users/settings" element={<UsersSettings />} /> 
            <Route path="/document/add" element={<AddDocument />} />
            <Route path="/document/project" element={<Projects />} />      {/*ajouter dons le sidebar*/}
            <Route path="/documents/settings" element={<DocumentSettings />} />
            <Route path="/archive" element={<Archive />} />
            <Route path="/project-invoices" element={<ProjectInvoices />} />
            <Route path="/fracture/settings" element={<FactureTypes />} />
            <Route path="/fracture/view-pdf" element={<ViewPDF />} />
            <Route path="/fracture/view-data" element={<UploadInvoice />} /> 
            <Route path="/Project/add" element={<AddProject />} />
            <Route path="/Project" element={<Projets />} />
            <Route path="/Task/add" element={<AddTask />} />
            <Route path="/Task" element={<TaskList />} />
            <Route path="/Taskflow" element={<TaskFlow />} />
            <Route path="/deployment" element={<DeploymentDiagram />} />
            <Route path="/fracture/signature" element={<UploadAndSignPdf />} /> {/* Nouvelle page pour l'upload du PDF */}
            <Route path="/project/gantt" element={<GanttPage />} /> {/* Nouvelle page pour Gantt */}
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/predict" element={<PredictDuration />} /> 

          </Route>
        </Routes>
      </ThemeProvider>
      </WebSocketProvider>
    </Router>
  );
};

export default App;