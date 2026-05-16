import { getApps, initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: 'AIzaSyDpRvd26PHjySVqo6CSvHNeKZhOGn4-wUw',
  authDomain: 'atomberghackthon.firebaseapp.com',
  projectId: 'atomberghackthon',
  storageBucket: 'atomberghackthon.firebasestorage.app',
  messagingSenderId: '536978904299',
  appId: '1:536978904299:web:0943519952c3cbefc81aae',
  measurementId: 'G-29EEN06DTG',
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : undefined;

export { app, analytics, firebaseConfig };
