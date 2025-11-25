const mongoose = require("mongoose");

const systemSettingSchema = new mongoose.Schema({
  commonFee: { type: Number, default: 300000 },
  cleaningFee: { type: Number, default: 100000 }, 
  electricityPrice: { type: Number, default: 3800 }
}, { timestamps: true });

// Singleton: Chỉ nên có 1 document setting duy nhất trong DB
module.exports = mongoose.model("SystemSetting", systemSettingSchema);