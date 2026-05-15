const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
const allowedOrigins = [
  "http://localhost:3000",
  "https://team-task-manager-3-eqpm.onrender.com"
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS blocked"));
    }
  },
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tasks', require('./routes/tasks'));

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Team Task Manager API is running!' });
});

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log(' MongoDB Connected');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(` Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error(' MongoDB connection error:', err.message);
    process.exit(1);
  });
