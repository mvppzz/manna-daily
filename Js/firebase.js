import { initializeApp } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBwM8m8DWuOPmRdEftOM-fkU1RQP02vaGs",
  authDomain: "mannadaily-589f3.firebaseapp.com",
  projectId: "mannadaily-589f3",
  storageBucket: "mannadaily-589f3.firebasestorage.app",
  messagingSenderId: "344382794483",
  appId: "1:344382794483:web:87a64547ed2f3de7372586",
  measurementId: "G-Q1MCYDC2CF"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);