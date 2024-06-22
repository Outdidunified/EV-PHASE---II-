const database = require('../db');

const authenticate = async (req, res) => {
    try {
        const { email, password, admin } = req.body;

        // Check if email, password, or admin is missing
        if (!email || !password || !admin) {
            return { error: true, status: 401, message: 'Invalid credentials' };
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
            return { error: true, status: 401, message: 'Invalid credentials' };
        }

        // Return user_id and email_id
        return { error: false, user: { user_id: user.user_id, email_id: user.email_id } };

    } catch (error) {
        console.error(error);
        return { error: true, status: 500, message: 'Internal Server Error' };
    }
};




module.exports = { authenticate };