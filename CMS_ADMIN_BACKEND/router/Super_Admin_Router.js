const express = require('express');
const router = express.Router();
const {authenticate} = require("../auth/Super_Admin_Auth.js")

// Route to check login credentials
router.post('/CheckLoginCredentials', authenticate, (req, res) => {
    res.status(200).json({ message: 'Success' });
});
module.exports = router;
