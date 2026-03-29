import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAZg_jm8NgE-TLCYv8P3_Q6ATospeQNMOE",
  authDomain: "phishguard-ai-3e307.firebaseapp.com",
  projectId: "phishguard-ai-3e307",
  storageBucket: "phishguard-ai-3e307.firebasestorage.app",
  messagingSenderId: "325902771985",
  appId: "1:325902771985:web:729f48d4aa2547b3580eb0"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged };