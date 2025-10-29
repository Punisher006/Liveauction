const { pool } = require('../config/database');
const crypto = require('crypto');

class PasswordResetToken {
    // Create password reset token
    static async create(userId) {
        // Generate random token
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour
        
        // Delete any existing tokens for this user
        await pool.execute('DELETE FROM password_reset_tokens WHERE user_id = ?', [userId]);
        
        // Create new token
        const sql = `
            INSERT INTO password_reset_tokens (user_id, token, expires_at) 
            VALUES (?, ?, ?)
        `;
        
        const [result] = await pool.execute(sql, [userId, token, expiresAt]);
        return token;
    }

    // Find valid token
    static async findValidToken(token) {
        const sql = `
            SELECT prt.*, u.email, u.full_name 
            FROM password_reset_tokens prt 
            JOIN users u ON prt.user_id = u.id 
            WHERE prt.token = ? AND prt.expires_at > NOW() AND prt.used = FALSE
        `;
        
        const [rows] = await pool.execute(sql, [token]);
        return rows[0];
    }

    // Mark token as used
    static async markAsUsed(token) {
        const sql = 'UPDATE password_reset_tokens SET used = TRUE WHERE token = ?';
        await pool.execute(sql, [token]);
    }

    // Clean expired tokens
    static async cleanExpiredTokens() {
        await pool.execute('DELETE FROM password_reset_tokens WHERE expires_at <= NOW()');
    }
}

module.exports = PasswordResetToken;