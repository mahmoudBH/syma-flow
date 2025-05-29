// SideList.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FaBars,
  FaTimes,
  FaTachometerAlt,
  FaTasks,
  FaUsers,
  FaChartBar,
  FaEnvelope,
  FaChevronDown,
  FaChevronUp,
  FaUserPlus,
  FaUserEdit,
  FaUserCog,
  FaArchive,
  FaFileInvoiceDollar,
  FaFileInvoice
} from 'react-icons/fa';
import { FaFolderTree } from 'react-icons/fa6';
import { AiFillFolderAdd } from 'react-icons/ai';
import { IoMdDocument } from 'react-icons/io';
import { MdAddTask, MdEditDocument } from 'react-icons/md';
import { HiDocumentAdd } from 'react-icons/hi';
import { PiInvoiceBold } from 'react-icons/pi';
import { motion } from 'framer-motion';
import { useTheme } from '../../components/context/ThemeProvider';

const SideList = ({ setIsSidebarOpen }) => {
  const { isDarkMode } = useTheme();
  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [openSubMenu, setOpenSubMenu] = useState(null);
  const [filteredSidebarData, setFilteredSidebarData] = useState([]);

  // Ouvre/ferme le sidebar
  const toggleSidebar = () => {
    setIsOpen(prev => !prev);
    setIsSidebarOpen?.(prev => !prev);
  };

  // Ouvre/ferme un sous-menu
  const toggleSubMenu = idx =>
    setOpenSubMenu(prev => (prev === idx ? null : idx));

  // Réagit au resize pour responsivité
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setIsOpen(!mobile);
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Filtrage en fonction de la catégorie (méthode à adapter selon besoin)
  useEffect(() => {
    const category = localStorage.getItem('category') || '';
    let data = sidebarData;
    if (category === 'super admin') {
      // accès complet
    } else if (category === 'Admin') {
      data = data.filter(item =>
        ['Project', 'document management', 'Fracture', 'Rapports'].includes(
          item.label
        )
      );
    } else if (category === 'Utilisateur') {
      data = data.filter(item =>
        ['Dashboard', 'Project', 'document management', 'Fracture'].includes(
          item.label
        )
      );
    } else {
      data = [];
    }
    // filtrage des sous-menus — inchangé
    data = data.map(item => {
      if (!item.subItems) return item;
      const allowed = item.subItems.filter(sub => {
        if (category === 'super admin') return true;
        if (category === 'Admin') {
          return [
            'Add Project',
            'Project',
            'Add Task',
            'Task List',
            'Task Flow',
            'Add Document',
            'Project Document',
            'Archive',
            'Add Fracture',
            'Rapports',
            'Signature',
            'Gantt Chart'
          ].includes(sub.label);
        }
        if (category === 'Utilisateur') {
          return ['Add Document','Project Document', 'Archive', 'Add Fracture', 'Signature','Project','Task List','Gantt Chart','Task Flow'].includes(
            sub.label
          );
        }
        return false;
      });
      return { ...item, subItems: allowed };
    });
    setFilteredSidebarData(data);
  }, []);

  return (
    <aside
      style={{
        ...styles.container,
        ...(isDarkMode ? styles.dark : styles.light),
        width: isOpen ? 250 : 80
      }}
    >
      {/* Bulles animées */}
      <motion.div
        style={styles.bubble1}
        animate={{ x: [0, 20, 0], y: [0, -20, 0] }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      <motion.div
        style={styles.bubble2}
        animate={{ x: [0, -30, 0], y: [0, 30, 0] }}
        transition={{ duration: 12, repeat: Infinity }}
      />

      {/* Toggle */}
      <div style={styles.toggle} onClick={toggleSidebar}>
        <motion.div whileTap={{ scale: 0.9 }}>
          {isOpen ? <FaTimes /> : <FaBars />}
        </motion.div>
      </div>

      {/* Liste */}
      <ul style={styles.list}>
        {filteredSidebarData.map((item, idx) => (
          <React.Fragment key={idx}>
            <li
              style={{
                ...styles.item,
                ...(isDarkMode ? styles.itemDark : {}),
                ...(openSubMenu === idx ? styles.itemOpen : {})
              }}
              onClick={() => item.subItems && toggleSubMenu(idx)}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateX(5px)';
                e.currentTarget.style.background = 'rgba(99,102,241,0.2)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateX(0)';
                e.currentTarget.style.background =
                  openSubMenu === idx
                    ? 'rgba(99,102,241,0.1)'
                    : isDarkMode
                    ? 'rgba(255,255,255,0.1)'
                    : 'transparent';
              }}
            >
              <Link to={item.path || '#'} style={styles.link}>
                <div style={styles.icon}>
                  <item.icon />
                </div>
                {isOpen && <span style={styles.text}>{item.label}</span>}
                {item.subItems && isOpen && (
                  <div style={styles.chevron}>
                    {openSubMenu === idx ? <FaChevronUp /> : <FaChevronDown />}
                  </div>
                )}
              </Link>
            </li>

            {/* Sous-menu */}
            {item.subItems &&
              openSubMenu === idx &&
              isOpen &&
              item.subItems.length > 0 && (
                <ul style={styles.subList}>
                  {item.subItems.map((sub, j) => (
                    <li
                      key={j}
                      style={{
                        ...styles.subItem,
                        ...(isDarkMode ? styles.subItemDark : {})
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.transform = 'translateX(5px)';
                        e.currentTarget.style.background = 'rgba(99,102,241,0.2)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.transform = 'translateX(0)';
                        e.currentTarget.style.background = isDarkMode
                          ? 'rgba(255,255,255,0.05)'
                          : 'transparent';
                      }}
                    >
                      <Link to={sub.path} style={styles.link}>
                        <div style={styles.icon}>
                          <sub.icon />
                        </div>
                        <span style={styles.text}>{sub.label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
          </React.Fragment>
        ))}
      </ul>
    </aside>
  );
};

// Données du menu
const sidebarData = [
  { label: 'Dashboard', icon: FaTachometerAlt, path: '/home' },
  {
    label: 'users',
    icon: FaUsers,
    subItems: [
      { label: 'Add Users', icon: FaUserPlus, path: '/users/add' },
      { label: 'Manage Users', icon: FaUserEdit, path: '/users/manage' },
      { label: 'Users Settings', icon: FaUserCog, path: '/users/settings' }
    ]
  },
  {
    label: 'Project',
    icon: FaFolderTree,
    subItems: [
      { label: 'Add Project', icon: AiFillFolderAdd, path: '/project/add' },
      { label: 'Project', icon: FaFolderTree, path: '/project' },
      { label: 'Add Task', icon: MdAddTask, path: '/task/add' },
      { label: 'Task List', icon: FaTasks, path: '/task' },
      { label: 'Task Flow', icon: FaTasks, path: '/Taskflow' },
      { label: 'Gantt Chart', icon: FaChartBar, path: '/project/gantt' }
    ]
  },
  {
    label: 'document management',
    icon: IoMdDocument,
    subItems: [
      { label: 'Add Document', icon: HiDocumentAdd, path: '/document/add' },
      { label: 'Project Document', icon: HiDocumentAdd, path: '/document/project' },
      { label: 'Archive', icon: FaArchive, path: '/archive' },
      { label: 'Documents Settings', icon: MdEditDocument, path: '/documents/settings' }
    ]
  },
  {
    label: 'Fracture',
    icon: PiInvoiceBold,
    subItems: [
      { label: 'Add Fracture', icon: FaFileInvoiceDollar, path: '/fracture/add' },
      { label: 'Fracture Settings', icon: FaFileInvoice, path: '/fracture/settings' },
      { label: 'Model Fracture', icon: FaFileInvoice, path: '/fracture/view-pdf' },
      { label: 'Signature', icon: FaFileInvoice, path: '/fracture/signature' }
    ]
  },
  { label: 'Rapports', icon: FaChartBar, path: '/rapports' },
  { label: 'Support', icon: FaEnvelope, path: '/support' }
];

// Styles CSS-in-JS
const styles = {
  container: {
    position: 'fixed',
    top: 0,
    left: 0,
    height: '100vh',
    padding: 20,
    overflow: 'hidden',
    backdropFilter: 'blur(12px)',
    boxShadow: '3px 0 10px rgba(0,0,0,0.1)',
    transition: 'width 0.4s ease',
    zIndex: 100
  },
  light: {
    background: 'rgba(255,255,255,0.3)',
    color: '#1e293b'
  },
  dark: {
    background: 'rgba(31,41,55,0.8)',
    color: '#f1f5f9'
  },
  bubble1: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: '50%',
    background: '#6366f1',
    opacity: 0.2,
    bottom: -50,
    right: -50
  },
  bubble2: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: '50%',
    background: '#ec4899',
    opacity: 0.2,
    bottom: 50,
    left: -30
  },
  toggle: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: 20
  },
  list: {
    listStyle: 'none',
    padding: 0
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    transition: 'all 0.2s'
  },
  itemDark: {
    background: 'rgba(255,255,255,0.1)'
  },
  itemOpen: {
    background: 'rgba(99,102,241,0.1)'
  },
  icon: {
    minWidth: 40,
    display: 'flex',
    justifyContent: 'center',
    fontSize: 20
  },
  text: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: 500,
    transition: 'opacity 0.3s'
  },
  chevron: {
    marginLeft: 'auto',
    fontSize: 14
  },
  subList: {
    listStyle: 'none',
    padding: '0 0 0 20px',
    margin: 0
  },
  subItem: {
    display: 'flex',
    alignItems: 'center',
    padding: 10,
    borderRadius: 6,
    transition: 'all 0.2s'
  },
  subItemDark: {
    background: 'rgba(255,255,255,0.05)'
  },
  link: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    textDecoration: 'none',
    color: 'inherit'
  }
};

export default SideList;
