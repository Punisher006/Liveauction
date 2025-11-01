const { pool } = require('../config/database');

class Transaction {
    // Create new transaction
    static async create(transactionData) {
        const {
            userId,
            bidId,
            transactionType,
            amount,
            balanceBefore,
            balanceAfter,
            mpesaCode,
            mpesaPhone,
            description,
            status = 'pending'
        } = transactionData;

        const sql = `
            INSERT INTO transactions (user_id, bid_id, transaction_type, amount, balance_before, balance_after, mpesa_code, mpesa_phone, description, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const [result] = await pool.execute(sql, [
            userId,
            bidId,
            transactionType,
            amount,
            balanceBefore,
            balanceAfter,
            mpesaCode,
            mpesaPhone,
            description,
            status
        ]);
        
        return this.findById(result.insertId);
    }

    // Find transaction by ID
    static async findById(id) {
        const sql = `
            SELECT t.*, b.amount as bid_amount, b.investment_period
            FROM transactions t
            LEFT JOIN bids b ON t.bid_id = b.id
            WHERE t.id = ?
        `;
        const [rows] = await pool.execute(sql, [id]);
        return rows[0];
    }

    // Find transactions by user ID
    static async findByUserId(userId, page = 1, limit = 20) {
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

    // Count transactions by user ID
    static async countByUserId(userId) {
        const sql = 'SELECT COUNT(*) as count FROM transactions WHERE user_id = ?';
        const [rows] = await pool.execute(sql, [userId]);
        return rows[0].count;
    }

    // Update transaction status
    static async updateStatus(id, status) {
        const sql = 'UPDATE transactions SET status = ?, updated_at = NOW() WHERE id = ?';
        await pool.execute(sql, [status, id]);
    }

    // Get user transaction summary
    static async getUserSummary(userId) {
        const sql = `
            SELECT 
                transaction_type,
                COUNT(*) as count,
                SUM(amount) as total_amount
            FROM transactions 
            WHERE user_id = ? AND status = 'completed'
            GROUP BY transaction_type
        `;
        const [rows] = await pool.execute(sql, [userId]);
        return rows;
    }
}

module.exports = Transaction;