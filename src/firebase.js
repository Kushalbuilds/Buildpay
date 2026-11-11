// Firebase Configuration & Service Initialization
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCtDdI581ASyMvgzLP9uFN6wm2rWNLYWnc",
  authDomain: "buildpay-f3c69.firebaseapp.com",
  projectId: "buildpay-f3c69",
  storageBucket: "buildpay-f3c69.firebasestorage.app",
  messagingSenderId: "281008151210",
  appId: "1:281008151210:web:6a1401b06a3115e0af0ed3",
  measurementId: "G-W6GZ2WTN4N"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const isConfigured = true;

export { app, db, isConfigured };
