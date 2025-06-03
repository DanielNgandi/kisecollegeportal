import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';
import { JWT_SECRET } from '../config/auth.js';

const registerStudent = async (req, res) => {
  try {
    const { fullName, email, password, groupCode, courseCode, type } = req.body;

    // Validate input
    if (!fullName || !email || !password || !groupCode || !courseCode || !type) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if student exists
    const existingStudent = await prisma.student.findUnique({ where: { email } });
    if (existingStudent) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Find group and course
    const group = await prisma.group.findUnique({ where: { groupCode } });
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const course = await prisma.course.findUnique({ where: { courseCode } });
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create student
    const student = await prisma.student.create({
      data: {
        fullName,
        email,
        password: hashedPassword,
        status: 'PENDING',
        groupId: group.id,
        courseId: course.id,
        type
      }
    });

    // Create initial progress records for all units in the course
    const units = await prisma.unit.findMany({
      where: { courseId: course.id }
    });

    for (const unit of units) {
      await prisma.progress.create({
        data: {
          studentId: student.id,
          unitId: unit.id,
          completion: 0.0
        }
      });
    }

    res.status(201).json({
      id: student.id,
      fullName: student.fullName,
      email: student.email,
      status: student.status,
      group: group.groupCode,
      course: course.courseCode
    });

  } catch (error) {
    console.error('Student registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

const loginStudent = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const student = await prisma.student.findUnique({ 
      where: { email },
      include: {
        group: true,
        course: true
      }
    });

    if (!student) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, student.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check account status
   // if (student.status !== 'ACTIVE') {
    //  return res.status(403).json({ 
    //    error: 'Account not active. Please wait for approval.' 
   //   });
    //}

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: student.id, 
        email: student.email, 
        role: 'STUDENT' 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      id: student.id,
      fullName: student.fullName,
      email: student.email,
      group: student.group.groupCode,
      course: student.course.courseCode,
      type: student.type,
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};
// Student Password Reset
const resetStudentPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({ error: 'Email and new password are required' });
    }

    // Check if student exists
    const student = await prisma.student.findUnique({ where: { email } });
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password in DB
    await prisma.student.update({
      where: { email },
      data: {
        password: hashedPassword
      }
    });

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Password reset failed' });
  }
};
export default {
  registerStudent,
  loginStudent,
  resetStudentPassword
};