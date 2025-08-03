// firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// ✅ Your Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyCjm-lOZmmO79Sr1UVvtacngr82i27Ka-0",
  authDomain: "shubhvilla-ca61f.firebaseapp.com",
  projectId: "shubhvilla-ca61f",
  storageBucket: "shubhvilla-ca61f.firebasestorage.app",
  messagingSenderId: "1025786443833",
  appId: "1:1025786443833:web:3275489106b9eadebcb5e8",
  measurementId: "G-QD8R7CC9J2"
};

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);

// ✅ Export services you need
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);
