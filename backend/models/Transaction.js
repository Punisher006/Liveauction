const { pool } = require('../config/database');

class Transaction {
    // Create new transaction
    static async create(transactionData) {
        const { userId, bidId, transactionType, amount, balanceBefore, balanceAfter, mpesaCode, mpesaPhone, description } = transactionData;
        
        const sql = `
            INSERT INTO transactions (user_id, bid_id, transaction_type, amount, balance_before, balance_after, mpesa_code, mpesa_phone, description) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const [result] = await pool.execute(sql, [
            userId, bidId, transactionType, amount, balanceBefore, balanceAfter, mpesaCode, mpesaPhone, description
        ]);
        return result.insertId;
    }

    // Get transactions by user ID
    static async findByUserId(userId, limit = 20, page = 1) {
        const offset = (page - 1) * limit;
        
        const sql = `
            SELECT t.*, b.amount as bid_amount, b.investment_period 
            FROM transactions t 
            LEFT JOIN bids b ON t.bid_id = b.id 
            WHERE t.user_id = ? 
            ORDER BY t.created_at DESC 
            LIMIT ? OFFSET ?
        `;
        
        const [rows] = await pool.execute(sql, [userId, limit, offset]);
        return rows;
    }

    // Get transaction count for user
    static async countByUserId(userId) {
        const sql = 'SELECT COUNT(*) as count FROM transactions WHERE user_id = ?';
        const [rows] = await pool.execute(sql, [userId]);
        return rows[0].count;
    }

    // Update transaction status
    static async updateStatus(transactionId, status) {
        const sql = 'UPDATE transactions SET status = ? WHERE id = ?';
        await pool.execute(sql, [status, transactionId]);
    }
}

module.exports = Transaction;