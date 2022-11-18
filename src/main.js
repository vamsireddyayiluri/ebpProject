import firebase from '@firebase/app';
import { createApp } from 'vue'
import App from './App.vue'
import './assets/main.css'
import '@firebase/firestore';
import '@firebase/auth';
import process from './process';
import store from './store';
import router from './router';

const firebaseConfig = {
    apiKey: process.env.VITE_APP_GOOGLE_API_KEY,
    authDomain: process.env.VITE_APP_AUTH_DOMAIN,
    databaseURL: process.env.VITE_APP_DATABASE_URL,
    projectId: process.env.VITE_APP_PROJECT_ID,
    storageBucket: process.env.VITE_APP_STORAGE_BUCKET,
    appId: process.env.VITE_APP_APP_ID
};

// initialize firebase
firebase.initializeApp(firebaseConfig);

firebase.firestore();

// set auth persistence
firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);

// const { docs: users } = await firebase.firestore().collection('users').get();
// users.map(res => {
//     console.log(res.data())
// })

createApp(App).use(store).use(router).mount('#app')
