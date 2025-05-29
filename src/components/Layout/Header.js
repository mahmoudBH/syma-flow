// Header.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaBell, FaMoon, FaSun, FaUserCircle, FaSignOutAlt, FaSearch } from "react-icons/fa";
import { motion } from 'framer-motion';
import { useTheme } from "../../components/context/ThemeProvider";

const Header = () => {
  const navigate = useNavigate();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [search, setSearch] = useState("");
  const [focused, setFocused] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <header style={{...styles.container, ...(isDarkMode ? styles.dark : styles.light)}}>
      <motion.div
        style={styles.bubble1}
        animate={{ x: [0, 20, 0], y: [0, -20, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        style={styles.bubble2}
        animate={{ x: [0, -30, 0], y: [0, 30, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />

      <div style={styles.searchWrapper}>
        <motion.div
          style={{...styles.searchContainer, ...(focused ? styles.searchFocused : {})}}
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <FaSearch style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Rechercher..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={styles.searchInput}
          />
        </motion.div>
      </div>

      <div style={styles.iconsWrapper}>
        <motion.div whileTap={{ scale: 0.9 }} style={styles.iconBtn} onClick={() => navigate('/notifications')}>
          <FaBell />
        </motion.div>
        <motion.div whileTap={{ scale: 0.9 }} style={styles.iconBtn} onClick={toggleDarkMode}>
          {isDarkMode ? <FaSun /> : <FaMoon />}
        </motion.div>
        <motion.div whileTap={{ scale: 0.9 }} style={styles.iconBtn} onClick={() => navigate('/profile')}>
          <FaUserCircle />
        </motion.div>
        <motion.div whileTap={{ scale: 0.9 }} style={styles.iconBtn} onClick={handleLogout}>
          <FaSignOutAlt />
        </motion.div>
      </div>
    </header>
  );
};

// CSS-in-JS styles
const styles = {
  container: {
    position: 'relative',
    padding: '1rem 2rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 8px 12px rgba(0,0,0,0.1)',
    overflow: 'hidden',
    transition: 'background 0.5s, color 0.5s',
    zIndex: 5
  },
  light: {
    background: 'rgba(255, 255, 255, 0.3)', // Blanc transparent pour effet glass
    color: '#1e293b',
    boxShadow: '0 8px 12px rgba(0,0,0,0.1)'
  },
  dark: {
    background: 'rgba(31,41,55,0.8)',
    color: '#f1f5f9',
    boxShadow: '0 8px 12px rgba(0,0,0,0.5)'
  },
  
  bubble2: {
    position: 'absolute',
    borderRadius: '50%',
    opacity: 0.2,
    background: '#6366f1',
    width: 100,
    height: 100,
    bottom: -30,
    left: -30
  },
  searchWrapper: { flex: 1, display: 'flex', justifyContent: 'center' },
  searchContainer: {
    display: 'flex',
    alignItems: 'center',
    padding: '0.5rem 1rem',
    borderRadius: 999,
    background: 'rgba(255,255,255,0.8)',
    border: '2px solid transparent',
    transition: 'border 0.3s, boxShadow 0.3s'
  },
  searchFocused: {
    borderColor: '#6366f1',
    boxShadow: '0 0 10px #6366f1'
  },
  searchIcon: { fontSize: '1.25rem', marginRight: '0.5rem', color: '#6366f1' },
  searchInput: {
    border: 'none',
    outline: 'none',
    background: 'transparent',
    color: 'inherit',
    fontSize: '1rem',
    width: '200px',
    transition: 'width 0.3s'
  },
  iconsWrapper: { display: 'flex', alignItems: 'center' },
  iconBtn: { marginLeft: '1rem', fontSize: '1.25rem', color: 'inherit', cursor: 'pointer', transition: 'transform 0.2s' }
};

export default Header;
