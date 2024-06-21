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

        const user = userWithRole[0];
        // Check if user and role are valid
        if (!user || user.password !== password || user.roles.role_name !== admin) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Continue to the next middleware or route handler
        next();

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};


module.exports = { authenticate };