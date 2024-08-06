const database = require('../db');

const authenticate = async (req) => {
    try {
        const { email, password } = req.body;

        // Check if email or password is missing
        if (!email || !password) {
            return { status: 401, message: 'Invalid credentials' };
        }

        const db = await database.connectToDatabase();
        const usersCollection = db.collection('users');
        const resellerCollection = db.collection('reseller_details');

        // Fetch user by email and check if the status is true
        const user = await usersCollection.findOne({ email_id: email, status: true });

        // Check if user is found and password matches
        if (!user || user.password !== password || user.role_id !== 2) {
            return { status: 401, message: 'Invalid credentials or user is deactivated' };
        }

        // Fetch reseller details using reseller_id and check if the status is true
        const getResellerDetails = await resellerCollection.findOne({ reseller_id: user.reseller_id, status: true });

        // If reseller details not found or deactivated, return an error
        if (!getResellerDetails) {
            return { status: 404, message: 'Reseller details not found or deactivated' };
        }

        // Return reseller details and user ID
        return {
            status: 200,
            data: {
                user_id: user.user_id,
                reseller_name: getResellerDetails.reseller_name,
                email_id: user.email_id,
                reseller_id: getResellerDetails.reseller_id,
            }
        };

    } catch (error) {
        console.error('Error during authentication:', error);
        return { status: 500, message: 'Internal Server Error' };
    }
};

module.exports = { authenticate };
