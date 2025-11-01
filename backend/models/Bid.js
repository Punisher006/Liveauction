const { pool } = require('../config/database');
const { sanitizeSQL } = require('../middleware/security');

class Bid {
    // Create new bid
    static async create(bidData) {
        const { userId, auctionSessionId, amount, investmentPeriod } = bidData;
        
        const roiRates = { 4: 0.3, 8: 0.6, 12: 0.95 };
        const expectedROI = roiRates[investmentPeriod] * 100;
        const expectedReturn = amount + (amount * roiRates[investmentPeriod]);
        
        const sql = `
            INSERT INTO bids (user_id, auction_session_id, amount, investment_period, expected_roi, expected_return, bid_date, bid_time, payment_deadline) 
            VALUES (?, ?, ?, ?, ?, ?, CURDATE(), TIME(NOW()), DATE_ADD(NOW(), INTERVAL 24 HOUR))
        `;
        
        const [result] = await pool.execute(sql, [
            userId, 
            auctionSessionId, 
            amount, 
            investmentPeriod, 
            expectedROI, 
            expectedReturn
        ]);
        
        return result.insertId;
    }

    // Get user bids with session details
    static async findByUserId(userId) {
        const sql = `
            SELECT 
                b.*, 
                s.session_name,
                s.start_time,
                s.end_time,
                TIMEDIFF(s.end_time, TIME(NOW())) as time_remaining
            FROM bids b 
            JOIN auction_sessions s ON b.auction_session_id = s.id 
            WHERE b.user_id = ? 
            ORDER BY b.created_at DESC
        `;
        
        const [rows] = await pool.execute(sql, [userId]);
        return rows;
    }

    // Get bid by ID with details
    static async findById(bidId) {
        const sql = `
            SELECT 
                b.*,
                u.full_name as user_name,
                u.phone as user_phone,
                s.session_name
            FROM bids b
            JOIN users u ON b.user_id = u.id
            JOIN auction_sessions s ON b.auction_session_id = s.id
            WHERE b.id = ?
        `;
        const [rows] = await pool.execute(sql, [bidId]);
        return rows[0];
    }

    // Update bid status
    static async updateStatus(bidId, status) {
        const sql = 'UPDATE bids SET status = ?, updated_at = NOW() WHERE id = ?';
        await pool.execute(sql, [status, bidId]);
    }

    // Get active bids for auction session
    static async getActiveBidsForSession(sessionId) {
        const sql = `
            SELECT b.*, u.full_name, u.phone 
            FROM bids b 
            JOIN users u ON b.user_id = u.id 
            WHERE b.auction_session_id = ? AND b.status IN ('pending', 'paired')
        `;
        const [rows] = await pool.execute(sql, [sessionId]);
        return rows;
    }

    // Check if user has active bid
    static async hasActiveBid(userId) {
        const sql = `
            SELECT COUNT(*) as count 
            FROM bids 
            WHERE user_id = ? AND status IN ('pending', 'paired')
        `;
        const [rows] = await pool.execute(sql, [userId]);
        return rows[0].count > 0;
    }

    // Count all bids
    static async countAll() {
        const sql = 'SELECT COUNT(*) as count FROM bids';
        const [rows] = await pool.execute(sql);
        return rows[0].count;
    }

    // Count bids by status
    static async countByStatus(statuses) {
        const placeholders = statuses.map(() => '?').join(',');
        const sql = `SELECT COUNT(*) as count FROM bids WHERE status IN (${placeholders})`;
        const [rows] = await pool.execute(sql, statuses);
        return rows[0].count;
    }

    // Get total volume of completed bids
    static async getTotalVolume() {
        const sql = 'SELECT COALESCE(SUM(amount), 0) as total FROM bids WHERE status = "completed"';
        const [rows] = await pool.execute(sql);
        return rows[0].total;
    }
}

module.exports = Bid;