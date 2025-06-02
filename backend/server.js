const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const session = require("express-session");
const jwt = require("jsonwebtoken");
const crypto = require("crypto"); // Pour générer des tokens de vérification
const nodemailer = require("nodemailer"); // Pour envoyer des emails
const multer = require('multer');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const app = express();
const { PDFDocument, StandardFonts } = require('pdf-lib'); // Importer StandardFonts
const path = require('path');
const QRCode = require('qrcode');
const verificationTokens = {}; // Stocker les tokens temporairement
const moment = require('moment');
const { exec  } = require('child_process');

const http = require('http');
const WebSocket = require('ws');
const server = http.createServer(app);
const wss = new WebSocket.Server({ server }); // Crée le serveur WebSocket
// Pour stocker la correspondance { username: WebSocketClient }
const wsClients = new Map();


// Middleware pour parser les requêtes JSON
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads')); // Pour servir les fichiers téléchargés

// Configuration CORS
app.use(cors({
    origin: 'http://localhost:3000', // Spécifiez votre frontend
    credentials: true // Autorise l'envoi de cookies et d'en-têtes d'authentification
}));

// Middleware factice d'authentification
app.use((req,res,next)=>{req.user={name:"Mahmoud Bousbih"};next();});

// Configuration de la session
app.use(session({
    secret: "votre_secret_key", // Changez cette clé par une plus sécurisée
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Passez à true si vous utilisez HTTPS
        httpOnly: true,
        sameSite: 'lax' // Peut être 'none' si HTTPS
    }
}));

app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // pour servir les images
app.use(
  '/documents',
  express.static(path.join(__dirname, 'documents'))
);
app.use(
  '/factures',
  express.static(path.join(__dirname, 'factures'))
);

// Clé secrète pour JWT
const SECRET_KEY = "your_secret_key"; // Changez cette clé par une plus sécurisée

// Connexion à la base de données MySQL
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root", // Remplacez par votre mot de passe MySQL
    database: "symaflow_db"
});



// Chemin absolu vers pdftotext.exe
const PDFTOTEXT = `"C:\\poppler\\bin\\pdftotext.exe"`;

const profileStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Nouveau dossier pour les photos de profil
  },
  filename: function (req, file, cb) {
    // Nom unique : timestamp + extension originale
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const uploadProfile = multer({ storage: profileStorage });
// Configuration de Multer pour gérer l'upload de documents
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'documents/'); // Dossier où enregistrer les fichiers
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });


// Configuration de Multer pour gérer l'upload de facture
const storageFacture = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'factures/'); // Dossier où enregistrer les factures
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const uploadFacture = multer({ storage: storageFacture });


// Fonction pour générer un mot de passe temporaire
const generateTempPassword = (length = 8) => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let tempPassword = "";
    for (let i = 0; i < length; i++) {
      tempPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return tempPassword;
  };

db.connect(err => {
    if (err) {
        console.error("Erreur de connexion à MySQL:", err);
    } else {
        console.log("Connecté à MySQL !");
    }
});


// Gérer chaque nouvelle connexion WS
wss.on("connection", (ws) => {
  console.log("Nouveau client WS connecté");

  // À la réception d’un message, attendre l’enregistrement de l’utilisateur
  ws.on("message", (message) => {
    try {
      const payload = JSON.parse(message);
      // Si c’est un message d’enregistrement, garder en mémoire le WS
      if (payload.type === "register" && payload.user) {
        wsClients.set(payload.user, ws);
        console.log(`WS client enregistré pour utilisateur : ${payload.user}`);
      }
    } catch (err) {
      console.error("Erreur parsing WS message:", err);
    }
  });

  ws.on("close", () => {
    // Nettoyer la Map : chercher la clé dont la valeur est ce WS et la supprimer
    for (const [user, clientWs] of wsClients.entries()) {
      if (clientWs === ws) {
        wsClients.delete(user);
        console.log(`WS pour utilisateur supprimé: ${user}`);
        break;
      }
    }
  });
});

// Table de blacklist pour les tokens invalidés
let blacklist = []; // À utiliser en mémoire, mais vous pouvez aussi utiliser une base de données

// Fonction pour générer un mot de passe temporaire
const generatePassword = () => {
    return crypto.randomBytes(6).toString("hex"); // 12 caractères hexadécimaux
};

// Fonction pour envoyer un email de vérification
const sendVerificationEmail = (email, verificationToken, password) => {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: "symatique.info@gmail.com", // Adresse professionnelle
            pass: "mlot nagq saey ohqg" // Mot de passe d'application (remplacez par un environnement sécurisé)
        }
    });

    const mailOptions = {
        from: "Support Symatique <support@symatique.com>", // Adresse plus professionnelle
        to: email,
        subject: "[Symatique] Vérification de votre adresse e-mail",
        headers: {
            "X-Priority": "1 (Highest)",
            "X-Mailer": "Nodemailer",
            "Precedence": "bulk"
        },
        text: `Bonjour,

            Merci de vous être inscrit sur Symatique. Pour activer votre compte, cliquez sur le lien suivant :

            http://localhost:4000/verify-email?token=${verificationToken}

            Voici votre mot de passe temporaire : ${password}

            Si vous n'avez pas fait cette demande, ignorez simplement cet e-mail.

            Cordialement,
            L'équipe Symatique`,
        html: `
            <p>Bonjour,</p>
            <p>Merci de vous être inscrit sur Symatique. Nous sommes ravis de vous avoir parmi nous !</p>
            <p>Pour finaliser votre inscription, veuillez vérifier votre adresse e-mail en cliquant sur le bouton ci-dessous :</p>
            <a href="http://localhost:4000/verify-email?token=${verificationToken}" style="display:inline-block; padding:10px 20px; background-color:#007BFF; color:#fff; text-decoration:none; border-radius:5px;">Vérifier mon e-mail</a>
            <p>Voici votre mot de passe temporaire : <strong>${password}</strong></p>
            <p>Si vous n'avez pas créé ce compte, ignorez cet e-mail. Aucune autre action n'est nécessaire de votre part.</p>
            <p>Ceci est un e-mail automatique. Merci de ne pas y répondre.</p>
        `
    };

        transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                console.error("Erreur d'envoi de l'e-mail :", err);
            } else {
                console.log("E-mail de vérification envoyé avec succès :", info.response);
            }
        });
};

// Fonction d'envoi d'email avec mot de passe temporaire
const sendPasswordEmail = (toEmail, userName, tempPassword) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'symatique.info@gmail.com', // Remplacez avec votre email
            pass: 'mlot nagq saey ohqg' // Remplacez avec votre App Password Gmail
        }
    });

    const mailOptions = {
        from: 'Support Symatique <support@symatique.com>',
        to: toEmail,
        subject: '[Symatique] Votre mot de passe temporaire',
        headers: {
            "X-Priority": "1 (Highest)",
            "X-Mailer": "Nodemailer",
            "Precedence": "bulk"
        },
        text: `Bonjour ${userName},

            Voici votre mot de passe temporaire pour accéder à votre compte :

            ${tempPassword}

            Cordialement,
            L'équipe Symatique`,

        html: `
            <p>Bonjour <strong>${userName}</strong>,</p>
            <p>Voici votre mot de passe temporaire pour accéder à votre compte : <strong>${tempPassword}</strong></p>
            <p>Cordialement,<br>L'équipe Symatique</p>
        `
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log("Erreur d'envoi de l'email :", error);
        } else {
            console.log("Mot de passe temporaire envoyé :", info.response);
        }
    });
};



let clients = [];

wss.on('connection', (ws) => {
  console.log("Client WebSocket connecté");
  clients.push(ws);

  ws.on('close', () => {
    console.log("Client WebSocket déconnecté");
    clients = clients.filter(client => client !== ws);
  });
});

function broadcastNotification(message) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}


// Crée un compte admin automatiquement si aucun n'existe
const createAdminAccount = async () => {
    const name = "admin";
    const email = "admin@symaflow.com";
    const password = "admin123"; // Tu peux le modifier
    const saltRounds = 10;

    // Vérifie si un compte admin existe déjà
    const checkQuery = "SELECT * FROM admin WHERE email = ?";
    db.query(checkQuery, [email], async (err, results) => {
        if (err) {
            return console.error("Erreur lors de la vérification du compte admin :", err);
        }

        if (results.length === 0) {
            try {
                const hashedPassword = await bcrypt.hash(password, saltRounds);
                const insertQuery = "INSERT INTO admin (name, email, password) VALUES (?, ?, ?)";
                db.query(insertQuery, [name, email, hashedPassword], (err, result) => {
                    if (err) {
                        return console.error("Erreur lors de la création du compte admin :", err);
                    }
                    console.log("Compte admin créé avec succès !");
                });
            } catch (err) {
                console.error("Erreur lors du hashage du mot de passe admin :", err);
            }
        } else {
            console.log("Le compte admin existe déjà.");
        }
    });
};

