import express from 'express';
const router = express.Router();
import studentController from '../controllers/studentcontroller.js';
import { authenticateStudent } from'../middleware/authmiddleware.js';

// Protected routes - require student authentication
router.use(authenticateStudent);

// Dashboard route
router.get('/dashboard', studentController.getDashboardData);

// Course and unit routes
router.get('/courses', studentController.getStudentCourses);
router.get('/lessons/:lessonId', studentController.getLessonDetails);

export default router