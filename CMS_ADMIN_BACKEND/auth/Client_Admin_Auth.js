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
        const clientCollection = db.collection('client_details');

        // Fetch user by email
        const user = await usersCollection.findOne({ email_id: email });
        
        // Check if user is found and password matches
        if (!user || user.password !== password) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Fetch client details using client_id
        const getClientdetails = await clientCollection.findOne({ client_id: user.client_id });

        // If client details not found, return an error
        if (!getClientdetails) {
            return res.status(404).json({ message: 'Client details not found' });
        }

        // Return reseller details and user ID
        return {
            user_id: user.user_id,
            reseller_id: user.reseller_id,
            client_name: getClientdetails.client_name,
            client_id: getClientdetails.client_id
        };

    } catch (error) {
        console.error('Error during authentication:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};





module.exports = { authenticate };