import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth, signInAnonymously } from 'firebase/auth'



const firebaseConfig = {
  apiKey: "AIzaSyD7Pjf-RyiCRPK26ee9aBtpxPgxa4stVhQ",
  authDomain: "progradical-2025.firebaseapp.com",
  projectId: "progradical-2025",
  storageBucket: "progradical-2025.firebasestorage.app",
  messagingSenderId: "564643608765",
  appId: "1:564643608765:web:5e938b2556257a4f611fd4"
};

export const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)

// Adicionado função para autenticação anônima
export async function ensureAnonAuth() {
  try {
    const cred = await signInAnonymously(auth)
    console.log('✅ Auth anônima OK — UID:', cred.user.uid)
  } catch (e) {
    console.error('❌ Erro ao autenticar anonimamente:', e)
  }
}


console.log('Firebase ENV:', import.meta.env.VITE_PROJECT_ID)
