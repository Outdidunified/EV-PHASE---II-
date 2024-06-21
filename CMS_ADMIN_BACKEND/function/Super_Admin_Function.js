const database = require('../db');
const logger = require('../logger');

// USER_ROLE Functions
//FetchUserRole
async function FetchUserRole() {
    try {
        const db = await database.connectToDatabase();
        const usersCollection = db.collection("user_roles");
        
        // Query to fetch roles with role_name either "superadmin" or "reselleradmin"
        const user_roles = await usersCollection.find({ 
            role_name: { $in: ["superadmin", "reselleradmin"] } 
        }).toArray();

        // Return the role data
        return user_roles;
    } catch (error) {
        logger.error(`Error fetching user roles: ${error}`);
        throw new Error('Error fetching user roles');
    }
}
// Create UserRole
async function CreateUserRole() {
    
}

//FetchUser
async function FetchUser() {
    try {
        const db = await database.connectToDatabase();
        const usersCollection = db.collection("users");
        
        // Query to fetch users with role_name "superadmin"
        const users = await usersCollection.find({ 
            role_id: 1
        }).toArray();

        // Return the users data
        return users;
    } catch (error) {
        logger.error(`Error fetching users: ${error}`);
        throw new Error('Error fetching users');
    }
}
// Create User
async function CreateUser() {
}

module.exports = { 
    //USER_ROLE
    CreateUserRole,
    FetchUserRole,
    //USER
    CreateUser,
    FetchUser,
};