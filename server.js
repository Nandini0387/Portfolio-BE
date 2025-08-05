const express = require('express');
require('dotenv').config();
const pool = require('./database_connection');
const updateHoldings = require('./services/update_holdings');
const holdingsRoute = require('./routes/holdings');
const cors = require('cors');


const app = express();
app.use(express.json());
app.use('/holdings', holdingsRoute);
app.use(cors());
// Get all holdings
app.get('/holdings', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM holdings');
  res.json(rows);
});

// Update holdings prices
app.post('/update', async (req, res) => {
  const result = await updateHoldings();
  res.json(result);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
