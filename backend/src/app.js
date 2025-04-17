// backend/src/app.js 

const express = require('express');
const dotenv = require('dotenv');
const sequelize = require('./config/database');
const authRoutes = require('./routes/auth.routes');

dotenv.config();
const app = express();

app.use(express.json());
app.use('/auth', authRoutes);

sequelize.sync({ force: true }).then(() => {
  console.log('Database synced');
});

module.exports = app;