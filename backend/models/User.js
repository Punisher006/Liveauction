const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
    // Create new user
    static async create(userData) {
        const { fullName, email, phone, password, mpesaName } = userData;
        
        const passwordHash = await bcrypt.hash(password, 10);
        
        const sql = `
            INSERT INTO users (full_name, email, phone, password_hash, mpesa_name) 
            VALUES (?, ?, ?, ?, ?)
        `;
        
        const [result] = await pool.execute(sql, [fullName, email, phone, passwordHash, mpesaName]);
        return result.insertId;
    }

    // Find user by email
    static async findByEmail(email) {
        const sql = 'SELECT * FROM users WHERE email = ?';
        const [rows] = await pool.execute(sql, [email]);
        return rows[0];
    }

    // Find user by ID
    static async findById(id) {
        const sql = 'SELECT id, full_name, email, phone, mpesa_name, balance, account_status, verification_status, created_at FROM users WHERE id = ?';
        const [rows] = await pool.execute(sql, [id]);
        return rows[0];
    }

    // Update user balance
    static async updateBalance(userId, newBalance) {
        const sql = 'UPDATE users SET balance = ? WHERE id = ?';
        await pool.execute(sql, [newBalance, userId]);
    }

    // Update last login
    static async updateLastLogin(userId) {
        const sql = 'UPDATE users SET last_login = NOW() WHERE id = ?';
        await pool.execute(sql, [userId]);
    }

    // Compare password
    static async comparePassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }

    // Get user statistics
    static async getUserStats(userId) {
        const sql = `
            SELECT 
                COUNT(*) as total_bids,
                SUM(amount) as total_invested,
                SUM(CASE WHEN status = 'completed' THEN expected_return - amount ELSE 0 END) as total_earned
            FROM bids 
            WHERE user_id = ?
        `;
        const [rows] = await pool.execute(sql, [userId]);
        return rows[0];
    }
}

module.exports = User;