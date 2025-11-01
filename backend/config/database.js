const mysql = require('mysql2');
require('dotenv').config();

// Create connection pool with security settings
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'liveauction_db',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4',
    timezone: '+00:00',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    connectTimeout: 60000,
    acquireTimeout: 60000,
    timeout: 60000,
    typeCast: function (field, next) {
        if (field.type === 'TINY' && field.length === 1) {
            return (field.string() === '1'); // 1 = true, 0 = false
        }
        return next();
    }
});

// Promise wrapper for the pool
const promisePool = pool.promise();

// Test database connection with timeout
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

// Initialize database with required data and security
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
                ('max_active_bids_per_user', '1', 'Maximum active bids per user'),
                ('max_login_attempts', '5', 'Maximum failed login attempts before lock'),
                ('account_lock_duration', '30', 'Account lock duration in minutes')
            `);
            console.log('✅ System settings initialized');
        }

        // Create admin user if not exists (with secure password)
        const [adminUsers] = await promisePool.execute('SELECT COUNT(*) as count FROM users WHERE email = ?', ['admin@liveauction.com']);
        if (adminUsers[0].count === 0) {
            const bcrypt = require('bcryptjs');
            const adminPasswordHash = await bcrypt.hash('ChangeThisPassword123!', 12);
            
            await promisePool.execute(`
                INSERT INTO users (full_name, email, phone, password_hash, mpesa_name, account_status, verification_status, is_admin) 
                VALUES (?, ?, ?, ?, ?, 'active', 'verified', 1)
            `, ['System Administrator', 'admin@liveauction.com', '254700000000', adminPasswordHash, 'ADMIN']);
            
            console.log('✅ Admin user created (change password immediately!)');
        }

        console.log('✅ Database initialization completed');
    } catch (error) {
        console.error('❌ Database initialization failed:', error.message);
        throw error;
    }
};

// Graceful shutdown
const closeDatabase = async () => {
    try {
        await promisePool.end();
        console.log('✅ Database connections closed gracefully');
    } catch (error) {
        console.error('❌ Error closing database connections:', error.message);
    }
};

module.exports = {
    pool: promisePool,
    testConnection,
    initializeDatabase,
    closeDatabase
};