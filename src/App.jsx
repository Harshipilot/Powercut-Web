import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { db } from "./firebase";
import { collection, getDocs } from "firebase/firestore";

import RoleSelection from "./pages/RoleSelection";
import WorkerLogin from "./pages/WorkerLogin";
import WorkerDashboard from "./pages/WorkerDashboard";
import PublicDashboard from "./pages/PublicDashboard";
import About from "./pages/About";

function App() {

  // 🔥 Firebase connection test (runs once)
  useEffect(() => {
    const testFirebase = async () => {
      try {
        await getDocs(collection(db, "test"));
        console.log("🔥 Firebase Connected Successfully");
      } catch (error) {
        console.error("❌ Firebase Not Connected:", error);
      }
    };

    testFirebase();
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<RoleSelection />} />
        <Route path="/worker-login" element={<WorkerLogin />} />
        <Route path="/worker-dashboard" element={<WorkerDashboard />} />
        <Route path="/public-dashboard" element={<PublicDashboard />} />
        <Route path="/about" element={<About />} />
        
      </Routes>
    </Router>
  );
}

export default App;