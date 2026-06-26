import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBkuKFXa14mOH0Gfa2WlJV8FCAKQz5gGFI",
  authDomain: "sri-ram-digital-library.firebaseapp.com",
  projectId: "sri-ram-digital-library",
  storageBucket: "sri-ram-digital-library.firebasestorage.app",
  messagingSenderId: "1079309598824",
  appId: "1:1079309598824:web:bbc571eb80bcf180a3bbdd",
  measurementId: "G-2Y56W4SFMX"
};

// Initialize Firebase
export const firebaseApp = initializeApp(firebaseConfig);
export const firebaseAnalytics = typeof window !== 'undefined' ? getAnalytics(firebaseApp) : null;
