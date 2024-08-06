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
        const associationCollection = db.collection('association_details');

        // Fetch user by email
        const user = await usersCollection.findOne({ email_id: email, status: true });

        // Check if user is found and password matches
        if (!user || user.password !== password || user.role_id !== 4) {
            return { status: 401, message: 'Invalid credentials or deactivated' };
        }

        // Fetch association details and check if the status is not false
        const getAssociationDetails = await associationCollection.findOne({
            association_id: user.association_id,
            status: true,
        });

        // If association details not found or deactivated, return an error
        if (!getAssociationDetails) {
            return { status: 404, message: 'Association details not found or deactivated' };
        }

        // Return reseller details and user ID
        return {
            status: 200,
            data: {
                user_id: user.user_id,
                reseller_id: user.reseller_id,
                client_id: user.client_id,
                email_id: user.email_id,
                association_id: getAssociationDetails.association_id,
                association_name: getAssociationDetails.association_name,
            }
        };

    } catch (error) {
        console.error('Error during authentication:', error);
        return { status: 500, message: 'Internal Server Error' };
    }
};

module.exports = { authenticate };
