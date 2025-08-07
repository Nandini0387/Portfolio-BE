const pool = require('../database_connection');
const updateHoldings = require('./update_holdings');
const cron = require('node-cron');

const recordPortfolioValue = async () => {
  console.log('Recording portfolio history...');
  
  try {
    // First, ensure all prices are up-to-date by calling the update service.
    await updateHoldings();

    // Calculate total value from the now-updated holdings.
    const [holdings] = await pool.query('SELECT quantity, current_price FROM holdings WHERE current_price IS NOT NULL');

    const totalValue = holdings.reduce((sum, holding) => {
      // Ensure values are valid numbers before calculation.
      const quantity = parseFloat(holding.quantity);
      const price = parseFloat(holding.current_price);
      if (!isNaN(quantity) && !isNaN(price)) {
        return sum + (quantity * price);
      }
      return sum;
    }, 0);

    // Only record if the total value is greater than zero to avoid empty data points.
    if (totalValue > 0) {
      await pool.query(
        'INSERT INTO portfolio_history (total_value, timestamp) VALUES (?, NOW())',
        [totalValue]
      );
      console.log(`Successfully recorded portfolio value: $${totalValue.toFixed(2)}`);
    } else {
      console.log('Total portfolio value is zero. Nothing to record.');
    }
  } catch (error) {
    console.error('Error during portfolio history recording:', error.message);
  }
};
cron.schedule('* * * * *', async () => {
    console.log('📈 Updating Portfolio history...');
    await recordPortfolioValue(); // Portfolio History table gets updated per every minute
  });
module.exports = recordPortfolioValue;
