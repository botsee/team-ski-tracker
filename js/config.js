// Firebase SDK betöltése CDN-ről
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Firebase konfiguráció
const firebaseConfig = {
  apiKey: "AIzaSyC3H-38btCyfZAnI1uAROEZgVOZOQgXXw8",
  authDomain: "team-ski-track.firebaseapp.com",
  databaseURL: "https://team-ski-track-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "team-ski-track",
  storageBucket: "team-ski-track.firebasestorage.app",
  messagingSenderId: "1081049045752",
  appId: "1:1081049045752:web:51c1fc8d81b39c784db90d"
};

// Firebase inicializálás
export const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
