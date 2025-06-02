# -*- coding: utf-8 -*-
"""
ml_service/predict_service.py

Microservice FastAPI pour charger le modèle .pkl et exposer un endpoint /predict-duration.
"""

from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import uvicorn

# 1) Charger le modèle entraîné
model = joblib.load("ml_service/project_duration_predictor.pkl")

# 2) Créer l’application FastAPI
app = FastAPI(title="Project Duration Predictor")

# 3) Définir le schéma Pydantic des features attendues
class ProjectFeatures(BaseModel):
    nb_taches_total: int
    nb_taches_terminees: int
    duree_prevue_moyenne: float
    duree_reelle_moyenne: float
    budget: float
    montant_payer: float

@app.post("/predict-duration")
def predict_duration(features: ProjectFeatures):
    """
    Expose le modèle ML : reçoit un JSON avec exactement les champs suivants :
      - nb_taches_total (int)
      - nb_taches_terminees (int)
      - duree_prevue_moyenne (float)
      - duree_reelle_moyenne (float)
      - budget (float)
      - montant_payer (float)
    Retourne la prédiction de durée du projet (jours).
    """
    X = [[
        features.nb_taches_total,
        features.nb_taches_terminees,
        features.duree_prevue_moyenne,
        features.duree_reelle_moyenne,
        features.budget,
        features.montant_payer
    ]]
    prediction = model.predict(X)[0]
    return {"predicted_duration_days": round(float(prediction), 2)}

# 4) Pour lancer directement via python (optionnel)
if __name__ == "__main__":
    uvicorn.run("predict_service:app", host="0.0.0.0", port=5000, reload=True)
