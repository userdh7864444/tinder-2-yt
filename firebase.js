// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBLNhjtHy5bp75xnT0jhjYiwWK9T2JoHXk",
    authDomain: "tinder-2-yt-62dbc.firebaseapp.com",
    projectId: "tinder-2-yt-62dbc",
    storageBucket: "tinder-2-yt-62dbc.appspot.com",
    messagingSenderId: "569678879951",
    appId: "1:569678879951:web:7729b3e58dc3539144abba"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth()
const db = getFirestore()

export { auth, db }