// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBVlKfXiSD0iWRSJGMe8uTbfnRPTxmapIc",
  authDomain: "studentlife-3d059.firebaseapp.com",
  projectId: "studentlife-3d059",
  storageBucket: "studentlife-3d059.firebasestorage.app",
  messagingSenderId: "1041329314283",
  appId: "1:1041329314283:web:437bf19bd44d3e4b7921ae",
  measurementId: "G-TCQ08ZCBRN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);