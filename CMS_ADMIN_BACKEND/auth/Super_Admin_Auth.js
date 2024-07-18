const database = require('../db');

const authenticate = async (req) => {
    try {
        const { email, password } = req.body;

        // Check if email or password is missing
        if (!email || !password) {
            return { error: true, status: 401, message: 'Invalid credentials' };
        }

        const db = await database.connectToDatabase();
        const usersCollection = db.collection('users');
        // const resellerCollection = db.collection('reseller_details');

        // Fetch user by email and check if the status is true
        const user = await usersCollection.findOne({ email_id: email, status: true });

        // Check if user is found and password matches
        if (!user || user.password !== password || user.role_id !== 1) {
            return { error: true, status: 401, message: 'Invalid credentials' };
        }

        // Fetch reseller details using reseller_id and check if the status is true
        //const getResellerDetails = await resellerCollection.findOne({ reseller_id: user.reseller_id, status: true });

        // If reseller details not found or deactivated, return an error
        // if (!getResellerDetails) {
        //     return { status: 404, message: 'Reseller details not found or deactivated' };
        // }

        // Return reseller details and user ID
        return { error: false, user: { user_id: user.user_id, username: user.username, email_id: user.email_id } };

        // const db = await database.connectToDatabase();
        // const usersCollection = db.collection('users');

        // // Query to get user by email with the role
        // const userWithRole = await usersCollection.aggregate([
        //     { $match: { email_id: email, status: true } }, // Check user status
        //     {
        //         $lookup: {
        //             from: 'user_roles',
        //             localField: 'role_id',
        //             foreignField: 'role_id',
        //             as: 'roles'
        //         }
        //     },
        //     { $unwind: '$roles' },
        //     { $match: { 'roles.status': true } }, // Check role status
        //     { $limit: 1 }
        // ]).toArray();

        // if (userWithRole.length === 0) {
        //     return { error: true, status: 401, message: 'Invalid credentials or inactive user/role' };
        // }

        // const user = userWithRole[0];

        // // Check if the password is valid
        // if (user.password !== password) {
        //     return { error: true, status: 401, message: 'Invalid credentials' };
        // }

        // // Return user_id and email_id
        // return { error: false, user: { user_id: user.user_id, username: user.username, email_id: user.email_id } };

    } catch (error) {
        console.error(error);
        return { error: true, status: 500, message: 'Internal Server Error' };
    }
};

module.exports = { authenticate };
