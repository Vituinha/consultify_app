import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
    apiKey: "AIzaSyCSbmpNQuNH2OiK2jm2YCBKAIYNkX0AaNo",
    authDomain: "tickets-aec80.firebaseapp.com",
    projectId: "tickets-aec80",
    storageBucket: "tickets-aec80.appspot.com",
    messagingSenderId: "12959684187",
    appId: "1:12959684187:web:d7905811624af45446117e",
    measurementId: "G-CX60JXRHZ9"
};
  
const firebaseApp = initializeApp(firebaseConfig)

const db = getFirestore(firebaseApp)
const auth = getAuth(firebaseApp)
const storage = getStorage(firebaseApp)

export { db, auth, storage }
