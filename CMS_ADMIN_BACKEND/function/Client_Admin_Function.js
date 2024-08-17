const database = require('../db');
const logger = require('../logger');

// MANAGE ASSOCIATION Functions
//FetchAssociationUser
async function FetchAssociationUser(req, res) {
    try {
        const { client_id } = req.body; 
        const db = await database.connectToDatabase();
        const associationCollection = db.collection("association_details");

        // Fetch association details for the given client_id
        const users = await associationCollection.find({ client_id: parseInt(client_id) }).toArray();
        
        if (users.length === 0) {
            return res.status(404).json({ message: "No association found for the provided client_id." });
        }

        const reseller_ids = users.map(user => user.reseller_id);
        const client_ids = users.map(user => user.client_id);

        // Fetch reseller details
        const resellerCollection = db.collection("reseller_details");
        const resellers = await resellerCollection.find({ reseller_id: { $in: reseller_ids } }).toArray();

        // Fetch client details
        const clientCollection = db.collection("client_details");  // Assuming 'client_details' is the correct collection name
        const clients = await clientCollection.find({ client_id: { $in: client_ids } }).toArray();

        // Map resellers and clients by their IDs for quick lookup
        const resellerMap = resellers.reduce((acc, reseller) => {
            acc[reseller.reseller_id] = reseller.reseller_name;
            return acc;
        }, {});

        const clientMap = clients.reduce((acc, client) => {
            acc[client.client_id] = client.client_name;
            return acc;
        }, {});

        // Attach names to users
        const result = users.map(user => ({
            ...user,
            reseller_name: resellerMap[user.reseller_id] || 'Unknown Reseller',
            client_name: clientMap[user.client_id] || 'Unknown Client'
        }));

        return result;

    } catch (error) {
        console.error(`Error fetching client details: ${error}`);
        logger.error(`Error fetching client details: ${error}`);
        return res.status(500).json({ message: 'Error fetching client details' });
    }
}

// FetchChargerDetailsWithSession
async function FetchChargerDetailsWithSession(req) {
    try {
        const { association_id } = req.body;

        // Validate association_id
        if (!association_id) {
            throw new Error('Association ID is required');
        }

        const db = await database.connectToDatabase();
        const chargerCollection = db.collection("charger_details");

        // Aggregation pipeline to fetch charger details with sorted session data
        const result = await chargerCollection.aggregate([
            {
                $match: { assigned_association_id: association_id }
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
                    charger_id: 1,
                    assigned_association_id: 1,
                    finance_id: 1,
                    client_commission:1,              
                    sessiondata: 1
                }
            }
        ]).toArray();

        if (!result || result.length === 0) {
            throw new Error('No chargers found for the specified Association ID');
        }

        // Sort sessiondata within each chargerID based on the first session's stop_time
        result.forEach(charger => {
            if (charger.sessiondata.length > 1) {
                charger.sessiondata.sort((a, b) => new Date(b.stop_time) - new Date(a.stop_time));
            }
        });

        return result;

    } catch (error) {
        console.error(`Error fetching charger details: ${error.message}`);
        throw error;
    }
}


