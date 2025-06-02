# ml_service/app.py

from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import mysql.connector
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)  # Autoriser toutes les origines pour simplifier (en dev)

# Charger le modèle scikit-learn entraîné
MODEL_PATH = "project_duration_model.pkl"
with open(MODEL_PATH, "rb") as f:
    model = pickle.load(f)
    print("Modèle ML chargé depuis", MODEL_PATH)


def get_db_connection():
    """
    Ouvre une connexion MySQL et renvoie le cursor et la connexion.
    """
    conn = mysql.connector.connect(
        host="localhost",
        user="root",
        password="root",        # votre mot de passe MySQL
        database="symaflow_db"
    )
    return conn


@app.route("/api/predict-project", methods=["GET"])
def predict_project():
    """
    Expose GET /api/predict-project?project_id=<ID>
    - Récupère project_id
    - Si absent ou non valide, renvoie 400
    - Sinon, extrait les données du projet + ses tâches de la base
    - Calcule features pour le ML
    - Prédit la durée
    - Construit predicted_end_date
    - Compare à planned_end_date
    - Renvoie JSON :
        {
          "predicted_duration_days": float,
          "predicted_end_date": "YYYY-MM-DD",
          "planned_end_date":  "YYYY-MM-DD",
          "risk_status":       "retard" | "ok"
        }
    """
    # 1) Récupérer project_id depuis la query string
    project_id = request.args.get("project_id", type=int)
    if project_id is None:
        return jsonify({"error": "project_id manquant ou invalide."}), 400

    # 2) Se connecter à MySQL
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # 3) Charger la ligne "project"
    cursor.execute(
        """
        SELECT date_debut, date_fin, budget, montant_payer
        FROM project
        WHERE id = %s
        """,
        (project_id,),
    )
    projet = cursor.fetchone()
    if not projet:
        cursor.close()
        conn.close()
        return jsonify({"error": "Projet introuvable."}), 404

    # Convertir date_fin en string "YYYY-MM-DD"
    planned_end_date = projet["date_fin"].strftime("%Y-%m-%d")

    # 4) Charger les tâches associées pour calculer les features
    cursor.execute(
        """
        SELECT statut, dateDebut, dateFin
        FROM taches
        WHERE project_id = %s
        """,
        (project_id,),
    )
    rows_tasks = cursor.fetchall()

    cursor.close()
    conn.close()

    # Calculer les features
    nb_total = len(rows_tasks)
    nb_terminees = sum(1 for t in rows_tasks if t["statut"] == "Terminée")

    # Moyenne des durées prévues pour les tâches TERMINÉES
    duree_prevue_moyenne = 0.0
    if nb_terminees > 0:
        diffs = []
        for t in rows_tasks:
            if t["statut"] == "Terminée":
                d1 = t["dateDebut"]
                d2 = t["dateFin"]
                delta_days = (d2 - d1).days
                diffs.append(delta_days)
        duree_prevue_moyenne = float(sum(diffs) / len(diffs))

    # 5) Composition du vecteur X pour le modèle
    #    On construit sous la forme [ [budget, montant_payer, nb_total, nb_terminees, duree_prevue_moyenne] ]
    X = [
        [
            float(projet["budget"]),
            float(projet["montant_payer"]),
            nb_total,
            nb_terminees,
            duree_prevue_moyenne,
        ]
    ]

    # 6) Prédiction (scikit-learn LinearRegression ou autre)
    pred_days = float(model.predict(X)[0])  # ex. 12.345

    # 7) Construire predicted_end_date à partir de date_debut + pred_days
    date_debut_obj = projet["date_debut"]
    predicted_end_date_obj = date_debut_obj + timedelta(days=pred_days)
    predicted_end_date = predicted_end_date_obj.strftime("%Y-%m-%d")

    # 8) Déterminer risk_status
    risk_status = "retard" if predicted_end_date > planned_end_date else "ok"

    # 9) Retour JSON
    return jsonify({
        "predicted_duration_days": round(pred_days, 2),
        "predicted_end_date": predicted_end_date,
        "planned_end_date": planned_end_date,
        "risk_status": risk_status,
    })


if __name__ == "__main__":
    app.run(port=5000, debug=True)
