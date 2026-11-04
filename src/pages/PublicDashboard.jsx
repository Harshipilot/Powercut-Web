import { useEffect, useState, useRef } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";

const GEOAPIFY_API_KEY = import.meta.env.VITE_GEOAPIFY_KEY;

const LOCAL_REPORT_KEY = "smartgrid_local_reports";

const loadLocalReports = () => {
  try {
    const raw = localStorage.getItem(LOCAL_REPORT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const parseTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "just now";

  const minutes = Math.max(1, Math.round((Date.now() - date.getTime()) / 60000));
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;

  const days = Math.round(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
};

function PublicDashboard() {
  const [reports, setReports] = useState([]);
  const [searchArea, setSearchArea] = useState("");
  const [selectedArea, setSelectedArea] = useState(
    localStorage.getItem("selectedArea") || null
  );
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [filter, setFilter] = useState("all");
  const [selectedReport, setSelectedReport] = useState(null);
  const searchTimerRef = useRef(null);

  useEffect(() => {
    const q = query(
      collection(db, "reports"),
      where("status", "==", "active")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const localReports = loadLocalReports();
      const merged = [...localReports, ...data].filter(
        (report, index, arr) =>
          arr.findIndex((item) => item.id === report.id) === index
      );

      setReports(merged);
    });

    return () => unsubscribe();
  }, []);

  const searchLocation = async (value) => {
    const trimmed = value.trim();
    setSearchArea(value);

    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    if (!trimmed || trimmed.length < 2) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    searchTimerRef.current = setTimeout(async () => {
      setIsSearching(true);

      try {
        const apiKey = GEOAPIFY_API_KEY;
        if (!apiKey) {
          throw new Error("Geoapify API key is missing");
        }

        const url = new URL("https://api.geoapify.com/v1/geocode/autocomplete");
        url.searchParams.set("text", trimmed);
        url.searchParams.set("limit", "6");
        url.searchParams.set("apiKey", apiKey);
        url.searchParams.set("lang", "en");
        url.searchParams.set("filter", "countrycode:in");

        const res = await fetch(url.toString(), {
          headers: {
            Accept: "application/json",
          },
        });

        if (!res.ok) {
          throw new Error("Location lookup failed");
        }

        const data = await res.json();

        const matches = (data?.features || [])
          .map((feature) => feature.properties)
          .filter((property) => property && property.formatted)
          .map((property) => ({
            display_name: property.formatted,
            city: property.city || property.county || property.state || property.country,
            name: property.name,
          }))
          .slice(0, 6);

        setSuggestions(matches);
      } catch (err) {
        console.error("Public location search error:", err);
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 250);
  };

  const selectLocation = (place) => {
    const value = place.display_name || place.city || place.name || searchArea;
    setSearchArea(value);
    setSuggestions([]);
  };

  const handleAreaSubmit = () => {
    if (!searchArea) return;

    localStorage.setItem("selectedArea", searchArea);
    setSelectedArea(searchArea);
  };

  const handleChangeArea = () => {
    localStorage.removeItem("selectedArea");
    setSelectedArea(null);
    setSearchArea("");
    setFilter("all");
  };

  const filteredReports = (reports || []).filter((report) =>
    report.area?.toLowerCase().includes(selectedArea?.toLowerCase() || "")
  );

  const areaReports =
    filter === "all"
      ? filteredReports
      : filter === "recent"
        ? filteredReports.filter((report) => {
            const timestamp = report.createdAt || report.created_at;
            if (!timestamp) return false;
            const ageMinutes = (Date.now() - new Date(timestamp).getTime()) / 60000;
            return ageMinutes < 180;
          })
        : filteredReports.filter((report) =>
            `${report.reason || ""}`.toLowerCase().includes(filter)
          );

  const stats = {
    total: filteredReports.length,
    recent: filteredReports.filter((report) => {
      const timestamp = report.createdAt || report.created_at;
      if (!timestamp) return false;
      const ageMinutes = (Date.now() - new Date(timestamp).getTime()) / 60000;
      return ageMinutes < 180;
    }).length,
    severe: filteredReports.filter((report) => {
      const text = `${report.reason || ""}`.toLowerCase();
      return text.includes("transformer") || text.includes("substation") || text.includes("fire") || text.includes("major");
    }).length,
  };

  function RecenterMap({ reports }) {
    const map = useMap();
    if (reports.length > 0) {
      const first = reports[0];
      map.setView([first.latitude, first.longitude], 13);
    }
    return null;
  }

  const activeFilterLabel =
    filter === "all" ? "All issues" : filter === "recent" ? "Recent" : "Severe";

  // 🟢 AREA SELECTION SCREEN
  if (!selectedArea) {
    return (
      <div style={styles.selectionContainer}>
        <div style={styles.selectionCard}>
          <div style={styles.pill}>Live outage intelligence</div>
          <h1 style={styles.selectionTitle}>Check Power Status</h1>
          <p style={styles.selectionText}>
            Search your area to see active power cuts, outages, and service updates in real time.
          </p>

          <div style={styles.searchWrapper}>
            <input
              type="text"
              placeholder="Enter your area..."
              value={searchArea}
              onChange={(e) => searchLocation(e.target.value)}
              style={styles.searchInput}
            />

            {isSearching && !suggestions.length && (
              <div style={styles.searching}>Searching locations...</div>
            )}

            {suggestions.length > 0 && (
              <div style={styles.dropdown}>
                {suggestions.map((place, index) => (
                  <div
                    key={`${place.display_name || index}-${index}`}
                    style={styles.dropdownItem}
                    onClick={() => selectLocation(place)}
                  >
                    {place.display_name}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button onClick={handleAreaSubmit} style={styles.primaryButton}>
            Check Status
          </button>
        </div>
      </div>
    );
  }

  // 🔵 DASHBOARD
  return (
    <div style={styles.container}>
      <div style={styles.topBar}>
        <div>
          <div style={styles.pill}>Operational view</div>
          <h2 style={styles.areaTitle}>📍 {selectedArea}</h2>
        </div>

        <button onClick={handleChangeArea} style={styles.changeButton}>
          Change Area
        </button>
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <span style={styles.statLabel}>Active</span>
          <strong style={styles.statValue}>{stats.total}</strong>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statLabel}>Recent</span>
          <strong style={styles.statValue}>{stats.recent}</strong>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statLabel}>Severe</span>
          <strong style={styles.statValue}>{stats.severe}</strong>
        </div>
      </div>

      <div style={styles.filterBar}>
        {[
          { key: "all", label: "All issues" },
          { key: "recent", label: "Recent" },
          { key: "transformer", label: "Transformer" },
          { key: "line", label: "Line fault" },
          { key: "fire", label: "Fire" },
        ].map((chip) => (
          <button
            key={chip.key}
            onClick={() => setFilter(chip.key)}
            style={{
              ...styles.filterChip,
              ...(filter === chip.key ? styles.filterChipActive : {}),
            }}
          >
            {chip.label}
          </button>
        ))}
      </div>

      <p style={styles.count}>
        {areaReports.length === 0
          ? "🟢 Power is running normally in this area"
          : `${activeFilterLabel}: ${areaReports.length} live report${areaReports.length > 1 ? "s" : ""}`}
      </p>

      <div style={styles.dashboardWrapper}>
        <div style={styles.mapPanel}>
          <MapContainer
            center={[12.9716, 77.5946]}
            zoom={12}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <RecenterMap reports={areaReports} />

            {areaReports.map((report) => (
              <Marker
                key={report.id}
                position={[report.latitude, report.longitude]}
              >
                <Popup>
                  <div style={{ minWidth: "170px" }}>
                    <strong>{report.area}</strong>
                    <br />
                    {report.reason}
                    <br />
                    <small>{parseTime(report.createdAt || report.created_at)}</small>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        <aside style={styles.listPanel}>
          <div style={styles.listHeader}>
            <h3 style={styles.listTitle}>Active Reports</h3>
          </div>

          {areaReports.length === 0 ? (
            <div style={styles.emptyState}>No issues reported in this area.</div>
          ) : (
            areaReports.map((report) => (
              <button
                key={report.id}
                onClick={() => setSelectedReport(report)}
                style={styles.card}
                type="button"
              >
                <div style={styles.cardDot} />
                <div style={styles.cardContent}>
                  <p style={styles.cardReason}>{report.reason}</p>
                  <p style={styles.cardMeta}>{report.area}</p>
                  <p style={styles.cardMeta}>{parseTime(report.createdAt || report.created_at)}</p>
                </div>
              </button>
            ))
          )}
        </aside>
      </div>

      {selectedReport && (
        <div style={styles.modalOverlay} onClick={() => setSelectedReport(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div>
                <div style={styles.pill}>Report details</div>
                <h4 style={styles.modalTitle}>{selectedReport.area}</h4>
              </div>
              <button onClick={() => setSelectedReport(null)} style={styles.closeButton}>
                ✕
              </button>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.modalRow}>
                <span style={styles.modalLabel}>Issue</span>
                <strong>{selectedReport.reason}</strong>
              </div>
              <div style={styles.modalRow}>
                <span style={styles.modalLabel}>Status</span>
                <span style={styles.statusPill}>Active</span>
              </div>
              <div style={styles.modalRow}>
                <span style={styles.modalLabel}>Reported</span>
                <span>{parseTime(selectedReport.createdAt || selectedReport.created_at)}</span>
              </div>
              <div style={styles.modalRow}>
                <span style={styles.modalLabel}>Coordinates</span>
                <span>
                  {selectedReport.latitude}, {selectedReport.longitude}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  selectionContainer: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "32px",
    background:
      "radial-gradient(circle at top, rgba(59, 130, 246, 0.25), transparent 25%), linear-gradient(135deg, #020817, #0f172a 50%, #111827)",
  },

  selectionCard: {
    width: "100%",
    maxWidth: "620px",
    background: "rgba(15, 23, 42, 0.82)",
    border: "1px solid rgba(148, 163, 184, 0.18)",
    borderRadius: "30px",
    padding: "38px 30px",
    boxShadow: "0 25px 60px rgba(2, 6, 23, 0.6)",
    backdropFilter: "blur(12px)",
    textAlign: "center",
  },

  pill: {
    display: "inline-flex",
    padding: "8px 14px",
    borderRadius: "999px",
    background: "rgba(56, 189, 248, 0.12)",
    border: "1px solid rgba(125, 211, 252, 0.25)",
    color: "#bae6fd",
    fontSize: "0.7rem",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    fontWeight: 700,
    marginBottom: "18px",
  },

  selectionTitle: {
    margin: "0 0 10px",
    fontSize: "clamp(2.2rem, 4vw, 4rem)",
    lineHeight: "1.1",
    letterSpacing: "-0.06em",
    color: "#f8fafc",
  },

  selectionText: {
    margin: "0 auto 30px",
    maxWidth: "520px",
    color: "#cbd5e1",
    fontSize: "1.05rem",
    lineHeight: "1.8",
  },

  container: {
    minHeight: "100vh",
    padding: "32px",
    background:
      "radial-gradient(circle at top right, rgba(14, 165, 233, 0.18), transparent 24%), linear-gradient(135deg, #020817, #0f172a 50%, #111827)",
    color: "#e2e8f0",
  },

  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    marginBottom: "22px",
  },

  areaTitle: {
    margin: "10px 0 0",
    fontSize: "clamp(1.5rem, 2vw, 2.4rem)",
    letterSpacing: "-0.04em",
    color: "#f8fafc",
  },

  changeButton: {
    padding: "10px 16px",
    background: "rgba(239, 68, 68, 0.12)",
    color: "#fecaca",
    border: "1px solid rgba(252, 165, 165, 0.25)",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: 700,
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(120px, 1fr))",
    gap: "18px",
    marginBottom: "20px",
  },

  statCard: {
    background: "linear-gradient(135deg, rgba(15, 23, 42, 0.88), rgba(30, 41, 59, 0.8))",
    border: "1px solid rgba(148, 163, 184, 0.12)",
    borderRadius: "22px",
    padding: "18px 20px",
    boxShadow: "0 10px 25px rgba(2, 6, 23, 0.22)",
  },

  statLabel: {
    display: "block",
    color: "#94a3b8",
    fontSize: "0.78rem",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginBottom: "8px",
  },

  statValue: {
    fontSize: "2rem",
    lineHeight: "1",
    color: "#f8fafc",
    letterSpacing: "-0.05em",
  },

  filterBar: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    marginBottom: "12px",
  },

  filterChip: {
    border: "1px solid rgba(148, 163, 184, 0.18)",
    background: "rgba(15, 23, 42, 0.7)",
    color: "#dbeafe",
    borderRadius: "999px",
    padding: "8px 12px",
    cursor: "pointer",
    fontWeight: 700,
  },

  filterChipActive: {
    background: "linear-gradient(135deg, #38bdf8, #2563eb)",
    color: "#fff",
    borderColor: "rgba(125, 211, 252, 0.14)",
    boxShadow: "0 14px 22px rgba(37, 99, 235, 0.25)",
  },

  count: {
    margin: "0 0 20px",
    fontWeight: 700,
    color: "#cbd5e1",
    fontSize: "1.05rem",
  },

  dashboardWrapper: {
    display: "grid",
    gridTemplateColumns: "1.6fr 0.8fr",
    gap: "22px",
    height: "75vh",
  },

  mapPanel: {
    borderRadius: "28px",
    overflow: "hidden",
    border: "1px solid rgba(148, 163, 184, 0.15)",
    boxShadow: "0 18px 38px rgba(2, 6, 23, 0.35)",
  },

  listPanel: {
    background: "rgba(15, 23, 42, 0.72)",
    borderRadius: "28px",
    padding: "22px",
    border: "1px solid rgba(148, 163, 184, 0.12)",
    overflowY: "auto",
  },

  listHeader: {
    marginBottom: "18px",
  },

  listTitle: {
    margin: 0,
    fontSize: "1.35rem",
    color: "#f8fafc",
  },

  emptyState: {
    padding: "18px",
    borderRadius: "16px",
    background: "rgba(15, 23, 42, 0.7)",
    color: "#cbd5e1",
    border: "1px solid rgba(148, 163, 184, 0.08)",
  },

  card: {
    width: "100%",
    textAlign: "left",
    background: "linear-gradient(135deg, rgba(30, 41, 59, 0.96), rgba(15, 23, 42, 0.9))",
    border: "1px solid rgba(148, 163, 184, 0.12)",
    borderRadius: "18px",
    padding: "16px 18px",
    marginBottom: "14px",
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    cursor: "pointer",
    transition: "transform 0.2s ease, border-color 0.2s ease",
    color: "inherit",
  },

  cardDot: {
    width: "12px",
    height: "12px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #f87171, #ef4444)",
    marginTop: "6px",
    boxShadow: "0 0 20px rgba(239, 68, 68, 0.7)",
    flexShrink: 0,
  },

  cardContent: {
    flex: 1,
  },

  cardReason: {
    margin: "0 0 6px",
    color: "#f8fafc",
    fontWeight: 700,
    lineHeight: "1.6",
  },

  cardMeta: {
    margin: "2px 0",
    color: "#94a3b8",
    fontSize: "0.82rem",
  },

  searching: {
    marginTop: "8px",
    fontSize: "0.8rem",
    color: "#7dd3fc",
  },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    display: "grid",
    placeItems: "center",
    background: "rgba(2, 6, 23, 0.7)",
    backdropFilter: "blur(8px)",
    zIndex: 2000,
  },

  modal: {
    width: "min(520px, 92vw)",
    background: "rgba(15, 23, 42, 0.96)",
    border: "1px solid rgba(148, 163, 184, 0.14)",
    borderRadius: "24px",
    boxShadow: "0 30px 60px rgba(2, 6, 23, 0.65)",
    overflow: "hidden",
  },

  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
    padding: "22px 22px 14px",
  },

  modalTitle: {
    margin: 0,
    fontSize: "1.5rem",
    color: "#f8fafc",
  },

  closeButton: {
    border: "none",
    background: "rgba(148, 163, 184, 0.12)",
    color: "#f8fafc",
    borderRadius: "10px",
    width: "36px",
    height: "36px",
    cursor: "pointer",
    fontSize: "1rem",
  },

  modalBody: {
    padding: "0 22px 24px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },

  modalRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    padding: "12px 14px",
    borderRadius: "12px",
    background: "rgba(15, 23, 42, 0.7)",
    border: "1px solid rgba(148, 163, 184, 0.08)",
    color: "#e2e8f0",
  },

  modalLabel: {
    color: "#94a3b8",
  },

  statusPill: {
    display: "inline-flex",
    alignItems: "center",
    padding: "5px 10px",
    background: "rgba(34, 197, 94, 0.12)",
    border: "1px solid rgba(134, 239, 172, 0.2)",
    borderRadius: "999px",
    color: "#bbf7d0",
    fontWeight: 700,
  },
};

export default PublicDashboard;