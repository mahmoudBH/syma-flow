# train_model.py

import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error
import joblib

# Charger les données historiques (extraites depuis MySQL → CSV)
df = pd.read_csv("projets_termines.csv")

# Features et target
X = df[[
    'nb_taches_total',
    'nb_taches_terminees',
    'duree_prevue_moyenne',
    'duree_reelle_moyenne',
    'budget',
    'montant_payer'
]]

y = df['duree_reelle_projet']  # en jours

# Séparer les données pour test
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Entraîner le modèle
model = RandomForestRegressor(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# Évaluer
y_pred = model.predict(X_test)
mae = mean_absolute_error(y_test, y_pred)
print(f"Erreur moyenne absolue : {mae:.2f} jours")

# Sauvegarder le modèle
joblib.dump(model, "project_duration_predictor.pkl")
