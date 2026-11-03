import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// This config is safe to commit: it only identifies the Firebase project.
// Access to data is controlled by the rules in firestore.rules.
const firebaseConfig = {
  apiKey: "AIzaSyBVlKfXiSD0iWRSJGMe8uTbfnRPTxmapIc",
  authDomain: "studentlife-3d059.firebaseapp.com",
  projectId: "studentlife-3d059",
  storageBucket: "studentlife-3d059.firebasestorage.app",
  messagingSenderId: "1041329314283",
  appId: "1:1041329314283:web:437bf19bd44d3e4b7921ae",
  measurementId: "G-TCQ08ZCBRN",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