//CreateAssociationUser
async function CreateAssociationUser(req, res, next) {
    try {
        const {
            reseller_id,
            client_id,
            association_name,
            association_phone_no,
            association_email_id,
            association_address,
            created_by
        } = req.body;

        // Validate required fields
        if (!association_name || !association_phone_no || !association_email_id || !association_address || !created_by || !reseller_id || !client_id) {
            return res.status(400).json({ message: 'Reseller ID, Client ID, Association Name, Phone Number, Email ID, Address, and Created By are required' });
        }

        const db = await database.connectToDatabase();
        const associationCollection = db.collection("association_details");

        // Check if the association email already exists
        const existingAssociation = await associationCollection.findOne({
            $or: [
                { association_email_id: association_email_id },
                { association_name: association_name }
            ]
        });

        if (existingAssociation) {
            return res.status(400).json({ message: 'Association with this Association name / Email ID already exists' });
        }

        // Use aggregation to fetch the highest association_id
        const lastAssociation = await associationCollection.find().sort({ association_id: -1 }).limit(1).toArray();
        let newAssociationId = 1; // Default association_id if no associations exist
        if (lastAssociation.length > 0) {
            newAssociationId = lastAssociation[0].association_id + 1;
        }

        // Insert the new association
        const result = await associationCollection.insertOne({
            association_id: newAssociationId,
            client_id,
            reseller_id,
            association_name,
            association_phone_no,
            association_email_id,
            association_address,
            association_wallet:0.00,
            created_date: new Date(),
            modified_date: null,
            created_by,
            modified_by: null,
            status: true
        });

        if (result.acknowledged) {
        next();
        } else {
            return res.status(500).json({ message: 'Failed to create association' });
        }
        
    } catch (error) {
        console.error(error);
        logger.error(`Error creating association: ${error}`);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}
//UpdateAssociationUser
async function UpdateAssociationUser(req, res, next) {
    try {
        const {
            association_id,
            association_name,
            association_phone_no,
            association_address,
            association_wallet,
            modified_by,
            status
        } = req.body;

        // Validate required fields
        if (!association_id || !association_name || !association_wallet || !association_phone_no  || !association_address || !modified_by ) {
            return res.status(400).json({ message: 'Association ID Association Name, Phone Number, Address, and Modified By are required' });
        }

        const db = await database.connectToDatabase();
        const associationCollection = db.collection("association_details");

        // Check if the association exists
        const existingAssociation = await associationCollection.findOne({ association_id: association_id });
        if (!existingAssociation) {
            return res.status(404).json({ message: 'Association not found' });
        }
        // Create an update object
        const updateData = {
            association_name,
            association_phone_no,
            association_wallet:association_wallet || existingAssociation.association_wallet,
            association_address,
            modified_date: new Date(),
            modified_by
        };

        // Conditionally add the status field if it's provided
        if (status !== undefined) {
            updateData.status = status;
        }

        // Update the association details
        const result = await associationCollection.updateOne(
            { association_id: association_id },
            { $set: updateData }
        );

        if (result.modifiedCount > 0) {
            next()
        } else {
            return res.status(500).json({ message: 'Failed to update association' });
        }
        
    } catch (error) {
        console.error(error);
        logger.error(`Error updating association: ${error}`);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}
//DeActivateOrActivate AssociationUser
async function DeActivateOrActivateAssociationUser(req, res, next) {
    try {
        const { modified_by, association_id, status } = req.body;

        // Validate the input
        if (!modified_by || !association_id || typeof status !== 'boolean') {
            return res.status(400).json({ message: 'Username, association id, and Status (boolean) are required' });
        }

        const db = await database.connectToDatabase();
        const associationCollection = db.collection("association_details");

        // Check if the role exists
        const existingAssociation = await associationCollection.findOne({ association_id: association_id });
        if (!existingAssociation) {
            return res.status(404).json({ message: 'Role not found' });
        }

        // Update existing role
        const updateResult = await associationCollection.updateOne(
            { association_id: association_id },
            {
                $set: {
                    status: status,
                    modified_by: modified_by,
                    modified_date: new Date()
                }
            }
        );

        if (updateResult.matchedCount === 0) {
            return res.status(500).json({ message: 'Failed to update status' });
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
        
        // Aggregation pipeline to join users and reseller_details collections
        const result = await usersCollection.aggregate([
            { $match: { user_id: user_id } },
            {
                $lookup: {
                    from: 'client_details',
                    localField: 'client_id',
                    foreignField: 'client_id',
                    as: 'client_details'
                }
            },
            {
                $project: {
                    _id: 0,
                    user_id: 1,
                    username: 1,
                    email_id: 1,
                    phone_no: 1,
                    password:1,
                    wallet_bal: 1,
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
                    client_details: 1
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
//UpdateClientProfile
async function UpdateClientProfile(req, res, next) {
    const { client_id, modified_by, client_phone_no, client_address } = req.body;

    try {
        // Validate required fields
        if (!client_id || !modified_by || !client_phone_no || !client_address) {
            return res.status(400).json({ message: 'Client ID, modified_by, phone number, and client address are required' });
        }

        const db = await database.connectToDatabase();
        const clientCollection = db.collection("client_details");

        // Update the client profile
        const updateResult = await clientCollection.updateOne(
            { client_id: client_id },
            {
                $set: {
                    client_phone_no: client_phone_no,
                    client_address: client_address,
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
        console.error(`Error updating client profile: ${error}`);
        logger.error(`Error updating client profile: ${error}`);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}

//CHARGER Function
// FetchAllocatedCharger
async function FetchAllocatedCharger(req) {
    try {
        const { client_id } = req.body;
        const db = await database.connectToDatabase();
        const devicesCollection = db.collection("charger_details");

        // Aggregation to fetch chargers with association names
        const chargersWithAssociations = await devicesCollection.aggregate([
            {
                $match: { assigned_association_id: { $ne: null }, assigned_client_id: client_id } // Find chargers with assigned associations
            },
            {
                $lookup: {
                    from: 'association_details', // Collection name for association details
                    localField: 'assigned_association_id',
                    foreignField: 'association_id', // Assuming association_id is the field name in association_details
                    as: 'associationDetails'
                }
            },
            {
                $unwind: '$associationDetails' // Unwind the array to include association details as an object
            },
            {
                $addFields: {
                    association_name: '$associationDetails.association_name' // Include the association name in the result
                }
            },
            {
                $project: {
                    associationDetails: 0 // Exclude the full associationDetails object
                }
            }
        ]).toArray();

        return chargersWithAssociations; // Only return data, don't send response
    } catch (error) {
        console.error(`Error fetching chargers: ${error}`);
        throw new Error('Failed to fetch chargers'); // Throw error, handle in route
    }
}

//FetchUnAllocatedCharger
async function FetchUnAllocatedCharger(req) {
    try {
        const {client_id} = req.body
        const db = await database.connectToDatabase();
        const devicesCollection = db.collection("charger_details");

        const chargers = await devicesCollection.find({ assigned_association_id: null, assigned_client_id: client_id  }).toArray();

        return chargers; // Only return data, don't send response
    } catch (error) {
        console.error(`Error fetching chargers: ${error}`);
        throw new Error('Failed to fetch chargers'); // Throw error, handle in route
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


// USER Functions
//FetchUser
async function FetchUser(req, res) {
    try {
        const client_id = req.body.client_id;
        if(!client_id){
            return res.status(409).json({ message: 'Client ID is Empty !' });
        }
        const db = await database.connectToDatabase();
        const usersCollection = db.collection("users");
        const rolesCollection = db.collection("user_roles");
        const resellerCollection = db.collection("reseller_details");
        const clientCollection = db.collection("client_details");
        const associationCollection = db.collection("association_details");
        
        // Query to fetch users with role_id 
        const users = await usersCollection.find({ role_id: { $in: [3, 4] }, client_id }).toArray();

        // Extract all unique role_ids, reseller_ids, client_ids, and association_ids from users
        const roleIds = [...new Set(users.map(user => user.role_id))];
        const resellerIds = [...new Set(users.map(user => user.reseller_id))];
        const clientIds = [...new Set(users.map(user => user.client_id))];
        const associationIds = [...new Set(users.map(user => user.association_id))];
        
        // Fetch roles based on role_ids
        const roles = await rolesCollection.find({ role_id: { $in: roleIds } }).toArray();
        const roleMap = new Map(roles.map(role => [role.role_id, role.role_name]));
        
        // Fetch resellers based on reseller_ids
        let resellers,resellerMap;
        if(resellerIds){
            resellers = await resellerCollection.find({ reseller_id: { $in: resellerIds } }).toArray();
            resellerMap = new Map(resellers.map(reseller => [reseller.reseller_id, reseller.reseller_name]));
        }
        
        // Fetch clients based on client_ids
        let clients,clientMap;
        if(clientIds){
            clients = await clientCollection.find({ client_id: { $in: clientIds } }).toArray();
            clientMap = new Map(clients.map(client => [client.client_id, client.client_name]));
        }
        
        // Fetch associations based on association_ids
        let associations,associationMap;
        if(associationIds){
            associations = await associationCollection.find({ association_id: { $in: associationIds } }).toArray();
            associationMap = new Map(associations.map(association => [association.association_id, association.association_name]));
        }
        
        // Attach additional details to each user
        const usersWithDetails = users.map(user => ({
            ...user,
            role_name: roleMap.get(user.role_id) || 'Unknown',
            reseller_name: resellerMap.get(user.reseller_id) || null,
            client_name: clientMap.get(user.client_id) || null,
            association_name: associationMap.get(user.association_id) || null
        }));
        
        // Return the users with all details
        return usersWithDetails;
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
        { role_id: { $in: [4] }, status: true }, // Filter to fetch role_id 1 and 2
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
// FetchAssociationForSelection
async function FetchAssociationForSelection(req,res) {
    try {
        const client_id = req.body.client_id;
        if (!client_id) {
            return res.status(409).json({ message: 'Client ID is Empty!' });
        }

        const db = await database.connectToDatabase();
        const associationsCollection = db.collection("association_details");
        const usersCollection = db.collection("users");

        // Fetch all association_id from the users table
        const userAssociationIds = await usersCollection.distinct("association_id");

        // Query to fetch all reseller_id and reseller_name
        const resellers = await associationsCollection.find(
            {
                status: true,
                client_id: client_id,
                association_id: { $nin: userAssociationIds } 
            },
            {
                projection: {
                    association_id: 1,
                    association_name: 1,
                    _id: 0 // Exclude _id from the result
                }
            }
        ).toArray();

        // Return the resellers data
        return resellers;
    } catch (error) {
        logger.error(`Error fetching associations: ${error}`);
        throw new Error('Error fetching associations');
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
            tag_id: null,
            assigned_association: null,
            username: username,
            email_id: email_id,
            password: parseInt(password),
            phone_no: phone_no,
            wallet_bal: 0,
            autostop_time: null,
            autostop_unit: null,
            autostop_price: null,
            autostop_time_is_checked: null,
            autostop_unit_is_checked: null,
            autostop_price_is_checked: null,
            created_by: created_by,
            created_date: new Date(),
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
                    password: parseInt(password),
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


// WALLET Functions
// FetchCommissionAmtClient
async function FetchCommissionAmtClient(req, res) {
    const { user_id } = req.body;
    try {
        const db = await database.connectToDatabase();
        const usersCollection = db.collection("users");
        const clientsCollection = db.collection("client_details");

        // Fetch the user with the specified user_id
        const user = await usersCollection.findOne({ user_id: user_id });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Extract client_id from the user object
        const clientId = user.client_id;

        if (!clientId) {
            return res.status(404).json({ message: 'Client ID not found for this user' });
        }

        // Fetch the client with the specified client_id
        const client = await clientsCollection.findOne({ client_id: clientId });

        if (!client) {
            return res.status(404).json({ message: 'Client not found' });
        }

        // Extract client_wallet from client object
        const clientWallet = client.client_wallet;

        return clientWallet;

    } catch (error) {
        console.error(`Error fetching client wallet balance: ${error}`);
        logger.error(`Error fetching client wallet balance: ${error}`);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}


//MANAGE FINANCE
// FetchFinanceDetails
async function FetchFinanceDetails() {
    try {
        const db = await database.connectToDatabase();
        const Collection = db.collection("finance_details");

        // Fetch all finance details documents
        const financeDetailsList = await Collection.find().toArray();

        // Prepare the list of finance data with total prices
        const financeDataList = financeDetailsList.map((financeDetails) => {
            // Calculate the total percentage of the various charges
            const totalPercentage = [
                financeDetails.app_charges,
                financeDetails.other_charges,
                financeDetails.parking_charges,
                financeDetails.rent_charges,
                financeDetails.open_a_eb_charges,
                financeDetails.open_other_charges
            ].reduce((sum, charge) => sum + parseFloat(charge || 0), 0);

            // Calculate the final price
            const pricePerUnit = parseFloat(financeDetails.eb_charges || 0);
            const price = 1 * pricePerUnit;
            const totalPrice = price + (price * totalPercentage / 100);

            // Construct the data object
            return {
                finance_id: financeDetails.finance_id,
                client_id: financeDetails.client_id,
                eb_charges: financeDetails.eb_charges,
                app_charges: financeDetails.app_charges,
                other_charges: financeDetails.other_charges,
                parking_charges: financeDetails.parking_charges,
                rent_charges: financeDetails.rent_charges,
                open_a_eb_charges: financeDetails.open_a_eb_charges,
                open_other_charges: financeDetails.open_other_charges,
                created_by: financeDetails.created_by,
                created_date: financeDetails.created_date,
                modified_by: financeDetails.modified_by,
                modified_date: financeDetails.modified_date,
                totalprice: totalPrice,
                status: financeDetails.status,
            };
        });

        // Return the list of finance data
        return financeDataList;
    } catch (error) {
        logger.error(`Error fetching finance details: ${error}`);
        throw new Error('Error fetching finance details');
    }
}

//CreateFinanceDetails
async function CreateFinanceDetails(req, res, next) {
    try {
        const {
            client_id,
            eb_charges,
            app_charges,
            other_charges,
            parking_charges,
            rent_charges,
            open_a_eb_charges,
            open_other_charges,
            created_by
        } = req.body;

        // Validate required fields
        if (!client_id || !eb_charges || !app_charges || !other_charges || !parking_charges || !rent_charges || !open_a_eb_charges || !open_other_charges || !created_by) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const db = await database.connectToDatabase();
        const financeCollection = db.collection("finance_details");

        // Use aggregation to fetch the highest finance_id
        const lastFinance = await financeCollection.find().sort({ finance_id: -1 }).limit(1).toArray();
        let newFinanceId = 1; // Default finance_id if no finance details exist
        if (lastFinance.length > 0) {
            newFinanceId = lastFinance[0].finance_id + 1;
        }

        // Insert the new finance detail
        const result = await financeCollection.insertOne({
            finance_id: newFinanceId,
            client_id,
            eb_charges: parseInt(eb_charges),
            app_charges,
            other_charges,
            parking_charges,
            rent_charges,
            open_a_eb_charges,
            open_other_charges,
            created_by,
            created_date: new Date(),
            modified_by: null,
            modified_date: null,
            status: true
        });

        if (result.acknowledged) {
            next();
        } else {
            return res.status(500).json({ message: 'Failed to create finance detail' });
        }

    } catch (error) {
        console.error(error);
        logger.error(`Error creating finance detail: ${error}`);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}
//UpdateFinanceDetails
async function UpdateFinanceDetails(req, res, next) {
    try {
        const {
            finance_id,
            client_id,
            eb_charges,
            app_charges,
            other_charges,
            parking_charges,
            rent_charges,
            open_a_eb_charges,
            open_other_charges,
            modified_by
        } = req.body;

        // Validate required fields
        if (!finance_id  || !client_id || !eb_charges || !app_charges || !other_charges || !parking_charges || !rent_charges || !open_a_eb_charges || !open_other_charges || !modified_by) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const db = await database.connectToDatabase();
        const financeCollection = db.collection("finance_details");

        // Check if the finance_id exists
        const existingFinance = await financeCollection.findOne({ finance_id: finance_id });
        if (!existingFinance) {
            return res.status(404).json({ message: 'Finance with this ID does not exist' });
        }

        // Update the finance detail
        const result = await financeCollection.updateOne(
            { finance_id: finance_id },
            {
                $set: {
                    client_id,
                    eb_charges: parseInt(eb_charges) || existingFinance.eb_charges,
                    app_charges,
                    other_charges,
                    parking_charges,
                    rent_charges,
                    open_a_eb_charges,
                    open_other_charges,
                    modified_date: new Date(),
                    modified_by
                }
            }
        );

        if (result.modifiedCount === 1) {
            next();
        } else {
            return res.status(500).json({ message: 'Failed to update finance detail' });
        }

    } catch (error) {
        console.error(error);
        logger.error(`Error updating finance detail: ${error}`);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}
//DeactivateOrActivateFinanceDetails
async function DeactivateOrActivateFinanceDetails(req, res, next) {
    try {
        const { finance_id, status, modified_by } = req.body;

        // Validate required fields
        if (!finance_id || typeof status !== 'boolean' || !modified_by) {
            return res.status(400).json({ message: 'Finance ID, Status, and Modified By are required' });
        }

        const db = await database.connectToDatabase();
        const financeCollection = db.collection("finance_details");

        // Check if the finance_id exists
        const existingFinance = await financeCollection.findOne({ finance_id: finance_id });
        if (!existingFinance) {
            return res.status(404).json({ message: 'Finance with this ID does not exist' });
        }

        // Update the status of the finance detail
        const result = await financeCollection.updateOne(
            { finance_id: finance_id },
            {
                $set: {
                    status,
                    modified_date: new Date(),
                    modified_by
                }
            }
        );

        if (result.modifiedCount === 1) {
            next()
        } else {
            return res.status(500).json({ message: 'Failed to update finance detail' });
        }

    } catch (error) {
        console.error(error);
        logger.error(`Error updating finance detail: ${error}`);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}

// ASSIGN FINANCE TO CHARGER
async function AssignFinanceToCharger(req, res, next) {
    try {
        const { charger_id, finance_id , modified_by} = req.body;

        // Validate required fields
        if (!charger_id || !finance_id || !modified_by) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const db = await database.connectToDatabase();
        const chargerCollection = db.collection("charger_details");

        // Check if the charger_id exists
        const existingCharger = await chargerCollection.findOne({ charger_id: charger_id });
        if (!existingCharger) {
            return res.status(404).json({ message: 'Charger with this ID does not exist' });
        }

        const result = await chargerCollection.updateOne(
            { charger_id: charger_id },
            {
                $set: {
                    finance_id,
                    modified_date: new Date(),
                    modified_by
                }
            }
        );

        if (result.modifiedCount === 1) {
            next();
        } else {
            return res.status(500).json({ message: 'Failed to update finance in charger' });
        }

    } catch (error) {
        console.error(error);
        logger.error(`Error updating finance in charger: ${error}`);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}


//ASSIGN_CHARGER_TO_ASSOCIATION
//FetchAssociationUserToAssginCharger
async function FetchAssociationUserToAssginCharger(req, res) {
    try {
        const { client_id } = req.body; 
        const db = await database.connectToDatabase();
        const associationCollection = db.collection("association_details");

        const users = await associationCollection.find({ client_id: parseInt(client_id) , status: true}).toArray();

        return users;

    } catch (error) {
        console.error(`Error fetching client details: ${error}`);
        logger.error(`Error fetching client details: ${error}`);
        throw new Error('Error fetching client details');
    }
}
//FetchUnAllocatedChargerToAssgin
async function FetchUnAllocatedChargerToAssgin(req) {
    try {
        const {client_id} = req.body
        const db = await database.connectToDatabase();
        const devicesCollection = db.collection("charger_details");

        const chargers = await devicesCollection.find({ assigned_association_id: null, assigned_client_id: client_id , status:true }).toArray();

        return chargers; // Only return data, don't send response
    } catch (error) {
        console.error(`Error fetching chargers: ${error}`);
        throw new Error('Failed to fetch chargers'); // Throw error, handle in route
    }
}

//AssginChargerToAssociation
async function AssginChargerToAssociation(req, res) {
    try {
        const { association_id, charger_id, client_commission ,modified_by} = req.body;


        // Validate required fields
        if (!association_id || !charger_id || !modified_by || !client_commission) {
            return res.status(400).json({ message: 'Association ID, Charger IDs, client_commission and Modified By are required' });
        }

        const db = await database.connectToDatabase();
        const devicesCollection = db.collection("charger_details");

        // Ensure charger_ids is an array
        let chargerIdsArray = Array.isArray(charger_id) ? charger_id : [charger_id];

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
                    assigned_association_id: association_id,
                    client_commission: client_commission,
                    assigned_association_date: new Date(),
                    modified_date: new Date(),
                    modified_by
                }
            }
        );

        if (result.modifiedCount === 0) {ß
            throw new Error('Failed to assign chargers to reseller');
        }

        return res.status(200).json({ status:"Success",message: 'Chargers Successfully Assigned' });

    } catch (error) {
        console.error(error);s
        logger.error(`Error assigning chargers to reseller: ${error}`);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}


module.exports = { 
    //MANAGE USER
    FetchUser,
    FetchSpecificUserRoleForSelection,
    FetchAssociationForSelection,
    CreateUser,
    UpdateUser,
    DeActivateUser,
    // MANAGE ASSOCIATION
    FetchAssociationUser,
    FetchChargerDetailsWithSession,
    CreateAssociationUser,
    UpdateAssociationUser,
    DeActivateOrActivateAssociationUser,
    //PROFILE
    FetchUserProfile,
    UpdateUserProfile,
    UpdateClientProfile,
    //MANAGE CHARGER
    FetchUnAllocatedCharger,
    FetchAllocatedCharger,
    DeActivateOrActivateCharger,
    //MANAGE WALLET
    FetchCommissionAmtClient,
    //MANAGE FINANCE
    FetchFinanceDetails,
    CreateFinanceDetails,
    UpdateFinanceDetails,
    DeactivateOrActivateFinanceDetails,
    //ASSGIN FINANCE TO CHARGER
    AssignFinanceToCharger,
    FetchAssociationUserToAssginCharger,
    FetchUnAllocatedChargerToAssgin,
    //ASSGIN FINANCE TO CHARGER
    AssginChargerToAssociation,
};