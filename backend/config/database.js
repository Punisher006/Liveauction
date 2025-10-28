const mysql = require('mysql2');
require('dotenv').config();

// Create connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'liveauction_db',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4'
});

// Promise wrapper for the pool
const promisePool = pool.promise();

// Test database connection
const testConnection = async () => {
    try {
        const [rows] = await promisePool.execute('SELECT 1 + 1 AS result');
        console.log('✅ MySQL database connected successfully');
        return true;
    } catch (error) {
        console.error('❌ MySQL connection failed:', error.message);
        return false;
    }
};

// Initialize database with required data
const initializeDatabase = async () => {
    try {
        // Check if auction sessions exist
        const [sessions] = await promisePool.execute('SELECT COUNT(*) as count FROM auction_sessions');
        if (sessions[0].count === 0) {
            await promisePool.execute(`
                INSERT INTO auction_sessions (session_name, start_time, end_time, max_bids_per_session) VALUES
                ('Morning Auction', '09:00:00', '10:00:00', 50),
                ('Afternoon Auction', '13:00:00', '14:00:00', 50),
                ('Evening Auction', '19:30:00', '20:30:00', 50)
            `);
            console.log('✅ Auction sessions initialized');
        }

        // Check if system settings exist
        const [settings] = await promisePool.execute('SELECT COUNT(*) as count FROM system_settings');
        if (settings[0].count === 0) {
            await promisePool.execute(`
                INSERT INTO system_settings (setting_key, setting_value, description) VALUES
                ('min_investment', '500', 'Minimum investment amount in KES'),
                ('max_investment', '100000', 'Maximum investment amount in KES'),
                ('roi_4_days', '30', 'ROI percentage for 4 days investment'),
                ('roi_8_days', '60', 'ROI percentage for 8 days investment'),
                ('roi_12_days', '95', 'ROI percentage for 12 days investment'),
                ('payment_deadline_hours', '24', 'Payment deadline in hours'),
                ('system_commission', '5', 'System commission percentage'),
                ('max_active_bids_per_user', '1', 'Maximum active bids per user')
            `);
            console.log('✅ System settings initialized');
        }

        console.log('✅ Database initialization completed');
    } catch (error) {
        console.error('❌ Database initialization failed:', error.message);
    }
};

module.exports = {
    pool: promisePool,
    testConnection,
    initializeDatabase
};