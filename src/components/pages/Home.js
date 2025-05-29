import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../components/context/ThemeProvider';
import { FiUsers, FiShield, FiFolder, FiFileText, FiFile, FiArchive, FiFileMinus, FiClock, FiSun, FiMoon } from 'react-icons/fi';
import { motion } from 'framer-motion';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useTheme();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch('http://localhost:4000/api/stats')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error('Error loading stats:', err));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className={`home-container ${isDarkMode ? 'dark' : 'light'}`}>
      {/* Theme Toggle */}
      <motion.div
        className="theme-toggle"
        onClick={toggleTheme}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        {isDarkMode ? <FiSun /> : <FiMoon />}
      </motion.div>

      <header className="header">
        <motion.h2 className="title" initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
          Bienvenue sur SymaFlow
        </motion.h2>
        <motion.button onClick={handleLogout} className="logout-btn" whileTap={{ scale: 0.95 }}>
          Se déconnecter
        </motion.button>
      </header>

      {!stats && (
        <motion.p className="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          Chargement des statistiques...
        </motion.p>
      )}

      {stats && (
        <motion.div className="grid stats-grid" initial="hidden" animate="visible" variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}>
          <Card icon={<FiUsers />} title="Utilisateurs" value={stats.users[0].count} />
          <Card icon={<FiShield />} title="Admins" value={stats.admins[0].count} />
          <Card icon={<FiFolder />} title="Projets" value={stats.projects[0].count} />
          <Card icon={<FiFileText />} title="Types de docs" value={stats.document_types[0].count} />
          <Card icon={<FiFile />} title="Docs totaux" value={stats.documents_total[0].count} />
          <Card icon={<FiArchive />} title="Docs archivés" value={stats.documents_archived[0].count} />
          <Card icon={<FiFileMinus />} title="Types de factures" value={stats.facture_types[0].count} />
          <Card icon={<FiFileText />} title="Factures totales" value={stats.factures_total[0].count} />
          <Card icon={<FiClock />} title="Tâches totales" value={stats.tasks_total[0].count} />
        </motion.div>
      )}

      {stats && (
        <section className="section">
          <motion.h3 className="section-title" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            Répartition par profil
          </motion.h3>
          <div className="profile-grid">
            {stats.profiles.map((p, i) => (
              <motion.div key={p.label} className="profile-card" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 + i * 0.1 }}>
                <p className="profile-label">{p.label}</p>
                <p className="profile-count">{p.count}</p>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {stats && (
        <section className="section">
          <motion.h3 className="section-title" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            Tâches par projet
          </motion.h3>
          {(() => {
            const grouped = {};
            stats.tasks_status.forEach(item => {
              if (!grouped[item.project]) grouped[item.project] = {};
              grouped[item.project][item.status] = item.count;
            });
            return Object.entries(grouped).map(([project, statuses], idx) => (
              <motion.div key={project} className="project-card" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 + idx * 0.1 }}>
                <h4 className="project-title">Projet {project}</h4>
                <div className="status-grid">
                  <StatusCard label="Terminées" count={statuses['Terminée'] || 0} color="green" />
                  <StatusCard label="En cours" count={statuses['En cours'] || 0} color="yellow" />
                  <StatusCard label="En attente" count={statuses['En attente'] || 0} color="blue" />
                </div>
              </motion.div>
            ));
          })()}
        </section>
      )}
    </div>
  );
};

// Card
const Card = ({ icon, title, value }) => (
  <motion.div className="stat-card" whileHover={{ y: -5 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
    <div className="stat-icon">{icon}</div>
    <div>
      <p className="stat-title">{title}</p>
      <p className="stat-value">{value}</p>
    </div>
  </motion.div>
);

// StatusCard
const StatusCard = ({ label, count, color }) => (
  <motion.div className={`status-card ${color}`} whileHover={{ scale: 1.05 }}>
    <p className="status-label">{label}</p>
    <p className="status-value">{count}</p>
  </motion.div>
);

export default Home;