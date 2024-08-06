const express = require('express');
const router = express.Router();
const Auth = require("../auth/ReSeller_Admin_Auth.js");
const functions = require("../function/ReSeller_Admin_Function.js");

// Route to check login credentials
router.post('/CheckLoginCredentials', async (req, res) => {
    try {
        const result = await Auth.authenticate(req);

        if (result.status !== 200) {
            return res.status(result.status).json({ message: result.message });
        }

        res.status(200).json({
            status: 'Success',
            data: result.data
        });
    } catch (error) {
        console.error('Error in CheckLoginCredentials route:', error);
        res.status(500).json({ status: 'Failed', message: 'Failed to check login credentials' });
    }
});

// MANAGE CLIENT Route
// Route to FetchClients
router.post('/getAllClients', async (req, res) => {
    try {
        const getresellerClients = await functions.FetchClients(req, res); // Pass req and res to the function
        res.status(200).json({ message: 'Success', data: getresellerClients });
    } catch (error) {
        console.error('Error in FetchClients route:', error);
        res.status(500).json({ status: 'Failed', message: 'Failed to fetch client details' });
    }
});
// Route to FetchAssignedAssociation
router.post('/FetchAssignedAssociation', async (req, res) => {
    try {
        await functions.FetchAssignedAssociation(req, res);
    } catch (error) {
        console.error('Error in FetchAssignedAssociation route:', error);
        res.status(500).json({ status: 'Failed', message: 'Failed to FetchAssignedAssociation' });
    }
});
// Route to FetchChargerDetailsWithSession
router.post('/FetchChargerDetailsWithSession', async (req, res) => {
    try {
        const ChargersWithSession = await functions.FetchChargerDetailsWithSession(req);
        
        // Filter out any circular references (optional, only if necessary)
        const Chargers = JSON.parse(JSON.stringify(ChargersWithSession));
        
        res.status(200).json({ status: 'Success', data: Chargers });
    } catch (error) {
        if (error.message === 'No chargers found for the specified client_id') {
            res.status(404).json({ status: 'Failed', message: error.message });
        } else if (error.message === 'Client ID is required') {
            res.status(400).json({ status: 'Failed', message: error.message });
        } else {
            res.status(500).json({ status: 'Failed', message: 'Internal Server Error' });
        }
    }
});

// add new client
router.post('/addNewClient', async (req, res) => {
    try {
        const result = await functions.addNewClient(req);
        if (result === true) {
            res.status(200).json({ message: 'Success', data: 'Client created successfully' });
        } else {
            res.status(500).json({ status: 'Failed', message: "Internal Server Error" });
        }
    } catch (error) {
        console.error('Error in addNewClient route:', error.message);
        const statusCode = error.statusCode || 500; // Default to 500 if no custom status code
        res.status(statusCode).json({ status: 'Failed', message: error.message });
    }
});

// Route to update reseller
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
        res.status(500).json({ status: 'Failed', message: error.message });
    }
});

router.post('/UpdateResellerCommission', async (req,res) => {
    try{
        const UpdateResellerCommission = await functions.updateCommission(req);
        if(UpdateResellerCommission === true){
            res.status(200).json({ message: 'Success', data: 'Commission updated successfully' });
        }else{
            console.log('Internal Server Error');
            res.status(500).json({ status: 'Failed', message: "Internal Server Error" });
        }
    }catch(error){
        console.error('Error in update reseller commission route:', error.message);
        res.status(500).json({ status: 'Failed', message: error.message });
    }
});

// Route to DeActivateOrActivate Reseller
router.post('/DeActivateClient', functions.DeActivateClient, (req, res) => {
    try {
        res.status(200).json({ status: 'Success' ,  message: 'User deactivated successfully' });
    } catch (error) {
        console.error('Error in DeActivateClient route:', error);
        res.status(500).json({ status: 'Failed', message: 'Failed to deactivate client' });
    }
});

