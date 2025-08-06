require('dotenv').config();
const axios = require('axios');
const pool = require('../database_connection');
const cron = require('node-cron');
const ensureStockTableExists = async (safeSymbol) => {
    const createQuery = `
      CREATE TABLE IF NOT EXISTS stock_quotes_history_${safeSymbol} (
        id INT PRIMARY KEY AUTO_INCREMENT,
        open_price DECIMAL(10, 2),
        high_price DECIMAL(10, 2),
        low_price DECIMAL(10, 2),
        current_price DECIMAL(10, 2),
        previous_close DECIMAL(10, 2),
        change_value DECIMAL(10, 2),
        percent_change DECIMAL(5, 2),
        fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await pool.query(createQuery);
  };
const fetchAndStoreFromFinnhub = async () => {
  try {

    const [rows] = await pool.query('SELECT symbol FROM holdings');

    for (const row of rows) {
       

      const symbol = row.symbol;
      const safeSymbol = symbol.replace(/[^a-zA-Z0-9]/g, '_');

      await ensureStockTableExists(safeSymbol);

      const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${process.env.FINNHUB_API_KEY}`;
      const response = await axios.get(url);
      const quote = response.data;

      if (quote && quote.c) {
        const insertQuery = `
          INSERT INTO stock_quotes_history_${safeSymbol}
            (open_price, high_price, low_price, current_price, previous_close, change_value, percent_change)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        const change = (quote.c - quote.pc).toFixed(2);
        const percent = ((change / quote.pc) * 100).toFixed(2);

        const values = [
          quote.o,
          quote.h,
          quote.l,
          quote.c,
          quote.pc,
          change,
          percent,
        ];

        await pool.query(insertQuery, values);
        console.log(`✅ Stored data for ${symbol}`);
      }
    }
  } catch (err) {
    console.error('🚨 Error updating stock data:', err.message);
  }
};

// Schedule every hourly update
cron.schedule('0 * * * *', async () => {
    console.log('📈 Updating stock history...');
    await fetchAndStoreFromFinnhub(); // Each stock table gets fresh hourly quote
  });