const { pool } = require('../config/database');

class AuctionSession {
    // Get all active sessions
    static async findAll() {
        const sql = 'SELECT * FROM auction_sessions WHERE status = "active" ORDER BY start_time';
        const [rows] = await pool.execute(sql);
        return rows;
    }

    // Get session by ID
    static async findById(id) {
        const sql = 'SELECT * FROM auction_sessions WHERE id = ?';
        const [rows] = await pool.execute(sql, [id]);
        return rows[0];
    }

    // Get current or next session
    static async getCurrentOrNext() {
        const currentTime = new Date().toTimeString().split(' ')[0];
        
        const sql = `
            SELECT * FROM auction_sessions 
            WHERE status = 'active' 
            ORDER BY 
                CASE 
                    WHEN ? BETWEEN start_time AND end_time THEN 1
                    WHEN start_time > ? THEN 2
                    ELSE 3
                END,
                start_time
            LIMIT 2
        `;
        
        const [rows] = await pool.execute(sql, [currentTime, currentTime]);
        
        let currentSession = null;
        let nextSession = null;

        if (rows.length > 0) {
            const firstSession = rows[0];
            const sessionStartTime = firstSession.start_time;
            const sessionEndTime = firstSession.end_time;

            if (currentTime >= sessionStartTime && currentTime <= sessionEndTime) {
                currentSession = firstSession;
                nextSession = rows[1] || null;
            } else {
                nextSession = firstSession;
            }
        }

        return { currentSession, nextSession };
    }

    // Get session statistics
    static async getSessionStats(sessionId) {
        const sql = `
            SELECT 
                COUNT(*) as total_bids,
                COALESCE(SUM(amount), 0) as total_volume,
                COALESCE(AVG(amount), 0) as average_bid,
                COUNT(CASE WHEN status IN ('pending', 'paired') THEN 1 END) as active_bids
            FROM bids 
            WHERE auction_session_id = ?
        `;
        const [rows] = await pool.execute(sql, [sessionId]);
        return rows[0];
    }

    // Get current bids count for session
    static async getCurrentBidCount(sessionId) {
        const sql = `
            SELECT COUNT(*) as current_bids 
            FROM bids 
            WHERE auction_session_id = ? AND status IN ('pending', 'paired')
        `;
        const [rows] = await pool.execute(sql, [sessionId]);
        return rows[0].current_bids;
    }
}

module.exports = AuctionSession;