// MANAGE USER Routes
// Route to FetchUser
router.post('/FetchUsers', async (req, res) => {
    try {
        // Call FetchUser function to get users data
        const user = await functions.FetchUser(req,res);
        // Send response with users data
        res.status(200).json({ status: 'Success', data: user });
        
    } catch (error) {
        console.error('Error in FetchUser route:', error);
        res.status(500).json({ status: 'Failed', message: 'Failed to fetch users' });
}});
// Route to FetchSpecificUserRoleForSelection 
router.get('/FetchSpecificUserRoleForSelection', async (req, res) => {
    try {
        // Call FetchUser function to get users data
        const user = await functions.FetchSpecificUserRoleForSelection(req, res);
        // Send response with users data
        res.status(200).json({ status: 'Success', data: user });
        
    } catch (error) {
        console.error('Error in FetchSpecificUserForCreateSelection route:', error);
        res.status(500).json({ status: 'Failed', message: 'Failed to FetchSpecificUserForCreateSelection ' });
}});
// Route to FetchClientForSelection 
router.post('/FetchClientForSelection', async (req, res) => {
    try {
        // Call FetchUser function to get users data
        const user = await functions.FetchClientForSelection(req, res);
        // Send response with users data
        res.status(200).json({ status: 'Success', data: user });
        
    } catch (error) {
        console.error('Error in FetchClientForSelection route:', error);
        res.status(500).json({ status: 'Failed', message: 'Failed to FetchClientForSelection ' });
}});
// Route to CreateUser
router.post('/CreateUser', functions.CreateUser, (req, res) => {
    res.status(200).json({ status: 'Success' ,message: 'New user created successfully' });
});
// Route to UpdateUser
router.post('/UpdateUser', functions.UpdateUser, (req, res) => {
    res.status(200).json({ status: 'Success' ,message: 'user updated successfully' });
});
// Route to DeActivateUser
router.post('/DeActivateUser', functions.DeActivateUser, (req, res) => {
    res.status(200).json({ status: 'Success' ,  message: 'User deactivated successfully' });
});


//MANAGE CHARGER Route
// Route to FetchUnAllocatedCharger 
router.post('/FetchUnAllocatedCharger', async (req, res) => {
    try {
        const Chargers = await functions.FetchUnAllocatedCharger(req);
        
        const safeChargers = JSON.parse(JSON.stringify(Chargers));
        
        res.status(200).json({ status: 'Success', data: safeChargers });
    } catch (error) {
        console.error('Error in FetchUnAllocatedCharger route:', error);
        res.status(500).json({ status: 'Failed', message: 'Failed to FetchUnAllocatedCharger' });
    }
});
// Route to FetchAllocatedCharger 
router.post('/FetchAllocatedCharger', async (req, res) => {
    try {
        const Chargers = await functions.FetchAllocatedCharger(req);
        
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

//ASSIGN TO CLIENT
// Route to FetchClientUserToAssginCharger
router.post('/FetchClientUserToAssginCharger', async (req, res) => {
    try {
        // Call FetchUser function to get users data
        const user = await functions.FetchClientUserToAssginCharger(req, res);
        // Send response with users data
        res.status(200).json({ status: 'Success', data: user });
        
    } catch (error) {
        console.error('Error in FetchClientUserToAssginCharger route:', error);
        res.status(500).json({ status: 'Failed', message: 'Failed to fetch users' });
}});
// Route to FetchUnAllocatedChargerToAssgin 
router.post('/FetchUnAllocatedChargerToAssgin', async (req, res) => {
    try {
        const Chargers = await functions.FetchUnAllocatedChargerToAssgin(req, res);
        
   
        res.status(200).json({ status: 'Success', data: Chargers });
    } catch (error) {
        console.error('Error in FetchUnAllocatedChargerToAssgin route:', error);
        res.status(500).json({ status: 'Failed', message: 'Failed to FetchUnAllocatedChargerToAssgin' });
    }
});
// Route to AssginChargerToClient
router.post('/AssginChargerToClient', async (req, res) => {
    try {
        await functions.AssginChargerToClient(req, res);
    } catch (error) {
        console.error('Error in AssginChargerToClient route:', error); 
        res.status(500).json({ message: 'Failed to AssginChargerToClient' });
    }
});

//MANAGE WALLET
//Route to FetchCommissionAmtReseller
router.post('/FetchCommissionAmtReseller', async (req, res) => {
    try {
        const commissionAmt = await functions.FetchCommissionAmtReseller(req, res);
        res.status(200).json({ status: 'Success', data: commissionAmt });

    } catch (error) {
        console.error('Error in FetchCommissionAmtReseller route:', error);
        res.status(500).json({ status: 'Failed', message: 'Failed to  FetchCommissionAmtReseller' });
    }
});

// PROFILE Route
// Route to FetchUserProfile 
router.post('/FetchUserProfile', async (req, res) => {
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
// Route to UpdateResellerProfile 
router.post('/UpdateResellerProfile',functions.UpdateResellerProfile, async (req, res) => {
    try {
        res.status(200).json({ status: 'Success',message: 'Reseller profile updated successfully' });
    } catch (error) {
        console.error('Error in UpdateResellerProfile route:', error);
        res.status(500).json({ status: 'Failed', message: 'Failed to update reseller profile' });
    }
});
module.exports = router;
