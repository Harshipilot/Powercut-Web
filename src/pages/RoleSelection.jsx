import { useNavigate } from "react-router-dom";

function RoleSelection() {
  const navigate = useNavigate();

  return (
    <div style={styles.page}>
      {/* Background Layer */}
      <div style={styles.background}></div>

      {/* Main Content Wrapper */}
      <div style={styles.mainWrapper}>
        {/* Navbar */}
        <nav style={styles.navbar}>
          <div style={styles.logo}>⚡ SmartGrid</div>
          <div style={styles.navLinks}>
            <span
    style={styles.link}
    onClick={() => navigate("/about")}
  >
    About
  </span>
            <span style={styles.link}>Contact</span>
          </div>
        </nav>

        {/* Hero Section */}
        <div style={styles.hero}>
          <h1 style={styles.title}>Power Cut Reporting System</h1>

          <p style={styles.subtitle}>
            Real-Time Monitoring & Transparent Communication for Smart Cities
          </p>

          {/* Cards */}
          <div style={styles.cardContainer}>
            <div
              style={styles.card}
              onClick={() => navigate("/worker-login")}
            >
              <h2>👷 Worker Portal</h2>
              <p>Secure access for electricity department staff</p>
            </div>

            <div
              style={styles.card}
              onClick={() => navigate("/public-dashboard")}
            >
              <h2>🌍 Public Dashboard</h2>
              <p>View live power cut updates in your area</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={styles.footerSection}>
          <h3>SmartGrid Power System</h3>
          <p>Improving transparency through real-time reporting</p>
        </div>

        <div style={styles.footerSection}>
          <p><strong>Helpline:</strong> 1912</p>
          <p><strong>Email:</strong> support@smartgrid.in</p>
        </div>

        <div style={styles.footerSection}>
          <p>© 2026 SmartGrid Technologies</p>
          <p>Version 1.0</p>
        </div>
      </footer>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    fontFamily: "Segoe UI, sans-serif",
    color: "white",
    position: "relative",
    overflow: "hidden",
  },

  background: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundImage:
      "url('https://images.unsplash.com/photo-1509395176047-4a66953fd231')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    zIndex: -2,
  },

  mainWrapper: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    background:
      "linear-gradient(135deg, rgba(15,23,42,0.9), rgba(37,99,235,0.7))",
    backdropFilter: "blur(6px)",
  },

  navbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 50px",
  },

  logo: {
    fontSize: "22px",
    fontWeight: "bold",
    letterSpacing: "1px",
  },

  navLinks: {
    display: "flex",
    gap: "25px",
  },

  link: {
    cursor: "pointer",
    opacity: 0.8,
  },

  hero: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    padding: "20px",
  },

  title: {
    fontSize: "52px",
    fontWeight: "bold",
    marginBottom: "20px",
  },

  subtitle: {
    fontSize: "18px",
    opacity: 0.9,
    marginBottom: "60px",
    maxWidth: "600px",
  },

  cardContainer: {
    display: "flex",
    gap: "40px",
    flexWrap: "wrap",
    justifyContent: "center",
  },

  card: {
    background: "rgba(255,255,255,0.08)",
    backdropFilter: "blur(15px)",
    padding: "40px",
    borderRadius: "20px",
    width: "280px",
    cursor: "pointer",
    transition: "0.3s ease",
    boxShadow: "0 15px 35px rgba(0,0,0,0.4)",
  },

  footer: {
    background: "rgba(0,0,0,0.8)",
    padding: "30px 50px",
    display: "flex",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "20px",
  },

  footerSection: {
    maxWidth: "300px",
  },
};

export default RoleSelection; 