// Appelle cette fonction au démarrage du serveur
createAdminAccount();

// Route pour la connexion
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email et mot de passe requis !" });
  }

  const query = `
    SELECT id, name, email, password, category, is_active FROM (
      SELECT id, name, email, password, 'super admin' AS category, 1 AS is_active
        FROM admin WHERE email = ?
      UNION
      SELECT id, name, email, password, category, is_active
        FROM users WHERE email = ?
    ) AS u
    LIMIT 1
  `;

  db.query(query, [email, email], async (err, results) => {
    if (err) {
      console.error("Erreur recherche utilisateur :", err);
      return res.status(500).json({ error: "Erreur serveur" });
    }
    if (results.length === 0) {
      return res.status(401).json({ error: "Utilisateur non trouvé !" });
    }

    const user = results[0];
    if (user.is_active === 0) {
      return res.status(403).json({ error: "Votre compte est désactivé." });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: "Mot de passe incorrect !" });
    }

    // On inclut maintenant id, email, name, category dans le token
    const payload = {
      id:       user.id,
      email:    user.email,
      name:     user.name,
      category: user.category
    };

    const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "1h" });

    // On peut toujours stocker en session si besoin, mais on ne s'en sert plus pour l'API
    req.session.user = payload;

    // On renvoie le token et le user payload
    res.json({ 
      message: "Connexion réussie", 
      token, 
      user: payload 
    });
  });
});


// Forgot Password Route
app.post('/forgot-password', (req, res) => {
    const { email } = req.body;
  
    const sql = "SELECT id, name, email, password FROM users WHERE email = ?";
    db.query(sql, [email], async (err, result) => {
        if (err) return res.status(500).json({ error: "Database error" });

        if (result.length > 0) {
            const user = result[0];

            // Generate a temporary password
            const tempPassword = generatePassword();

            // Hash the temporary password before saving it to the database
            bcrypt.hash(tempPassword, 10, (err, hashedPassword) => {
                if (err) {
                    return res.status(500).json({ error: "Error hashing password" });
                }

                // Update the user's password with the hashed temporary password
                const updateSql = "UPDATE users SET password = ? WHERE id = ?";
                db.query(updateSql, [hashedPassword, user.id], (updateErr, updateResult) => {
                    if (updateErr) return res.status(500).json({ error: "Database error while updating password" });

                    // Send the temporary password to the user's email
                    sendPasswordEmail(user.email, user.name, tempPassword);

                    res.json({ message: "Temporary password sent to your email" });
                });
            });
        } else {
            res.status(404).json({ error: "No account found with this email" });
        }
    });
});

app.post('/resend-reset-link', (req, res) => {
    const { email } = req.body;
  
    const sql = "SELECT id, name, email, password FROM users WHERE email = ?";
    db.query(sql, [email], (err, result) => {
      if (err) return res.status(500).json({ error: "Database error" });
  
      if (result.length > 0) {
        const user = result[0];
  
        // Envoi de l'email avec le mot de passe et le nom de l'utilisateur
        sendPasswordEmail(user.email, user.name, user.password);
  
        res.json({ message: "Password and username sent successfully" });
      } else {
        res.status(404).json({ error: "No account found with this email" });
      }
    });
});



// Route pour vérifier la session
app.get("/check-session", (req, res) => {
    if (req.session && req.session.user) {
        res.json({ sessionActive: true });
    } else {
        res.json({ sessionActive: false });
    }
});

// Middleware de vérification du token
const verifyToken = (req, res, next) => {
    const token = req.headers["authorization"];

    if (!token) {
        return res.status(403).json({ error: "Accès refusé, aucun token fourni" });
    }

    // Vérification si le token est dans la blacklist
    if (blacklist.includes(token)) {
        return res.status(401).json({ error: "Token invalidé, veuillez vous reconnecter" });
    }

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: "Token invalide ou expiré" });
        }
        req.user = decoded;
        next();
    });
};

// Route pour ajouter un utilisateur
app.post("/add-user", (req, res) => {
    const { first_name, last_name, email, phone, category, profile } = req.body;

    // Vérifier que tous les champs sont présents
    if (!first_name || !last_name || !email || !phone || !category || !profile) {
        return res.status(400).json({ error: "Tous les champs sont requis !" });
    }

    const name = `${first_name} ${last_name}`; // Fusionner prénom et nom
    const password = generatePassword(); // Génération du mot de passe temporaire
    const hashedPassword = bcrypt.hashSync(password, 10);
    const verificationToken = crypto.randomBytes(32).toString("hex");

    // Ajouter le profil à la base de données avec les autres informations de l'utilisateur
    const sql = "INSERT INTO users (name, email, phone, category, profile, password, verification_token) VALUES (?, ?, ?, ?, ?, ?, ?)";
    db.query(sql, [name, email, phone, category, profile, hashedPassword, verificationToken], (err, result) => {
        if (err) {
            console.error("Erreur lors de l'ajout de l'utilisateur :", err);
            return res.status(500).json({ message: "Erreur lors de l'inscription" });
        } else {
            // Envoyer l'email de vérification
            sendVerificationEmail(email, verificationToken, password);
            res.status(200).json({ message: "Utilisateur ajouté avec succès et email envoyé" });
        }
    });
});

// Route DELETE /delete-user/:id
app.delete('/delete-user/:id', (req, res) => {
  const userId = req.params.id;

  // On supprime de la table users
  const sql = 'DELETE FROM users WHERE id = ?';
  db.query(sql, [userId], (err, result) => {
    if (err) {
      console.error('Erreur lors de la suppression de l’utilisateur :', err);
      return res.status(500).json({ error: 'Erreur serveur' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    res.json({ message: 'Utilisateur supprimé avec succès' });
  });
});


app.get("/users", (req, res) => {
  const sql = "SELECT id, name, email, phone, category, profile, is_active FROM users";
  db.query(sql, (err, result) => {
    if (err) {
      console.error("Erreur lors de la récupération des utilisateurs :", err);
      return res.status(500).json({ message: "Erreur lors de la récupération des utilisateurs" });
    }
    res.status(200).json(result);
  });
});


// Route pour récupérer les utilisateurs
app.get('/api/users', (req, res) => {
    const query = 'SELECT id, name FROM users'; // Remplacez 'name' par le nom exact de votre colonne utilisateur
    db.query(query, (err, results) => {
      if (err) {
        console.error('Erreur lors de la récupération des utilisateurs:', err);
        return res.status(500).json({ error: 'Erreur serveur' });
      }
      res.json(results); // Retourne la liste des utilisateurs
    });
  });
  
// 📥 API Récupération des infos utilisateur (y compris photo)
app.get("/api/user/:id", (req, res) => {
  const sql = "SELECT id, name, email, phone, category, profile, photo FROM users WHERE id = ?";
  db.query(sql, [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ error: "Erreur de récupération" });
    if (result.length === 0) return res.status(404).json({ error: "Utilisateur non trouvé" });

    const user = result[0];
    if (user.photo) {
      user.photo_url = `http://localhost:4000/uploads/${user.photo}`;
    } else {
      user.photo_url = null;
    }
    res.json(user);
  });
});

// 📤 API Upload de la photo de profil
app.post("/api/upload-photo/:id", uploadProfile.single("photo"), (req, res) => {
  const id = req.params.id;
  if (!req.file) {
    return res.status(400).json({ message: "Aucune image uploadée." });
  }

  const photoFilename = req.file.filename;
  const photoUrl = `http://localhost:4000/uploads/${photoFilename}`; // Ajuste selon dossier uploads

  const sql = "UPDATE users SET photo = ? WHERE id = ?";
  db.query(sql, [photoFilename, id], (err, result) => {
    if (err) return res.status(500).json({ message: "Erreur serveur", err });
    res.json({ message: "Photo mise à jour avec succès", photo_url: photoUrl });
  });
});

// Route pour récupérer les administrateurs
app.get('/api/admins', (req, res) => {
    const query = 'SELECT id, name FROM users WHERE category = "Admin"'; // Ajout du filtre
    db.query(query, (err, results) => {
      if (err) {
        console.error('Erreur lors de la récupération des administrateurs:', err);
        return res.status(500).json({ error: 'Erreur serveur' });
      }
      res.json(results);
    });
  });
  
// Update infos utilisateur (sans photo)
app.put("/user/:id", (req, res) => {
  const { id } = req.params;
  const { name, email, phone } = req.body;

  const sql = "UPDATE users SET name = ?, email = ?, phone = ? WHERE id = ?";
  db.query(sql, [name, email, phone, id], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Erreur lors de la mise à jour" });
    }
    res.json({ message: "Profil mis à jour" });
  });
});

