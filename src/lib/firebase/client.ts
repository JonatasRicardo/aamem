"use client";

import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

let firebaseApp: FirebaseApp | null = null;

function requireEnv(name: string, value?: string) {
  if (!value) {
    throw new Error(`Missing Firebase client env: ${name}`);
  }

  return value;
}

export function getFirebaseClientApp() {
  if (firebaseApp) {
    return firebaseApp;
  }

  if (getApps().length > 0) {
    firebaseApp = getApps()[0]!;
    return firebaseApp;
  }

  firebaseApp = initializeApp({
    apiKey: requireEnv(
      "NEXT_PUBLIC_FIREBASE_API_KEY",
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY
    ),
    authDomain: requireEnv(
      "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
    ),
    projectId: requireEnv(
      "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    ),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  });

  return firebaseApp;
}

export async function signInWithGoogle() {
  const auth = getAuth(getFirebaseClientApp());
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  const credential = await signInWithPopup(auth, provider);

  return {
    idToken: await credential.user.getIdToken(),
    user: {
      displayName: credential.user.displayName,
      email: credential.user.email,
      photoURL: credential.user.photoURL,
    },
  };
}
