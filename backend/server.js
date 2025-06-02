require('dotenv').config();
const express = require('express');
const cors = require('cors');
const studentAuthRoutes = require('./routes/studentauthroute');
const studentRoutes = require('./routes/studentroute');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/auth/student', studentAuthRoutes);
app.use('/student', studentRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Student backend running on port ${PORT}`);
});