// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";   // ✅ ADD THIS
import { getAnalytics } from "firebase/analytics";   // optional
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCvMJtlhgflDW0eIMdVf2I62N9UN3Rpe40",
  authDomain: "powercut-web.firebaseapp.com",
  projectId: "powercut-web",
  storageBucket: "powercut-web.firebasestorage.app",
  messagingSenderId: "917307008888",
  appId: "1:917307008888:web:230ceb1eebe9f1507cca8d",
  measurementId: "G-26RY6CVY57"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const analytics = getAnalytics(app);
export { db };
