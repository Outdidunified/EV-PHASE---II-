const express = require('express');
const router = express.Router();
const Auth = require("../auth/ReSeller_Admin_Auth.js");
const functions = require("../function/ReSeller_Admin_Function.js");

// Route to check login credentials
router.post('/CheckLoginCredentials', async(req, res) => {
    try{
        const result = await Auth.authenticate(req);
        res.status(200).json({ message: 'Success', data: {reseller_name: result.reseller_name, reseller_id: result.reseller_id} });
    }catch(error){
        console.error('Error in CheckLoginCredentials route:', error);
        res.status(500).json({ status: 'Failed', message: 'Failed to check login credentials' });
    }
});


// Route to fetch the client details
router.get('/getAllClients', async (req, res) => {
    try {
        const getresellerClients = await functions.FetchAllClients(req, res); // Pass req and res to the function
        res.status(200).json({ message: 'Success', data: getresellerClients });
    } catch (error) {
        console.error('Error in getAllClients route:', error);
        res.status(500).json({ status: 'Failed', message: 'Failed to fetch client details' });
    }
});

// Route to de-activate the client
router.post('/DeActivateClient', functions.DeActivateClient, (req, res) => {
    try {
        res.status(200).json({ status: 'Success' ,  message: 'User deactivated successfully' });
    } catch (error) {
        console.error('Error in DeActivateClient route:', error);
        res.status(500).json({ status: 'Failed', message: 'Failed to deactivate client' });
    }
});

router.post('/addNewClient', async(req,res) => {
    try{
        const addNewClient = await functions.addNewClient(req);
        if(addNewClient === true){
            res.status(200).json({ message: 'Success', data: 'Client created successfully' });
        }else{
            console.log('Internal Server Error');
            res.json({ status: 'Failed', message: "Internal Server Error" });
        }
    }catch(error){
        console.error('Error in addNewClient route:', error.message);
        res.json({ status: 'Failed', message: error.message });
    }
});

router.post('/updateClient', async(req,res) => {
    try{
        const updateClient = await functions.updateClient(req);
        if(updateClient === true){
            res.status(200).json({ message: 'Success', data: 'Client updated successfully' });
        }else{
            console.log('Internal Server Error');
            res.status(500).json({ status: 'Failed', message: "Internal Server Error" });
        }
    }catch(error){
        console.error('Error in updateClient route:', error.message);
        res.json({ status: 'Failed', message: error.message });
    }
});

module.exports = router;
