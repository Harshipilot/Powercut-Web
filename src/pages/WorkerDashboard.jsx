import { useState, useEffect } from "react";
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
} from "react-leaflet";
import L from "leaflet";

function WorkerDashboard() {
const auth = getAuth();
const navigate = useNavigate();
const user = auth.currentUser;

const [area, setArea] = useState("");
const [reason, setReason] = useState("");
const [position, setPosition] = useState(null);
const [reports, setReports] = useState([]);
const [message, setMessage] = useState("");
const [suggestions, setSuggestions] = useState([]);

// Fix leaflet marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
iconRetinaUrl:
"https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
iconUrl:
"https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
shadowUrl:
"https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
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

return () => unsubscribe();

}, []);

// Nominatim Search
const searchLocation = async (value) => {
setArea(value);

if (value.length < 3) {  
  setSuggestions([]);  
  return;  
}  

const res = await fetch(  
  `https://nominatim.openstreetmap.org/search?q=${value}&format=json&addressdetails=1`  
);  
const data = await res.json();  
setSuggestions(data);

};

const selectLocation = (place) => {
const lat = parseFloat(place.lat);
const lon = parseFloat(place.lon);

setArea(place.display_name);  
setPosition({ lat, lng: lon });  
setSuggestions([]);

};

const handleSubmit = async (e) => {
e.preventDefault();

if (!area || !reason || !position) {  
  setMessage("Fill all fields and select location");  
  return;  
}  

try {  
  await addDoc(collection(db, "reports"), {  
    area,  
    reason,  
    latitude: position.lat,  
    longitude: position.lng,  
    status: "active",  
    reportedBy: user?.email,  
    createdAt: serverTimestamp(),  
  });  

  setArea("");  
  setReason("");  
  setPosition(null);  
  setMessage("Report submitted successfully");  
} catch (error) {  
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

function RecenterMap({ position }) {
const map = useMap();
if (position) {
map.setView([position.lat, position.lng], 14);
}
return null;
}

return (
<div style={styles.container}>
<div style={styles.dashboardWrapper}>

{/* LEFT PANEL */}  
    <div style={styles.leftPanel}>  
      <div style={styles.overlay}>  
        <h2>⚡ Report Power Cut</h2>  

        <form onSubmit={handleSubmit} style={styles.form}>  
          <div style={{ position: "relative" }}>  
            <input  
              type="text"  
              placeholder="Search Area..."  
              value={area}  
              onChange={(e) => searchLocation(e.target.value)}  
              style={styles.input}  
              required  
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

          <textarea  
            placeholder="Reason for power cut"  
            value={reason}  
            onChange={(e) => setReason(e.target.value)}  
            style={styles.textarea}  
            required  
          />  

          <button type="submit" style={styles.submitButton}>  
            Submit Report  
          </button>  
        </form>  

        {message && <p style={styles.message}>{message}</p>}  

        <button style={styles.logout} onClick={handleLogout}>  
          Logout  
        </button>  
      </div>  
    </div>  

    {/* RIGHT PANEL - MAP */}  
    <div style={styles.mapPanel}>  
      <MapContainer  
        center={[12.9716, 77.5946]}  
        zoom={12}  
        style={{ height: "100%", width: "100%" }}  
      >  
        <TileLayer  
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"  
        />  

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
container: {
minHeight: "100vh",
padding: "20px",
backgroundColor: "#0f172a",
},
dashboardWrapper: {
display: "flex",
gap: "20px",
height: "90vh",
},
leftPanel: {
width: "35%",
backgroundImage: "url('/report-bg.jpg')",
backgroundSize: "cover",
backgroundPosition: "center",
borderRadius: "15px",
},
mapPanel: {
flex: 1,
borderRadius: "15px",
overflow: "hidden",
},
overlay: {
backgroundColor: "rgba(255,255,255,0.92)",
height: "100%",
padding: "25px",
borderRadius: "15px",
},
form: {
display: "flex",
flexDirection: "column",
gap: "15px",
marginTop: "20px",
},
input: {
padding: "10px",
borderRadius: "8px",
border: "1px solid #ccc",
},
textarea: {
padding: "10px",
borderRadius: "8px",
border: "1px solid #ccc",
minHeight: "80px",
},
dropdown: {
position: "absolute",
top: "45px",
left: 0,
right: 0,
backgroundColor: "white",
borderRadius: "8px",
maxHeight: "200px",
overflowY: "auto",
boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
zIndex: 1000,
},
dropdownItem: {
padding: "10px",
cursor: "pointer",
borderBottom: "1px solid #eee",
},
submitButton: {
padding: "10px",
backgroundColor: "#2563eb",
color: "white",
border: "none",
borderRadius: "8px",
cursor: "pointer",
},
resolveButton: {
marginTop: "5px",
padding: "5px",
backgroundColor: "green",
color: "white",
border: "none",
borderRadius: "4px",
cursor: "pointer",
},
logout: {
marginTop: "20px",
padding: "10px",
backgroundColor: "#dc2626",
color: "white",
border: "none",
borderRadius: "8px",
cursor: "pointer",
},
message: {
marginTop: "10px",
color: "green",
},
};

export default WorkerDashboard;