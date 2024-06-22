const database = require('../db');
const logger = require('../logger');

async function FetchAllClients(req, res) {
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


// add new client
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

// Update client details
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

module.exports = { FetchAllClients, DeActivateClient, addNewClient, updateClient }