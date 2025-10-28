const mongoose = require('mongoose');

const auctionSessionSchema = new mongoose.Schema({
    sessionName: {
        type: String,
        required: true
    },
    startTime: {
        type: String, // Store as "HH:MM:SS"
        required: true
    },
    endTime: {
        type: String, // Store as "HH:MM:SS"
        required: true
    },
    maxBidsPerSession: {
        type: Number,
        default: 50
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    }
}, {
    timestamps: true
});

// Get current or next session
auctionSessionSchema.statics.getCurrentOrNextSession = function() {
    const now = new Date();
    const currentTime = now.toTimeString().split(' ')[0]; // "HH:MM:SS"
    
    return this.find({ status: 'active' })
        .then(sessions => {
            let currentSession = null;
            let nextSession = null;
            
            for (const session of sessions) {
                if (currentTime >= session.startTime && currentTime <= session.endTime) {
                    currentSession = session;
                    break;
                } else if (currentTime < session.startTime && (!nextSession || session.startTime < nextSession.startTime)) {
                    nextSession = session;
                }
            }
            
            // If no next session today, get first session tomorrow
            if (!currentSession && !nextSession && sessions.length > 0) {
                nextSession = sessions[0];
            }
            
            return { currentSession, nextSession };
        });
};

module.exports = mongoose.model('AuctionSession', auctionSessionSchema);