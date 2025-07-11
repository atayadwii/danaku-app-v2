// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDgwny2HVN0zuVXFUFMgfRD5W5uHLFkuYs",
  authDomain: "danaku-app.firebaseapp.com",
  projectId: "danaku-app",
  storageBucket: "danaku-app.appspot.com",
  messagingSenderId: "196400703578",
  appId: "1:196400703578:web:6273376356586c6d329063"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);