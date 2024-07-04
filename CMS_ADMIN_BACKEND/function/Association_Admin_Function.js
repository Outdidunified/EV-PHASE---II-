const database = require('../db');
const logger = require('../logger');


// PROFILE Functions
//FetchUserProfile
async function FetchUserProfile(req, res) {
    const { user_id } = req.body;

    try {
        const db = await database.connectToDatabase();
        const usersCollection = db.collection("users");
        
        // Aggregation pipeline to join users and reseller_details collections
        const result = await usersCollection.aggregate([
            { $match: { user_id: user_id } },
            {
                $lookup: {
                    from: 'association_details',
                    localField: 'association_id',
                    foreignField: 'association_id',
                    as: 'association_details'
                }
            },
            {
                $project: {
                    _id: 0,
                    user_id: 1,
                    username: 1,
                    email_id: 1,
                    phone_no: 1,
                    wallet_bal: 1,
                    password:1,
                    autostop_time: 1,
                    autostop_unit: 1,
                    autostop_price: 1,
                    autostop_time_is_checked: 1,
                    autostop_unit_is_checked: 1,
                    autostop_price_is_checked: 1,
                    created_date: 1,
                    modified_date: 1,
                    created_by: 1,
                    modified_by: 1,
                    status: 1,
                    association_details: 1
                }
            }
        ]).toArray();

        if (result.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const userProfile = result[0];

        return userProfile;
        
    } catch (error) {
        logger.error(`Error fetching user: ${error}`);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}
// UpdateUserProfile
async function UpdateUserProfile(req, res,next) {
    const { user_id, username, phone_no, password, } = req.body;

    try {
        // Validate the input
        if (!user_id || !username || !phone_no || !password  ) {
            return res.status(400).json({ message: 'User ID, Username, Phone Number and Password are required' });
        }

        const db = await database.connectToDatabase();
        const usersCollection = db.collection("users");

        // Check if the user exists
        const existingUser = await usersCollection.findOne({ user_id: user_id });
        if (!existingUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update the user profile
        const updateResult = await usersCollection.updateOne(
            { user_id: user_id },
            {
                $set: {
                    username: username,
                    phone_no: phone_no,
                    password: password,
                    modified_by: username,
                    modified_date: new Date(),
                }
            }
        );

        if (updateResult.matchedCount === 0) {
            return res.status(500).json({ message: 'Failed to update user profile' });
        }
        next();        
    } catch (error) {
        console.error(error);
        logger.error(`Error updating user profile: ${error}`);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}
//UpdateAssociationProfile
async function UpdateAssociationProfile(req, res, next) {
    const { association_id, modified_by, association_phone_no, association_address } = req.body;

    try {
        // Validate required fields
        if (!association_id || !modified_by || !association_phone_no || !association_address) {
            return res.status(400).json({ message: 'association ID, modified_by, phone number, and association address are required' });
        }

        const db = await database.connectToDatabase();
        const clientCollection = db.collection("association_details");

        // Update the client profile
        const updateResult = await clientCollection.updateOne(
            { association_id: association_id },
            {
                $set: {
                    association_phone_no: association_phone_no,
                    association_address: association_address,
                    modified_date: new Date(),
                    modified_by: modified_by
                }
            }
        );

        if (updateResult.matchedCount === 0) {
            return res.status(404).json({ message: 'Client not found' });
        }

        if (updateResult.modifiedCount === 0) {
            return res.status(500).json({ message: 'Failed to update client profile' });
        }

        next();
    } catch (error) {
        console.error(`Error updating association profile: ${error}`);
        logger.error(`Error updating association profile: ${error}`);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}

// USER Functions
//FetchUser
async function FetchUser() {
    try {
        const db = await database.connectToDatabase();
        const usersCollection = db.collection("users");
        
        // Query to fetch users with role_id 
        const users = await usersCollection.find({ role_id: { $in: [4, 5] } }).toArray();

        // Return the users data
        return users;
    } catch (error) {
        logger.error(`Error fetching users by role_id: ${error}`);
        throw new Error('Error fetching users by role_id');
    }
}
//FetchSpecificUserRoleForSelection
async function FetchSpecificUserRoleForSelection() {
    try {
        const db = await database.connectToDatabase();
        const usersCollection = db.collection("user_roles");

        // Query to fetch all reseller_id and reseller_name
        const roles = await usersCollection.find(
        { role_id: { $in: [5] } }, // Filter to fetch role_id 1 and 2
        {
            projection: {
                role_id: 1,
                role_name: 1,
                _id: 0 // Exclude _id from the result
            }
        }
        ).toArray();
        // Return the users data
        return roles;
    } catch (error) {
        logger.error(`Error fetching users: ${error}`);
        throw new Error('Error fetching users');
    }
}
//CreateUser
async function CreateUser(req, res, next) {
    try {
        const { role_id, reseller_id, client_id, association_id,username, email_id, password, phone_no, created_by } = req.body;

        // Validate the input
        if (!username || !role_id || !email_id || !password || !created_by || !reseller_id || !client_id || !association_id) {
            return res.status(400).json({ message: 'Username, Role ID, Email, Password, Created By, Reseller ID, Client ID, and Association ID are required' });
        }

        const db = await database.connectToDatabase();
        const Users = db.collection("users");
        const UserRole = db.collection("user_roles");

        // Check if the role ID exists
        const existingRole = await UserRole.findOne({ role_id: role_id });
        if (!existingRole) {
            return res.status(400).json({ message: 'Invalid Role ID' });
        }
        
        // Check if the email_id already exists
        const existingUser = await Users.findOne({ email_id: email_id });
        if (existingUser) {
            return res.status(400).json({ message: 'Email ID already exists' });
        }

        // Use aggregation to fetch the highest user_id
        const lastUser = await Users.find().sort({ user_id: -1 }).limit(1).toArray();
        let newUserId = 1; // Default user_id if no users exist
        if (lastUser.length > 0) {
            newUserId = lastUser[0].user_id + 1;
        }

        // Insert the new user
        await Users.insertOne({
            role_id: role_id,
            reseller_id: reseller_id, // Default value, adjust if necessary
            client_id: client_id, // Default value, adjust if necessary
            association_id: association_id, // Default value, adjust if necessary
            user_id: newUserId,
            username: username,
            email_id: email_id,
            password: password,
            phone_no: phone_no,
            wallet_bal: 0,
            autostop_time: null,
            autostop_unit: null,
            autostop_price: null,
            autostop_time_is_checked: null,
            autostop_unit_is_checked: null,
            autostop_price_is_checked: null,
            created_date: new Date(),
            modified_date: null,
            created_by: created_by,
            modified_by: null,
            status: true
        });


        next();
    } catch (error) {
        console.error(error);
        logger.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}
// Update User
async function UpdateUser(req, res, next) {
    try {
        const { user_id, username, phone_no, password, wallet_bal, modified_by, status } = req.body;

        // Validate the input
        if (!user_id || !username || !password || !modified_by ){
            return res.status(400).json({ message: 'User ID, Username and Modified By are required' });
        }

        const db = await database.connectToDatabase();
        const Users = db.collection("users");

        // Check if the user exists
        const existingUser = await Users.findOne({ user_id: user_id });
        if (!existingUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update the user document
        const updateResult = await Users.updateOne(
            { user_id: user_id },
            {
                $set: {
                    username: username,
                    phone_no: phone_no,
                    wallet_bal: wallet_bal || existingUser.wallet_bal, 
                    modified_date: new Date(),
                    modified_by: modified_by,
                    status: status,
                }
            }
        );

        if (updateResult.matchedCount === 0) {
            return res.status(500).json({ message: 'Failed to update user' });
        }

        next();
    } catch (error) {
        console.error(error);
        logger.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}
//DeActivate User
async function DeActivateUser(req, res, next) {
    try {
        const { user_id, modified_by, status } = req.body;

        // Validate the input
        if (!modified_by || !user_id || typeof status !== 'boolean') {
            return res.status(400).json({ message: 'User ID, Modified By, and Status (boolean) are required' });
        }

        const db = await database.connectToDatabase();
        const Users = db.collection("users");

        // Check if the user exists
        const existingUser = await Users.findOne({ user_id: user_id });
        if (!existingUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update user status
        const updateResult = await Users.updateOne(
            { user_id: user_id },
            {
                $set: {
                    status: status,
                    modified_by: modified_by,
                    modified_date: new Date()
                }
            }
        );

        if (updateResult.matchedCount === 0) {
            return res.status(500).json({ message: 'Failed to update user status' });
        }

        next();
    } catch (error) {
        console.error(error);
        logger.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}

//CHARGER Function
//FetchAllocatedChargerByClientToAssociation
async function FetchAllocatedChargerByClientToAssociation(req) {
    try {
        const {association_id} = req.body
        const db = await database.connectToDatabase();
        const devicesCollection = db.collection("charger_details");

        const chargers = await devicesCollection.find({ assigned_association_id: association_id  }).toArray();

        return chargers; // Only return data, don't send response
    } catch (error) {
        console.error(`Error fetching chargers: ${error}`);
        throw new Error('Failed to fetch chargers'); // Throw error, handle in route
    }
}
//UpdateDevice 
async function UpdateDevice(req, res, next) {
    try {
        const { modified_by, charger_id, charger_accessibility , wifi_username, wifi_password,lat, long} = req.body;
        // Validate the input
        if (!modified_by || !charger_id || !charger_accessibility || !wifi_username || !wifi_password || !lat || !long) {
            return res.status(400).json({ message: 'Username, chargerID, charger_accessibility , wifi_username, wifi_password,lat, long}and Status (boolean) are required' });
        }

        const db = await database.connectToDatabase();
        const devicesCollection = db.collection("charger_details");

        // Check if the charger exists
        const existingRole = await devicesCollection.findOne({ charger_id: charger_id });
        if (!existingRole) {
            return res.status(404).json({ message: 'chargerID not found' });
        }

        // Update existing role
        const updateResult = await devicesCollection.updateOne(
            { charger_id: charger_id },
            {
                $set: {
                    charger_accessibility: charger_accessibility,
                    wifi_username: wifi_username,
                    wifi_password: wifi_password,
                    lat: lat,
                    long: long,
                    modified_by: modified_by,
                    modified_date: new Date()
                }
            }
        );

        if (updateResult.matchedCount === 0) {
            return res.status(500).json({ message: 'Failed to update charger' });
        }

        next();
    } catch (error) {
        console.error(error);
        logger.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}
//DeActivateOrActivate 
async function DeActivateOrActivateCharger(req, res, next) {
    try {
        const { modified_by, charger_id, status } = req.body;
        // Validate the input
        if (!modified_by || !charger_id || typeof status !== 'boolean') {
            return res.status(400).json({ message: 'Username, chargerID, and Status (boolean) are required' });
        }

        const db = await database.connectToDatabase();
        const devicesCollection = db.collection("charger_details");

        // Check if the charger exists
        const existingRole = await devicesCollection.findOne({ charger_id: charger_id });
        if (!existingRole) {
            return res.status(404).json({ message: 'chargerID not found' });
        }

        // Update existing role
        const updateResult = await devicesCollection.updateOne(
            { charger_id: charger_id },
            {
                $set: {
                    status: status,
                    modified_by: modified_by,
                    modified_date: new Date()
                }
            }
        );

        if (updateResult.matchedCount === 0) {
            return res.status(500).json({ message: 'Failed to update charger' });
        }

        next();
    } catch (error) {
        console.error(error);
        logger.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}

// WALLET Functions
//FetchCommissionAmtAssociation
async function FetchCommissionAmtAssociation(req, res) {
    const { user_id } = req.body;
    try {
        const db = await database.connectToDatabase();
        const usersCollection = db.collection("users");
        
        // Fetch the user with the specified user_id
        const user = await usersCollection.findOne({ user_id: user_id });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Extract wallet balance from user object
        const walletBalance = user.wallet_bal;

        return walletBalance;

    } catch (error) {
        console.error(`Error fetching wallet balance: ${error}`);
        logger.error(`Error fetching wallet balance: ${error}`);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}

module.exports = { 
    //PROFILE
    FetchUserProfile,
    UpdateUserProfile,
    UpdateAssociationProfile,
    //MANAGE USER
    FetchUser,
    FetchSpecificUserRoleForSelection,
    CreateUser,
    UpdateUser,
    DeActivateUser,
    //MANAGE CHARGER
    FetchAllocatedChargerByClientToAssociation,
    UpdateDevice,
    DeActivateOrActivateCharger,
    //WALLET
    FetchCommissionAmtAssociation,
}