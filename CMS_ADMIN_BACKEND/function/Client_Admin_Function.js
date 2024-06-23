const database = require('../db');
const logger = require('../logger');

// MANAGE ASSOCIATION Functions
//FetchAssociationUser
async function FetchAssociationUser(req, res) {
    try {
        const { client_id } = req.body; 
        const db = await database.connectToDatabase();
        const associationCollection = db.collection("association_details");

        const users = await associationCollection.find({ client_id: parseInt(client_id) }).toArray();

        return users;

    } catch (error) {
        console.error(`Error fetching client details: ${error}`);
        logger.error(`Error fetching client details: ${error}`);
        throw new Error('Error fetching client details');
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
        const existingAssociation = await associationCollection.findOne({ association_email_id: association_email_id });
        if (existingAssociation) {
            return res.status(400).json({ message: 'Association with this Email ID already exists' });
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
            modified_by,
            status
        } = req.body;

        // Validate required fields
        if (!association_id || !association_name || !association_phone_no  || !association_address || !modified_by ) {
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
    const { user_id, username, phone_no, password, wallet_bal, modified_by, status } = req.body;

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
                    wallet_bal: wallet_bal,
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
//FetchAllocatedCharger
async function FetchAllocatedCharger() {
    try {
        const db = await database.connectToDatabase();
        const devicesCollection = db.collection("charger_details");

        // Query to fetch chargers where assigned_reseller_id is null
        const chargers = await devicesCollection.find({ assigned_association_id: !null }).toArray();

        return chargers; // Only return data, don't send response
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

        // Query to fetch chargers where assigned_reseller_id is null
        const chargers = await devicesCollection.find({ assigned_association_id: null }).toArray();

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

module.exports = { 
    // MANAGE ASSOCIATION
    FetchAssociationUser,
    CreateAssociationUser,
    UpdateAssociationUser,
    DeActivateOrActivateAssociationUser,
    //PROFILE
    FetchUserProfile,
    UpdateUserProfile,
    //MANAGE CHARGER
    FetchUnAllocatedCharger,
    FetchAllocatedCharger,
    DeActivateOrActivateCharger,
};