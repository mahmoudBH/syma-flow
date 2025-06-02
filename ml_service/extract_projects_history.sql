mysql -h localhost -u root -proot symaflow_db \
  --batch --raw --silent \
  --execute="
    SELECT
      p.id                   AS project_id,
      p.nom                  AS project_name,
      p.budget,
      p.montant_payer,
      COUNT(t.id)            AS nb_taches_total,
      SUM(CASE WHEN t.statut = 'Terminée' THEN 1 ELSE 0 END) AS nb_taches_terminees,
      AVG(DATEDIFF(t.dateFin, t.dateDebut)) AS duree_prevue_moyenne,
      AVG(DATEDIFF(t.dateFin, t.dateDebut)) AS duree_reelle_moyenne,
      DATEDIFF(p.date_fin, p.date_debut) AS duree_reelle_projet
    FROM project p
    JOIN taches t ON t.project_id = p.id
    WHERE p.statut = 'Terminée'
    GROUP BY p.id;
  " > ml_service/projets_termines.csv
