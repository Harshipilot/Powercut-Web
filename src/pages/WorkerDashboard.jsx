import { useState, useEffect, useRef } from "react";
import { getAuth, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import {
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  updateDoc,
  doc,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";

const GEOAPIFY_API_KEY = import.meta.env.VITE_GEOAPIFY_KEY;

const PLACE_TYPE_PRIORITY = [
  "city",
  "town",
  "village",
  "suburb",
  "hamlet",
  "administrative",
  "county",
  "state",
  "country",
];

const LOCAL_REPORT_KEY = "smartgrid_local_reports";

const readLocalReports = () => {
  try {
    const raw = localStorage.getItem(LOCAL_REPORT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const writeLocalReports = (reports) => {
  localStorage.setItem(LOCAL_REPORT_KEY, JSON.stringify(reports));
};

const appendLocalReport = (report) => {
  const current = readLocalReports();
  const next = [report, ...current];
  writeLocalReports(next);
  return next;
};

function WorkerDashboard() {
  const auth = getAuth();
  const navigate = useNavigate();
  const user = auth.currentUser;
  const abortControllerRef = useRef(null);
  const debounceTimerRef = useRef(null);

  const [area, setArea] = useState("");
  const [reason, setReason] = useState("");
  const [position, setPosition] = useState(null);
  const [reports, setReports] = useState([]);
  const [message, setMessage] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [mapPickMode, setMapPickMode] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Fix leaflet marker icon issue
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  });

  // Fetch active reports
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

    return () => {
      unsubscribe();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const normalizePlace = (feature) => {
    if (!feature || !feature.properties) return null;

    const props = feature.properties;
    const coords = feature.geometry?.coordinates || [];
    const lat = Number(coords[1]);
    const lon = Number(coords[0]);

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

    const placeType = (
      props.result_type ||
      props.datasource?.raw?.result_type ||
      props.category ||
      ""
    )
      .toLowerCase();

    return {
      place_id: props.place_id || `${lat}-${lon}`,
      display_name: props.formatted || props.name || "Selected location",
      lat,
      lon,
      kind: placeType,
      cityLabel:
        props.city ||
        props.town ||
        props.village ||
        props.hamlet ||
        props.suburb ||
        props.name ||
        props.formatted ||
        "Selected location",
      ...props,
    };
  };

  // Nominatim Search
  const searchLocation = async (value) => {
    const trimmed = value.trim();
    setArea(value);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!trimmed || trimmed.length < 2) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    debounceTimerRef.current = setTimeout(async () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      setIsSearching(true);

      try {
        const apiKey = GEOAPIFY_API_KEY;
        if (!apiKey) {
          throw new Error("Geoapify API key is missing");
        }

        const url = new URL("https://api.geoapify.com/v1/geocode/autocomplete");
        url.searchParams.set("text", trimmed);
        url.searchParams.set("limit", "8");
        url.searchParams.set("apiKey", apiKey);
        url.searchParams.set("lang", "en");
        url.searchParams.set("filter", "countrycode:in");

        const res = await fetch(url.toString(), {
          signal: abortControllerRef.current.signal,
          headers: {
            Accept: "application/json",
          },
        });

        if (!res.ok) {
          throw new Error(`Geocoding request failed: ${res.status}`);
        }

        const data = await res.json();

        const filtered = (data?.features || [])
          .map((feature) => normalizePlace(feature))
          .filter(Boolean)
          .filter((place) => {
            const placeType = place.kind || "";
            const text = `${place.display_name} ${place.cityLabel}`.toLowerCase();
            const matchesUserInput = text.includes(trimmed.toLowerCase());
            const isUsableLocation = PLACE_TYPE_PRIORITY.some((type) =>
              placeType.includes(type)
            );
            return matchesUserInput && isUsableLocation;
          })
          .slice(0, 6);

        setSuggestions(filtered.length ? filtered : []);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Location search error:", err);
          setSuggestions([]);
        }
      } finally {
        setIsSearching(false);
      }
    }, 250);
  };

  const selectLocation = (place) => {
    const lat = parseFloat(place.lat);
    const lon = parseFloat(place.lon);

    setArea(place.display_name);
    setPosition({ lat, lng: lon });
    setSuggestions([]);
    setIsSearching(false);
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setMessage("Geolocation is not supported on this device.");
      return;
    }

    setIsGettingLocation(true);
    setMessage("Getting your current location...");

    navigator.geolocation.getCurrentPosition(
      async (positionData) => {
        const lat = positionData.coords.latitude;
        const lng = positionData.coords.longitude;

        try {
          const apiKey = GEOAPIFY_API_KEY;
          if (!apiKey) {
            throw new Error("Geoapify API key is missing");
          }

          const url = new URL("https://api.geoapify.com/v1/geocode/reverse");
          url.searchParams.set("lat", String(lat));
          url.searchParams.set("lon", String(lng));
          url.searchParams.set("apiKey", apiKey);
          url.searchParams.set("lang", "en");

          const res = await fetch(url.toString(), {
            headers: { Accept: "application/json" },
          });

          const data = await res.json();
          const display = data?.features?.[0]?.properties?.formatted || `Lat ${lat.toFixed(4)}, Lng ${lng.toFixed(4)}`;

          setArea(display);
          setPosition({ lat, lng });
          setMessage("Current location selected successfully.");
        } catch (error) {
          console.error("Reverse geocode failed:", error);
          setArea(`Lat ${lat.toFixed(4)}, Lng ${lng.toFixed(4)}`);
          setPosition({ lat, lng });
          setMessage("Current location captured. Please review the area name.");
        } finally {
          setIsGettingLocation(false);
        }
      },
      (error) => {
        console.error("Location permission error:", error);
        setIsGettingLocation(false);
        setMessage("Location access denied. Please type the area manually.");
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  const submitReport = async (reportData) => {
    const newReport = {
      ...reportData,
      id: reportData.id || `local-${Date.now()}`,
      createdAt: reportData.createdAt || new Date().toISOString(),
      status: "active",
      area: reportData.area,
      reason: reportData.reason,
      latitude: Number(reportData.latitude),
      longitude: Number(reportData.longitude),
    };

    try {
      const docRef = await addDoc(collection(db, "reports"), newReport);
      const savedReport = { ...newReport, id: docRef.id };
      setReports((prev) => [savedReport, ...prev]);
      appendLocalReport(savedReport);
      return savedReport;
    } catch (error) {
      console.error("Firestore addDoc failed:", error);
      const savedLocalReport = { ...newReport, source: "local" };
      const allLocal = appendLocalReport(savedLocalReport);
      setReports((prev) => [savedLocalReport, ...prev.filter((item) => item.id !== savedLocalReport.id)]);
      return savedLocalReport;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!area || !reason || !position) {
      setMessage("Fill all fields and select location");
      return;
    }

    const reportData = {
      area,
      reason,
      latitude: position.lat,
      longitude: position.lng,
      status: "active",
      reportedBy: user?.email || "anonymous",
      createdAt: new Date().toISOString(),
    };

    try {
      await submitReport(reportData);
      setArea("");
      setReason("");
      setPosition(null);
      setMessage("Report submitted successfully");
      setSuggestions([]);
    } catch (error) {
      console.error("Submit failed:", error);
      setMessage("Error submitting report");
    }
  };

  const handleResolve = async (id) => {
    await updateDoc(doc(db, "reports", id), {
      status: "resolved",
    });
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  const reverseGeocode = async (lat, lng) => {
    try {
      const apiKey = GEOAPIFY_API_KEY;
      if (!apiKey) {
        throw new Error("Geoapify API key is missing");
      }

      const url = new URL("https://api.geoapify.com/v1/geocode/reverse");
      url.searchParams.set("lat", String(lat));
      url.searchParams.set("lon", String(lng));
      url.searchParams.set("apiKey", apiKey);
      url.searchParams.set("lang", "en");
      url.searchParams.set("limit", "1");

      const res = await fetch(url.toString(), {
        headers: {
          Accept: "application/json",
        },
      });

      if (!res.ok) {
        throw new Error("Reverse geocode failed");
      }

      const data = await res.json();
      const feature = data?.features?.[0];
      const display = feature?.properties?.formatted || "Selected location";

      setArea(display);
      setPosition({ lat, lng });
      setMapPickMode(false);
      setSuggestions([]);
      setMessage("Location selected from map");
      return display;
    } catch (error) {
      console.error("Reverse geocode failed:", error);
      setArea(`Lat ${lat.toFixed(4)}, Lng ${lng.toFixed(4)}`);
      setPosition({ lat, lng });
      setMapPickMode(false);
      return null;
    }
  };

  function MapSelectorHandler() {
    useMapEvents({
      click(e) {
        if (!mapPickMode) return;
        reverseGeocode(e.latlng.lat, e.latlng.lng);
      },
    });

    return null;
  }

  function RecenterMap({ position }) {
    const map = useMap();
    if (position) {
      map.setView([position.lat, position.lng], 14);
    }
    return null;
  }

  return (
    <div style={styles.page}>
      <div style={styles.topNav}>
        <div style={styles.brand}> 
          <div style={styles.brandMark}>⚡</div>
          <span>SmartGrid Ops</span>
        </div>

        <button style={styles.logout} onClick={handleLogout}>
          Logout
        </button>
      </div>

      <div style={styles.dashboardWrapper}>
        <div style={styles.leftPanel}>
          <div style={styles.headerGroup}>
            <div style={styles.kicker}>Incident reporting</div>
            <h2 style={styles.title}>Report Power Cut</h2>
          </div>

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.locationInputGroup}>
              <button
                type="button"
                onClick={() => setMapPickMode((prev) => !prev)}
                style={styles.mapPickButton}
              >
                {mapPickMode ? "Cancel map pick" : "Pick from map"}
              </button>

              <button
                type="button"
                onClick={useCurrentLocation}
                style={styles.currentLocationButton}
                disabled={isGettingLocation}
              >
                {isGettingLocation ? "Getting location..." : "Use current location"}
              </button>
            </div>

            <div style={styles.inputWrap}>
              <label style={styles.label}>Area / city</label>
              <input
                type="text"
                placeholder="Search city or area..."
                value={area}
                onChange={(e) => searchLocation(e.target.value)}
                style={styles.input}
                required
              />

              {isSearching && !suggestions.length && (
                <div style={styles.searching}>Searching best matches...</div>
              )}

              {suggestions.length > 0 && (
                <div style={styles.dropdown}>
                  {suggestions.map((place, index) => (
                    <div
                      key={`${place.place_id || index}-${place.display_name}`}
                      style={styles.dropdownItem}
                      onClick={() => selectLocation(place)}
                    >
                      {place.cityLabel || place.display_name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={styles.inputWrap}>
              <label style={styles.label}>Reason</label>
              <textarea
                placeholder="Describe the outage reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                style={styles.textarea}
                required
              />
            </div>

            <button type="submit" style={styles.submitButton}>
              Submit Report
            </button>
          </form>

          {message && <p style={styles.message}>{message}</p>}
        </div>

        <div style={styles.mapPanel}>
          <div style={styles.mapHeader}>
            <div>
              <div style={styles.kicker}>Live map</div>
              <h3 style={styles.mapTitle}>Area Overview</h3>
            </div>
            <div style={styles.statusChip}>{reports.length} active</div>
          </div>

          <MapContainer
            center={[12.9716, 77.5946]}
            zoom={12}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MapSelectorHandler />

            {position && (
              <>
                <RecenterMap position={position} />
                <Marker position={[position.lat, position.lng]}>
                  <Popup>Selected Location</Popup>
                </Marker>
              </>
            )}

            {reports.map((report) => (
              <Marker
                key={report.id}
                position={[report.latitude, report.longitude]}
              >
                <Popup>
                  <strong>{report.area}</strong>
                  <br />
                  {report.reason}
                  <br />
                  <button
                    onClick={() => handleResolve(report.id)}
                    style={styles.resolveButton}
                  >
                    Resolve
                  </button>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: "26px 28px 28px",
    background:
      "radial-gradient(circle at top left, rgba(34, 211, 238, 0.18), transparent 20%), radial-gradient(circle at bottom right, rgba(168, 85, 247, 0.12), transparent 22%), linear-gradient(135deg, #020817 0%, #0f172a 38%, #111827 100%)",
    color: "#e2e8f0",
  },

  topNav: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "26px",
    padding: "10px 6px",
  },

  brand: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    fontWeight: 800,
    letterSpacing: "0.05em",
    color: "#f8fafc",
  },

  brandMark: {
    width: "42px",
    height: "42px",
    display: "grid",
    placeItems: "center",
    borderRadius: "14px",
    background: "linear-gradient(135deg, #22d3ee, #2563eb)",
    boxShadow: "0 12px 30px rgba(34, 211, 238, 0.45)",
    fontSize: "22px",
  },

  logout: {
    background: "rgba(239, 68, 68, 0.12)",
    border: "1px solid rgba(252, 165, 165, 0.2)",
    color: "#fecaca",
    borderRadius: "12px",
    padding: "10px 16px",
    cursor: "pointer",
    fontWeight: 700,
  },

  dashboardWrapper: {
    display: "grid",
    gridTemplateColumns: "420px 1fr",
    gap: "22px",
    minHeight: "calc(100vh - 120px)",
  },

  leftPanel: {
    background: "rgba(15, 23, 42, 0.8)",
    border: "1px solid rgba(148, 163, 184, 0.14)",
    borderRadius: "28px",
    padding: "28px 24px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    boxShadow: "0 18px 40px rgba(2, 6, 23, 0.4)",
  },

  headerGroup: {
    marginBottom: "20px",
  },

  kicker: {
    display: "inline-flex",
    padding: "8px 12px",
    borderRadius: "999px",
    background: "rgba(56, 189, 248, 0.1)",
    border: "1px solid rgba(125, 211, 252, 0.22)",
    color: "#bae6fd",
    fontSize: "0.7rem",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    fontWeight: 700,
  },

  title: {
    margin: "14px 0 0",
    fontSize: "2.3rem",
    lineHeight: "1.1",
    letterSpacing: "-0.05em",
    color: "#f8fafc",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },

  inputWrap: {
    position: "relative",
  },

  label: {
    display: "block",
    marginBottom: "10px",
    color: "#cbd5e1",
    fontWeight: 700,
    fontSize: "0.9rem",
  },

  input: {
    width: "100%",
    padding: "15px 16px",
    borderRadius: "16px",
    border: "1px solid rgba(148, 163, 184, 0.2)",
    background: "rgba(15, 23, 42, 0.9)",
    color: "#f8fafc",
    outline: "none",
    fontSize: "1rem",
  },

  textarea: {
    width: "100%",
    minHeight: "120px",
    padding: "15px 16px",
    borderRadius: "16px",
    border: "1px solid rgba(148, 163, 184, 0.2)",
    background: "rgba(15, 23, 42, 0.9)",
    color: "#f8fafc",
    resize: "vertical",
    outline: "none",
    fontSize: "1rem",
  },

  dropdown: {
    position: "absolute",
    top: "95px",
    left: 0,
    right: 0,
    backgroundColor: "rgba(15, 23, 42, 0.98)",
    borderRadius: "16px",
    maxHeight: "220px",
    overflowY: "auto",
    zIndex: 1000,
    boxShadow: "0 18px 35px rgba(2, 6, 23, 0.45)",
    border: "1px solid rgba(148, 163, 184, 0.1)",
  },

  dropdownItem: {
    padding: "12px 14px",
    cursor: "pointer",
    color: "#e2e8f0",
    borderBottom: "1px solid rgba(148, 163, 184, 0.08)",
  },

  searching: {
    marginTop: "8px",
    fontSize: "0.8rem",
    color: "#7dd3fc",
  },

  submitButton: {
    marginTop: "8px",
    border: "none",
    borderRadius: "16px",
    padding: "16px 22px",
    background: "linear-gradient(135deg, #38bdf8 0%, #2563eb 100%)",
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "0 18px 35px rgba(37, 99, 235, 0.45)",
  },

  message: {
    margin: "18px 0 0",
    color: "#bbf7d0",
    fontWeight: 600,
    background: "rgba(34, 197, 94, 0.12)",
    border: "1px solid rgba(134, 239, 172, 0.2)",
    borderRadius: "12px",
    padding: "12px 14px",
  },

  mapPanel: {
    background: "rgba(15, 23, 42, 0.8)",
    borderRadius: "28px",
    padding: "18px",
    border: "1px solid rgba(148, 163, 184, 0.14)",
    boxShadow: "0 18px 38px rgba(2, 6, 23, 0.4)",
    minHeight: "500px",
  },

  mapHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
    padding: "6px 6px 0",
  },

  mapTitle: {
    margin: "10px 0 0",
    color: "#f8fafc",
    fontSize: "1.5rem",
    letterSpacing: "-0.04em",
  },

  statusChip: {
    padding: "8px 12px",
    borderRadius: "999px",
    background: "rgba(239, 68, 68, 0.08)",
    border: "1px solid rgba(248, 113, 113, 0.2)",
    color: "#fecaca",
    fontSize: "0.74rem",
    fontWeight: 700,
  },

  resolveButton: {
    marginTop: "8px",
    padding: "7px 12px",
    background: "linear-gradient(135deg, #34d399, #10b981)",
    color: "white",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: 700,
  },

  currentLocationButton: {
    marginTop: "8px",
    padding: "10px 14px",
    borderRadius: "12px",
    background: "rgba(16, 185, 129, 0.12)",
    border: "1px solid rgba(110, 231, 183, 0.22)",
    color: "#bbf7d0",
    cursor: "pointer",
    fontWeight: 700,
  },

  mapPickButton: {
    marginTop: "8px",
    padding: "10px 14px",
    borderRadius: "12px",
    background: "rgba(14, 165, 233, 0.12)",
    border: "1px solid rgba(125, 211, 252, 0.22)",
    color: "#bae6fd",
    cursor: "pointer",
    fontWeight: 700,
  },
};

export default WorkerDashboard;