const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { authenticateStudent } = require('../middleware/authmiddleware');

// Protected routes - require student authentication
router.use(authenticateStudent);

// Dashboard route
router.get('/dashboard', studentController.getDashboardData);

// Course and unit routes
router.get('/courses', studentController.getStudentCourses);
router.get('/lessons/:lessonId', studentController.getLessonDetails);

module.exports = router;