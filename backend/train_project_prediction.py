import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, r2_score
import joblib

# 1. Charger les données
df = pd.read_csv('data/projets_termine_data.csv')

# 2. Préparer X (features) et y (target)
# Supposons que la colonne 'duree_reelle_projet' est ce qu'on cherche à prédire.
y = df['duree_reelle_projet']
X = df.drop(columns=['project_id', 'duree_reelle_projet'])

# 3. Fractionner en jeu entraînement / test
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# 4. Choisir un modèle (p. ex. RandomForest)
model = RandomForestRegressor(
    n_estimators=100,
    max_depth=10,
    random_state=42
)

# 5. Entraîner
model.fit(X_train, y_train)

# 6. Évaluer
y_pred = model.predict(X_test)
mae = mean_absolute_error(y_test, y_pred)
r2  = r2_score(y_test, y_pred)
print(f'MAE: {mae:.2f} jours, R²: {r2:.2f}')

# 7. Sauvegarder le modèle entraîné
joblib.dump(model, 'models/project_duration_predictor.pkl')
