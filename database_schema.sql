-- Create database
CREATE DATABASE IF NOT EXISTS portfolio;
USE portfolio;

-- Create holdings table
CREATE TABLE IF NOT EXISTS holdings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    symbol VARCHAR(10) NOT NULL,
    company_name VARCHAR(100),
    quantity INT NOT NULL,
    buy_price DECIMAL(10, 2) NOT NULL,
    current_price DECIMAL(10, 2),
    return_value DECIMAL(10, 2),
    last_updated DATETIME
);
