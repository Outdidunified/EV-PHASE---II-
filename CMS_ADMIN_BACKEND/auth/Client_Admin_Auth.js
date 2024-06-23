const database = require('../db');

const authenticate = async (req, res, next) => {
    try {
        const { email, password, admin } = req.body;
        // Check if email, password, or admin is missing
        if (!email || !password || !admin) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const db = await database.connectToDatabase();
        const usersCollection = db.collection('users');
        const clientCollection = db.collection('client_details');

        // Use aggregation to get user and role in one query with a limit of 1
        const userWithRole = await usersCollection.aggregate([
            { $match: { email_id: email } },
            {
                $lookup: {
                    from: 'user_roles',
                    localField: 'role_id',
                    foreignField: 'role_id',
                    as: 'roles'
                }
            },
            { $unwind: '$roles' },
            { $match: { 'roles.role_name': admin } },
            { $limit: 1 }
        ]).toArray();


        if (userWithRole.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials 1' });
        }

        const user = userWithRole[0];
        const client_id = user.client_id;

        // Fetch the client details
        const getClientDetails = await clientCollection.findOne({ client_id: client_id });


        // Check if user and role are valid
        if (!user || user.password !== password || user.roles.role_name !== admin) {
            return res.status(401).json({ message: 'Invalid credentials 2' });
        }

        // If the user is valid, attach the client details to the request object
        req.clientDetails = getClientDetails;

        // Proceed to the next middleware or route handler
        next();

    } catch (error) {
        console.error('Error during authentication:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};




module.exports = { authenticate };