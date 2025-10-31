const mysql = require('mysql2');
require('dotenv').config();

// Create connection pool with security settings
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'liveauction_db',
    port: process.env.DB_PORT || 3306,
    
    // Security settings
    charset: 'utf8mb4',
    timezone: '+00:00',
    connectionLimit: 10,
    queueLimit: 0,
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true,
    
    // SSL configuration (if using cloud database)
    ssl: process.env.DB_SSL === 'true' ? {
        rejectUnauthorized: true
    } : false
});

// Promise wrapper for the pool
const promisePool = pool.promise();

// Secure query execution with parameterization
const executeQuery = async (sql, params = []) => {
    const connection = await promisePool.getConnection();
    
    try {
        // Validate SQL query (basic check)
        if (!isSafeQuery(sql)) {
            throw new Error('Potentially unsafe SQL query detected');
        }
        
        const [rows] = await connection.execute(sql, params);
        return rows;
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    } finally {
        connection.release();
    }
};

// Check if query is safe (basic validation)
const isSafeQuery = (sql) => {
    const dangerousPatterns = [
        /(\b(DROP|ALTER|TRUNCATE|CREATE|DELETE)\b)/i,
        /(\b(INSERT|UPDATE)\b.*\b(SET|VALUES)\b.*\b(SELECT|FROM)\b)/i,
        /(;|\-\-|\/\*|\*\/|@@|@)/,
        /(UNION.*SELECT)/i,
        /(xp_|sp_|fn_)/i
    ];

    const upperSql = sql.toUpperCase();
    
    // Allow only SELECT, INSERT, UPDATE with proper structure
    if (!/^\s*(SELECT|INSERT|UPDATE|DELETE)\s+/i.test(upperSql)) {
        return false;
    }

    for (let pattern of dangerousPatterns) {
        if (pattern.test(sql)) {
            return false;
        }
    }

    return true;
};

// Secure user authentication queries
const userQueries = {
    findByEmail: `SELECT id, full_name, email, phone, password_hash, account_status, 
                 verification_status, balance, created_at 
                 FROM users WHERE email = ? AND account_status = 'active'`,
    
    findById: `SELECT id, full_name, email, phone, mpesa_name, balance, 
              account_status, verification_status, created_at 
              FROM users WHERE id = ? AND account_status = 'active'`,
    
    createUser: `INSERT INTO users (full_name, email, phone, password_hash, mpesa_name) 
                VALUES (?, ?, ?, ?, ?)`,
    
    updateBalance: `UPDATE users SET balance = ? WHERE id = ? AND account_status = 'active'`
};

// Secure bid queries
const bidQueries = {
    createBid: `INSERT INTO bids (user_id, auction_session_id, amount, investment_period, 
                expected_roi, expected_return, bid_date, bid_time, payment_deadline) 
                VALUES (?, ?, ?, ?, ?, ?, CURDATE(), TIME(NOW()), DATE_ADD(NOW(), INTERVAL 24 HOUR))`,
    
    findUserBids: `SELECT b.*, s.session_name, s.start_time, s.end_time 
                  FROM bids b 
                  JOIN auction_sessions s ON b.auction_session_id = s.id 
                  WHERE b.user_id = ? 
                  ORDER BY b.created_at DESC`,
    
    updateBidStatus: `UPDATE bids SET status = ?, updated_at = NOW() WHERE id = ? AND user_id = ?`
};

module.exports = {
    pool: promisePool,
    executeQuery,
    userQueries,
    bidQueries,
    testConnection: async () => {
        try {
            const [rows] = await promisePool.execute('SELECT 1 + 1 AS result');
            return true;
        } catch (error) {
            console.error('Database connection failed:', error);
            return false;
        }
    }
};