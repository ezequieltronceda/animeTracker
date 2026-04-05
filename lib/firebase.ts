import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyA-W0QiHqU5cOypwWu62Dw5k69cy0-7vBQ",
  authDomain: "oloraculo-876c2.firebaseapp.com",
  projectId: "oloraculo-876c2",
  storageBucket: "oloraculo-876c2.firebasestorage.app",
  messagingSenderId: "654308297169",
  appId: "1:654308297169:web:2ea7055b472e493a5e78f0",
  measurementId: "G-P6E1PCJQFX"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

export { db };