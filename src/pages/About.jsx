import React, { useEffect, useState } from "react";
import heroImg from "../assets/hero.png";
import reportImg from "../assets/report.png";
import lifecycleImg from "../assets/color.png";

function About() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setVisible(true);
    }, 200);
  }, []);

  return (
    <div style={styles.container}>
      
      {/* HERO SECTION */}
      <div style={styles.hero}>
        <img
          src={heroImg}
          alt="Smart City Monitoring"
          style={styles.heroImage}
        />

        <div style={styles.heroOverlay}>
          <h1 style={styles.title}>
            Bringing Transparency to Urban Power Management
          </h1>
          <p style={styles.subtitle}>
            A calm, intelligent monitoring system designed for modern cities.
          </p>
        </div>
      </div>

      {/* REPORTING SECTION */}
      <section
        style={{
          ...styles.section,
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0px)" : "translateY(40px)",
        }}
      >
        <img src={reportImg} alt="Worker Reporting" style={styles.image} />

        <div style={styles.textBox}>
          <h2 style={styles.sectionTitle}>Real-Time Issue Reporting</h2>
          <p style={styles.paragraph}>
            Field workers can instantly report outages using live location
            tracking and structured dashboards. This reduces communication
            delays and enables faster resolution cycles.
          </p>
        </div>
      </section>

      {/* LIFECYCLE SECTION */}
      <section
        style={{
          ...styles.section,
          flexDirection: "row-reverse",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0px)" : "translateY(40px)",
        }}
      >
        <img
          src={lifecycleImg}
          alt="Lifecycle Monitoring"
          style={styles.image}
        />

        <div style={styles.textBox}>
          <h2 style={styles.sectionTitle}>Structured Status Lifecycle</h2>
          <p style={styles.paragraph}>
            Reports move through defined stages — Active, Scheduled,
            and Resolved — ensuring transparency and accountability
            for both workers and citizens.
          </p>
        </div>
      </section>

      {/* MISSION */}
      <section style={styles.mission}>
        <h2 style={styles.sectionTitle}>Our Mission</h2>
        <p style={styles.paragraph}>
          SmartGrid bridges the communication gap between electricity
          departments and citizens by transforming outage management
          into a transparent, data-driven digital experience.
        </p>
      </section>

      {/* FOOTER */}
      <footer style={styles.footer}>
        © 2026 SmartGrid Technologies
      </footer>
    </div>
  );
}

const styles = {
  container: {
    background: "linear-gradient(135deg, #0f172a, #1e3a8a)",
    color: "white",
    fontFamily: "Segoe UI, sans-serif",
    overflowX: "hidden",
  },

  hero: {
    position: "relative",
    height: "500px",
    overflow: "hidden",
  },

  heroImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    filter: "brightness(0.6)",
  },

  heroOverlay: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    textAlign: "center",
    maxWidth: "900px",
    padding: "20px",
  },

  title: {
    fontSize: "42px",
    marginBottom: "20px",
    fontWeight: "600",
    lineHeight: "1.3",
  },

  subtitle: {
    fontSize: "18px",
    opacity: 0.9,
  },

  section: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "60px",
    padding: "100px 20px",
    maxWidth: "1200px",
    margin: "0 auto",
    flexWrap: "wrap",
    transition: "all 0.8s ease",
  },

  image: {
    width: "500px",
    maxWidth: "100%",
    borderRadius: "20px",
    boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
    transition: "transform 0.4s ease",
  },

  textBox: {
    maxWidth: "500px",
  },

  sectionTitle: {
    fontSize: "28px",
    marginBottom: "20px",
    fontWeight: "600",
  },

  paragraph: {
    fontSize: "16px",
    lineHeight: "1.8",
    opacity: 0.9,
  },

  mission: {
    textAlign: "center",
    padding: "100px 20px",
    maxWidth: "900px",
    margin: "0 auto",
  },

  footer: {
    textAlign: "center",
    padding: "40px",
    opacity: 0.6,
    fontSize: "14px",
  },
};

export default About;