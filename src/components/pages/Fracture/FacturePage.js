// src/components/UploadInvoice.jsx
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import styled from "styled-components";

const API = "http://localhost:4000";

export default function UploadInvoice() {
  const [file, setFile] = useState(null);
  const [projectId, setProjectId] = useState("");
  const [typeId, setTypeId] = useState("");
  const [projects, setProjects] = useState([]);
  const [factureTypes, setFactureTypes] = useState([]);
  const [status, setStatus] = useState("");
  const [insertedId, setInsertedId] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);

  // Charger les projets accessibles à l'utilisateur
  useEffect(() => {
    const token = localStorage.getItem("token");
    axios
      .get(`${API}/api/my-projects`, {
        headers: { Authorization: token },
      })
      .then((res) => setProjects(res.data))
      .catch(() => setProjects([]));
  }, []);

  // Charger la liste des types de facture
  useEffect(() => {
    axios
      .get(`${API}/api/facture-types`)
      .then((res) => setFactureTypes(res.data))
      .catch(() => setFactureTypes([]));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !projectId || !typeId) {
      setError("Veuillez sélectionner un projet, un type et un fichier.");
      return;
    }

    setIsLoading(true);
    setStatus("Analyse en cours...");
    setError("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("projet", projectId);
    formData.append("type", typeId);

    try {
      const token = localStorage.getItem("token");
      const resp = await axios.post(`${API}/api/invoice/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: token,
        },
      });

      setInsertedId(resp.data.id);
      setStatus(resp.data.message);
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de l'extraction");
      setStatus("");
    } finally {
      setIsLoading(false);
    }
  };

  const triggerFileInput = () => fileInputRef.current.click();

  return (
    <Container>
      <Card>
        <Title>Importer une facture</Title>
        <Subtitle>Extraction automatique des données</Subtitle>

        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label>Projet</Label>
            <Select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
              <option value="">-- Choisir un projet --</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nom}
                </option>
              ))}
            </Select>
          </FormGroup>

          <FormGroup>
            <Label>Type de facture</Label>
            <Select value={typeId} onChange={(e) => setTypeId(e.target.value)}>
              <option value="">-- Choisir un type --</option>
              {factureTypes.map((ft) => (
                <option key={ft.id} value={ft.id}>
                  {ft.type}
                </option>
              ))}
            </Select>
          </FormGroup>

          <FormGroup>
            <Label>Fichier PDF</Label>
            <FileInputContainer>
              <HiddenFileInput
                type="file"
                accept="application/pdf"
                ref={fileInputRef}
                onChange={(e) => setFile(e.target.files[0])}
              />
              <FileButton onClick={triggerFileInput}>
                {file ? file.name : "Choisir un fichier"}
              </FileButton>
            </FileInputContainer>
          </FormGroup>

          <Button disabled={isLoading}>
            {isLoading ? "Traitement..." : "Extraire les données"}
          </Button>
        </Form>

        {status && (
          <SuccessMessage>
            ✓ {status} {insertedId && <IDLabel>ID: {insertedId}</IDLabel>}
          </SuccessMessage>
        )}
        {error && <ErrorMessage>! {error}</ErrorMessage>}
      </Card>
    </Container>
  );
}

// ——— Styled Components ———

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 2rem;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4edf5 100%);
  font-family: "Inter", "Segoe UI", sans-serif;
`;

const Card = styled.div`
  width: 100%;
  max-width: 500px;
  background: #fff;
  padding: 2.5rem;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  text-align: center;
  transition: transform 0.3s ease;
  &:hover {
    transform: translateY(-5px);
  }
`;

const Title = styled.h2`
  margin-bottom: 0.5rem;
  color: #2d3748;
  font-size: 1.8rem;
  font-weight: 700;
`;

const Subtitle = styled.p`
  margin-bottom: 2rem;
  color: #718096;
  font-size: 1rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FormGroup = styled.div`
  text-align: left;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  color: #4a5568;
  font-weight: 500;
  font-size: 0.9rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.85rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #f8fafc;
  font-size: 1rem;
  transition: all 0.2s;
  &:focus {
    outline: none;
    border-color: #4299e1;
    box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.15);
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.85rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #f8fafc;
  font-size: 1rem;
  transition: all 0.2s;
  &:focus {
    outline: none;
    border-color: #4299e1;
    box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.15);
  }
`;

const FileInputContainer = styled.div`
  position: relative;
`;

const HiddenFileInput = styled.input`
  display: none;
`;

const FileButton = styled.div`
  padding: 0.85rem 1rem;
  border: 1px dashed #e2e8f0;
  border-radius: 10px;
  background: #f8fafc;
  color: #718096;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    border-color: #4299e1;
    color: #4299e1;
  }
`;

const Button = styled.button`
  padding: 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 6px rgba(118, 75, 162, 0.2);
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 7px 14px rgba(118, 75, 162, 0.3);
  }
  &:disabled {
    background: #cbd5e0;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const StatusBase = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  border-radius: 10px;
  margin-top: 1rem;
  font-weight: 500;
`;

const SuccessMessage = styled(StatusBase)`
  background: #f0fff4;
  color: #2f855a;
  border: 1px solid #c6f6d5;
`;

const ErrorMessage = styled(StatusBase)`
  background: #fff5f5;
  color: #c53030;
  border: 1px solid #fed7d7;
`;

const IDLabel = styled.span`
  display: inline-block;
  margin-left: 10px;
  padding: 3px 8px;
  background: #ebf8ff;
  border-radius: 20px;
  color: #2b6cb0;
  font-size: 0.85rem;
`;
