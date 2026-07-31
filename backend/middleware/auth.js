const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

// Ensure this path matches the JSON file provided by the user
const serviceAccount = require('../notora-univora-firebase-adminsdk-fbsvc-db69e22b86.json');

initializeApp({
  credential: cert(serviceAccount)
});

const verifyToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
    }

    const idToken = authHeader.split('Bearer ')[1];
    
    try {
        const decodedToken = await getAuth().verifyIdToken(idToken);
        req.user = decodedToken;
        next();
    } catch (error) {
        console.error('Error verifying Firebase ID token:', error);
        return res.status(403).json({ error: 'Unauthorized: Invalid token' });
    }
};

module.exports = { verifyToken };
