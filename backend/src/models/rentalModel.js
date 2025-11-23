const mongoose = require("mongoose");

const rentalSchema = new mongoose.Schema({
  apartment: { type: mongoose.Schema.Types.ObjectId, ref: "Apartment", required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  totalPrice: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ["pending", "reserved", "approved", "rented", "cancelling", "cancelled"], 
    default: "pending" 
  },
  contractSigned: { type: Boolean, default: false },
  paymentDone: { type: Boolean, default: false },
  paymentQRCode: { type: String, default: "" }
}, { timestamps: true });

// Fix OverwriteModelError
module.exports = mongoose.models.Rental || mongoose.model("Rental", rentalSchema);