app.put("/update-user/:id", (req, res) => {
  const userId = req.params.id;
  const { name, email, phone, category, profile, is_active } = req.body;

  if (!name || !email || !phone || !category) {
    return res.status(400).json({ error: "Tous les champs sont requis !" });
  }

  // Si on ne « transfère » pas vers admin, mise à jour simple
  const sqlUpdate = `
    UPDATE users
    SET name = ?, email = ?, phone = ?, category = ?, profile = ?, is_active = ?
    WHERE id = ?
  `;
  db.query(sqlUpdate, [name, email, phone, category, profile, is_active ? 1 : 0, userId], (err) => {
    if (err) {
      console.error("Erreur lors de la mise à jour de l'utilisateur :", err);
      return res.status(500).json({ message: "Erreur lors de la mise à jour de l'utilisateur" });
    }
    res.status(200).json({ message: "Utilisateur mis à jour avec succès" });
  });
});

    
app.put('/activate-user/:id', (req, res) => {
  const { is_verified } = req.body;
  db.query(
    'UPDATE users SET is_verified = ? WHERE id = ?',
    [is_verified, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: 'Erreur activation' });
      res.json({ message: 'Statut activé mis à jour' });
    }
  );
});

app.put('/change-password/:id', async (req, res) => {
  const userId = req.params.id;
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ error: 'Le mot de passe est requis !' });
  }

  try {
    // 1. Hasher le nouveau mot de passe
    const saltRounds = 10;
    const hashed = await bcrypt.hash(password, saltRounds);

    // 2. Déterminer la catégorie de l'utilisateur via une requête UNION
    const sqlCat = `
      SELECT category FROM (
        SELECT id, 'super admin' AS category FROM admin WHERE id = ?
        UNION
        SELECT id, category FROM users WHERE id = ?
      ) AS u
    `;
    db.query(sqlCat, [userId, userId], (err, catRes) => {
      if (err) {
        console.error('Erreur lors de la récupération de la catégorie :', err);
        return res.status(500).json({ error: 'Erreur serveur' });
      }
      if (catRes.length === 0) {
        return res.status(404).json({ error: 'Utilisateur introuvable' });
      }

      const category = catRes[0].category;
      let sqlUpdate, params;

      if (category === 'super admin') {
        // Mettre à jour dans la table admin
        sqlUpdate = 'UPDATE admin SET password = ? WHERE id = ?';
        params    = [hashed, userId];
      } else {
        // Mettre à jour dans la table users
        sqlUpdate = 'UPDATE users SET password = ? WHERE id = ?';
        params    = [hashed, userId];
      }

      // 3. Exécuter la mise à jour
      db.query(sqlUpdate, params, (err, result) => {
        if (err) {
          console.error('Erreur lors du changement de mot de passe :', err);
          return res.status(500).json({ error: 'Erreur serveur' });
        }
        if (result.affectedRows === 0) {
          return res.status(404).json({ error: 'Utilisateur introuvable' });
        }
        res.json({ message: 'Mot de passe mis à jour avec succès' });
      });
    });
  } catch (err) {
    console.error('Erreur lors du hashage :', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route de vérification de l'email
app.get("/verify-email", (req, res) => {
    const { token } = req.query;

    if (!token) {
        return res.status(400).json({ error: "Token manquant" });
    }

    const query = "SELECT * FROM users WHERE verification_token = ?";
    db.query(query, [token], (err, results) => {
        if (err) {
            console.error("Erreur lors de la recherche du token :", err);
            return res.status(500).json({ error: "Erreur serveur" });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: "Token invalide" });
        }

        const user = results[0];
        const updateQuery = "UPDATE users SET is_verified = 1 WHERE id = ?";
        db.query(updateQuery, [user.id], (err, result) => {
            if (err) {
                console.error("Erreur lors de la mise à jour de la vérification :", err);
                return res.status(500).json({ error: "Erreur serveur" });
            }

            // Réponse HTML pour indiquer que l'email a été vérifié
            res.send(`
                <h1>Email vérifié avec succès !</h1>
                <p>Votre adresse e-mail a été vérifiée avec succès. Vous pouvez maintenant accéder à votre compte.</p>
                <a href="http://localhost:3000/login">Se connecter</a>
            `);
        });
    });
});


// Ajouter une catégorie
app.post("/add-category", (req, res) => {
    const { category } = req.body;
    if (!category) {
        return res.status(400).json({ error: "La catégorie est requise" });
    }

    const sql = "INSERT INTO category (category) VALUES (?)";
    db.query(sql, [category], (err, result) => {
        if (err) {
            console.error("Erreur d'ajout de la catégorie :", err);
            return res.status(500).json({ error: "Erreur serveur" });
        }
        res.json({ message: "Catégorie ajoutée avec succès" });
    });
});

// Ajouter un profil
app.post("/add-profile", (req, res) => {
    const { profile } = req.body;
    if (!profile) {
        return res.status(400).json({ error: "Le profil est requis" });
    }

    const sql = "INSERT INTO profile (profile) VALUES (?)";
    db.query(sql, [profile], (err, result) => {
        if (err) {
            console.error("Erreur d'ajout du profil :", err);
            return res.status(500).json({ error: "Erreur serveur" });
        }
        res.json({ message: "Profil ajouté avec succès" });
    });
});

// Route pour récupérer les catégories
app.get("/categories", (req, res) => {
    db.query("SELECT * FROM category", (err, results) => {
      if (err) {
        console.error("Erreur lors de la récupération des catégories :", err);
        return res.status(500).json({ error: "Erreur serveur" });
      }
      res.json(results);
    });
  });
  
  // Route pour récupérer les profils
  app.get("/profiles", (req, res) => {
    db.query("SELECT * FROM profile", (err, results) => {
      if (err) {
        console.error("Erreur lors de la récupération des profils :", err);
        return res.status(500).json({ error: "Erreur serveur" });
      }
      res.json(results);
    });
  }); 

// API pour obtenir tous les types de documents
app.get('/api/document-types', (req, res) => {
    const query = 'SELECT * FROM document_types';
  
    db.query(query, (err, result) => {
      if (err) {
        return res.status(500).json({ message: 'Erreur lors de la récupération des types de documents.', error: err });
      }
      res.status(200).json(result);
    });
  });

  // API pour ajouter un type de document
app.post('/api/document-type', (req, res) => {
    const { type_name } = req.body;
    
    if (!type_name) {
      return res.status(400).json({ message: 'Le nom du type de document est requis.' });
    }
    
    const query = 'INSERT INTO document_types (type_name) VALUES (?)';
    
    db.query(query, [type_name], (err, result) => {
      if (err) {
        return res.status(500).json({ message: 'Erreur lors de l\'ajout du type de document.', error: err });
      }
      res.status(201).json({ message: 'Type de document ajouté avec succès!', id: result.insertId });
    });
  });

// API pour obtenir tous les types de documents
app.get('/api/facture-types', (req, res) => {
  const sql = "SELECT id, type FROM facture_types";
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Erreur /api/facture-types', err);
      return res.status(500).json({ message: 'Erreur serveur' });
    }
    res.json(results);
  });
});


// Route pour supprimer un type de document
app.delete('/api/document-type/:id', (req, res) => {
    const { id } = req.params;
  
    // SQL pour supprimer le type de document
    const query = 'DELETE FROM document_types WHERE id = ?';
  
    db.query(query, [id], (err, result) => {
      if (err) {
        return res.status(500).json({ message: 'Erreur lors de la suppression du type de document.' });
      }
  
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Type de document non trouvé.' });
      }
  
      res.status(200).json({ message: 'Type de document supprimé avec succès!' });
    });
  });
  
