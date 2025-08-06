const pool = require('../database_connection');
const axios = require('axios');
require('dotenv').config();
const cron = require('node-cron');

const updateHoldings = async () => {
  console.log("Update function triggered");
  
  const [holdings] = await pool.query('SELECT * FROM holdings');
  console.log("Fetched holdings:", holdings);

  const updates = [];

  for (const holding of holdings) {
    console.log(`Fetching data for symbol: ${holding.symbol}`);
    
    const url = `https://finnhub.io/api/v1/quote?symbol=${holding.symbol}&token=${process.env.FINNHUB_API_KEY}`;
try {
  const response = await axios.get(url);
  const quote = response.data;

  if (!quote || quote.c == null) {
    console.warn(`No quote data for ${holding.symbol}`);
    updates.push({ symbol: holding.symbol, error: 'No quote data' });
    continue;
  }

  const currentPrice = parseFloat(quote.c);
  const returnValue = (currentPrice - holding.buy_price) * holding.quantity;

  await pool.query(
    'UPDATE holdings SET current_price = ?, return_value = ?, last_updated = NOW() WHERE id = ?',
    [currentPrice, returnValue, holding.id]
  );

  updates.push({ symbol: holding.symbol, currentPrice, returnValue });
} catch (err) {
  console.error(`Error fetching ${holding.symbol}:`, err.message);
  updates.push({ symbol: holding.symbol, error: 'API fetch failed' });
}

  }

  console.log("Updates complete:", updates);
  return updates;
};

cron.schedule('*/5 * * * *', async () => {
  console.log('🔄 Updating holdings...');
  await updateHoldings(); // Make sure this updates current_price & return_value
});

module.exports = updateHoldings;
