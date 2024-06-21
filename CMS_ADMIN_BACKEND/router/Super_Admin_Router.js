const express = require('express');
const router = express.Router();
const Auth = require("../auth/Super_Admin_Auth.js")
const functions = require("../function/Super_Admin_Function.js")

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


// Route to check login credentials
router.post('/CheckLoginCredentials', Auth.authenticate, (req, res) => {
    res.status(200).json({ status: 'Success' });
});

module.exports = router;