// Route pour ajouter un document
app.post('/api/document/add', upload.single('file'),
  (req, res) => {
    const {
      expediteur,
      destinateur,
      type,
      objet,
      project_id,   // on attend désormais l'id du projet
      statut
    } = req.body;
    const filePath = req.file ? req.file.path : null;

    // Validation
    if (
      !expediteur ||
      !destinateur ||
      !type ||
      !objet ||
      !project_id ||
      !filePath
    ) {
      return res
        .status(400)
        .json({ message: 'Tous les champs requis doivent être remplis.' });
    }

    // Insertion en utilisant project_id (INT)
    const sql = `
      INSERT INTO document
        (expediteur, destinateur, type, objet, file, project_id, statut, created_at)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    db.query(
      sql,
      [
        expediteur,
        destinateur,
        type,
        objet,
        filePath,
        parseInt(project_id, 10),
        statut || null
      ],
      (err, result) => {
        if (err) {
          console.error('Erreur insertion document :', err);
          return res
            .status(500)
            .json({ message: "Erreur serveur lors de l'ajout du document" });
        }
        res.json({
          message: 'Document ajouté avec succès',
          documentId: result.insertId
        });
      }
    );
  }
);

// Ajouter un type de facture
app.post('/api/facture-type', (req, res) => {
    const { type } = req.body;
    if (!type) {
        return res.status(400).json({ message: 'Le type de facture est requis' });
    }
    const sql = "INSERT INTO facture_types (type) VALUES (?)";
    db.query(sql, [type], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Erreur lors de l\'ajout du type de facture' });
        }
        res.status(201).json({ message: 'Type de facture ajouté avec succès' });
    });
});


// API pour récupérer les types de facture
app.get('/api/facture-types', (req, res) => {
  const sql = "SELECT * FROM facture_types";
  db.query(sql, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Erreur lors de la récupération des types de factures' });
    }
    res.json(results);
  });
});

// Supprimer un type de facture par ID
app.delete('/api/facture-type/:id', (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM facture_types WHERE id = ?";
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Erreur lors de la suppression du type de facture' });
        }
        res.json({ message: 'Type de facture supprimé avec succès' });
    });
});

app.post('/api/save-selection', async (req, res) => {
    const { factureType, field, text, position } = req.body;
    const { x, y, width, height } = position;
    
    try {
      // Define the dynamic insert query based on the selected field
      let updateQuery = '';
      let values = [x, y, width, height, factureType];
  
      // Logic to determine which invoice field to update
      switch (field) {
        case 'dateFacturation':
          updateQuery = `
            UPDATE facture_types
            SET dateFacturation_x = ?, dateFacturation_y = ?, dateFacturation_width = ?, dateFacturation_height = ?
            WHERE type = ?`;
          break;
        case 'echeance':
          updateQuery = `
            UPDATE facture_types
            SET echeance_x = ?, echeance_y = ?, echeance_width = ?, echeance_height = ?
            WHERE type = ?`;
          break;
        case 'totalTTC':
          updateQuery = `
            UPDATE facture_types
            SET totalTTC_x = ?, totalTTC_y = ?, totalTTC_width = ?, totalTTC_height = ?
            WHERE type = ?`;
          break;
        case 'destinataire':
          updateQuery = `
            UPDATE facture_types
            SET destinataire_x = ?, destinataire_y = ?, destinataire_width = ?, destinataire_height = ?
            WHERE type = ?`;
          break;
        default:
          return res.status(400).send('Champ inconnu');
      }
  
      // Execute the update query for the selected field
      db.query(updateQuery, values, (err, result) => {
        if (err) {
          console.error('Erreur:', err);
          return res.status(500).send('Erreur lors de l\'enregistrement de la sélection');
        }
  
        // Check if rows were affected
        if (result.affectedRows > 0) {
          return res.status(200).send('Sélection enregistrée avec succès');
        } else {
          return res.status(400).send('Aucune ligne trouvée à mettre à jour');
        }
      });
    } catch (error) {
      console.error('Erreur:', error);
      res.status(500).send('Erreur lors de l\'enregistrement de la sélection');
    }
  });

// Route pour récupérer les données de la facture en fonction du type
app.get("/api/facture-data", async (req, res) => {
    const { type } = req.query;

    // Vérifier si le type de facture est spécifié
    if (!type) {
        return res.status(400).json({ message: "Type de facture non spécifié" });
    }

    try {
        // Requête SQL pour récupérer les coordonnées (x, y), largeur (width) et hauteur (height) des champs de la facture
        const query = `
            SELECT dateFacturation_x, dateFacturation_y, dateFacturation_width, dateFacturation_height,
                   echeance_x, echeance_y, echeance_width, echeance_height,
                   totalTTC_x, totalTTC_y, totalTTC_width, totalTTC_height,
                   destinataire_x, destinataire_y, destinataire_width, destinataire_height
            FROM facture_types
            WHERE type = ?`;

        // Exécuter la requête SQL
        db.query(query, [type], (err, result) => {
            if (err) {
                console.error("Erreur lors de la requête SQL:", err);
                return res.status(500).json({ message: "Erreur lors de la récupération des données de la facture" });
            }

            // Vérifier si des données ont été trouvées
            if (result.length === 0) {
                return res.status(404).json({ message: "Aucune donnée trouvée pour ce type de facture" });
            }

            // Formater les données de la facture
            const factureData = {
                dateFacturation: {
                    x: result[0].dateFacturation_x,
                    y: result[0].dateFacturation_y,
                    width: result[0].dateFacturation_width,
                    height: result[0].dateFacturation_height,
                },
                echeance: {
                    x: result[0].echeance_x,
                    y: result[0].echeance_y,
                    width: result[0].echeance_width,
                    height: result[0].echeance_height,
                },
                totalTTC: {
                    x: result[0].totalTTC_x,
                    y: result[0].totalTTC_y,
                    width: result[0].totalTTC_width,
                    height: result[0].totalTTC_height,
                },
                destinataire: {
                    x: result[0].destinataire_x,
                    y: result[0].destinataire_y,
                    width: result[0].destinataire_width,
                    height: result[0].destinataire_height,
                }
            };

            res.json(factureData);
        });
    } catch (error) {
        console.error("Erreur lors de la récupération des données:", error);
        res.status(500).json({ message: "Erreur serveur" });
    }
});
 
// Route pour ajouter une facture
app.post("/api/facture/add", (req, res) => {
    const { expediteur, type_facture, projet, fichier_pdf, date_facturation, echeance, total_ttc, destinataire } = req.body;
  
    const query = `
      INSERT INTO facture (expediteur, type_facture, projet, fichier_pdf, date_facturation, echeance, total_ttc, destinataire)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
  
    const values = [expediteur, type_facture, projet, fichier_pdf, date_facturation, echeance, total_ttc, destinataire];
  
    db.query(query, values, (err, results) => {
      if (err) {
        console.error("Erreur lors de l'ajout de la facture :", err);
        return res.status(500).json({ error: "Erreur serveur" });
      }
      res.json({ message: "Facture ajoutée avec succès", id: results.insertId });
    });
  });

// Endpoint pour ajouter un projet
app.post('/api/add-project', (req, res) => {
    const { nom, responsable, date_debut, date_fin, budget, description } = req.body;
    const montant_payer = 0;
    const statut = "En cours"; 

    const sql = "INSERT INTO project (nom, responsable, date_debut, date_fin, statut, budget, montant_payer, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    db.query(sql, [nom, responsable, date_debut, date_fin, statut, budget, montant_payer, description], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        // Une fois que le projet est ajouté avec succès, envoyez une notification via WebSocket
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(`Un nouveau projet a été ajouté: ${nom}`);
            }
        });

        res.json({ message: "Projet ajouté avec succès" });
    });
});

app.get('/api/projets-rs', (req, res) => {
  // Récupérer les paramètres de la requête
  const { responsable, categorie } = req.query;

  // Récupérer le responsable de l'utilisateur connecté (par exemple, req.user.name)
  const userResponsable = req.user ? req.user.name : null;

  // Initialiser la requête SQL
  let query = `
      SELECT id, nom, responsable, date_debut, date_fin, statut, budget, montant_payer, description, equipe
      FROM project
  `;

  const params = [];

  // Logique de filtrage
  if (categorie) {
      // Si une catégorie est spécifiée, appliquer le filtre en fonction de la catégorie
      if (categorie === 'Utilisateur' || categorie === 'Admin') {
          // Si l'utilisateur est un "Utilisateur" ou "Admin", filtrer par son nom
          if (userResponsable) {
              query += " WHERE responsable = ?";
              params.push(userResponsable);
          } else {
              // Si aucun utilisateur connecté, retourner une erreur ou tous les projets
              console.warn('Aucun utilisateur connecté. Affichage de tous les projets.');
          }
      } else if (categorie === 'Tous') {
          // Si la catégorie est "Tous", ne pas appliquer de filtre
      } else {
          // Si une autre catégorie est spécifiée, appliquer un filtre spécifique
          query += " WHERE categorie = ?";
          params.push(categorie);
      }
  } else if (responsable) {
      // Si aucun paramètre de catégorie mais un responsable est spécifié, filtrer par responsable
      query += " WHERE responsable = ?";
      params.push(responsable);
  }

  // Exécuter la requête SQL
  db.query(query, params, (err, results) => {
      if (err) {
          console.error('Erreur lors de la récupération des projets :', err);
          return res.status(500).json({ error: 'Erreur serveur' });
      }

      // Convertir la colonne JSON `equipe` en objet JavaScript
      const projets = results.map(projet => ({
          ...projet,
          equipe: projet.equipe ? JSON.parse(projet.equipe) : [] // Vérifie si `equipe` n'est pas NULL
      }));

      // Retourner les projets filtrés
      res.json(projets);
  });
});

app.put("/api/projets/:id", (req, res) => {
    const { id } = req.params;
    const { equipe } = req.body;
  
    const sql = "UPDATE projets SET equipe = ? WHERE id = ?";
    db.query(sql, [equipe, id], (err, result) => {
      if (err) {
        console.error("Erreur lors de l'ajout de l'équipe :", err);
        return res.status(500).send("Erreur lors de l'ajout de l'équipe.");
      }
      res.status(200).send("Équipe ajoutée avec succès.");
    });
  });

