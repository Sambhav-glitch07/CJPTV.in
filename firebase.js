import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInAnonymously,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBqnMGAmlA3BVsVj3NRFGdHP1jNXqKlV-o",
  authDomain: "cjptv-ai.firebaseapp.com",
  projectId: "cjptv-ai",
  storageBucket: "cjptv-ai.firebasestorage.app",
  messagingSenderId: "52376838955",
  appId: "1:52376838955:web:2dd3752fe5d9ee55e91b6e"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();

export {
  signInWithPopup,
  signInAnonymously,
  signOut,
  onAuthStateChanged
};