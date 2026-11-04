import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

function WorkerLogin() {
  const navigate = useNavigate();
  const auth = getAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/worker-dashboard");
    } catch (err) {
      setError("Invalid Email or Password");
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.glow} />

      <div style={styles.panel}>
        <div style={styles.leftPanel}>
          <div style={styles.brandWrap}>
            <div style={styles.logoBadge}>⚡</div>
            <span style={styles.brandName}>SmartGrid</span>
          </div>

          <div style={styles.contentWrap}>
            <div style={styles.kicker}>Operations access</div>
            <h1 style={styles.title}>Secure Worker Login</h1>
            <p style={styles.subtitle}>
              Sign in to monitor outages, update field reports, and coordinate city response.
            </p>
          </div>
        </div>

        <div style={styles.formPanel}>
          <div style={styles.headerRow}>
            <h2 style={styles.formTitle}>Welcome back</h2>
            <button style={styles.backButton} onClick={() => navigate("/")}>
              ← Home
            </button>
          </div>

          <form onSubmit={handleLogin} style={styles.form}>
            <label style={styles.label}>
              Email address
              <input
                type="email"
                placeholder="name@smartgrid.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
                required
              />
            </label>

            <label style={styles.label}>
              Password
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
                required
              />
            </label>

            {error && <p style={styles.error}>{error}</p>}

            <button type="submit" style={styles.button}>
              Login to dashboard
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "32px",
    background:
      "radial-gradient(circle at top left, rgba(34, 211, 238, 0.2), transparent 25%), radial-gradient(circle at bottom right, rgba(167, 139, 250, 0.2), transparent 24%), linear-gradient(135deg, #020817, #0f172a 58%, #111827)",
    position: "relative",
    overflow: "hidden",
  },

  glow: {
    position: "absolute",
    width: "480px",
    height: "480px",
    borderRadius: "50%",
    background: "rgba(59, 130, 246, 0.18)",
    filter: "blur(70px)",
    top: "18%",
    left: "12%",
  },

  panel: {
    position: "relative",
    zIndex: 1,
    width: "100%",
    maxWidth: "1100px",
    minHeight: "640px",
    display: "grid",
    gridTemplateColumns: "1fr 0.95fr",
    borderRadius: "30px",
    overflow: "hidden",
    border: "1px solid rgba(148, 163, 184, 0.16)",
    boxShadow: "0 30px 70px rgba(2, 6, 23, 0.7)",
    backdropFilter: "blur(12px)",
  },

  leftPanel: {
    background: "linear-gradient(160deg, rgba(8, 47, 73, 0.9), rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.9))",
    padding: "36px 36px 30px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },

  brandWrap: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    color: "#f8fafc",
    fontWeight: 800,
    letterSpacing: "0.04em",
  },

  logoBadge: {
    width: "42px",
    height: "42px",
    display: "grid",
    placeItems: "center",
    borderRadius: "14px",
    background: "linear-gradient(135deg, #22d3ee, #2563eb)",
    boxShadow: "0 12px 30px rgba(34, 211, 238, 0.45)",
    fontSize: "22px",
  },

  brandName: {
    fontSize: "1.15rem",
  },

  contentWrap: {
    maxWidth: "430px",
  },

  kicker: {
    display: "inline-flex",
    padding: "8px 14px",
    borderRadius: "999px",
    background: "rgba(56, 189, 248, 0.1)",
    border: "1px solid rgba(125, 211, 252, 0.2)",
    color: "#bae6fd",
    fontSize: "0.72rem",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    fontWeight: 700,
    marginBottom: "16px",
  },

  title: {
    margin: "0 0 14px",
    fontSize: "clamp(2.4rem, 4vw, 4rem)",
    lineHeight: "1.05",
    letterSpacing: "-0.06em",
    color: "#f8fafc",
  },

  subtitle: {
    margin: 0,
    color: "#cbd5e1",
    fontSize: "1.04rem",
    lineHeight: "1.8",
    opacity: 0.9,
  },

  formPanel: {
    background: "rgba(15, 23, 42, 0.82)",
    padding: "38px 34px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },

  headerRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "28px",
  },

  formTitle: {
    margin: 0,
    color: "#f8fafc",
    fontSize: "1.95rem",
    letterSpacing: "-0.04em",
  },

  backButton: {
    background: "transparent",
    border: "1px solid rgba(148, 163, 184, 0.2)",
    color: "#cbd5e1",
    borderRadius: "12px",
    padding: "10px 14px",
    cursor: "pointer",
    fontWeight: 600,
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },

  label: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    color: "#cbd5e1",
    fontWeight: 600,
    fontSize: "0.92rem",
  },

  input: {
    width: "100%",
    padding: "15px 16px",
    borderRadius: "14px",
    border: "1px solid rgba(148, 163, 184, 0.2)",
    background: "rgba(15, 23, 42, 0.9)",
    color: "#f8fafc",
    outline: "none",
    fontSize: "1rem",
    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
  },

  button: {
    marginTop: "8px",
    border: "none",
    borderRadius: "14px",
    padding: "16px 20px",
    background: "linear-gradient(135deg, #38bdf8 0%, #2563eb 100%)",
    color: "#fff",
    fontWeight: 800,
    letterSpacing: "0.01em",
    cursor: "pointer",
    boxShadow: "0 18px 35px rgba(37, 99, 235, 0.45)",
  },

  error: {
    margin: "-4px 0 0",
    color: "#fca5a5",
    fontSize: "0.92rem",
  },
};

export default WorkerLogin;