app.post("/projets/:id/ajouter-equipe", (req, res) => {
  const projectId = req.params.id;
  const newMembers = req.body.equipe;  // tableau d'objets { id, name, role }

  if (!Array.isArray(newMembers) || newMembers.length === 0) {
    return res.status(400).json({ error: "L'équipe doit être un tableau non vide." });
  }

  // 1) Récupérer l'équipe existante
  const selectSql = "SELECT equipe FROM project WHERE id = ?";
  db.query(selectSql, [projectId], (err, rows) => {
    if (err) {
      console.error("Erreur SELECT équipe :", err);
      return res.status(500).json({ error: "Erreur serveur" });
    }
    if (rows.length === 0) {
      return res.status(404).json({ error: "Projet introuvable" });
    }

    // 2) Parser JSON ou démarrer tableau vide
    let currentTeam = [];
    try {
      currentTeam = rows[0].equipe ? JSON.parse(rows[0].equipe) : [];
    } catch (parseErr) {
      console.warn("JSON invalide dans project.equipe, on réinitialise", parseErr);
      currentTeam = [];
    }

    // 3) Fusionner en évitant les doublons (par id)
    const merged = [...currentTeam];
    newMembers.forEach(member => {
      if (!merged.some(m => m.id === member.id)) {
        merged.push(member);
      }
    });

    // 4) Mettre à jour la colonne
    const updateSql = "UPDATE project SET equipe = ? WHERE id = ?";
    db.query(updateSql, [JSON.stringify(merged), projectId], (err2) => {
      if (err2) {
        console.error("Erreur UPDATE équipe :", err2);
        return res.status(500).json({ error: "Erreur serveur" });
      }
      res.json({ message: "Équipe mise à jour avec succès", equipe: merged });
    });
  });
});

// Récupérer tous les documents d'un projet donné
app.get('/api/project/:id/documents', (req, res) => {
  const projectId = req.params.id;
  const sql = `
    SELECT 
      d.id,
      d.expediteur,
      d.destinateur,
      dt.type_name,
      d.objet,
      d.file,
      d.archived,
      d.statut,
      d.created_at
    FROM document d
    JOIN document_types dt ON d.type = dt.id
    WHERE d.project_id = ?
    ORDER BY d.created_at DESC
  `;
  db.query(sql, [projectId], (err, docs) => {
    if (err) {
      console.error('Erreur récupération documents du projet :', err);
      return res.status(500).json({ error: 'Erreur serveur' });
    }
    res.json(docs);
  });
});

app.get('/api/projects-active', (req, res) => {
  const sql = `
    SELECT id, nom, responsable, date_debut, date_fin, statut, budget, montant_payer, description, equipe
    FROM project
    WHERE date_debut <= CURDATE() AND date_fin >= CURDATE()
  `;
  db.query(sql, (err, projects) => {
    if (err) return res.status(500).json({ error: 'Erreur serveur' });
    res.json(projects.map(p => ({
      ...p,
      equipe: p.equipe ? JSON.parse(p.equipe) : []
    })));
  });
});

// API pour récupérer les projets de l'utilisateur
app.get('/api/my-projects', (req, res) => {
  const userName = req.user.name;
  const sql = `
    SELECT id, nom, responsable, date_debut, date_fin, statut, budget, montant_payer, description, equipe
    FROM project
    WHERE responsable=? OR JSON_CONTAINS(equipe, JSON_OBJECT('name', ?), '$')
  `;
  db.query(sql, [userName, userName], (e, rows) => {
    if (e) return res.status(500).json({ error: 'Erreur serveur' });
    res.json(rows.map(p => ({ ...p, equipe: p.equipe ? JSON.parse(p.equipe) : [] })));
  });
});

// Route pour récupérer les tâches d’un projet
app.get("/api/project/:id/tasks", verifyToken, (req, res) => {
  const projectId = req.params.id;
  const userName = req.user.name;

  db.query(
    "SELECT responsable, equipe FROM project WHERE id = ?",
    [projectId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "Erreur serveur" });
      if (!rows.length) return res.status(404).json({ error: "Projet introuvable" });

      const { responsable, equipe } = rows[0];
      const team = equipe ? JSON.parse(equipe) : [];

      let sql, params;
      if (responsable === userName) {
        sql = "SELECT *, COALESCE(dependencies, '[]') AS dependencies FROM taches WHERE project_id = ?";
        params = [projectId];
      } else if (team.some((m) => m.name === userName)) {
        sql =
          "SELECT *, COALESCE(dependencies, '[]') AS dependencies FROM taches WHERE project_id = ? AND assignee = ?";
        params = [projectId, userName];
      } else {
        return res.status(403).json({ error: "Pas autorisé" });
      }

      db.query(sql, params, (err2, tasks) => {
        if (err2) return res.status(500).json({ error: "Erreur serveur" });
        // dependencies est déjà un JSON string
        const parsed = tasks.map((t) => ({
          ...t,
          dependencies: JSON.parse(t.dependencies),
        }));
        res.json(parsed);
      });
    }
  );
});

// 2) Archive : bascule et lecture
app.get('/api/archive', (req, res) => {
  // a) Mettre à jour le statut des projets expirés
  const updateProj = `
    UPDATE project
    SET statut = 'Archivé'
    WHERE date_fin < CURDATE()
  `;
  db.query(updateProj, err => {
    if (err) console.error(err);
    // b) Mettre à jour les documents liés
    const updateDocs = `
      UPDATE document d
      JOIN project p ON d.project_id = p.id
      SET d.archived = 1
      WHERE p.statut = 'Archivé'
    `;
    db.query(updateDocs, err2 => {
      if (err2) console.error(err2);
      // c) Lire les projets archivés
      const getProj = `
        SELECT id, nom, responsable, date_debut, date_fin, statut, budget, montant_payer, description, equipe
        FROM project
        WHERE statut = 'Archivé'
      `;
      db.query(getProj, (err3, projs) => {
        if (err3) return res.status(500).json({ error: 'Erreur serveur' });
        // d) Lire les documents archivés
        const getDocs = `
          SELECT d.id, d.expediteur, d.destinateur, dt.type_name, d.objet, d.file, d.archived, d.statut, d.created_at, d.project_id
          FROM document d
          JOIN document_types dt ON d.type = dt.id
          WHERE d.archived = 1
          ORDER BY d.created_at DESC
        `;
        db.query(getDocs, (err4, docs) => {
          if (err4) return res.status(500).json({ error: 'Erreur serveur' });
          res.json({
            projects: projs.map(p => ({ ...p, equipe: p.equipe ? JSON.parse(p.equipe) : [] })),
            documents: docs
          });
        });
      });
    });
  });
});

