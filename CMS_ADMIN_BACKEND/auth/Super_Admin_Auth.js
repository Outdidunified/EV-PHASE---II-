const { connectToDatabase } = require('../db.js');

const authenticate = async(req, res, next) => {
    try {
        const email = req.body.email;
        const password = req.body.password;
        const admin = req.body.superadmin;

        const db = await connectToDatabase();
        const usersCollection = db.collection('users');

        // Check if both email and password are empty
        if (!email || !password || !admin) {
            const errorMessage = 'Invalid credentials';
            return res.status(401).json({ message: errorMessage });
        }

        const user = await usersCollection.findOne({ username: email });

        if (!user || user.password !== password || user.role_id !== 1) {
            const errorMessage = 'Invalid credentials';
            return res.status(401).json({ message: errorMessage });
        }

        // Continue to the next middleware or route handler
        next();

    } catch (error) {
        console.error(error);
        const errorMessage = 'Internal Server Error';
        return res.status(500).json({ message: errorMessage });
    }
};


module.exports = { authenticate };