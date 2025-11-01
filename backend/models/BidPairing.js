const { pool } = require('../config/database');

class BidPairing {
    // Create bid pairing
    static async create(pairingData) {
        const { bidId, sellerId, buyerId, amount, sellerPhone, sellerMpesaName } = pairingData;
        
        const sql = `
            INSERT INTO bid_pairings (bid_id, seller_id, buyer_id, amount, seller_phone, seller_mpesa_name, payment_deadline) 
            VALUES (?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 24 HOUR))
        `;
        
        const [result] = await pool.execute(sql, [bidId, sellerId, buyerId, amount, sellerPhone, sellerMpesaName]);
        return result.insertId;
    }

    // Get pairings for bid
    static async findByBidId(bidId) {
        const sql = `
            SELECT 
                bp.*,
                u_seller.full_name as seller_name,
                u_buyer.full_name as buyer_name
            FROM bid_pairings bp
            JOIN users u_seller ON bp.seller_id = u_seller.id
            JOIN users u_buyer ON bp.buyer_id = u_buyer.id
            WHERE bp.bid_id = ?
        `;
        const [rows] = await pool.execute(sql, [bidId]);
        return rows;
    }

    // Get pairings for user
    static async findByUserId(userId) {
        const sql = `
            SELECT 
                bp.*,
                b.amount as bid_amount,
                b.investment_period,
                u_seller.full_name as seller_name,
                u_buyer.full_name as buyer_name
            FROM bid_pairings bp
            JOIN bids b ON bp.bid_id = b.id
            JOIN users u_seller ON bp.seller_id = u_seller.id
            JOIN users u_buyer ON bp.buyer_id = u_buyer.id
            WHERE bp.seller_id = ? OR bp.buyer_id = ?
            ORDER BY bp.created_at DESC
        `;
        const [rows] = await pool.execute(sql, [userId, userId]);
        return rows;
    }

    // Update payment status
    static async updatePaymentStatus(pairingId, status) {
        const sql = `
            UPDATE bid_pairings 
            SET payment_status = ?, 
                paid_at = CASE WHEN ? = 'paid' THEN NOW() ELSE paid_at END,
                confirmed_at = CASE WHEN ? = 'confirmed' THEN NOW() ELSE confirmed_at END
            WHERE id = ?
        `;
        await pool.execute(sql, [status, status, status, pairingId]);
    }

    // Find pairing by ID
    static async findById(pairingId) {
        const sql = 'SELECT * FROM bid_pairings WHERE id = ?';
        const [rows] = await pool.execute(sql, [pairingId]);
        return rows[0];
    }
}

module.exports = BidPairing;