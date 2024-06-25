const database = require('../db');

const authenticate = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        // Check if email or password is missing
        if (!email || !password) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const db = await database.connectToDatabase();
        const usersCollection = db.collection('users');
        const resellerCollection = db.collection('reseller_details');

        // Fetch user by email
        const user = await usersCollection.findOne({ email_id: email });

        // Check if user is found and password matches
        if (!user || user.password !== password) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Fetch reseller details using reseller_id
        const getResellerdetails = await resellerCollection.findOne({ reseller_id: user.reseller_id });

        // If reseller details not found, return an error
        if (!getResellerdetails) {
            return res.status(404).json({ message: 'Reseller details not found' });
        }

        // Return reseller details and user ID
        return {
            user_id: user.user_id,
            reseller_name: getResellerdetails.reseller_name,
            reseller_id: getResellerdetails.reseller_id
        };

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

module.exports = { authenticate };



