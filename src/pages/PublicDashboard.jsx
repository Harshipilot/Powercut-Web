import { useEffect, useState } from "react";
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

// Fix leaflet marker issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

function PublicDashboard() {
  const [reports, setReports] = useState([]);
  const [searchArea, setSearchArea] = useState("");
  const [selectedArea, setSelectedArea] = useState(
    localStorage.getItem("selectedArea") || null
  );
  const [suggestions, setSuggestions] = useState([]);

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
      setReports(data);
    });

    return () => unsubscribe();
  }, []);

  // 🔎 Nominatim Search
  const searchLocation = async (value) => {
    setSearchArea(value);

    if (value.length < 3) {
      setSuggestions([]);
      return;
    }

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${value}&format=json&addressdetails=1`
      );
      const data = await res.json();
      setSuggestions(data.slice(0, 5)); // limit to 5 results
    } catch (err) {
      console.error(err);
    }
  };

  const selectLocation = (place) => {
    setSearchArea(place.display_name);
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
  };

  const filteredReports = reports.filter((report) =>
    report.area?.toLowerCase().includes(
      selectedArea?.toLowerCase() || ""
    )
  );

  function RecenterMap({ reports }) {
    const map = useMap();
    if (reports.length > 0) {
      const first = reports[0];
      map.setView([first.latitude, first.longitude], 14);
    }
    return null;
  }

  // 🟢 AREA SELECTION SCREEN
  if (!selectedArea) {
    return (
      <div style={styles.selectionContainer}>
        <h1 style={{ fontSize: "32px", marginBottom: "10px" }}>
          ⚡ Check Power Status
        </h1>

        <div style={styles.searchWrapper}>
          <input
            type="text"
            placeholder="Enter your area..."
            value={searchArea}
            onChange={(e) => searchLocation(e.target.value)}
            style={styles.searchInput}
          />

          {suggestions.length > 0 && (
            <div style={styles.dropdown}>
              {suggestions.map((place, index) => (
                <div
                  key={index}
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
    );
  }

  // 🔵 DASHBOARD
  return (
    <div style={styles.container}>
      <div style={styles.topBar}>
        <h2>📍 {selectedArea}</h2>
        <button onClick={handleChangeArea} style={styles.changeButton}>
          Change Area
        </button>
      </div>

      <p style={styles.count}>
        {filteredReports.length === 0
          ? "🟢 Power is running normally"
          : `🔴 ${filteredReports.length} Active Power Cut${
              filteredReports.length > 1 ? "s" : ""
            }`}
      </p>

      <div style={styles.dashboardWrapper}>
        <div style={styles.mapPanel}>
          <MapContainer
            center={[12.9716, 77.5946]}
            zoom={12}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <RecenterMap reports={filteredReports} />

            {filteredReports.map((report) => (
              <Marker
                key={report.id}
                position={[report.latitude, report.longitude]}
              >
                <Popup>
                  <strong>{report.area}</strong>
                  <br />
                  {report.reason}
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        <div style={styles.listPanel}>
          <h3>Active Reports</h3>

          {filteredReports.length === 0 ? (
            <p>No issues reported.</p>
          ) : (
            filteredReports.map((report) => (
              <div key={report.id} style={styles.card}>
                <p>{report.reason}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  selectionContainer: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0f172a, #1e3a8a)",
    color: "white",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  container: {
    minHeight: "100vh",
    padding: "30px",
    backgroundColor: "#0f172a",
    color: "white",
  },
  searchWrapper: {
    position: "relative",
    marginTop: "20px",
    width: "350px",
  },
  searchInput: {
    padding: "12px",
    width: "100%",
    borderRadius: "8px",
    border: "none",
    outline: "none",
    fontSize: "14px",
  },
  dropdown: {
    position: "absolute",
    top: "48px",
    left: 0,
    right: 0,
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    maxHeight: "200px",
    overflowY: "auto",
    zIndex: 1000,
    boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
  },
  dropdownItem: {
    padding: "12px",
    cursor: "pointer",
    color: "#111827", // 🔥 FIXED TEXT COLOR
    fontSize: "14px",
  },
  primaryButton: {
    marginTop: "20px",
    padding: "12px 25px",
    backgroundColor: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
  },
  changeButton: {
    padding: "6px 12px",
    backgroundColor: "#dc2626",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  count: {
    marginTop: "15px",
    marginBottom: "20px",
    fontWeight: "500",
  },
  dashboardWrapper: {
    display: "flex",
    gap: "20px",
    height: "75vh",
  },
  mapPanel: {
    flex: 1.5,
    borderRadius: "15px",
    overflow: "hidden",
  },
  listPanel: {
    flex: 1,
    backgroundColor: "#1e293b",
    borderRadius: "15px",
    padding: "20px",
    overflowY: "auto",
  },
  card: {
    backgroundColor: "#334155",
    padding: "15px",
    borderRadius: "10px",
    marginBottom: "15px",
  },
};

export default PublicDashboard; 