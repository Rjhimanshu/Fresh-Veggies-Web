// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { connectFunctionsEmulator, getFunctions } from "firebase/functions";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDuzW8Rg_VL7xJJnr4c-cw6MwTyLsapIGo",
  authDomain: "fresh-veggies-web-cedc4.firebaseapp.com",
  databaseURL: "https://fresh-veggies-web-cedc4-default-rtdb.firebaseio.com",
  projectId: "fresh-veggies-web-cedc4",
  storageBucket: "fresh-veggies-web-cedc4.firebasestorage.app",
  messagingSenderId: "746189351970",
  appId: "1:746189351970:web:173c5ec43db894a6616e7b",
  measurementId: "G-336VRJXDCT"
};



const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const analytics = getAnalytics(app);
const functions = getFunctions(app); 

if (window.location.hostname === "localhost") {
  console.log("Connecting to Functions emulator on port 5001");
  connectFunctionsEmulator(functions, "localhost", 5001);
}

export { app,auth, db, analytics,functions };