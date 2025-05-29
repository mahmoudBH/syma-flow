import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { useTheme } from "../../components/context/ThemeProvider"; // Importation du hook

const Layout = () => {  
  const { isDarkMode, toggleDarkMode } = useTheme(); // Récupération du mode sombre
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className={isDarkMode ? "dark-mode" : ""}>  
      <Header isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />  
      <div style={styles.layout}>
        <Sidebar isDarkMode={isDarkMode} setIsSidebarOpen={setIsSidebarOpen} />  
        <main style={{ ...styles.mainContent, marginLeft: isSidebarOpen ? "250px" : "80px" }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

const styles = {
  layout: {
    display: "flex",
    marginTop: "60px",
  },
  mainContent: {
    padding: "20px",
    flex: 1,
    transition: "margin-left 0.3s",
  },
};

export default Layout;
