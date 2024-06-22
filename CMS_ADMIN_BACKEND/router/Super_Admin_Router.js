const express = require('express');
const router = express.Router();
const Auth = require("../auth/Super_Admin_Auth.js")
const functions = require("../function/Super_Admin_Function.js")

// Route to check login credentials
router.post('/CheckLoginCredentials', async (req, res) => {
    try {
        const result = await Auth.authenticate(req, res);

        if (result.error) {
            return res.status(result.status).json({ message: result.message });
        }

        res.status(200).json({ status: 'Success', data: result.user });
    } catch (error) {
        console.error('Error in CheckLoginCredentials route:', error);
        res.status(500).json({ status: 'Failed', message: 'Failed to authenticate user' });
    }
});

// USER_ROLE Routes
// Route to FetchUserRole
router.get('/FetchUserRoles', async (req, res) => {
    try {
        // Call FetchUserRole function to get users data
        const user_roles = await functions.FetchUserRole();
        // Send response with users data
        res.status(200).json({ status: 'Success', data: user_roles });
        
    } catch (error) {
        console.error('Error in FetchUserRole route:', error);
        res.status(500).json({ status: 'Failed', message: 'Failed to fetch user roles' });
    }
});
// Route to FetchUserRole Specific
router.get('/FetchSpecificUserRole', async (req, res) => {
    try {
        // Call FetchUserRole function to get users data
        const user_roles = await functions.FetchSpecificUserRole();
        // Send response with users data
        res.status(200).json({ status: 'Success', data: user_roles });
        
    } catch (error) {
        console.error('Error in FetchUserRole route:', error);
        res.status(500).json({ status: 'Failed', message: 'Failed to fetch user roles' });
    }
});
// Route to CreateUserRole
router.post('/CreateUserRole', functions.CreateUserRole, (req, res) => {
    res.status(200).json({ status: 'Success' ,  message: 'New user role created successfully' });
});
// Route to DeActivateOrActivateUserRole
router.post('/DeActivateOrActivateUserRole', functions.DeActivateOrActivateUserRole, (req, res) => {
    res.status(200).json({ status: 'Success' ,  message: 'User role updated successfully' });
});


// USER Routes
// Route to FetchUser 
router.get('/FetchUsers', async (req, res) => {
    try {
        // Call FetchUser function to get users data
        const user = await functions.FetchUser();
        // Send response with users data
        res.status(200).json({ status: 'Success', data: user });
        
    } catch (error) {
        console.error('Error in FetchUser route:', error);
        res.status(500).json({ status: 'Failed', message: 'Failed to fetch users' });
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

// CHARGER Route
// Route to FetchCharger 
router.get('/FetchCharger', async (req, res) => {
    try {
        const Chargers = await functions.FetchCharger();
        
        const safeChargers = JSON.parse(JSON.stringify(Chargers));
        
        res.status(200).json({ status: 'Success', data: safeChargers });
    } catch (error) {
        console.error('Error in FetchCharger route:', error);
        res.status(500).json({ status: 'Failed', message: 'Failed to fetch  charger' });
    }
});
// Route to create a new charger
router.post('/CreateCharger', async (req, res) => {
    try {
        await functions.CreateCharger(req, res);
    } catch (error) {
        console.error('Error in CreateCharger route:', error);
        res.status(500).json({ status: 'Failed', message: 'Failed to create charger' });
    }
});
// Route to update a charger
router.post('/UpdateCharger', async (req, res) => {
    try {
        // Call UpdateCharger function with req and res
        await functions.UpdateCharger(req, res);
    } catch (error) {
        console.error('Error in UpdateCharger route:', error);
        res.status(500).json({ status: 'Failed', message: 'Failed to update charger' });
    }
});
// Route to DeActivateOrActivate Reseller
router.post('/DeActivateOrActivateCharger', functions.DeActivateOrActivateCharger, (req, res) => {
    res.status(200).json({ status: 'Success' ,  message: 'Charger updated successfully' });
});

// RESELLER Route
// Route to FetchResellers
router.get('/FetchResellers', async (req, res) => {
    try {
        await functions.FetchResellers(req, res);
    } catch (error) {
        console.error('Error in FetchResellers route:', error);
        res.status(500).json({ status: 'Failed', message: 'Failed to fetch Resellers' });
    }
});
// Route to create a new reseller
router.post('/CreateReseller', async (req, res) => {
    try {
        await functions.CreateReseller(req, res);
    } catch (error) {
        console.error('Error in createReseller route:', error);
        res.status(500).json({ message: 'Failed to create reseller' });
    }
});
// Route to update reseller
router.post('/UpdateReseller', async (req, res) => {
    try {
        await functions.UpdateReseller(req, res);
    } catch (error) {
        console.error('Error in UpdateReseller route:', error); 
        res.status(500).json({ message: 'Failed to update reseller' });
    }
});
// Route to DeActivateOrActivate Reseller
router.post('/DeActivateOrActivateReseller', functions.DeActivateOrActivateReseller, (req, res) => {
    res.status(200).json({ status: 'Success' ,  message: 'Reseller updated successfully' });
});

//ASSIGN TO RESELLER
// Route to FetchUnallocatedCharger
router.get('/FetchUnallocatedCharger', async (req, res) => {
    try {
        const Chargers = await functions.FetchCharger();
        
        // Filter out any circular references (optional, only if necessary)
        const safeChargers = JSON.parse(JSON.stringify(Chargers));
        
        res.status(200).json({ status: 'Success', data: safeChargers });
    } catch (error) {
        console.error('Error in FetchUnallocatedCharger route:', error);
        res.status(500).json({ status: 'Failed', message: 'Failed to fetch unallocated charger' });
    }
});
module.exports = router;
