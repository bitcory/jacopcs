import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAKDQHVh6htoqSLzfb29pu-ZziPC-f3grA",
  authDomain: "call-recorder-e835d.firebaseapp.com",
  projectId: "call-recorder-e835d",
  storageBucket: "call-recorder-e835d.firebasestorage.app",
  messagingSenderId: "413448527726",
  appId: "1:413448527726:web:80c49c70f8ee5e4524ab7f",
  measurementId: "G-5WN686W60P"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);