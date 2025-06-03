import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';
import { JWT_SECRET } from '../config/auth.js';

export const authenticateStudent = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Verify the user is a student
    const student = await prisma.student.findUnique({
      where: { id: decoded.id }
    });

    if (!student || student.status !== 'ACTIVE') {
      throw new Error();
    }

    // Attach student to request
    req.user = student;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Please authenticate as a student' });
  }
};

