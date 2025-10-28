const mongoose = require('mongoose');
const AuctionSession = require('../models/AuctionSession');
const SystemSetting = require('../models/SystemSetting');

const initDatabase = async () => {
    try {
        // Initialize Auction Sessions
        const sessions = await AuctionSession.find();
        if (sessions.length === 0) {
            await AuctionSession.insertMany([
                {
                    sessionName: 'Morning Auction',
                    startTime: '09:00:00',
                    endTime: '10:00:00',
                    maxBidsPerSession: 50
                },
                {
                    sessionName: 'Afternoon Auction',
                    startTime: '13:00:00',
                    endTime: '14:00:00',
                    maxBidsPerSession: 50
                },
                {
                    sessionName: 'Evening Auction',
                    startTime: '19:30:00',
                    endTime: '20:30:00',
                    maxBidsPerSession: 50
                }
            ]);
            console.log('Auction sessions initialized');
        }

        // Initialize System Settings
        const settings = await SystemSetting.find();
        if (settings.length === 0) {
            await SystemSetting.insertMany([
                {
                    settingKey: 'min_investment',
                    settingValue: '500',
                    description: 'Minimum investment amount in KES'
                },
                {
                    settingKey: 'max_investment',
                    settingValue: '100000',
                    description: 'Maximum investment amount in KES'
                },
                {
                    settingKey: 'roi_4_days',
                    settingValue: '30',
                    description: 'ROI percentage for 4 days investment'
                },
                {
                    settingKey: 'roi_8_days',
                    settingValue: '60',
                    description: 'ROI percentage for 8 days investment'
                },
                {
                    settingKey: 'roi_12_days',
                    settingValue: '95',
                    description: 'ROI percentage for 12 days investment'
                },
                {
                    settingKey: 'payment_deadline_hours',
                    settingValue: '24',
                    description: 'Payment deadline in hours'
                },
                {
                    settingKey: 'system_commission',
                    settingValue: '5',
                    description: 'System commission percentage'
                },
                {
                    settingKey: 'max_active_bids_per_user',
                    settingValue: '1',
                    description: 'Maximum active bids per user'
                }
            ]);
            console.log('System settings initialized');
        }

        console.log('Database initialization completed successfully');
    } catch (error) {
        console.error('Database initialization failed:', error);
    }
};

module.exports = initDatabase;