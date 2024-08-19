const express = require('express');
const router = express.Router();
const Auth = require("../auth/Association_Admin_Auth.js")
const functions = require("../function/Association_Admin_Function.js")

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
// Route to UpdateAssociationProfile 
router.post('/UpdateAssociationProfile',functions.UpdateAssociationProfile, async (req, res) => {
    try {
        res.status(200).json({ status: 'Success',message: 'Client profile updated successfully' });
    } catch (error) {
        console.error('Error in UpdateAssociationProfile route:', error);
        res.status(500).json({ status: 'Failed', message: 'Failed to update Association profile' });
    }
});

// MANAGE USER Routes
// Route to FetchUser
router.post('/FetchUsers', async (req, res) => {
    try {
        // Call FetchUser function to get users data
        const user = await functions.FetchUser(req, res);
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
// Route to FetchAllocatedChargerByClientToAssociation 
router.post('/FetchAllocatedChargerByClientToAssociation', async (req, res) => {
    try {
        const Chargers = await functions.FetchAllocatedChargerByClientToAssociation(req);
        
        const safeChargers = JSON.parse(JSON.stringify(Chargers));
        
        res.status(200).json({status: 'Success', data: safeChargers });
    } catch (error) {
        console.error('Error in FetchAllocatedChargerByClientToAssociation route:', error);
        res.status(500).json({ status: 'Failed', message: 'Failed to FetchAllocatedChargerByClientToAssociation' });
    }
});
// Route to DeActivateOrActivate Reseller
router.post('/UpdateDevice', functions.UpdateDevice, (req, res) => {
    res.status(200).json({ status: 'Success' ,  message: 'Charger updated successfully' });
});
// Route to DeActivateOrActivate Reseller
router.post('/DeActivateOrActivateCharger', functions.DeActivateOrActivateCharger, (req, res) => {
    res.status(200).json({ status: 'Success' ,  message: 'Charger updated successfully' });
});

//MANAGE WALLET
//Route to FetchCommissionAmtAssociation
router.post('/FetchCommissionAmtAssociation', async (req, res) => {
    try {
        const commissionAmt = await functions.FetchCommissionAmtAssociation(req, res);
        res.status(200).json({ status: 'Success', data: commissionAmt });
    } catch (error) {
        console.error('Error in FetchCommissionAmtAssociation route:', error);
        res.status(500).json({ status: 'Failed', message: 'Failed to  FetchCommissionAmtAssociation' });
    }
});

//ADD USER TO ASSOCIATION
//ASSGIN
//FetchUsersWithSpecificRolesToAssgin
router.get('/FetchUsersWithSpecificRolesToAssgin', async (req, res) => {
    try {
        await functions.FetchUsersWithSpecificRolesToAssgin(req, res);
    } catch (error) {
        console.error('Error in FetchUsersWithSpecificRolesToAssgin route:', error);
        res.status(500).json({ status: 'Failed', message: 'Failed to FetchUsersWithSpecificRolesToAssgin' });
    }
});
//AddUserToAssociation
router.post('/AssUserToAssociation', functions.AddUserToAssociation, (req, res) => {
    res.status(200).json({ status: 'Success', message: 'User added successfully' });
});
//UN_ASSGIN
//FetchUsersWithSpecificRolesToUnAssgin
router.post('/FetchUsersWithSpecificRolesToUnAssgin', async (req, res) => {
    try {
        await functions.FetchUsersWithSpecificRolesToUnAssgin(req, res);
    } catch (error) {
        console.error('Error in FetchUsersWithSpecificRolesToUnAssgin route:', error);
        res.status(500).json({ status: 'Failed', message: 'Failed to FetchUsersWithSpecificRolesToUnAssgin' });
    }
});
//RemoveUserFromAssociation
router.post('/RemoveUserFromAssociation', async (req, res) => {
    try {
        await functions.RemoveUserFromAssociation(req, res);
    } catch (error) {
        console.error('Error in RemoveUserFromAssociation route:', error);
        res.status(500).json({ status: 'Failed', message: 'Failed to remove user from association' });
    }
});


// ASSGIN TAG ID  TO USER
// Route to AssignTagIdToUser
router.post('/AssignTagIdToUser', functions.AssignTagIdToUser, (req, res) => {
    res.status(200).json({ status: 'Success', message: 'Tag ID assigned successfully to user' });
});


// MANAGE_TAGID
//FetchAllTagIDs
router.get('/FetchAllTagIDs', async (req, res) => {
    try {
        const tags = await functions.FetchAllTagIDs(req, res);
        if(tags.status === 404){
            res.status(200).json({ status: 'Success', data: tags.message });
        }else{
            res.status(200).json({ status: 'Success', data: tags });
        }
    } catch (error) {
        console.error('Error in FetchAllTagIDs route:', error);
        res.status(500).json({ status: 'Failed', message: 'Failed to fetch tag IDs' });
    }
});

//CreateTagID
router.post('/CreateTagID', async (req, res) => {
    try {
        await functions.CreateTagID(req, res);
    } catch (error) {
        console.error('Error in CreateTagID route:', error);
        res.status(500).json({ status: 'Failed', message: 'Failed to create tag ID' });
    }
});
//UpdateTagID
router.post('/UpdateTagID', async (req, res) => {
    try {
        await functions.UpdateTagID(req, res);
    } catch (error) {
        console.error('Error in UpdateTagID route:', error);
        res.status(500).json({ status: 'Failed', message: 'Failed to update tag ID' });
    }
});
//DeactivateTagID
router.post('/DeactivateOrActivateTagID', async (req, res) => {
    try {
        await functions.DeactivateTagID(req, res);
    } catch (error) {
        console.error('Error in DeactivateTagID route:', error);
        res.status(500).json({ status: 'Failed', message: 'Failed to deactivate tag ID' });
    }
});


module.exports = router;
