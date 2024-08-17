const express = require('express');
const router = express.Router();
const Auth = require("../auth/Client_Admin_Auth.js")
const functions = require("../function/Client_Admin_Function.js")
const CircularJSON = require('circular-json');

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
// Route to UpdateClientProfile 
router.post('/UpdateClientProfile',functions.UpdateClientProfile, async (req, res) => {
    try {
        res.status(200).json({ status: 'Success',message: 'Client profile updated successfully' });
    } catch (error) {
        console.error('Error in UpdateClientProfile route:', error);
        res.status(500).json({ status: 'Failed', message: 'Failed to update Client profile' });
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
        console.error('Error in FetchSpecificUserRoleForSelection route:', error);
        res.status(500).json({ status: 'Failed', message: 'Failed to FetchSpecificUserForCreateSelection ' });
}});
// Route to FetchAssociationForSelection 
router.post('/FetchAssociationForSelection', async (req, res) => {
    try {
        // Call FetchUser function to get users data
        const user = await functions.FetchAssociationForSelection(req, res);
        // Send response with users data
        res.status(200).json({ status: 'Success', data: user });
        
    } catch (error) {
        console.error('Error in FetchAssociationForSelection route:', error);
        res.status(500).json({ status: 'Failed', message: 'Failed to FetchAssociationForSelection ' });
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

// MANAGE ASSOCIATION Routes
// Route to FetchAssociationUser 
router.post('/FetchAssociationUser', async (req, res) => {
    try {
        const user = await functions.FetchAssociationUser(req, res);
        const safeUser = CircularJSON.stringify(user); // Safely handle circular references
        res.status(200).json({ status: 'Success', data: JSON.parse(safeUser) });
    } catch (error) {
        console.error('Error in FetchUser route:', error);
        res.status(500).json({ status: 'Failed', message: 'Failed to fetch users' });
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
        if (error.message === 'No chargers found for the specified AssociationID') {
            res.status(404).json({ status: 'Failed', message: error.message });
        } else if (error.message === 'Association ID is required') {
            res.status(400).json({ status: 'Failed', message: error.message });
        } else {
            res.status(500).json({ status: 'Failed', message: 'Internal Server Error' });
        }
    }
});
// Route to CreateAssociationUser 
router.post('/CreateAssociationUser', functions.CreateAssociationUser, (req, res) => {
    res.status(200).json({ status: 'Success' ,message:  'Association created successfully' });
});
// Route to UpdateAssociationUser 
router.post('/UpdateAssociationUser', functions.UpdateAssociationUser, (req, res) => {
    res.status(200).json({ status: 'Success' ,message:  'Association updated successfully' });
});
// Route to DeActivateOrActivateAssociationUser 
router.post('/DeActivateOrActivateAssociationUser', functions.DeActivateOrActivateAssociationUser, (req, res) => {
    res.status(200).json({ status: 'Success' ,  message: 'AssociationUser updated successfully' });
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

//MANAGE WALLET
//Route to FetchCommissionAmtClient
router.post('/FetchCommissionAmtClient', async (req, res) => {
    try {
        const commissionAmt = await functions.FetchCommissionAmtClient(req, res);
        res.status(200).json({ status: 'Success', data: commissionAmt });
    } catch (error) {
        console.error('Error in FetchCommissionAmtReseller route:', error);
        res.status(500).json({ status: 'Failed', message: 'Failed to  FetchCommissionAmtReseller' });
    }
});

//MANAGE FINANCE
// Route to FetchFinanceDetails
router.get('/FetchFinanceDetails', async (req, res) => {
    try {
        const data = await functions.FetchFinanceDetails(req, res);
        res.status(200).json({ status: 'Success', data: data });

    } catch (error) {
        console.error('Error in FetchFinanceDetails route:', error);
        res.status(500).json({ status: 'Failed', message: 'Failed to  FetchFinanceDetails' });
    }
});
// Route to CreateFinanceDetails
router.post('/CreateFinanceDetails', functions.CreateFinanceDetails, (req, res) => {
    res.status(200).json({ status: 'Success' ,message:  'Finance Details created successfully' });
});
// Route to UpdateFinanceDetails
router.post('/UpdateFinanceDetails', functions.UpdateFinanceDetails, (req, res) => {
    res.status(200).json({ status: 'Success' ,message:  'Finance Details Updated successfully' });
});
// Route to DeactivateOrActivateFinanceDetails
router.post('/DeactivateOrActivateFinanceDetails', functions.DeactivateOrActivateFinanceDetails, (req, res) => {
    res.status(200).json({ status: 'Success' ,message:  'Finance  Updated successfully' });
});

// ASSGIN FINANCE TO CHARGER
// Route to AssignFinanceToCharger
router.post('/AssignFinanceToCharger', functions.AssignFinanceToCharger, (req, res) => {
    res.status(200).json({ status: 'Success' ,message:  'Finance Assigned successfully' });
});
// Route to FetchFinanceDetailsForSelection
router.get('/FetchFinanceDetailsForSelection', async (req, res) => {
    try {
        const data = await functions.FetchFinanceDetails(req, res);
        res.status(200).json({ status: 'Success', data: data });

    } catch (error) {
        console.error('Error in FetchFinanceDetailsForSelection route:', error);
        res.status(500).json({ status: 'Failed', message: 'Failed to  FetchFinanceDetailsForSelection' });
    }
});


//ASSIGN TO ASSOCIATION
// Route to FetchAssociationUserToAssginCharger
router.post('/FetchAssociationUserToAssginCharger', async (req, res) => {
    try {
        // Call FetchUser function to get users data
        const user = await functions.FetchAssociationUserToAssginCharger(req, res);
        // Send response with users data
        res.status(200).json({ status: 'Success', data: user });
        
    } catch (error) {
        console.error('Error in FetchAssociationUserToAssginCharger route:', error);
        res.status(500).json({ status: 'Failed', message: 'Failed to fetch users' });
}});
// Route to FetchUnAllocatedChargerToAssgin 
router.post('/FetchUnAllocatedChargerToAssgin', async (req, res) => {
    try {
        const Chargers = await functions.FetchUnAllocatedChargerToAssgin(req);
        
        const safeChargers = JSON.parse(JSON.stringify(Chargers));
        
        res.status(200).json({ status: 'Success', data: safeChargers });
    } catch (error) {
        console.error('Error in FetchUnAllocatedChargerToAssgin route:', error);
        res.status(500).json({ status: 'Failed', message: 'Failed to FetchUnAllocatedChargerToAssgin' });
    }
});
// Route to AssginChargerToAssociation
router.post('/AssginChargerToAssociation', async (req, res) => {
    try {
        await functions.AssginChargerToAssociation(req, res);
    } catch (error) {
        console.error('Error in AssginChargerToClient route:', error); 
        res.status(500).json({ message: 'Failed to AssginChargerToClient' });
    }
});

module.exports = router;
