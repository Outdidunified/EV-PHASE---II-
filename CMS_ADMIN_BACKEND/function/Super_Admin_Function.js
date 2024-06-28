const database = require('../db');
const logger = require('../logger');

// USER_ROLE Functions
//FetchUserRole
async function FetchUserRole() {
    try {
        const db = await database.connectToDatabase();
        const usersCollection = db.collection("user_roles");
        
        // Query to fetch all roles from usersCollection
        const user_roles = await usersCollection.find().toArray();

        // Return the role data
        return user_roles;
    } catch (error) {
        logger.error(`Error fetching user roles: ${error}`);
        throw new Error('Error fetching user roles');
    }
}
//FetchSpecificUserRole
async function FetchSpecificUserRole() {
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
async function CreateUserRole(req, res, next) {
    try {
        const { created_by, rolename } = req.body;

        // Validate the input
        if (!created_by || !rolename) {
            return res.status(400).json({ message: 'Username and Role Name are required' });
        }

        const db = await database.connectToDatabase();
        const UserRole = db.collection("user_roles");

        // Use aggregation to check for existing role name and fetch the highest role_id
        const aggregationResult = await UserRole.aggregate([
            {
                $facet: {
                    existingRole: [
                        { $match: { role_name: rolename } },
                        { $limit: 1 }
                    ],
                    lastRole: [
                        { $sort: { role_id: -1 } },
                        { $limit: 1 }
                    ]
                }
            }
        ]).toArray();

        const existingRole = aggregationResult[0].existingRole[0];
        const lastRole = aggregationResult[0].lastRole[0];

        // Check if the role name already exists
        if (existingRole) {
            return res.status(400).json({ message: 'Role Name already exists' });
        }

        // Determine the new role_id
        let newRoleId = 1; // Default role_id if no roles exist
        if (lastRole) {
            newRoleId = lastRole.role_id + 1;
        }

        // Insert the new user role
        await UserRole.insertOne({
            role_id: newRoleId,
            role_name: rolename,
            created_date: new Date(),
            created_by: created_by, 
            modified_by: null, 
            modified_date: null,
            status: true
        });

        next();
    } catch (error) {
        console.error(error);
        logger.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}
//DeActivateOrActivate UserRole
async function DeActivateOrActivateUserRole(req, res, next) {
    try {
        const { modified_by, role_id, status } = req.body;

        // Validate the input
        if (!modified_by || !role_id || typeof status !== 'boolean') {
            return res.status(400).json({ message: 'Username, Role Name, and Status (boolean) are required' });
        }

        const db = await database.connectToDatabase();
        const UserRole = db.collection("user_roles");

        // Check if the role exists
        const existingRole = await UserRole.findOne({ role_id: role_id });
        if (!existingRole) {
            return res.status(404).json({ message: 'Role not found' });
        }

        // Update existing role
        const updateResult = await UserRole.updateOne(
            { role_id: role_id },
            {
                $set: {
                    status: status,
                    modified_by: modified_by,
                    modified_date: new Date()
                }
            }
        );

        if (updateResult.matchedCount === 0) {
            return res.status(500).json({ message: 'Failed to update user role' });
        }

        next();
    } catch (error) {
        console.error(error);
        logger.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}

// USER Functions
//FetchUser
async function FetchUser() {
    try {
        const db = await database.connectToDatabase();
        const usersCollection = db.collection("users");
        
        // Query to fetch all users
        const users = await usersCollection.find().toArray();

        // Return the users data
        return users;
    } catch (error) {
        logger.error(`Error fetching users: ${error}`);
        throw new Error('Error fetching users');
    }
}
//FetchSpecificUserRoleForSelection
async function FetchSpecificUserRoleForSelection() {
    try {
        const db = await database.connectToDatabase();
        const usersCollection = db.collection("user_roles");

           // Query to fetch all reseller_id and reseller_name
           const roles = await usersCollection.find(
            { role_id: { $in: [1, 2] } }, // Filter to fetch role_id 1 and 2
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
// FetchResellerForSelection
async function FetchResellerForSelection() {
    try {
        const db = await database.connectToDatabase();
        const resellersCollection = db.collection("reseller_details");

        // Query to fetch all reseller_id and reseller_name
        const resellers = await resellersCollection.find(
            {}, // No filter to fetch all resellers
            {
                projection: {
                    reseller_id: 1,
                    reseller_name: 1,
                    _id: 0 // Exclude _id from the result
                }
            }
        ).toArray();

        // Return the resellers data
        return resellers;
    } catch (error) {
        logger.error(`Error fetching resellers: ${error}`);
        throw new Error('Error fetching resellers');
    }
}
// Create User
async function CreateUser(req, res, next) {
    try {
        const { role_id, reseller_id,username, email_id, password, phone_no, wallet_bal, created_by } = req.body;

        // Validate the input
        if (!username || !role_id || !email_id || !password || !created_by || !reseller_id) {
            return res.status(400).json({ message: 'Username, Role ID, Email, reseller id ,Password, and Created By are required' });
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
            client_id: null, // Default value, adjust if necessary
            association_id: null, // Default value, adjust if necessary
            user_id: newUserId,
            username: username,
            email_id: email_id,
            password: password,
            phone_no: phone_no,
            wallet_bal: wallet_bal || 0,
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

// PROFILE Functions
//FetchUserProfile
async function FetchUserProfile(req, res) {
    const { user_id } = req.body;

    try {
        const db = await database.connectToDatabase();
        const usersCollection = db.collection("users");
        
        // Query to fetch the user by user_id
        const user = await usersCollection.findOne({ user_id: user_id });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        return user;
        
    } catch (error) {
        logger.error(`Error fetching user: ${error}`);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}
// UpdateUserProfile
async function UpdateUserProfile(req, res,next) {
    const { user_id, username, phone_no, password, modified_by, status } = req.body;

    try {
        // Validate the input
        if (!user_id || !username || !phone_no || !password || !modified_by || typeof status !== 'boolean') {
            return res.status(400).json({ message: 'User ID, Username, Phone Number, Password, Modified By, and Status are required' });
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
                    modified_by: modified_by,
                    modified_date: new Date(),
                    status: status
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

//CHARGER Function
//FetchCharger(Which are un-allocated to reseller)
async function FetchCharger() {
    try {
        const db = await database.connectToDatabase();
        const devicesCollection = db.collection("charger_details");

        // Query to fetch chargers where assigned_reseller_id is null
        const chargers = await devicesCollection.find({ assigned_reseller_id: null }).toArray();

        return chargers; // Only return data, don't send response
    } catch (error) {
        console.error(`Error fetching chargers: ${error}`);
        throw new Error('Failed to fetch chargers'); // Throw error, handle in route
    }
}
//CreateCharger
async function CreateCharger(req, res) {
    try {
        const { charger_id, tag_id, model, type, vendor, gun_connector, max_current, max_power, socket_count, created_by } = req.body;

        // Validate the input
        if (!charger_id || !tag_id || !model || !type ||
            !vendor || !gun_connector || !max_current ||
            !max_power || !socket_count || !created_by) {
            return res.status(400).json({ message: 'Charger ID, Tag ID, Model, Type, Vendor, Gun Connector, Max Current, Max Power, Socket Count, and Created By are required' });
        }

        const db = await database.connectToDatabase();
        const devicesCollection = db.collection("charger_details");

        // Check if charger with the same charger_id already exists
        const existingCharger = await devicesCollection.findOne({ charger_id });
        if (existingCharger) {
            return res.status(409).json({ message: `Charger with ID ${charger_id} already exists` });
        }

        // Insert the new device
        await devicesCollection.insertOne({
            charger_id,
            transaction_id: null, // Default or null, depending on your needs
            tag_id,
            model,
            type,
            vendor,
            gun_connector,
            max_current,
            max_power,
            socket_count,
            current_or_active_user: null, // Optional fields with default or null values
            ip: null,
            lat: null,
            long: null,
            wifi_password: null,
            short_description: null,
            charger_accessibility: null,
            reseller_commission: null,
            client_commission: null,
            assigned_reseller_id: null,
            assigned_client_id: null,
            assigned_association_id: null,
            finance_id: null,
            assigned_reseller_date: null,
            assigned_client_date: null,
            assigned_association_date: null,
            created_date: new Date(),
            modified_date: null,
            created_by,
            modified_by: null,
            status: true
        });

        return res.status(200).json({ status: 'Success', message: 'Charger created successfully' });

    } catch (error) {
        console.error(error);
        logger.error(`Error creating device: ${error}`);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}
// UpdateCharger
async function UpdateCharger(req, res) {
    try {
        const { charger_id, tag_id, model, type, vendor, gun_connector, max_current, max_power, socket_count, modified_by } = req.body;

        // Validate the input - ensure charger_id and other required fields are provided
        if (!charger_id || !tag_id || !model || !type ||
            !vendor || !gun_connector || !max_current ||
            !max_power || !socket_count || !modified_by) {
            return res.status(400).json({ message: 'Charger ID, Tag ID, Model, Type, Vendor, Gun Connector, Max Current, Max Power, Socket Count, and Created By are required' });
        }

        const db = await database.connectToDatabase();
        const devicesCollection = db.collection("charger_details");

        // Check if the charger exists
        const existingCharger = await devicesCollection.findOne({ charger_id });

        if (!existingCharger) {
            return res.status(404).json({ message: 'Charger not found' });
        }

        // Update the charger document
        const updateResult = await devicesCollection.updateOne(
            { charger_id },
            {
                $set: {
                    tag_id,
                    model,
                    type,
                    vendor,
                    gun_connector,
                    max_current,
                    max_power,
                    socket_count,
                    modified_by,
                    modified_date: new Date(),
                }
            }
        );

        if (updateResult.modifiedCount === 0) {
            return res.status(500).json({ message: 'Failed to update charger' });
        }

        return res.status(200).json({ status: 'Success', message: 'Charger updated successfully' });

    } catch (error) {
        console.error(error);
        logger.error(`Error updating charger: ${error}`);
        return res.status(500).json({ message: 'Internal Server Error' });
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

//RESELLER Function
//FetchResellers
async function FetchResellers(req, res) {
    try {
        const db = await database.connectToDatabase();
        const resellerCollection = db.collection("reseller_details");

        // Query to fetch all resellers
        const resellers = await resellerCollection.find({}).toArray();

        if (!resellers || resellers.length === 0) {
            return res.status(404).json({ message: 'No resellers found' });
        }

        // Return the reseller data
        return res.status(200).json({ status: 'Success', data: resellers });

    } catch (error) {
        console.error(error);
        logger.error(`Error fetching resellers: ${error}`);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}
//FetchAssignedClients
async function FetchAssignedClients(req, res) {
    try {
        const { reseller_id } = req.body;
        // Validate reseller_id
        if (!reseller_id) {
            return res.status(400).json({ message: 'Reseller ID is required' });
        }

        const db = await database.connectToDatabase();
        const clientCollection = db.collection("client_details");

        // Query to fetch clients for the specific reseller_id
        const clients = await clientCollection.find({ reseller_id: reseller_id }).toArray();

        if (!clients || clients.length === 0) {
            return res.status(404).json({ message: 'No client details found for the specified reseller_id' });
        }

        // Return the client data
        return res.status(200).json({ status: 'Success', data: clients });

    } catch (error) {
        console.error(error);
        logger.error(`Error fetching clients: ${error}`);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}
// FetchChargerDetailsWithSession
async function FetchChargerDetailsWithSession(req) {
    try {
        const { reseller_id } = req.body;

        // Validate reseller_id
        if (!reseller_id) {
            throw new Error('Reseller ID is required');
        }

        const db = await database.connectToDatabase();
        const chargerCollection = db.collection("charger_details");

        // Aggregation pipeline to fetch charger details with sorted session data
        const result = await chargerCollection.aggregate([
            {
                $match: { assigned_reseller_id: reseller_id }
            },
            {
                $lookup: {
                    from: "device_session_details",
                    localField: "charger_id",
                    foreignField: "charger_id",
                    as: "sessions"
                }
            },
            {
                $addFields: {
                    chargerID: "$charger_id",
                    sessiondata: {
                        $cond: {
                            if: { $gt: [{ $size: "$sessions" }, 0] },
                            then: {
                                $map: {
                                    input: {
                                        $sortArray: {
                                            input: "$sessions",
                                            sortBy: { stop_time: -1 }
                                        }
                                    },
                                    as: "session",
                                    in: "$$session"
                                }
                            },
                            else: ["No session found"]
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    chargerID: 1,
                    sessiondata: 1
                }
            }
        ]).toArray();

        if (!result || result.length === 0) {
            throw new Error('No chargers found for the specified reseller_id');
        }

        // Sort sessiondata within each chargerID based on the first session's stop_time
        result.forEach(charger => {
            if (charger.sessiondata.length > 1) {
                charger.sessiondata.sort((a, b) => new Date(b.stop_time) - new Date(a.stop_time));
            }
        });

        return result;

    } catch (error) {
        console.error(error);
        logger.error(`Error fetching charger details: ${error.message}`);
        throw error;
    }
}

// CreateReseller 
async function CreateReseller(req, res) {
    try {
        const {
            reseller_name,
            reseller_phone_no,
            reseller_email_id,
            reseller_address,
            created_by
        } = req.body;

        // Validate required fields
        if (!reseller_name || !reseller_phone_no || !reseller_email_id || !reseller_address || !created_by) {
            return res.status(400).json({ message: 'Reseller Name, Phone Number, Email ID, Address, and Created By are required' });
        }

        const db = await database.connectToDatabase();
        const resellerCollection = db.collection("reseller_details");

        // Check if a reseller with the same phone number or email ID already exists
        const existingReseller = await resellerCollection.findOne({
            $or: [
                { reseller_email_id: reseller_email_id }
            ]
        });

        if (existingReseller) {
            return res.status(400).json({ message: 'Reseller already exists' });
        }

        // Use aggregation to fetch the highest reseller_id
        const lastReseller = await resellerCollection.find().sort({ reseller_id: -1 }).limit(1).toArray();
        let newResellerId = 1; // Default reseller_id if no resellers exist
        if (lastReseller.length > 0) {
            newResellerId = lastReseller[0].reseller_id + 1;
        }

        // Insert the new reseller
        await resellerCollection.insertOne({
            reseller_id: newResellerId,
            reseller_name,
            reseller_phone_no,
            reseller_email_id,
            reseller_address,
            created_date: new Date(),
            modified_date: null,
            created_by,
            modified_by: null,
            status: true
        });

        return res.status(200).json({ message: 'Reseller created successfully' });

    } catch (error) {
        console.error(error);
        logger.error(`Error creating reseller: ${error}`);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}
//UpdateReseller 
async function UpdateReseller(req, res) {
    try {
        const {
            reseller_id,
            reseller_phone_no,
            reseller_address,
            modified_by,
            status
        } = req.body;

        // Validate required fields
        if (!reseller_id  || !reseller_phone_no || !reseller_address || !modified_by || typeof status !== 'boolean') {
            return res.status(400).json({ message: 'Reseller ID, Name, Phone Number, status, Email ID, Address, and Modified By are required' });
        }

        const db = await database.connectToDatabase();
        const resellerCollection = db.collection("reseller_details");

        // Check if the reseller exists
        const existingReseller = await resellerCollection.findOne({ reseller_id: reseller_id });

        if (!existingReseller) {
            return res.status(404).json({ message: 'Reseller not found' });
        }

        // Update the reseller details
        const result = await resellerCollection.updateOne(
            { reseller_id: reseller_id },
            {
                $set: {
                    reseller_phone_no,
                    reseller_address,
                    modified_date: new Date(),
                    modified_by,
                    status
                }
            }
        );

        if (result.modifiedCount === 0) {
            throw new Error('Failed to update reseller');
        }

        return res.status(200).json({ message: 'Reseller updated successfully' });

    } catch (error) {
        console.error(error);
        logger.error(`Error updating reseller: ${error}`);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}
//DeActivateOrActivate 
async function DeActivateOrActivateReseller(req, res, next) {
    try {
        const { modified_by, reseller_id, status } = req.body;

        // Validate the input
        if (!modified_by || !reseller_id || typeof status !== 'boolean') {
            return res.status(400).json({ message: 'Username, reseller_id, and Status (boolean) are required' });
        }

        const db = await database.connectToDatabase();
        const UserRole = db.collection("reseller_details");

        // Check if the role exists
        const existingRole = await UserRole.findOne({ reseller_id: reseller_id });
        if (!existingRole) {
            return res.status(404).json({ message: 'reseller not found' });
        }

        // Update existing role
        const updateResult = await UserRole.updateOne(
            { reseller_id: reseller_id },
            {
                $set: {
                    status: status,
                    modified_by: modified_by,
                    modified_date: new Date()
                }
            }
        );

        if (updateResult.matchedCount === 0) {
            return res.status(500).json({ message: 'Failed to update reseller' });
        }

        next();
    } catch (error) {
        console.error(error);
        logger.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}

//ASSIGN_CHARGER_TO_RESELLER
//AssginChargerToReseller 
async function AssginChargerToReseller(req, res) {
    try {
        const { reseller_id, charger_ids, modified_by } = req.body;
        
        // Validate required fields
        if (!reseller_id || !charger_ids || !modified_by) {
            return res.status(400).json({ message: 'Reseller ID, Charger IDs, and Modified By are required' });
        }

        const db = await database.connectToDatabase();
        const devicesCollection = db.collection("charger_details");

        // Ensure charger_ids is an array
        let chargerIdsArray = Array.isArray(charger_ids) ? charger_ids : [charger_ids];
        
        // Check if all the chargers exist
        const existingChargers = await devicesCollection.find({ charger_id: { $in: chargerIdsArray } }).toArray();

        if (existingChargers.length !== chargerIdsArray.length) {
            return res.status(404).json({ message: 'One or more chargers not found' });
        }

        // Update the reseller details for all chargers
        const result = await devicesCollection.updateMany(
            { charger_id: { $in: chargerIdsArray } },
            {
                $set: {
                    assigned_reseller_id: reseller_id,
                    superadmin_commission: 0,
                    assigned_to_reseller_date: new Date(),
                    modified_date: new Date(),
                    modified_by
                }
            }
        );

        if (result.modifiedCount === 0) {
            throw new Error('Failed to assign chargers to reseller');
        }

        return res.status(200).json({ message: 'Chargers Successfully Assigned' });

    } catch (error) {
        console.error(error);
        logger.error(`Error assigning chargers to reseller: ${error}`);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}




module.exports = { 
    //USER_ROLE 
    CreateUserRole,
    FetchUserRole,
    FetchSpecificUserRole,
    DeActivateOrActivateUserRole,
    //USER
    FetchUser,
    FetchSpecificUserRoleForSelection,
    FetchResellerForSelection,
    CreateUser,
    UpdateUser,
    DeActivateUser,
    //PROFILE
    FetchUserProfile,
    UpdateUserProfile,
    //MANAGE CHARGER
    FetchCharger,
    CreateCharger,
    UpdateCharger,
    DeActivateOrActivateCharger,
    //MANAGE RESELLER
    FetchResellers,
    FetchAssignedClients,
    FetchChargerDetailsWithSession,
    CreateReseller,
    UpdateReseller,
    DeActivateOrActivateReseller,
    //ASSIGN TO RESELLER
    AssginChargerToReseller,
};