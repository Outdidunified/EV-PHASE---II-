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
        const clientCollection = db.collection('client_details');

        // Fetch user by email and check if the status is true
        const user = await usersCollection.findOne({ email_id: email, status: true });

        // Check if user is found and password matches
        if (!user || user.password !== password) {
            return { status: 401, message: 'Invalid credentials or user is deactivated' };
        }

        // Fetch client details using client_id and check if the status is true
        const getClientDetails = await clientCollection.findOne({ client_id: user.client_id, status: true });

        // If client details not found or deactivated, return an error
        if (!getClientDetails) {
            return { status: 404, message: 'Client details not found or deactivated' };
        }

        // Return reseller details and user ID
        return {
            status: 200,
            data: {
                user_id: user.user_id,
                reseller_id: user.reseller_id,
                client_name: getClientDetails.client_name,
                client_id: getClientDetails.client_id
            }
        };

    } catch (error) {
        console.error('Error during authentication:', error);
        return { status: 500, message: 'Internal Server Error' };
    }
};

module.exports = { authenticate };
