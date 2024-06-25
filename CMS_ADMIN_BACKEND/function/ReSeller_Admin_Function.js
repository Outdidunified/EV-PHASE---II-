const database = require('../db');
const logger = require('../logger');


//RESELLER Function
//FetchClients
async function FetchClients(req, res) {
    try {
        const { reseller_id } = req.query; 
        const db = await database.connectToDatabase();
        const clientCollection = db.collection("client_details");

        const clientList = await clientCollection.find({ reseller_id: parseInt(reseller_id) }).toArray();

        return clientList;

    } catch (error) {
        console.error(`Error fetching client details: ${error}`);
        logger.error(`Error fetching client details: ${error}`);
        throw new Error('Error fetching client details');
    }
}
//FetchAssignedAssociation
async function FetchAssignedAssociation(req, res) {
    try {
        const { client_id } = req.body;

        // Validate client_id
        if (!client_id) {
            return res.status(400).json({ message: 'Client ID is required' });
        }

        const db = await database.connectToDatabase();
        const AssociationCollection = db.collection("association_details");

        // Query to fetch Association for the specific reseller_id
        const Association = await AssociationCollection.find({ client_id: client_id }).toArray();

        if (!Association || Association.length === 0) {
            return res.status(404).json({ message: 'No Association details found for the specified client_id' });
        }

        // Return the Association data
        return res.status(200).json({ status: 'Success', data: Association });

    } catch (error) {
        console.error(error);
        logger.error(`Error fetching Association: ${error}`);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}
//FetchChargerDetailsWithSession
async function FetchChargerDetailsWithSession(req) {
    try {
        const { client_id } = req.body;

        // Validate client_id
        if (!client_id) {
            throw new Error('Client ID is required');
        }

        const db = await database.connectToDatabase();
        const chargerCollection = db.collection("charger_details");

        // Aggregation pipeline to fetch charger details with sorted session data
        const result = await chargerCollection.aggregate([
            {
                $match: { assigned_client_id: client_id }
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
            throw new Error('No chargers found for the specified client_id');
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
//Createclient
async function addNewClient(req){
    try{
        const{reseller_id,client_name,client_phone_no,client_email_id,client_address,created_by} = req.body;
        const created_date = new Date();
        const modified_by = null;
        const modified_date = null;
        const status = true;

        const db = await database.connectToDatabase();
        const clientCollection = db.collection("client_details");

        // Check if client_email_id is already in use
        const existingClient = await clientCollection.findOne({ client_email_id });
        if (existingClient) {
            throw new Error('Client with this email already exists');
        }
        

        // Find the last client_id to determine the next available client_id
        const lastClient = await clientCollection.find().sort({ client_id: -1 }).limit(1).toArray();
        let nextClientId = 1; // Default to 1 if no records exist yet

        if (lastClient.length > 0) {
            nextClientId = lastClient[0].client_id + 1;
        }

        // Prepare new client object with incremented client_id
        const newClient = {
            client_id: nextClientId,
            reseller_id: reseller_id, // Assuming reseller_id is stored as ObjectId
            client_name,
            client_phone_no,
            client_email_id,
            client_address,
            created_by,
            created_date,
            modified_by,
            modified_date,
            status
        };

        // Insert new client into client_details collection
        const result = await clientCollection.insertOne(newClient);

        if (result.acknowledged === true) {
            console.log(`New client added successfully with client_id ${nextClientId}`);
            return true; // Return the newly inserted client_id if needed
        } else {
            throw new Error('Failed to add new client');
        }

    }catch(error){
        logger.error(`Error in add new client: ${error}`);
        throw new Error(error.message)
    }
}
//UpdateClient
async function updateClient(req){
    try{
        const {client_id,client_name,client_phone_no,client_address,modified_by,status} = req.body;
        const db = await database.connectToDatabase();
        const clientCollection = db.collection("client_details");

        if(!client_id || !client_name || !client_phone_no || !client_address || !modified_by){
            throw new Error(`Client update fields are not available`);
        }

        const where = { client_id: client_id };

        const updateDoc = {
            $set: {
                client_name: client_name,
                client_phone_no: client_phone_no,
                client_address: client_address,
                status: status,
                modified_by: modified_by,
                modified_date: new Date()
            }
        };

        const result = await clientCollection.updateOne(where, updateDoc);

        if (result.modifiedCount === 0) {
            throw new Error(`Client not found to update`);
        }

        return true;

    }catch(error){
        logger.error(`Error in update client: ${error}`);
        throw new Error(error.message)
    }
}
//DeActivateOrActivate 
async function DeActivateClient(req, res,next) {
    const { client_id, modified_by, status } = req.body;
    try {

        const db = await database.connectToDatabase();
        const clientCollection = db.collection("client_details");

        // Check if the user exists
        const existingUser = await clientCollection.findOne({ client_id: client_id });
        if (!existingUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update user status
        const updateResult = await clientCollection.updateOne(
            { client_id: client_id },
            {
                $set: {
                    status: status,
                    modified_by: modified_by,
                    modified_date: new Date()
                }
            }
        );

        if (updateResult.matchedCount === 0) {
            return res.status(500).json({ message: 'Failed to update  status' });
        }

        next();
    } catch (error) {
        logger.error(`Error in deactivating client: ${error}`);
        throw new Error('Error in deactivating client');
    }
}


// USER Functions
//FetchUser
async function FetchUser() {
    try {
        const db = await database.connectToDatabase();
        const usersCollection = db.collection("users");
        
        // Query to fetch users with role_id 1 or 2
        const users = await usersCollection.find({ role_id: { $in: [2, 3] } }).toArray();

        // Return the users data
        return users;
    } catch (error) {
        logger.error(`Error fetching users by role_id: ${error}`);
        throw new Error('Error fetching users by role_id');
    }
}
//FetchSpecificUserForSelection
async function FetchSpecificUserForSelection() {
    try {
        const db = await database.connectToDatabase();
        const usersCollection = db.collection("users");

       // Use aggregation to fetch users with their roles, filtering for role_id 1 and 2
        const usersWithRoles = await usersCollection.aggregate([
                {
                    $lookup: {
                        from: 'user_roles',
                        localField: 'role_id',
                        foreignField: 'role_id',
                        as: 'role_details'
                    }
                },
                { $unwind: '$role_details' },
                {
                    $match: {
                        'role_details.role_id': { $in: [3] }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        role_id: '$role_details.role_id',
                        role_name: '$role_details.role_name'
                    }
                }
            ]).toArray();
        // Return the users data
        return usersWithRoles;
    } catch (error) {
        logger.error(`Error fetching users: ${error}`);
        throw new Error('Error fetching users');
    }
}
// Create User
async function CreateUser(req, res, next) {
    try {
        const { role_id, username, email_id, password, phone_no, wallet_bal, created_by } = req.body;

        // Validate the input
        if (!username || !role_id || !email_id || !password || !created_by) {
            return res.status(400).json({ message: 'Username, Role ID, Email, Password, and Created By are required' });
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
            reseller_id: null, // Default value, adjust if necessary
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

//CHARGER Function
//FetchAllocatedCharger
async function FetchAllocatedCharger() {
    try {
        const db = await database.connectToDatabase();
        const devicesCollection = db.collection("charger_details");

        // Aggregation to fetch chargers with client names
        const chargersWithClients = await devicesCollection.aggregate([
            {
                $match: { assigned_client_id: { $ne: null } } // Find chargers with assigned clients
            },
            {
                $lookup: {
                    from: 'client_details', // Collection name for client details
                    localField: 'assigned_client_id',
                    foreignField: 'client_id', // Assuming client_id is the field name in client_details
                    as: 'clientDetails'
                }
            },
            {
                $unwind: '$clientDetails' // Unwind the array to include client details as an object
            },
            {
                $addFields: {
                    client_name: '$clientDetails.client_name' // Include the client name in the result
                }
            },
            {
                $project: {
                    clientDetails: 0 // Exclude the full clientDetails object
                }
            }
        ]).toArray();

        return chargersWithClients; // Only return data, don't send response
    } catch (error) {
        console.error(`Error fetching chargers: ${error}`);
        throw new Error('Failed to fetch chargers'); // Throw error, handle in route
    }
}
//FetchUnAllocatedCharger
async function FetchUnAllocatedCharger() {
    try {
        const db = await database.connectToDatabase();
        const devicesCollection = db.collection("charger_details");

        const chargers = await devicesCollection.find({ assigned_client_id: null }).toArray();

        return chargers; // Only return data, don't send response
    } catch (error) {
        console.error(`Error fetching chargers: ${error}`);
        throw new Error('Failed to fetch chargers'); // Throw error, handle in route
    }
}
//DeActivateOrActivateCharger
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
        const existingCharger = await devicesCollection.findOne({ charger_id: charger_id });
        if (!existingCharger) {
            return res.status(404).json({ message: 'chargerID not found' });
        }

        // Check if the charger is allocated
        if (existingCharger.assigned_client_id == null) {
            return res.status(400).json({ message: 'Cannot deactivate an allocated charger' });
        }

        // Update charger status and details
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

//ASSIGN_CHARGER_TO_CLIENT
//AssginChargerToClient 
async function AssginChargerToClient(req, res) {
    try {
        const { client_id, charger_id, modified_by, reseller_commission} = req.body;


        // Validate required fields
        if (!client_id || !charger_id || !modified_by || !reseller_commission) {
            return res.status(400).json({ message: 'Reseller ID, Charger IDs, reseller commission and Modified By are required' });
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
                    assigned_client_id: client_id,
                    reseller_commission: reseller_commission,
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

// WALLET Functions
//FetchCommissionAmtReseller
async function FetchCommissionAmtReseller(req, res) {
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
                    from: 'reseller_details',
                    localField: 'reseller_id',
                    foreignField: 'reseller_id',
                    as: 'reseller_details'
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
                    reseller_details: 1
                }
            }
        ]).toArray();

        if (result.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const userProfile = result[0];

        return userProfile;

    } catch (error) {
        logger.error(`Error fetching user profile: ${error}`);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}
//UpdateUserProfile
async function UpdateUserProfile(req, res,next) {
    const { user_id, username, phone_no, password } = req.body;

    try {
        // Validate required fields
        if (!user_id || !username || !phone_no || !password) {
            return res.status(400).json({ message: 'User ID, username, phone number, and password are required' });
        }

        const db = await database.connectToDatabase();
        const usersCollection = db.collection("users");

        // Update the user profile
        const updateResult = await usersCollection.updateOne(
            { user_id: user_id },
            {
                $set: {
                    username: username,
                    phone_no: phone_no,
                    password: password,
                    modified_date: new Date(),
                    modified_by:username
                }
            }
        );

        if (updateResult.matchedCount === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (updateResult.modifiedCount === 0) {
            return res.status(500).json({ message: 'Failed to update user profile' });
        }

        next()
    } catch (error) {
        console.error(`Error updating user profile: ${error}`);
        logger.error(`Error updating user profile: ${error}`);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}
//UpdateResellerProfile
async function UpdateResellerProfile(req, res,next) {
    const { reseller_id, modified_by, reseller_phone_no, reseller_address } = req.body;

    try {
        // Validate required fields
        if (!reseller_id || !modified_by || !reseller_phone_no || !reseller_address) {
            return res.status(400).json({ message: 'Reseller ID, modified_by, phone number, and reseller address are required' });
        }

        const db = await database.connectToDatabase();
        const usersCollection = db.collection("reseller_details");

        // Update the user profile
        const updateResult = await usersCollection.updateOne(
            { reseller_id: reseller_id },
            {
                $set: {
                    reseller_phone_no: reseller_phone_no,
                    reseller_address: reseller_address,
                    modified_date: new Date(),
                    modified_by:modified_by
                }
            }
        );

        if (updateResult.matchedCount === 0) {
            return res.status(404).json({ message: 'Reseller not found' });
        }

        if (updateResult.modifiedCount === 0) {
            return res.status(500).json({ message: 'Failed to update Reseller profile' });
        }

        next()
    } catch (error) {
        console.error(`Error updating Reseller profile: ${error}`);
        logger.error(`Error updating Reseller profile: ${error}`);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}

module.exports = { 
        //MANAGE USER
        FetchUser,
        FetchSpecificUserForSelection,
        CreateUser,
        UpdateUser,
        DeActivateUser,
        //MANAGE CLIENT
        FetchClients,
        FetchAssignedAssociation,
        FetchChargerDetailsWithSession,
        addNewClient,
        updateClient,
        DeActivateClient,
        //MANAGE CHARGER
        FetchAllocatedCharger,
        FetchUnAllocatedCharger,
        DeActivateOrActivateCharger,
        //ASSIGN TO CLIENT
        AssginChargerToClient,
        //WALLET
        FetchCommissionAmtReseller,
        //PROFILE
        FetchUserProfile,
        UpdateUserProfile,
        UpdateResellerProfile,
 }