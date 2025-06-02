# export_projets_termines.py

import mysql.connector
import pandas as pd
import sys

def main():
    # 1) Paramètres de connexion à MySQL
    config = {
        "host":     "localhost",
        "user":     "root",
        "password": "root",
        "database": "symaflow_db"
    }

    try:
        conn = mysql.connector.connect(**config)
    except mysql.connector.Error as err:
        print(f"❌ Erreur de connexion MySQL : {err}")
        sys.exit(1)

    # 2) Requête SQL pour ne sélectionner que les projets terminés
    query = """
        SELECT
      p.id AS project_id,
      p.nom AS project_name,
      p.budget,
      p.montant_payer,
      COUNT(t.id) AS nb_taches_total,
      SUM(CASE WHEN t.statut = 'Terminée' THEN 1 ELSE 0 END) AS nb_taches_terminees,
      AVG(DATEDIFF(t.dateFin, t.dateDebut)) AS duree_prevue_moyenne,
      DATEDIFF(p.date_fin, p.date_debut) AS duree_reelle_projet
    FROM project p
    JOIN taches t ON t.project_id = p.id
    WHERE p.statut = 'Terminée'
    GROUP BY p.id
    """

    try:
        # 3) Charger le résultat SQL dans un DataFrame pandas
        df = pd.read_sql(query, conn)
    except Exception as e:
        print(f"❌ Erreur lors de l’exécution de la requête : {e}")
        conn.close()
        sys.exit(1)

    conn.close()

    # 4) Vérifier que le DataFrame n'est pas vide
    if df.empty:
        print("⚠️ Aucune ligne retournée : aucun projet n'est marqué 'Terminée'.")
        print("   → Vérifiez bien le statut dans la table 'project' ou les jointures sur 'taches'.")
        sys.exit(1)

    # 5) Écrire dans un fichier CSV
    csv_path = "projets_termines.csv"
    try:
        df.to_csv(csv_path, index=False)
        print(f"✅ CSV généré avec succès dans : {csv_path} ({len(df)} ligne(s))")
    except Exception as e:
        print(f"❌ Impossible d’écrire le CSV : {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
