import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from 'firebase/firestore';

const firebase_Config = {
  apiKey: "AIzaSyDuzW8Rg_VL7xJJnr4c-cw6MwTyLsapIGo",
  authDomain: "fresh-veggies-web-cedc4.firebaseapp.com",
  projectId: "fresh-veggies-web-cedc4",
  storageBucket: "fresh-veggies-web-cedc4.firebasestorage.app",
  messagingSenderId: "746189351970",
  appId: "1:746189351970:web:79dcd66b24a71ec6616e7b",
  measurementId: "G-482E50RDNY"
};


const app = initializeApp(firebase_Config);
const auth = getAuth(app);
const db = getFirestore(app);
const analytics = getAnalytics(app);

export { app,auth, analytics,db};