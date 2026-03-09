export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json({
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: "washtime-ec882.firebaseapp.com",
    databaseURL: process.env.FIREBASE_DB_URL,
    projectId: "washtime-ec882",
    storageBucket: "washtime-ec882.firebasestorage.app",
    messagingSenderId: "775173825633",
    appId: process.env.FIREBASE_APP_ID
  });
}
