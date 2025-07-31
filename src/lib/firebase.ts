// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDFTheZ98lTl_P9uFV-qjFy2UpKCK9WKQk",
  authDomain: "transfers-argentina.firebaseapp.com",
  projectId: "transfers-argentina",
  storageBucket: "transfers-argentina.appspot.com",
  messagingSenderId: "633589706319",
  appId: "1:633589706319:web:a06a1d8bcc5460d440443a"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export { app, auth };
