// routes/holdings.js
const express = require('express');
const router = express.Router();
const pool = require('../database_connection');

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM holdings');
    res.json(rows); // Sends back all holdings
  } catch (err) {
    console.error("Error fetching holdings:", err.message);
    res.status(500).json({ error: 'Failed to fetch holdings' });
  }
});

module.exports = router;