// Route pour modifier les dépendances d'une tâche
app.put("/api/taches/:id/dependencies", verifyToken, (req, res) => {
  const taskId = req.params.id;
  const { dependencies } = req.body; // attend un tableau d'IDs

  if (!Array.isArray(dependencies)) {
    return res.status(400).json({ error: "dependencies doit être un tableau d'IDs" });
  }

  const depsJson = JSON.stringify(dependencies);

  const sql = "UPDATE taches SET dependencies = ? WHERE id = ?";
  db.query(sql, [depsJson, taskId], (err, result) => {
    if (err) {
      console.error("Erreur mise à jour dependencies :", err);
      return res.status(500).json({ error: "Erreur serveur" });
    }
    res.json({ message: "Dependencies mises à jour", dependencies });
  });
});

 
// api pour sauvegarder les tâches
app.post("/api/taches", (req, res) => {
  const { projet, expediteur, assignee, titre, description, priorite, statut, dateDebut, dateFin } = req.body;

  // 1. Récupérer l'ID du projet à partir de son nom
  const getProjectIdSQL = "SELECT id FROM project WHERE nom = ?";
  db.query(getProjectIdSQL, [projet], (err, rows) => {
    if (err) {
      console.error("Erreur récupération projet :", err);
      return res.status(500).json({ message: "Erreur serveur." });
    }
    if (rows.length === 0) {
      return res.status(400).json({ message: "Projet non trouvé." });
    }
    const project_id = rows[0].id;

    // 2. Insérer la tâche
    const insertTacheSQL = `
      INSERT INTO taches
        (project_id, expediteur, assignee, titre, description, priorite, statut, dateDebut, dateFin)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [project_id, expediteur, assignee, titre, description, priorite, statut, dateDebut, dateFin];

    db.query(insertTacheSQL, params, (err, result) => {
      if (err) {
        console.error("Erreur ajout tâche :", err);
        return res.status(500).json({ message: "Erreur ajout tâche." });
      }

      // 3. Construire le payload de notification uniquement pour l'assignee
      const payload = JSON.stringify({
        type: "new_task",
        titre,
        projet,
        assignee,
      });

      // 4. Envoyer via WS au client identifié par `assignee`
      const targetWs = wsClients.get(assignee);
      if (targetWs && targetWs.readyState === WebSocket.OPEN) {
        targetWs.send(payload);
      }
      // Sinon, l'utilisateur mobile n'est pas connecté: vous pouvez stocker la notif en BDD ou ignorer.

      // 5. Répondre à la requête REST du client web
      res.status(201).json({ message: "Tâche ajoutée avec succès !" });
    });
  });
});



// Route pour récupérer les tâches par assignee
app.get('/api/taches', (req, res) => {
    const { assignee } = req.query;
  
    if (!assignee) {
      return res.status(400).json({ error: 'Assignee requis !' });
    }
  
    const query = `
      SELECT id, projet, expediteur, assignee, titre, description, priorite, statut, dateDebut, dateFin
      FROM taches
      WHERE assignee = ?
    `;
  
    db.query(query, [assignee], (err, results) => {
      if (err) {
        console.error('Erreur lors de la récupération des tâches :', err);
        return res.status(500).json({ error: 'Erreur serveur' });
      }
  
      res.json(results);
    });
  });

// Route pour mettre à jour le statut d'une tâche
app.put('/api/taches/:id/statut', (req, res) => {
    const { id } = req.params;
    const { statut } = req.body;
  
    const query = `
      UPDATE taches
      SET statut = ?
      WHERE id = ?
    `;
  
    db.query(query, [statut, id], (err, result) => {
      if (err) {
        console.error('Erreur lors de la mise à jour du statut :', err);
        return res.status(500).json({ error: 'Erreur serveur' });
      }
  
      res.json({ message: 'Statut mis à jour avec succès !' });
    });
  });
  

app.post('/api/upload-sign', upload.single('pdf'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "No PDF file uploaded" });
    }

    const { signature, userEmail } = req.body;
    if (!signature || !userEmail) {
        return res.status(400).json({ message: "Signature and email required" });
    }

    // Generate verification token
    const token = crypto.randomBytes(32).toString('hex');
    verificationTokens[token] = { filePath: req.file.path, signature, email: userEmail };

    // Send verification email
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'symatique.info@gmail.com',
            pass: 'mlot nagq saey ohqg',
        },

    });

    const verificationLink = `http://localhost:4000/api/verify-signature?token=${token}`;

    const mailOptions = {
        from: 'your-email@gmail.com',
        to: userEmail,
        subject: 'Signature Verification',
        text: `Click the following link to confirm your signature: ${verificationLink}`,
    };

    try {
        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: "Verification email sent. Please check your inbox." });
    } catch (error) {
        console.error('Email Error:', error);
        res.status(500).json({ message: "Failed to send verification email." });
    }
});


app.get('/api/verify-signature', async (req, res) => {
    const { token } = req.query;
    const data = verificationTokens[token];

    if (!data) {
        return res.status(400).json({ message: "Invalid or expired verification link." });
    }

    const { filePath, signature, email } = data;
    delete verificationTokens[token]; // Remove token after use

    try {
        const existingPdfBytes = fs.readFileSync(filePath);
        const pdfDoc = await PDFDocument.load(existingPdfBytes);

        const qrContent = `Name: ${signature}\nEmail: ${email}\nVerified: Yes\nDate: ${new Date().toLocaleString()}`;
        const qrCodeDataUrl = await QRCode.toDataURL(qrContent);
        const qrCodeImageBytes = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');
        const qrCodeImage = await pdfDoc.embedPng(qrCodeImageBytes);

        const page = pdfDoc.getPages()[0];
        const { width, height } = page.getSize();
        const qrCodeSize = 100;

        page.drawImage(qrCodeImage, {
            x: width - qrCodeSize - 50,
            y: 50,
            width: qrCodeSize,
            height: qrCodeSize,
        });

        const signedDocumentsDir = path.join(__dirname, 'signed-documents');
        if (!fs.existsSync(signedDocumentsDir)) {
            fs.mkdirSync(signedDocumentsDir);
        }

        const signedPdfPath = path.join(signedDocumentsDir, Date.now() + '-signed.pdf');
        const pdfBytes = await pdfDoc.save();
        fs.writeFileSync(signedPdfPath, pdfBytes);

        res.status(200).json({ message: "PDF signed successfully!", filePath: signedPdfPath });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: "Error processing the PDF." });
    }
});


// Route pour mettre à jour les dépendances
app.put('/api/taches/:id/dependencies', (req, res) => {
  const { id } = req.params;
  const { dependencies } = req.body;
  
  db.query(
    'UPDATE taches SET dependencies = ? WHERE id = ?',
    [JSON.stringify(dependencies), id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Dépendances mises à jour' });
    }
  );
});

// Route pour récupérer toutes les tâches (pour les dépendances)
app.get('/api/all-tasks', (req, res) => {
  db.query('SELECT id, titre, statut FROM taches', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});



// Récupérer toutes les tâches d'un projet
app.get('/api/tasks/:projectId', (req, res) => {
  const { projectId } = req.params;
  const query = 'SELECT * FROM gantt_tasks WHERE project = ?';

  db.query(query, [projectId], (err, results) => {
    if (err) {
      console.error('Erreur lors de la récupération des tâches :', err);
      return res.status(500).json({ error: 'Erreur serveur' });
    }
    res.status(200).json(results);
  });
});

// Ajouter une nouvelle tâche
app.post('/api/tasks', (req, res) => {
  const { name, start_date, end_date, progress, type, progress_color, progress_selected_color, project } = req.body;
  const query = `
    INSERT INTO gantt_tasks (name, start_date, end_date, progress, type, progress_color, progress_selected_color, project)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    query,
    [name, start_date, end_date, progress, type, progress_color, progress_selected_color, project],
    (err, results) => {
      if (err) {
        console.error('Erreur lors de l\'ajout de la tâche :', err);
        return res.status(500).json({ error: 'Erreur serveur' });
      }
      res.status(201).json({ id: results.insertId, message: 'Tâche ajoutée avec succès' });
    }
  );
});

// Mettre à jour une tâche
app.put('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  const { name, start_date, end_date, progress, type, progress_color, progress_selected_color, project } = req.body;
  const query = `
    UPDATE gantt_tasks
    SET name = ?, start_date = ?, end_date = ?, progress = ?, type = ?, progress_color = ?, progress_selected_color = ?, project = ?
    WHERE id = ?
  `;

  db.query(
    query,
    [name, start_date, end_date, progress, type, progress_color, progress_selected_color, project, id],
    (err, results) => {
      if (err) {
        console.error('Erreur lors de la mise à jour de la tâche :', err);
        return res.status(500).json({ error: 'Erreur serveur' });
      }
      if (results.affectedRows === 0) {
        return res.status(404).json({ error: 'Tâche non trouvée' });
      }
      res.status(200).json({ message: 'Tâche mise à jour avec succès' });
    }
  );
});

// Supprimer une tâche
app.delete('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM gantt_tasks WHERE id = ?';

  db.query(query, [id], (err, results) => {
    if (err) {
      console.error('Erreur lors de la suppression de la tâche :', err);
      return res.status(500).json({ error: 'Erreur serveur' });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Tâche non trouvée' });
    }
    res.status(200).json({ message: 'Tâche supprimée avec succès' });
  });
});
  


app.get('/api/tasks', (req, res) => {
  const query = `
    SELECT id, projet, expediteur, assignee, titre, description, priorite, statut, dateDebut, dateFin
    FROM taches
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Erreur lors de la récupération des tâches :', err);
      return res.status(500).json({ error: 'Erreur serveur' });
    }
    res.json(results);
  });
});


// Stats endpoint
app.get('/api/stats', (req, res) => {
  const stats = {};
  const queries = {
    admins: 'SELECT COUNT(*) AS count FROM admin',
    users: 'SELECT COUNT(*) AS count FROM users',
    profiles: 'SELECT profile AS label, COUNT(*) AS count FROM users GROUP BY profile',
    projects: 'SELECT COUNT(*) AS count FROM project',
    tasks_total: 'SELECT COUNT(*) AS count FROM taches',
    tasks_status: 'SELECT projet AS project, statut AS status, COUNT(*) AS count FROM taches GROUP BY projet, statut',
    document_types: 'SELECT COUNT(*) AS count FROM document_types',
    documents_total: 'SELECT COUNT(*) AS count FROM document',
    documents_archived: 'SELECT COUNT(*) AS count FROM document WHERE archived = 1',
    facture_types: 'SELECT COUNT(*) AS count FROM facture_types',
    factures_total: 'SELECT COUNT(*) AS count FROM facture'
  };

  const keys = Object.keys(queries);
  let completed = 0;

  keys.forEach(key => {
    db.query(queries[key], (err, results) => {
      if (err) {
        console.error(`Error fetching ${key}:`, err);
        stats[key] = null;
      } else {
        stats[key] = results;
      }
      completed++;
      if (completed === keys.length) {
        res.json(stats);
      }
    });
  });
});

