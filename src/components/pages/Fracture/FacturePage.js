import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import styled from "styled-components";

const API = "http://localhost:4000";

export default function UploadInvoice() {
  const [file, setFile] = useState(null);
  const [projectId, setProjectId] = useState("");
  const [typeId, setTypeId]       = useState("");
  const [projects, setProjects]   = useState([]);
  const [factureTypes, setFactureTypes] = useState([]);
  const [status, setStatus]       = useState("");
  const [insertedId, setInsertedId] = useState(null);
  const [error, setError]         = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);

  // Charger projets accessibles
  useEffect(() => {
    const token = localStorage.getItem("token");
    axios.get(`${API}/api/my-projects`, {
      headers: { Authorization: token }
    })
    .then(res => setProjects(res.data))
    .catch(() => {});
  }, []);

  // Charger types de facture
  useEffect(() => {
    axios.get(`${API}/api/facture-types`)
      .then(res => setFactureTypes(res.data))
      .catch(() => {});
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
          Authorization: token
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
            <Select value={projectId} onChange={e => setProjectId(e.target.value)}>
              <option value="">-- Choisir un projet --</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.nom}</option>
              ))}
            </Select>
          </FormGroup>

          <FormGroup>
            <Label>Type de facture</Label>
            <Select value={typeId} onChange={e => setTypeId(e.target.value)}>
              <option value="">-- Choisir un type --</option>
              {factureTypes.map(ft => (
                <option key={ft.id} value={ft.id}>{ft.type}</option>
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
                onChange={e => setFile(e.target.files[0])}
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
            ✓ {status} {insertedId && <>ID: {insertedId}</>}
          </SuccessMessage>
        )}
        {error && (
          <ErrorMessage>
            ! {error}
          </ErrorMessage>
        )}
      </Card>
    </Container>
  );
}

// —— Styled Components ——

const Container = styled.div`
  display: flex; justify-content: center; align-items: center;
  min-height: 100vh; padding: 2rem;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4edf5 100%);
`;

const Card = styled.div`
  width: 100%; max-width: 500px;
  background: #fff; padding: 2.5rem;
  border-radius: 16px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  text-align: center;
`;

const Title = styled.h2`
  color: #2d3748; font-size: 1.8rem; margin-bottom: 0.5rem;
`;
const Subtitle = styled.p`
  color: #718096; font-size: 1rem; margin-bottom: 2rem;
`;

const Form = styled.form`
  display: flex; flex-direction: column; gap: 1.5rem;
`;

const FormGroup = styled.div`
  text-align: left;
`;

const Label = styled.label`
  display: block; margin-bottom: 0.5rem;
  color: #4a5568; font-weight: 500; font-size: 0.9rem;
`;

const Select = styled.select`
  width: 100%; padding: 0.85rem 1rem;
  border: 1px solid #e2e8f0; border-radius: 10px;
  background: #f8fafc; font-size: 1rem;
  &:focus { outline: none; border-color: #4299e1; }
`;

const HiddenFileInput = styled.input`
  display: none;
`;

const FileInputContainer = styled.div`
  position: relative;
`;

const FileButton = styled.div`
  padding: 0.85rem 1rem; border: 1px dashed #e2e8f0;
  border-radius: 10px; background: #f8fafc;
  color: #718096; cursor: pointer;
  &:hover { border-color: #4299e1; color: #4299e1; }
`;

const Button = styled.button`
  padding: 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff; border: none; border-radius: 10px;
  font-size: 1rem; font-weight: 600; cursor: pointer;
  &:disabled { background: #cbd5e0; cursor: not-allowed; }
`;

const StatusBase = styled.div`
  margin-top: 1rem; padding: 1rem; border-radius: 10px;
  display: inline-flex; align-items: center;
  font-weight: 500;
`;
const SuccessMessage = styled(StatusBase)`
  background: #f0fff4; color: #2f855a; border: 1px solid #c6f6d5;
`;
const ErrorMessage = styled(StatusBase)`
  background: #f0fff4; color: #2f855a; border: 1px solid #c6f6d5;
`;
