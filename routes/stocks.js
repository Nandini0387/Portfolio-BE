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
  

module.exports = router;
