import express from 'express';
const router = express.Router();
//import{ registerStudent, loginStudent, resetStudentPassword} from '../controllers/studentauth.js';
import studentAuth from '../controllers/studentauth.js';
// Student registration
router.post('/register', studentAuth.registerStudent);

// Student login
router.post('/login', studentAuth.loginStudent);

router.post('/resetpassword', studentAuth.resetStudentPassword);

export default router