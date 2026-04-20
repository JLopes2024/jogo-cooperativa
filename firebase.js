import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, updateDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

  const firebaseConfig = {
    apiKey: "AIzaSyCnNJX7Y3CNxXak9SnftTBcXV3hkj4g1ag",
    authDomain: "jogo-cooperativas.firebaseapp.com",
    projectId: "jogo-cooperativas",
    storageBucket: "jogo-cooperativas.firebasestorage.app",
    messagingSenderId: "641682053842",
    appId: "1:641682053842:web:a9de8c738ac7d7bed62b0b"
  };


const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db, collection, addDoc, getDocs, updateDoc, doc };