app.get('/api/statsdeep', (req, res) => {
  db.query(`
    SELECT 
      COUNT(*) AS totalUsers,
      SUM(category = 'Admin') AS adminCount,
      SUM(category = 'Utilisateur') AS userCount,
      profile,
      COUNT(*) AS profileCount
    FROM users
    GROUP BY profile`,
    (errUsers, users) => {
      if (errUsers) return res.status(500).json({ error: errUsers.sqlMessage });

      db.query(`
        SELECT 
          COUNT(*) AS totalProjects,
          GROUP_CONCAT(CONCAT(nom, '|', (SELECT COUNT(*) FROM taches WHERE projet = project.nom))) AS projectsTasks,
          (SELECT COUNT(*) FROM taches) AS totalTasks
        FROM project`,
        (errProjects, projects) => {
          if (errProjects) return res.status(500).json({ error: errProjects.sqlMessage });

          db.query(`
            SELECT 
              statut, 
              COUNT(*) AS count 
            FROM taches 
            GROUP BY statut`,
            (errTasks, tasksStatus) => {
              if (errTasks) return res.status(500).json({ error: errTasks.sqlMessage });

              db.query(`
                SELECT 
                  COUNT(*) AS totalDocuments,
                  SUM(archived) AS archivedCount,
                  document_types.type_name,
                  COUNT(document.type) AS typeCount
                FROM document
                LEFT JOIN document_types ON document.type = document_types.id
                GROUP BY document_types.type_name`,
                (errDocs, documents) => {
                  if (errDocs) return res.status(500).json({ error: errDocs.sqlMessage });

                  db.query(`
                    SELECT 
                      type_facture,
                      COUNT(*) AS typeCount,
                      SUM(CAST(REPLACE(REPLACE(total_ttc, ' €', ''), ',', '.') AS DECIMAL(10,2)) AS typeAmount
                    FROM facture
                    GROUP BY type_facture`,
                    (errInvoiceTypes, invoiceTypes) => {
                      if (errInvoiceTypes) return res.status(500).json({ error: errInvoiceTypes.sqlMessage });

                      db.query(`
                        SELECT 
                          COUNT(*) AS totalInvoices,
                          SUM(CAST(REPLACE(REPLACE(total_ttc, ' €', ''), ',', '.') AS DECIMAL(10,2)) AS totalAmount
                        FROM facture`,
                        (errInvoices, invoices) => {
                          if (errInvoices) return res.status(500).json({ error: errInvoices.sqlMessage });

                          const stats = {
                            users: {
                              total: users[0].totalUsers,
                              admins: users[0].adminCount,
                              users: users[0].userCount,
                              profiles: users.reduce((acc, curr) => {
                                acc[curr.profile] = curr.profileCount;
                                return acc;
                              }, {})
                            },
                            projects: {
                              total: projects[0].totalProjects,
                              totalTasks: projects[0].totalTasks,
                              details: projects[0].projectsTasks?.split(',').reduce((acc, item) => {
                                const [project, tasks] = item.split('|');
                                acc[project] = parseInt(tasks);
                                return acc;
                              }, {}) || {},
                              status: tasksStatus.reduce((acc, curr) => {
                                acc[curr.statut] = curr.count;
                                return acc;
                              }, {})
                            },
                            documents: {
                              total: documents[0].totalDocuments,
                              archived: documents[0].archivedCount,
                              types: documents.reduce((acc, curr) => {
                                acc[curr.type_name] = curr.typeCount;
                                return acc;
                              }, {})
                            },
                            invoices: {
                              total: invoices[0].totalInvoices,
                              amount: invoices[0].totalAmount,
                              types: invoiceTypes.reduce((acc, curr) => {
                                acc[curr.type_facture] = {
                                  count: curr.typeCount,
                                  amount: curr.typeAmount
                                };
                                return acc;
                              }, {})
                            }
                          };

                          res.json(stats);
                        });
                    });
                });
            });
        });
    });
});




// Route pour traiter les factures
app.post('/api/invoice/process', uploadFacture.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Aucun fichier fourni' });
  }

  const pdfPath = path.resolve(req.file.path);
  const projet = req.body.projet || 'Inconnu';
  const expediteur = req.body.expediteur || 'Inconnu';

  // Chemin absolu vers le script Python
  const scriptPath = path.join(__dirname, 'scripts', 'extract_and_store.py');
  
  // Vérifier que le script existe
  if (!fs.existsSync(scriptPath)) {
    return res.status(500).json({
      error: 'Script de traitement introuvable',
      details: `Le fichier ${scriptPath} n'existe pas`
    });
  }
  
  // Obtenir l'exécutable Python
  const pythonExecutable = getPythonExecutable();
  
  // Fonction pour échapper les chemins avec espaces
  const escapePath = (path) => {
    if (process.platform === 'win32') {
      // Sous Windows, utiliser des doubles guillemets
      return `"${path}"`;
    } else {
      // Sous Linux/Mac, échapper les espaces avec des backslashes
      return path.replace(/(\s+)/g, '\\$1');
    }
  };

  // Échapper les chemins
  const escapedPdfPath = escapePath(pdfPath);
  const escapedScriptPath = escapePath(scriptPath);
  
  // Construire la commande
  const cmd = `${escapePath(pythonExecutable)} ${escapedScriptPath} ${escapedPdfPath} "${projet}" "${expediteur}"`;
  
  console.log(`Exécution de la commande: ${cmd}`);
  
  exec(cmd, (err, stdout, stderr) => {
    console.log('Sortie Python stdout:', stdout);
    console.error('Sortie Python stderr:', stderr);
    
    // Supprimer le fichier après traitement même en cas d'erreur
    setTimeout(() => {
      try {
        if (fs.existsSync(pdfPath)) {
          fs.unlinkSync(pdfPath);
          console.log(`Fichier supprimé: ${pdfPath}`);
        }
      } catch (cleanupErr) {
        console.error('Erreur lors du nettoyage:', cleanupErr);
      }
    }, 5000); // Supprimer après 5 secondes
    
    if (err) {
      console.error('❌ Erreur lors de l\'exécution du script Python:', err);
      return res.status(500).json({ 
        error: 'Extraction échouée', 
        details: stderr || err.message,
        cmd
      });
    }
    
    const output = stdout.trim();
    if (output.startsWith('OK:')) {
      const id = output.split('OK:')[1].trim();
      return res.json({ 
        message: 'Facture traitée avec succès', 
        id 
      });
    } else {
      return res.status(400).json({ 
        error: output || 'Erreur inconnue',
        stderr,
        cmd
      });
    }
  });
});

// Fonction pour obtenir l'exécutable Python
function getPythonExecutable() {
  // Essayer l'environnement virtuel en premier
  const venvPaths = [
    path.join(__dirname, '.venv', 'Scripts', 'python.exe'), // Windows
    path.join(__dirname, '.venv', 'bin', 'python')          // Linux/Mac
  ];
  
  for (const venvPath of venvPaths) {
    if (fs.existsSync(venvPath)) {
      return venvPath;
    }
  }
  
  // Fallback: utiliser les commandes système
  if (process.platform === 'win32') {
    // Essayer différentes versions de Python sous Windows
    const versions = ['python', 'python3', 'py'];
    for (const version of versions) {
      try {
        // Vérifier si la commande existe
        execSync(`${version} --version`, { stdio: 'ignore' });
        return version;
      } catch (e) {
        // Continuer à essayer
      }
    }
    return 'python'; // Fallback
  } else {
    return 'python3'; // Linux/Mac
  }
}

// API pour uploader les factures
app.post(
  "/api/invoice/upload",
  uploadFacture.single("file"),
  (req, res) => {
    const pdfPath = path.resolve(req.file.path);
    const projet = req.body.projet || "Inconnu";
    const type = req.body.type || "Autre";
    const expediteur = req.user.name;

    // Appelle le script Python AI
    const cmd = `python extract_and_store_ai.py "${pdfPath}" "${projet}" "${expediteur}" "${type}"`;

    exec(cmd, { cwd: __dirname }, (err, stdout, stderr) => {
      if (err) {
        console.error("❌ Erreur d'extraction :", stderr || err);
        return res.status(500).json({ error: stderr || err.message });
      }
      
      const out = stdout.trim();
      if (out.startsWith("OK:")) {
        const insertedId = out.split("OK:")[1].trim();
        return res.json({
          message: "Facture extraite et insérée avec succès !",
          id: insertedId,
        });
      } else {
        return res.status(400).json({ error: out });
      }
    });
  }
);

// Route pour télécharger le fichier PDF
app.get('/api/invoice/file/:id', (req, res) => {
  const query = 'SELECT pdf_path FROM facture WHERE id = ?';
  db.query(query, [req.params.id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ error: 'Facture non trouvée' });
    
    const filePath = results[0].pdf_path;
    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Fichier PDF introuvable' });
    }
    
    res.download(filePath, path.basename(filePath));
  });
});

