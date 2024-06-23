const express = require('express');
const router = express.Router();
const Auth = require("../auth/Client_Admin_Auth.js")
const functions = require("../function/Client_Admin_Function.js")

// Route to check login credentials
router.post('/CheckLoginCredentials', Auth.authenticate ,async(req, res) => {
    try{
        res.status(200).json({ status: 'Success',data: {reseller_name:  req.clientDetails.client_id, reseller_id: result.reseller_id}});
    }catch(error){
        console.error('Error in CheckLoginCredentials route:', error);
        res.status(500).json({ status: 'Failed', message: 'Failed to check login credentials' });
    }
});

// PROFILE Route
// Route to FetchUserProfile 
router.get('/FetchUserProfile', async (req, res) => {
    try {
        const userdata = await functions.FetchUserProfile(req, res);
        res.status(200).json({ status: 'Success', data: userdata });

    } catch (error) {
        console.error('Error in FetchUserProfile route:', error);
        res.status(500).json({ status: 'Failed', message: 'Failed to  FetchUserProfile' });
    }
});
// Route to UpdateUserProfile 
router.post('/UpdateUserProfile',functions.UpdateUserProfile, async (req, res) => {
    try {
        res.status(200).json({ status: 'Success',message: 'User profile updated successfully' });
    } catch (error) {
        console.error('Error in UpdateUserProfile route:', error);
        res.status(500).json({ status: 'Failed', message: 'Failed to update user profile' });
    }
});

// MANAGE ASSOCIATION Routes
// Route to FetchAssociationUser 
router.get('/FetchAssociationUser', async (req, res) => {
    try {
        // Call FetchUser function to get users data
        const user = await functions.FetchAssociationUser(req, res);
        // Send response with users data
        res.status(200).json({ status: 'Success', data: user });
        
    } catch (error) {
        console.error('Error in FetchUser route:', error);
        res.status(500).json({ status: 'Failed', message: 'Failed to fetch users' });
}});
// Route to CreateAssociationUser 
router.post('/CreateAssociationUser', functions.CreateAssociationUser, (req, res) => {
    res.status(200).json({ status: 'Success' ,message:  'Association created successfully' });
});
// Route to CreateAssociationUser 
router.post('/UpdateAssociationUser', functions.UpdateAssociationUser, (req, res) => {
    res.status(200).json({ status: 'Success' ,message:  'Association updated successfully' });
});
// Route to DeActivateOrActivateAssociationUser 
router.post('/DeActivateOrActivateAssociationUser', functions.DeActivateOrActivateAssociationUser, (req, res) => {
    res.status(200).json({ status: 'Success' ,  message: 'AssociationUser updated successfully' });
});

//MANAGE CHARGER Route
// Route to FetchUnAllocatedCharger 
router.get('/FetchUnAllocatedCharger', async (req, res) => {
    try {
        const Chargers = await functions.FetchUnAllocatedCharger();
        
        const safeChargers = JSON.parse(JSON.stringify(Chargers));
        
        res.status(200).json({ status: 'Success', data: safeChargers });
    } catch (error) {
        console.error('Error in FetchUnAllocatedCharger route:', error);
        res.status(500).json({ status: 'Failed', message: 'Failed to FetchUnAllocatedCharger' });
    }
});
// Route to FetchAllocatedCharger 
router.get('/FetchAllocatedCharger', async (req, res) => {
    try {
        const Chargers = await functions.FetchAllocatedCharger();
        
        const safeChargers = JSON.parse(JSON.stringify(Chargers));
        
        res.status(200).json({ status: 'Success', data: safeChargers });
    } catch (error) {
        console.error('Error in FetchAllocatedCharger route:', error);
        res.status(500).json({ status: 'Failed', message: 'Failed to FetchAllocatedCharger' });
    }
});
// Route to DeActivateOrActivate Reseller
router.post('/DeActivateOrActivateCharger', functions.DeActivateOrActivateCharger, (req, res) => {
    res.status(200).json({ status: 'Success' ,  message: 'Charger updated successfully' });
});

module.exports = router;
