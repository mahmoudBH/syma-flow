import React, { useState, useEffect } from "react";
import { Viewer, Worker } from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";
import * as pdfjsLib from "pdfjs-dist";
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js";

const ViewPDF = () => {
  const defaultLayoutPluginInstance = defaultLayoutPlugin();
  const [pdfFileUrl, setPdfFileUrl] = useState(null);
  const [factureTypes, setFactureTypes] = useState([]);
  const [selectedFactureType, setSelectedFactureType] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [factureFields, setFactureFields] = useState({
    dateFacturation: null,
    echeance: null,
    totalTTC: null,
    destinataire: null,
  });
  const [pageDimensions, setPageDimensions] = useState({ width: 0, height: 0 });

  // Fetch facture types from backend
  useEffect(() => {
    const fetchFactureTypes = async () => {
      try {
        const response = await fetch("http://localhost:4000/api/facture-types");
        if (!response.ok)
          throw new Error("Erreur lors du chargement des types de factures");
        const data = await response.json();
        setFactureTypes(data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchFactureTypes();
  }, []);

  const handleTextSelection = () => {
    const selection = window.getSelection().toString();
    if (!selection) return;
  
    const selectionRange = window.getSelection().getRangeAt(0);
    const rect = selectionRange.getBoundingClientRect();
  
    // Normalize coordinates relative to the PDF viewer's dimensions
    const pdfContainer = document.querySelector(".rpv-core__inner-page");
    if (!pdfContainer) return;
    const containerRect = pdfContainer.getBoundingClientRect();
  
    const x = ((rect.left - containerRect.left) / containerRect.width) * 100;
    const y = ((containerRect.height - (rect.top - containerRect.top)) / containerRect.height) * 100; // Invert y-coordinate
    const width = (rect.width / containerRect.width) * 100;
    const height = (rect.height / containerRect.height) * 100;
  
    const field = prompt(
      "À quel champ voulez-vous associer ce texte ? (dateFacturation, echeance, totalTTC, destinataire)"
    );
  
    if (field && factureFields.hasOwnProperty(field)) {
      const newSelection = { text: selection, position: { x, y, width, height } };
      setFactureFields((prev) => ({ ...prev, [field]: newSelection }));
      saveSelectionToDatabase(field, newSelection);
    }
  };
  
  // Save selection to the database
  const saveSelectionToDatabase = async (field, newSelection) => {
    if (!selectedFactureType) {
      alert("Veuillez sélectionner un type de facture avant d’enregistrer.");
      return;
    }
  
    setIsSaving(true);
    setSaveMessage("");
  
    try {
      const response = await fetch("http://localhost:4000/api/save-selection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          factureType: selectedFactureType,
          field,
          text: newSelection.text,
          position: newSelection.position,  // Pass the width and height
        }),
      });
  
      if (!response.ok) throw new Error("Erreur lors de l’enregistrement.");
      setSaveMessage("Sélection enregistrée avec succès.");
    } catch (error) {
      setSaveMessage("Erreur lors de l’enregistrement.");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };
  

  // Attach event listener for text selection
  useEffect(() => {
    document.addEventListener("mouseup", handleTextSelection);
    return () => {
      document.removeEventListener("mouseup", handleTextSelection);
    };
  }, [selectedFactureType]);

  // Handle file upload and get page dimensions
  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file && file.type === "application/pdf") {
      setPdfFileUrl(URL.createObjectURL(file));

      // Get page dimensions
      const pdf = await pdfjsLib.getDocument(URL.createObjectURL(file)).promise;
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 1 });
      setPageDimensions({ width: viewport.width, height: viewport.height });
    } else {
      alert("Veuillez sélectionner un fichier PDF valide.");
    }
  };

  return (
    <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
      <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
        {/* Select facture type */}
        <select
          value={selectedFactureType}
          onChange={(e) => setSelectedFactureType(e.target.value)}
          style={{ marginBottom: "10px", padding: "8px", fontSize: "16px" }}
        >
          <option value="">Sélectionner un type de facture</option>
          {factureTypes.map((type) => (
            <option key={type.id} value={type.type}>
              {type.type}
            </option>
          ))}
        </select>

        {/* Upload PDF file */}
        <input
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          style={{ marginBottom: "10px", padding: "8px", fontSize: "16px" }}
        />

        {/* Display PDF */}
        {pdfFileUrl && (
          <div
            style={{
              border: "1px solid #ccc",
              borderRadius: "8px",
              overflow: "hidden",
              marginBottom: "20px",
              height: "750px",
            }}
          >
            <Viewer fileUrl={pdfFileUrl} plugins={[defaultLayoutPluginInstance]} />
          </div>
        )}

        {/* Display extracted fields */}
        <div style={{ marginTop: "20px", padding: "10px", border: "1px solid #ddd" }}>
          <h3>Champs Détectés :</h3>
          <p>
            <strong>Date de Facturation :</strong>{" "}
            {factureFields.dateFacturation?.text || "Non détecté"}
          </p>
          <p>
            <strong>Échéance :</strong>{" "}
            {factureFields.echeance?.text || "Non détecté"}
          </p>
          <p>
            <strong>Total TTC :</strong>{" "}
            {factureFields.totalTTC?.text || "Non détecté"}
          </p>
          <p>
            <strong>Destinataire :</strong>{" "}
            {factureFields.destinataire?.text || "Non détecté"}
          </p>
        </div>

        {/* Saving status */}
        {isSaving && <p>Enregistrement en cours...</p>}
        {saveMessage && <p>{saveMessage}</p>}
      </div>
    </Worker>
  );
};

export default ViewPDF;