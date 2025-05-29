import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTheme } from '../../context/ThemeProvider';  // Assure-toi d'importer le hook

const DocumentSettings = () => {
  const [typeName, setTypeName] = useState('');
  const [message, setMessage] = useState('');
  const [documentTypes, setDocumentTypes] = useState([]);
  const { isDarkMode } = useTheme();  // Récupérer le mode sombre

  // Fonction pour récupérer les types de documents
  const fetchDocumentTypes = async () => {
    try {
      const response = await axios.get('http://localhost:4000/api/document-types');
      setDocumentTypes(response.data);
    } catch (error) {
      setMessage('Erreur lors de la récupération des types de documents.');
    }
  };

  // Fonction pour supprimer un type de document
  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:4000/api/document-type/${id}`);
      setMessage('Type de document supprimé avec succès!');
      fetchDocumentTypes(); // Recharger la liste après la suppression
    } catch (error) {
      setMessage('Erreur lors de la suppression du type de document.');
    }
  };
  

  useEffect(() => {
    fetchDocumentTypes();
  }, []);

  // Fonction pour ajouter un type de document
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!typeName) {
      setMessage('Le nom du type de document est requis.');
      return;
    }

    try {
      await axios.post('http://localhost:4000/api/document-type', { type_name: typeName });
      setMessage('Type de document ajouté avec succès!');
      setTypeName('');
      fetchDocumentTypes(); // Recharger la liste après l'ajout
    } catch (error) {
      setMessage('Erreur lors de l\'ajout du type de document.');
    }
  };

  return (
    <div style={isDarkMode ? styles.darkContainer : styles.container}>
      <h1 style={isDarkMode ? styles.darkHeader : styles.header}>Document Settings</h1>
      
      {/* Formulaire d'ajout de type de document */}
      <form onSubmit={handleSubmit} style={isDarkMode ? styles.darkForm : styles.form}>
        <label style={isDarkMode ? styles.darkLabel : styles.label}>
          Type de document :
          <input
            type="text"
            value={typeName}
            onChange={(e) => setTypeName(e.target.value)}
            placeholder="Entrez le nom du type de document"
            style={isDarkMode ? styles.darkInput : styles.input}
          />
        </label>
        <button type="submit" style={isDarkMode ? styles.darkButton : styles.button}>Ajouter</button>
      </form>

      {/* Message de confirmation ou erreur */}
      {message && <p style={message.includes('succès') ? styles.success : styles.message}>{message}</p>}

      {/* Liste des types de documents */}
      <h2 style={isDarkMode ? styles.darkSubHeader : styles.subHeader}>Liste des types de documents</h2>
      <ul style={styles.documentList}>
        {documentTypes.length > 0 ? (
          documentTypes.map((type) => (
            <li key={type.id} style={isDarkMode ? styles.darkListItem : styles.listItem}>
              {type.type_name}
              <button 
                style={isDarkMode ? styles.darkDeleteButton : styles.deleteButton} 
                onClick={() => handleDelete(type.id)}
              >
                Supprimer
              </button>
            </li>
          ))
        ) : (
          <p>Aucun type de document disponible.</p>
        )}
      </ul>
    </div>
  );
};

// Styles pour les deux modes (clair et sombre)
const styles = {
  container: {
    width: '100%',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    backgroundColor: '#f4f6f9',
    fontFamily: 'Arial, sans-serif'
  },
  darkContainer: {
    width: '100%',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    backgroundColor: '#333',
    color: '#fff',
    fontFamily: 'Arial, sans-serif'
  },
  header: {
    fontSize: '2rem',
    color: '#333',
    textAlign: 'center',
    marginBottom: '20px'
  },
  darkHeader: {
    fontSize: '2rem',
    color: '#fff',
    textAlign: 'center',
    marginBottom: '20px'
  },
  form: {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    marginBottom: '30px'
  },
  darkForm: {
    backgroundColor: '#444',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
    marginBottom: '30px'
  },
  label: {
    fontSize: '1rem',
    color: '#333'
  },
  darkLabel: {
    fontSize: '1rem',
    color: '#fff'
  },
  input: {
    width: '100%',
    padding: '10px',
    marginTop: '8px',
    marginBottom: '20px',
    borderRadius: '5px',
    border: '1px solid #ddd',
    fontSize: '1rem'
  },
  darkInput: {
    width: '100%',
    padding: '10px',
    marginTop: '8px',
    marginBottom: '20px',
    borderRadius: '5px',
    border: '1px solid #555',
    fontSize: '1rem',
    backgroundColor: '#555',
    color: '#fff'
  },
  button: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#007bff',
    color: 'white',
    fontSize: '1rem',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    transition: 'background-color 0.3s'
  },
  darkButton: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#008cba',
    color: 'white',
    fontSize: '1rem',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    transition: 'background-color 0.3s'
  },
  message: {
    textAlign: 'center',
    fontSize: '1rem',
    color: '#d9534f',
    marginTop: '10px'
  },
  success: {
    textAlign: 'center',
    fontSize: '1rem',
    color: '#5bc0de',
    marginTop: '10px'
  },
  subHeader: {
    fontSize: '1.5rem',
    color: '#333',
    marginBottom: '10px'
  },
  darkSubHeader: {
    fontSize: '1.5rem',
    color: '#fff',
    marginBottom: '10px'
  },
  documentList: {
    listStyle: 'none',
    padding: '0'
  },
  listItem: {
    backgroundColor: '#fff',
    padding: '12px',
    marginBottom: '8px',
    borderRadius: '5px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  darkListItem: {
    backgroundColor: '#555',
    padding: '12px',
    marginBottom: '8px',
    borderRadius: '5px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  deleteButton: {
    backgroundColor: '#d9534f',
    color: 'white',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '5px',
    cursor: 'pointer',
    transition: 'background-color 0.3s'
  },
  darkDeleteButton: {
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '5px',
    cursor: 'pointer',
    transition: 'background-color 0.3s'
  },
  toggleButton: {
    marginTop: '20px',
    padding: '10px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    fontSize: '1rem',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    transition: 'background-color 0.3s'
  }
};

export default DocumentSettings;
