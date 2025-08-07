const express = require('express');
const router = express.Router();
const pool = require('../database_connection');

router.post('/add-stock', async (req, res) => {
  const { symbol, company_name, quantity, buy_price, threshold } = req.body;

  if (!symbol || !company_name || !quantity || !buy_price) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const insertQuery = `
      INSERT INTO holdings (symbol, company_name, quantity, buy_price, threshold, last_updated)
      VALUES (?, ?, ?, ?, ?, NOW())
    `;
    await pool.query(insertQuery, [
      symbol.toUpperCase(),
      company_name,
      quantity,
      buy_price,
      threshold || null,
    ]);

    res.status(201).json({ message: 'Stock added to holdings ✅' });
  } catch (error) {
    console.error('Insert error:', error);
    res.status(500).json({ error: 'Failed to add stock' });
  }
});


router.get('/latest-stock/:symbol', async (req, res) => {
  const symbol = req.params.symbol.toLowerCase();
  const stockTable = `stock_quotes_history_${symbol}`;

  try {
    const [rows] = await pool.query(
      `SELECT * FROM ?? ORDER BY fetched_at DESC LIMIT 1`,
      [stockTable]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'No data found for this stock' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch latest data for this Stock' });
  }
});

router.delete('/remove-stock/:symbol', async (req, res) => {
    const symbol = req.params.symbol.toUpperCase();
  
    try {
      // Delete the stock from holdings table
      const deleteHoldingQuery = `DELETE FROM holdings WHERE symbol = ?`;
      await pool.query(deleteHoldingQuery, [symbol]);
  
      // Drop the corresponding stock history table
      const dropTableQuery = `DROP TABLE IF EXISTS stock_quotes_history_${symbol.toLowerCase()}`;
      await pool.query(dropTableQuery);
  
      res.status(200).json({ message: `Stock '${symbol}' removed and its table deleted 🧹` });
    } catch (error) {
      console.error('Remove error:', error);
      res.status(500).json({ error: 'Failed to remove stock and delete table' });
    }
  });
  

  /*
router.get('/top-performers', async (req, res) => {
    try {
      const [rows] = await pool.query(
        `SELECT symbol, return_value 
         FROM holdings 
         WHERE return_value IS NOT NULL 
         ORDER BY return_value DESC 
         LIMIT 3`
      );
  
      res.status(200).json(rows);
    } catch (error) {
      console.error('Error fetching top performers:', error.message);
      res.status(500).json({ error: 'Failed to fetch top performers' });
    }
  });
  
  router.get('/least-performers', async (req, res) => {
    try {
      const [rows] = await pool.query(
        `SELECT symbol, return_value 
         FROM holdings 
         WHERE return_value IS NOT NULL 
         ORDER BY return_value ASC 
         LIMIT 3`
      );
  
      res.status(200).json(rows);
    } catch (error) {
      console.error('Error fetching least performers:', error.message);
      res.status(500).json({ error: 'Failed to fetch least performers' });
    }
  });
  
*/

  // Add these to your routes/stocks.js or create a new route file

// Get top performers
router.get('/top-performers', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT symbol, company_name, return_value, 
             (return_value / (buy_price * quantity) * 100) as return_percentage
      FROM holdings 
      WHERE return_value IS NOT NULL 
      ORDER BY return_percentage DESC 
      LIMIT 3
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching top performers:', error);
    res.status(500).json({ error: 'Failed to fetch top performers' });
  }
});

// Get worst performers
router.get('/worst-performers', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT symbol, company_name, return_value,
             (return_value / (buy_price * quantity) * 100) as return_percentage
      FROM holdings 
      WHERE return_value IS NOT NULL 
      ORDER BY return_percentage ASC 
      LIMIT 3
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching worst performers:', error);
    res.status(500).json({ error: 'Failed to fetch worst performers' });
  }
});

// Get portfolio summary
router.get('/portfolio-summary', async (req, res) => {
  try {
    const [summary] = await pool.query(`
      SELECT 
        COUNT(*) as total_stocks,
        SUM(quantity * buy_price) as total_investment,
        SUM(quantity * COALESCE(current_price, buy_price)) as current_value,
        SUM(COALESCE(return_value, 0)) as total_return
      FROM holdings
    `);
    res.json(summary[0]);
  } catch (error) {
    console.error('Error fetching portfolio summary:', error);
    res.status(500).json({ error: 'Failed to fetch portfolio summary' });
  }
});

// Get alerts (stocks near threshold)
router.get('/alerts', async (req, res) => {
  try {
    const [alerts] = await pool.query(`
      SELECT symbol, company_name, current_price, threshold,
             CASE 
               WHEN current_price >= threshold THEN 'above_threshold'
               WHEN current_price <= threshold * 0.95 THEN 'near_threshold'
               ELSE 'normal'
             END as alert_type
      FROM holdings 
      WHERE threshold IS NOT NULL 
      AND current_price IS NOT NULL
      AND (current_price >= threshold OR current_price <= threshold * 0.95)
    `);
    res.json(alerts);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});
module.exports = router;
