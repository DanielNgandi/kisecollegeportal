const express = require('express');
const router = express.Router();
const { registerStudent, loginStudent, resetStudentPassword} = require('../controllers/studentauth');

// Student registration
router.post('/register', registerStudent);

// Student login
router.post('/login', loginStudent);

router.post('/resetpassword', resetStudentPassword);

module.exports = router;