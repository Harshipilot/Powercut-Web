import { useNavigate } from "react-router-dom";

function RoleSelection() {
  const navigate = useNavigate();

  const stats = [
    { label: "Active Outages", value: "128" },
    { label: "Response Time", value: "11 min" },
    { label: "Cities Covered", value: "24" },
  ];

  return (
    <div style={styles.page}>
      <div style={styles.backgroundGlow} />

      <div style={styles.mainWrapper}>
        <nav style={styles.navbar}>
          <div style={styles.logoWrap}>
            <div style={styles.logoMark}>⚡</div>
            <div style={styles.logoText}>SmartGrid</div>
          </div>

          <div style={styles.navLinks}>
            <span style={styles.link} onClick={() => navigate("/about")}>About</span>
            <span style={styles.link}>Insights</span>
            <span style={styles.link}>Support</span>
          </div>
        </nav>

        <div style={styles.hero}>
          <div style={styles.heroText}>
            <div style={styles.badge}>Live city resilience platform</div>
            <h1 style={styles.title}>Power Cut Reporting System</h1>
            <p style={styles.subtitle}>
              Real-time monitoring and transparent communication for modern cities,
              keeping citizens informed and teams ready to respond.
            </p>

            <div style={styles.ctaRow}>
              <button style={styles.primaryButton} onClick={() => navigate("/worker-login")}>
                Worker Portal
              </button>
              <button style={styles.secondaryButton} onClick={() => navigate("/public-dashboard")}>
                Public Dashboard
              </button>
            </div>

            <div style={styles.statsRow}>
              {stats.map((stat) => (
                <div key={stat.label} style={styles.statCard}>
                  <div style={styles.statValue}>{stat.value}</div>
                  <div style={styles.statLabel}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={styles.cardGrid}>
            <div style={styles.featureCard} onClick={() => navigate("/worker-login")}>
              <div style={styles.featureIcon}>👷</div>
              <h2 style={styles.featureTitle}>Worker Portal</h2>
              <p style={styles.featureText}>Secure outage reporting for field teams and control rooms.</p>
            </div>

            <div style={styles.featureCard} onClick={() => navigate("/public-dashboard")}>
              <div style={styles.featureIcon}>🌍</div>
              <h2 style={styles.featureTitle}>Public Dashboard</h2>
              <p style={styles.featureText}>See live power cut alerts and area-level outage trends instantly.</p>
            </div>
          </div>
        </div>
      </div>

      <footer style={styles.footer}>
        <div style={styles.footerSection}>
          <div style={styles.footerBrand}>SmartGrid Power System</div>
          <p style={styles.footerText}>Improving transparency through real-time reporting.</p>
        </div>

        <div style={styles.footerSection}>
          <p style={styles.footerText}><strong>Helpline:</strong> 1912</p>
          <p style={styles.footerText}><strong>Email:</strong> support@smartgrid.in</p>
        </div>

        <div style={styles.footerSection}>
          <p style={styles.footerText}>© 2026 SmartGrid Technologies</p>
          <p style={styles.footerText}>Version 1.0</p>
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
    color: "#e2e8f0",
    position: "relative",
    overflow: "hidden",
    background:
      "radial-gradient(circle at top, rgba(14, 165, 233, 0.28), transparent 30%), linear-gradient(135deg, #020817 0%, #0f172a 35%, #111827 100%)",
  },

  backgroundGlow: {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(120deg, rgba(37, 99, 235, 0.25), rgba(14, 165, 233, 0.1), rgba(168, 85, 247, 0.18))",
    filter: "blur(50px)",
    zIndex: 0,
  },

  mainWrapper: {
    position: "relative",
    zIndex: 1,
    flex: 1,
    display: "flex",
    flexDirection: "column",
    backdropFilter: "blur(10px)",
  },

  navbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "22px 64px",
    borderBottom: "1px solid rgba(148, 163, 184, 0.18)",
    background: "rgba(15, 23, 42, 0.35)",
  },

  logoWrap: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    fontWeight: 800,
    letterSpacing: "0.06em",
  },

  logoMark: {
    width: "42px",
    height: "42px",
    display: "grid",
    placeItems: "center",
    borderRadius: "14px",
    background: "linear-gradient(135deg, #22d3ee, #2563eb)",
    boxShadow: "0 12px 30px rgba(34, 211, 238, 0.45)",
    fontSize: "22px",
  },

  logoText: {
    fontSize: "1.15rem",
    color: "#f8fafc",
  },

  navLinks: {
    display: "flex",
    gap: "30px",
    alignItems: "center",
    color: "#cbd5e1",
    fontSize: "0.96rem",
  },

  link: {
    cursor: "pointer",
    opacity: 0.8,
    transition: "opacity 0.2s ease",
    fontWeight: 500,
  },

  hero: {
    flex: 1,
    display: "grid",
    gridTemplateColumns: "1.2fr 0.8fr",
    gap: "40px",
    alignItems: "center",
    padding: "72px 64px 48px",
    maxWidth: "1440px",
    width: "100%",
    margin: "0 auto",
  },

  heroText: {
    textAlign: "left",
    maxWidth: "700px",
  },

  badge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "8px 16px",
    borderRadius: "999px",
    background: "rgba(14, 165, 233, 0.12)",
    border: "1px solid rgba(125, 211, 252, 0.35)",
    color: "#bae6fd",
    fontWeight: 700,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    fontSize: "0.72rem",
  },

  title: {
    fontSize: "clamp(2.8rem, 5vw, 5rem)",
    lineHeight: "1.04",
    letterSpacing: "-0.06em",
    margin: "18px 0 18px",
    fontWeight: 900,
    color: "#f8fafc",
  },

  subtitle: {
    fontSize: "1.12rem",
    opacity: 0.85,
    maxWidth: "620px",
    lineHeight: "1.8",
    margin: "0 0 28px",
    color: "#cbd5e1",
  },

  ctaRow: {
    display: "flex",
    gap: "18px",
    flexWrap: "wrap",
    marginBottom: "30px",
  },

  primaryButton: {
    border: "none",
    background: "linear-gradient(135deg, #38bdf8 0%, #2563eb 100%)",
    color: "white",
    fontWeight: 800,
    letterSpacing: "0.01em",
    padding: "16px 26px",
    borderRadius: "16px",
    cursor: "pointer",
    boxShadow: "0 18px 40px rgba(37, 99, 235, 0.5)",
  },

  secondaryButton: {
    border: "1px solid rgba(148, 163, 184, 0.3)",
    background: "rgba(15, 23, 42, 0.32)",
    color: "#e2e8f0",
    fontWeight: 700,
    letterSpacing: "0.01em",
    padding: "16px 26px",
    borderRadius: "16px",
    cursor: "pointer",
    backdropFilter: "blur(10px)",
  },

  statsRow: {
    display: "flex",
    gap: "20px",
    flexWrap: "wrap",
    marginTop: "8px",
  },

  statCard: {
    minWidth: "150px",
    padding: "16px 18px",
    borderRadius: "18px",
    background: "rgba(15, 23, 42, 0.48)",
    border: "1px solid rgba(148, 163, 184, 0.18)",
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.28)",
    backdropFilter: "blur(8px)",
  },

  statValue: {
    fontSize: "1.6rem",
    fontWeight: 800,
    color: "#f8fafc",
    marginBottom: "4px",
  },

  statLabel: {
    color: "#94a3b8",
    fontSize: "0.82rem",
  },

  cardGrid: {
    display: "grid",
    gap: "22px",
  },

  featureCard: {
    background: "linear-gradient(180deg, rgba(15, 23, 42, 0.82), rgba(15, 23, 42, 0.62))",
    border: "1px solid rgba(148, 163, 184, 0.2)",
    borderRadius: "26px",
    padding: "28px 24px",
    minHeight: "220px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    boxShadow: "0 18px 35px rgba(15, 23, 42, 0.35)",
    cursor: "pointer",
    transition: "transform 0.25s ease, border-color 0.25s ease",
  },

  featureIcon: {
    width: "54px",
    height: "54px",
    borderRadius: "16px",
    display: "grid",
    placeItems: "center",
    fontSize: "1.8rem",
    background: "linear-gradient(135deg, rgba(56, 189, 248, 0.18), rgba(147, 51, 234, 0.18))",
    border: "1px solid rgba(125, 211, 252, 0.35)",
    marginBottom: "18px",
  },

  featureTitle: {
    margin: "0 0 12px",
    fontSize: "1.8rem",
    color: "#f8fafc",
  },

  featureText: {
    margin: 0,
    color: "#cbd5e1",
    lineHeight: "1.8",
    fontSize: "1rem",
  },

  footer: {
    position: "relative",
    zIndex: 1,
    display: "flex",
    justifyContent: "space-between",
    gap: "28px",
    flexWrap: "wrap",
    padding: "30px 64px 40px",
    background: "rgba(2, 8, 23, 0.72)",
    borderTop: "1px solid rgba(148, 163, 184, 0.12)",
  },

  footerSection: {
    maxWidth: "320px",
  },

  footerBrand: {
    marginBottom: "10px",
    fontWeight: 800,
    color: "#f8fafc",
  },

  footerText: {
    margin: "6px 0",
    color: "#cbd5e1",
    lineHeight: "1.7",
    opacity: 0.85,
  },
};

export default RoleSelection;