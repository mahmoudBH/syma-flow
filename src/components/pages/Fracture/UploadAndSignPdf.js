import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";

const UploadAndSignPdf = () => {
    const [pdfFile, setPdfFile] = useState(null);
    const [signature, setSignature] = useState("");
    const [userEmail, setUserEmail] = useState("");
    const [message, setMessage] = useState("");

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user) {
            setSignature(user.name);
            setUserEmail(user.email);
        }
    }, []);

    const handleFileChange = (event) => {
        setPdfFile(event.target.files[0]);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!pdfFile || !signature || !userEmail) {
            setMessage("Please select a PDF, enter a signature, and provide an email.");
            return;
        }

        const formData = new FormData();
        formData.append("pdf", pdfFile);
        formData.append("signature", signature);
        formData.append("userEmail", userEmail);

        try {
            const response = await axios.post("http://localhost:4000/api/upload-sign", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            if (response.status === 200) {
                setMessage(response.data.message);
            }
        } catch (error) {
            console.error('Error:', error);
            setMessage("An error occurred while uploading the PDF.");
        }
    };

    return (
        <div style={styles.container}>
            <motion.div 
                initial={{ opacity: 0, scale: 0.8 }} 
                animate={{ opacity: 1, scale: 1 }} 
                transition={{ duration: 0.5 }}
                style={styles.card}
            >
                <h2 style={styles.title}>Upload & Sign PDF</h2>
                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.inputContainer}>
                        <label style={styles.label}>Select PDF:</label>
                        <input type="file" id="pdf" onChange={handleFileChange} style={styles.fileInput} />
                    </div>

                    <div style={styles.inputContainer}>
                        <label style={styles.label}>Email:</label>
                        <input type="email" value={userEmail} readOnly style={styles.input} />
                    </div>

                    <input type="hidden" value={signature} />

                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} type="submit" style={styles.button}>
                        Upload and Sign PDF
                    </motion.button>
                </form>

                {message && (
                    <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} style={styles.message}>
                        {message}
                    </motion.p>
                )}
            </motion.div>
        </div>
    );
};

export default UploadAndSignPdf;


// Styles CSS
const styles = {
    container: {
        minHeight: "100vh",
        background: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
    },
    card: {
        background: "rgba(255, 255, 255, 0.3)",
        backdropFilter: "blur(10px)",
        padding: "40px",
        borderRadius: "24px",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
        border: "1px solid rgba(255, 255, 255, 0.2)",
        width: "100%",
        maxWidth: "500px",
        textAlign: "center",
    },
    title: {
        fontSize: "2.5rem",
        fontWeight: "bold",
        color: "#fff",
        marginBottom: "24px",
        textShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    },
    form: {
        display: "flex",
        flexDirection: "column",
        gap: "24px",
    },
    inputContainer: {
        width: "100%",
    },
    label: {
        display: "block",
        fontSize: "1.125rem",
        fontWeight: "500",
        color: "#fff",
        marginBottom: "8px",
    },
    fileInput: {
        width: "100%",
        padding: "12px",
        borderRadius: "12px",
        border: "1px solid rgba(255, 255, 255, 0.3)",
        background: "rgba(255, 255, 255, 0.2)",
        color: "#fff",
        fontSize: "1rem",
        outline: "none",
    },
    button: {
        width: "100%",
        padding: "12px",
        borderRadius: "12px",
        background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
        color: "#fff",
        fontSize: "1.125rem",
        fontWeight: "600",
        border: "none",
        cursor: "pointer",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        transition: "transform 0.2s, box-shadow 0.2s",
    },
    message: {
        marginTop: "24px",
        fontSize: "1.125rem",
        fontWeight: "500",
        color: "#fff",
        background: "rgba(72, 187, 120, 0.8)",
        padding: "12px",
        borderRadius: "12px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    },
};