import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../components/context/ThemeProvider';
import { FiUsers, FiFolder, FiFileText, FiDollarSign, FiCheckSquare, FiArchive } from 'react-icons/fi';
import styled, { keyframes } from 'styled-components';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const StyledHome = styled.div`
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  min-height: 100vh;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 3rem;
  padding: 1rem 0;
  border-bottom: 1px solid ${props => props.theme.borderColor};

  h1 {
    font-size: 2rem;
    color: ${props => props.theme.primary};
    margin: 0;
  }
`;

const LogoutButton = styled.button`
  background: ${props => props.theme.primary};
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  animation: ${fadeIn} 0.6s ease-out;
`;

const StatCard = styled.div`
  background: ${props => props.theme.cardBg};
  padding: 1.5rem;
  border-radius: 16px;
  box-shadow: ${props => props.theme.cardShadow};
  transition: transform 0.3s ease;
  backdrop-filter: blur(10px);
  border: 1px solid ${props => props.theme.cardBorder};

  &:hover {
    transform: translateY(-5px);
    box-shadow: ${props => props.theme.cardHoverShadow};
  }
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;

  svg {
    width: 32px;
    height: 32px;
    color: ${props => props.theme.primary};
  }

  h3 {
    margin: 0;
    font-size: 1.25rem;
    color: ${props => props.theme.primary};
  }
`;

const StatValue = styled.div`
  font-size: 2.5rem;
  font-weight: 700;
  color: ${props => props.theme.textPrimary};
  margin-bottom: 1rem;
`;

const StatBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  background: ${props => props.bg};
  color: white;
  margin: 0.25rem;
  font-size: 0.9rem;
  gap: 0.5rem;
`;

const ProgressContainer = styled.div`
  margin: 1.5rem 0;
`;

const ProgressBar = styled.div`
  height: 8px;
  background: ${props => props.theme.progressBg};
  border-radius: 4px;
  overflow: hidden;
`;

const ProgressFill = styled.div`
  width: ${props => props.percentage}%;
  height: 100%;
  background: ${props => props.color};
  transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
`;

const StatLabel = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  color: ${props => props.theme.textSecondary};
`;

const Home = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

  const theme = {
    primary: isDarkMode ? '#7c3aed' : '#6d28d9',
    cardBg: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.8)',
    cardBorder: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
    cardShadow: isDarkMode ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 4px 6px rgba(0, 0, 0, 0.1)',
    cardHoverShadow: isDarkMode ? '0 8px 15px rgba(0, 0, 0, 0.4)' : '0 8px 15px rgba(0, 0, 0, 0.15)',
    textPrimary: isDarkMode ? '#fff' : '#1f2937',
    textSecondary: isDarkMode ? '#94a3b8' : '#64748b',
    progressBg: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
    borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('http://localhost:4000/api/stats');
        if (!response.ok) throw new Error('Erreur de chargement des données');
        const data = await response.json();
        setStats(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (loading) return <StyledHome theme={theme}>Chargement...</StyledHome>;
  if (error) return <StyledHome theme={theme}>Erreur : {error}</StyledHome>;

  return (
    <StyledHome theme={theme}>
      <Header theme={theme}>
        <h1>Tableau de Bord SymaFlow</h1>
        <LogoutButton theme={theme} onClick={handleLogout}>
          <FiCheckSquare /> Déconnexion
        </LogoutButton>
      </Header>

      <StatsGrid>
        {/* Carte Utilisateurs */}
        <StatCard theme={theme}>
          <CardHeader theme={theme}>
            <FiUsers />
            <h3>Utilisateurs</h3>
          </CardHeader>
          <StatValue theme={theme}>{stats.users.total}</StatValue>
          <div>
            <StatBadge bg="#3b82f6">Admins: {stats.users.admins}</StatBadge>
            <StatBadge bg="#10b981">Utilisateurs: {stats.users.users}</StatBadge>
            {Object.entries(stats.users.profiles).map(([profile, count]) => (
              <StatBadge key={profile} bg="#8b5cf6">
                {profile}: {count}
              </StatBadge>
            ))}
          </div>
        </StatCard>

        {/* Carte Projets */}
        <StatCard theme={theme}>
          <CardHeader theme={theme}>
            <FiFolder />
            <h3>Projets</h3>
          </CardHeader>
          <StatValue theme={theme}>{stats.projects.total}</StatValue>
          <ProgressContainer>
            {Object.entries(stats.projects.status).map(([status, count]) => (
              <div key={status}>
                <StatLabel theme={theme}>
                  <span>{status}</span>
                  <span>{count}</span>
                </StatLabel>
                <ProgressBar theme={theme}>
                  <ProgressFill 
                    percentage={(count / stats.projects.tasks) * 100}
                    color={
                      status === 'Terminée' ? '#10b981' :
                      status === 'En cours' ? '#3b82f6' : '#6b7280'
                    }
                  />
                </ProgressBar>
              </div>
            ))}
          </ProgressContainer>
        </StatCard>

        {/* Carte Documents */}
        <StatCard theme={theme}>
          <CardHeader theme={theme}>
            <FiFileText />
            <h3>Documents</h3>
          </CardHeader>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem' }}>
            <StatValue theme={theme}>{stats.documents.total}</StatValue>
            <StatBadge bg="#ef4444">
              <FiArchive /> Archivés: {stats.documents.archived}
            </StatBadge>
          </div>
          <div style={{ marginTop: '1rem' }}>
            {Object.entries(stats.documents.types).map(([type, count]) => (
              <StatBadge key={type} bg="#f59e0b">
                {type}: {count}
              </StatBadge>
            ))}
          </div>
        </StatCard>

        {/* Carte Factures */}
        <StatCard theme={theme}>
          <CardHeader theme={theme}>
            <FiDollarSign />
            <h3>Facturation</h3>
          </CardHeader>
          <StatValue theme={theme}>
            {stats.invoices.amount?.toLocaleString('fr-FR', { 
              style: 'currency', 
              currency: 'EUR',
              minimumFractionDigits: 2
            })}
          </StatValue>
          <ProgressContainer>
            <StatBadge bg="#10b981">Total: {stats.invoices.total}</StatBadge>
            {Object.entries(stats.invoices.types).map(([type, data]) => (
              <div key={type} style={{ marginTop: '1rem' }}>
                <StatLabel theme={theme}>
                  <span>{type}</span>
                  <span>{data.count}</span>
                </StatLabel>
                <ProgressBar theme={theme}>
                  <ProgressFill 
                    percentage={(data.count / stats.invoices.total) * 100}
                    color="#3b82f6"
                  />
                </ProgressBar>
              </div>
            ))}
          </ProgressContainer>
        </StatCard>
      </StatsGrid>
    </StyledHome>
  );
};

export default Home;