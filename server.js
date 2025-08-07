const express = require('express');
require('dotenv').config();
const pool = require('./database_connection');
const updateHoldings = require('./services/update_holdings');
const holdingsRoute = require('./routes/holdings');
const cors = require('cors');
const stockRoutes = require('./routes/stocks');
const recordPortfolioValue = require('./services/record_history');


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
app.post('/updateHoldings', async (req, res) => {
  const result = await updateHoldings();
  res.json(result);
});
app.use('/api', stockRoutes);


app.get('/portfolio/performance', async (req, res) => {
  try {
    const [history] = await pool.query(
      'SELECT total_value, timestamp FROM portfolio_history ORDER BY timestamp DESC LIMIT 100'
    );
    res.json(history.reverse());
  } catch (err) {
    console.error("Error fetching portfolio history:", err.message);
    res.status(500).json({ error: 'Failed to fetch portfolio history' });
  }
});

app.post('/updatePortfolioHistory', async (req, res) => {
  await recordPortfolioValue();
  res.json({ message: "Update and recording process triggered." });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