app.get('/api/project/:id/invoices', verifyToken, (req, res) => {
  const projectId = parseInt(req.params.id, 10);
  const userName  = req.user.name;

  const checkSql = `
    SELECT 1
    FROM project
    WHERE id = ?
      AND (
        responsable = ?
        OR JSON_CONTAINS(equipe, JSON_OBJECT('name', ?), '$')
      )
  `;
  db.query(checkSql, [projectId, userName, userName], (err, rows) => {
    if (err)    return res.status(500).json({ error: 'Erreur serveur' });
    if (!rows.length) return res.status(403).json({ error: 'Accès refusé' });

    const sql = `
      SELECT
        f.id,
        f.expediteur,
        ft.type AS type_libelle,
        f.date_facturation,
        f.echeance,
        f.total_ttc,
        f.destinataire,
        f.created_at,
        f.file
      FROM facture f
      LEFT JOIN facture_types ft ON f.type = ft.id
      WHERE f.projet = ?
      ORDER BY f.created_at DESC
    `;
    db.query(sql, [projectId], (err2, invoices) => {
      if (err2) return res.status(500).json({ error: 'Erreur serveur' });
      res.json(invoices);
    });
  });
});




// multer config : uploadFacture
app.post("/api/invoice/upload",
  verifyToken,
  uploadFacture.single("file"),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "Aucun fichier PDF envoyé." });
    }

    const pdfPath    = path.resolve(req.file.path);
    const projet     = req.body.projet;
    const expediteur = req.user.name;
    const typeId     = req.body.type;

    // Chemin vers votre python.exe (venv) et script
    const pythonExe  = path.resolve(__dirname, "venv", "Scripts", "python.exe");
    const scriptPath = path.resolve(__dirname, "extract_and_store_ai.py");

    // Construire la commande (notez les guillemets autour des paths)
    const cmd = `"${pythonExe}" "${scriptPath}" "${pdfPath}" "${projet}" "${expediteur}" "${typeId}"`;

    exec(cmd, { cwd: __dirname, maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
      // Si Python a crashé
      if (error) {
        console.error("❌ AI Extraction error:", stderr || error);
        return res.status(500).json({
          error: "Erreur AI lors de l’extraction",
          details: stderr.trim() || error.message,
        });
      }

      // On récupère la sortie standard
      const out = stdout.trim();
      console.log("🔹 Python output:", out);

      // Si votre script renvoie "OK: <id>"
      if (out.startsWith("OK:")) {
        const insertedId = out.split("OK:")[1].trim();
        return res.json({
          message: "Facture extraite et insérée avec succès !",
          id: insertedId,
        });
      }

      // Sinon, extraction partielle ou message d’erreur métier
      return res.status(400).json({
        error: "Extraction incomplète ou format inattendu",
        details: out,
      });
    });
  }
);



// ------ Partie Mobile -----



app.get("/anomalies", (req, res) => {
  db.query("SELECT * FROM taches", (err, taches) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Erreur serveur" });
    }

    const anomalies = [];
    const today = moment();

    const assigneeMap = {};

    for (let t of taches) {
      const dateFin = moment(t.dateFin);
      const dateDebut = moment(t.dateDebut);
      const joursDepuisDebut = today.diff(dateDebut, "days");

      // 1. Tâche en retard
      if (today.isAfter(dateFin) && t.statut !== "Terminée") {
        anomalies.push({
          type: "Tâche en retard",
          message: `La tâche '${t.titre}' est en retard.`,
          tache: t,
        });
      }

      // 2. Tâche en attente trop longtemps (3 jours)
      if (t.statut === "En attente" && joursDepuisDebut > 3) {
        anomalies.push({
          type: "Tâche figée",
          message: `La tâche '${t.titre}' est en attente depuis ${joursDepuisDebut} jours.`,
          tache: t,
        });
      }

      // 3. Compter pour chaque assignee les tâches "Haute" priorité en cours
      if (!assigneeMap[t.assignee]) assigneeMap[t.assignee] = 0;
      if (t.priorite === "Haute" && t.statut === "En cours") {
        assigneeMap[t.assignee]++;
      }
    }

    // 4. Vérifier surcharge : +3 tâches haute priorité en cours
    for (let assignee in assigneeMap) {
      if (assigneeMap[assignee] > 3) {
        anomalies.push({
          type: "Surcharge",
          message: `${assignee} a ${assigneeMap[assignee]} tâches de haute priorité en cours.`,
        });
      }
    }

    res.json({ anomalies });
  });
});


// API pour envoyer un message au support
app.post('/api/support/send-support-message', (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'Tous les champs sont obligatoires.' });
  }

  const sql = 'INSERT INTO support (name, email, subject, message) VALUES (?, ?, ?, ?)';
  db.query(sql, [name, email, subject, message], (err, result) => {
      if (err) {
          console.error('Erreur lors de l’enregistrement du message :', err);
          return res.status(500).json({ error: 'Erreur serveur' });
      }
      res.status(201).json({ message: 'Votre message a été envoyé avec succès.' });
  });
});

// API pour récupérer tous les messages du support
app.get('/api/support/messages', (req, res) => {
  const sql = 'SELECT * FROM support ORDER BY created_at DESC';
  db.query(sql, (err, results) => {
      if (err) {
          console.error('Erreur lors de la récupération des messages :', err);
          return res.status(500).json({ error: 'Erreur serveur' });
      }
      res.status(200).json(results);
  });
});

app.post('/api/ajouter-reunion', (req, res) => {
  const { id_project, titre, date_reunion, lieu, participants, description } = req.body;

  const query = `
    INSERT INTO reunion (id_project, titre, date_reunion, lieu, participants, description)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  const params = [id_project, titre, date_reunion, lieu, JSON.stringify(participants), description];

  db.query(query, params, (err, result) => {
    if (err) {
      console.error("Erreur lors de l'ajout de la réunion :", err);
      return res.status(500).json({ error: "Erreur serveur" });
    }
    res.status(201).json({ message: "Réunion ajoutée avec succès" });
  });
});



app.get("/api/reunions", (req, res) => {
  const participantName = req.query.participant; // ex. ?participant=koussay ayadi

  // 1. On récupère d’abord toutes les réunions avec le champ 'responsable' venant de la table project
  const query = `
    SELECT 
      r.id_reunion,
      r.id_project,
      r.titre,
      r.date_reunion,
      r.lieu,
      r.participants,
      r.description,
      r.created_at,
      p.responsable
    FROM reunion r
    JOIN project p ON r.id_project = p.id;
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Erreur lors de la récupération des réunions :", err);
      return res.status(500).json({ error: "Erreur serveur" });
    }

    // 2. On parcourt les résultats pour :
    //    • parser participants (stocké en JSON)
    //    • inclure la date_reunion au format ISO
    //    • garder aussi le champ 'responsable' pour le filtrage
    const reunions = results.map((row) => {
      let participantsArray = [];
      try {
        // On s'attend à ce que row.participants soit une chaîne JSON valide, ex.:
        // "[{\"id\":72,\"name\":\"koussay ayadi\"},{\"id\":70,\"name\":\"Moez Hajjaji\"}]"
        participantsArray = row.participants
          ? JSON.parse(row.participants)
          : [];
      } catch (parseError) {
        console.warn("Impossible de parser participants pour réunion", row.id_reunion);
      }

      return {
        id_reunion: row.id_reunion,
        id_project: row.id_project,
        titre: row.titre,
        date_reunion: row.date_reunion
          ? new Date(row.date_reunion).toISOString()
          : null,
        lieu: row.lieu,
        participants: participantsArray,   // tableau d’objets { id, name, ... }
        description: row.description,
        created_at: row.created_at,
        responsable: row.responsable,     // champ récupéré via la jointure
      };
    })
    // 3. Si un participant est demandé dans la query (participantName),
    //    on filtre : (a) s’il est dans 'participants', ou (b) s’il est le 'responsable'
    .filter((reunion) => {
      if (!participantName) return true; // pas de filtre → on renvoie toutes
      // a) Vérifier si participantName figure dans le tableau 'participants'
      const inList = reunion.participants.some(
        (p) => p.name === participantName
      );
      // b) Vérifier si participantName === responsable du projet
      const isResponsable = reunion.responsable === participantName;
      return inList || isResponsable;
    });

    // 4. On renvoie le résultat filtré
    res.json(reunions);
  });
});



// ----- Fin Partie Mobile -----

  // Route de déconnexion
app.post("/logout", (req, res) => {
    const token = req.headers["authorization"];

    if (!token) {
        return res.status(403).json({ error: "Aucun token fourni pour la déconnexion" });
    }

    // Ajouter le token à la blacklist pour l'invalider
    blacklist.push(token);

    // Détruire la session
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: "Erreur lors de la déconnexion" });
        }

        res.json({ message: "Déconnexion réussie, token invalidé et session détruite" });
    });
});



// Démarrer le serveur
const PORT = 4000;
server.listen(4000, () => console.log("API + WS sur le port 4000"));