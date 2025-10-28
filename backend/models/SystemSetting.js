const mongoose = require('mongoose');

const systemSettingSchema = new mongoose.Schema({
    settingKey: {
        type: String,
        required: true,
        unique: true
    },
    settingValue: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Get setting value by key
systemSettingSchema.statics.getValue = function(key, defaultValue = null) {
    return this.findOne({ settingKey: key })
        .then(setting => setting ? setting.settingValue : defaultValue);
};

// Get multiple settings
systemSettingSchema.statics.getMultiple = function(keys) {
    return this.find({ settingKey: { $in: keys } })
        .then(settings => {
            const result = {};
            settings.forEach(setting => {
                result[setting.settingKey] = setting.settingValue;
            });
            
            // Add default values for missing keys
            keys.forEach(key => {
                if (!result[key]) {
                    result[key] = null;
                }
            });
            
            return result;
        });
};

module.exports = mongoose.model('SystemSetting', systemSettingSchema);