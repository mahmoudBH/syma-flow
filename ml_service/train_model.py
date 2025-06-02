# ml_service/train_model.py

import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
import pickle
import os

CSV_PATH = "projets_termines.csv"
MODEL_PATH = "project_duration_model.pkl"

# 1) Charger le CSV
if not os.path.exists(CSV_PATH):
    print(f"❌ Le fichier '{CSV_PATH}' est introuvable. Veuillez exécuter l'export MySQL avant.")
    exit(1)

df = pd.read_csv(CSV_PATH)

# 2) Vérifier que le DataFrame n'est pas vide
if df.empty:
    print("❌ Le DataFrame est vide : aucune ligne dans 'projets_termines.csv'.")
    print("   -> Vérifiez que vous avez bien exporté des projets terminés avant d'entraîner le modèle.")
    exit(1)

# 3) Construire X (features) et y (target)
#    Ici, on choisit quelques prédicteurs simples :
#    - budget
#    - montant_payer
#    - nb_taches_total
#    - nb_taches_terminees
#    - duree_prevue_moyenne
#
#    Et la cible (y) = duree_reelle_projet
X = df[[
    "budget",
    "montant_payer",
    "nb_taches_total",
    "nb_taches_terminees",
    "duree_prevue_moyenne"
]]

# Cast en numérique, si nécessaire
for col in X.columns:
    X[col] = pd.to_numeric(X[col], errors="coerce").fillna(0)

y = df["duree_reelle_projet"].astype(float)

# 4) Split train/test (20% test)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# 5) Entraîner un modèle de régression linéaire
model = LinearRegression()
model.fit(X_train, y_train)

# 6) Sauvegarder le modèle avec pickle
with open(MODEL_PATH, "wb") as f:
    pickle.dump(model, f)

print(f"✅ Modèle ML entraîné et sauvegardé dans '{MODEL_PATH}'.")
