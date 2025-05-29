import React, { useState, useEffect } from "react";
import axios from "axios";
import { useTheme } from "../../context/ThemeProvider"; // Assurez-vous d'importer le hook pour le mode sombre

const FactureTypes = () => {
    const [type, setType] = useState("");
    const [factureTypes, setFactureTypes] = useState([]);
    const { isDarkMode } = useTheme(); // Récupérer le mode sombre

    // Fonction pour récupérer les types de factures
    const fetchFactureTypes = async () => {
        try {
            const response = await axios.get("http://localhost:4000/api/facture-types");
            setFactureTypes(response.data);
        } catch (error) {
            console.error("Erreur lors du chargement des types de factures :", error);
        }
    };

    // Fonction pour supprimer un type de facture
    const deleteFactureType = async (id) => {
        if (!window.confirm("Voulez-vous vraiment supprimer ce type de facture ?")) return;

        try {
            await axios.delete(`http://localhost:4000/api/facture-type/${id}`);
            fetchFactureTypes(); // Recharger la liste après suppression
        } catch (error) {
            console.error("Erreur lors de la suppression du type de facture :", error);
        }
    };

    // Fonction pour ajouter un type de facture
    const addFactureType = async () => {
        if (!type) return alert("Veuillez entrer un type de facture");

        try {
            await axios.post("http://localhost:4000/api/facture-type", { type });
            setType("");
            fetchFactureTypes(); // Recharger la liste après ajout
        } catch (error) {
            console.error("Erreur lors de l'ajout du type de facture :", error);
        }
    };

    useEffect(() => {
        fetchFactureTypes();
    }, []);

    return (
        <div style={isDarkMode ? styles.darkContainer : styles.container}>
            <h2 style={isDarkMode ? styles.darkHeader : styles.header}>Gestion des Types de Factures</h2>

            {/* Formulaire d'ajout */}
            <div style={isDarkMode ? styles.darkForm : styles.form}>
                <input
                    type="text"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    placeholder="Nom du type de facture"
                    style={isDarkMode ? styles.darkInput : styles.input}
                />
                <button
                    onClick={addFactureType}
                    style={isDarkMode ? styles.darkButton : styles.button}
                >
                    Ajouter
                </button>
            </div>

            {/* Liste des types de factures */}
            <h3 style={isDarkMode ? styles.darkSubHeader : styles.subHeader}>Liste des Types de Factures</h3>
            {factureTypes.length > 0 ? (
                <ul style={styles.documentList}>
                    {factureTypes.map((facture) => (
                        <li key={facture.id} style={isDarkMode ? styles.darkListItem : styles.listItem}>
                            {facture.type}
                            <button
                                onClick={() => deleteFactureType(facture.id)}
                                style={isDarkMode ? styles.darkDeleteButton : styles.deleteButton}
                            >
                                Supprimer
                            </button>
                        </li>
                    ))}
                </ul>
            ) : (
                <p style={isDarkMode ? styles.darkMessage : styles.message}>Aucun type de facture enregistré.</p>
            )}
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
    darkMessage: {
        textAlign: 'center',
        fontSize: '1rem',
        color: '#ff6666',
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
    }
};

export default FactureTypes;
