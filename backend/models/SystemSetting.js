const { pool } = require('../config/database');

class SystemSetting {
    // Get all settings
    static async findAll() {
        const sql = 'SELECT * FROM system_settings';
        const [rows] = await pool.execute(sql);
        return rows;
    }

    // Get setting by key
    static async findByKey(key) {
        const sql = 'SELECT * FROM system_settings WHERE setting_key = ?';
        const [rows] = await pool.execute(sql, [key]);
        return rows[0];
    }

    // Get multiple settings
    static async findByKeys(keys) {
        const placeholders = keys.map(() => '?').join(',');
        const sql = `SELECT * FROM system_settings WHERE setting_key IN (${placeholders})`;
        const [rows] = await pool.execute(sql, keys);
        
        const settings = {};
        rows.forEach(row => {
            settings[row.setting_key] = row.setting_value;
        });
        
        return settings;
    }

    // Update setting
    static async update(key, value, userId = null) {
        const sql = 'UPDATE system_settings SET setting_value = ?, updated_by = ? WHERE setting_key = ?';
        await pool.execute(sql, [value, userId, key]);
    }

    // Get investment settings
    static async getInvestmentSettings() {
        const keys = ['min_investment', 'max_investment', 'roi_4_days', 'roi_8_days', 'roi_12_days'];
        return await this.findByKeys(keys);
    }
}

module.exports = SystemSetting;