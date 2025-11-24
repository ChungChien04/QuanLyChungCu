const mongoose = require("mongoose");

const rentalSchema = new mongoose.Schema(
  {
    apartment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Apartment",
      required: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    months: { type: Number, required: true },

    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },

    totalPrice: { type: Number, required: true },

    status: {
      type: String,
      enum: [
        "pending",
        "reserved",
        "approved",
        "rented",
        "cancelling",
        "cancelled",
      ],
      default: "pending",
    },

    contractText: { type: String, default: "" },
    contractSigned: { type: Boolean, default: false },

    paymentDone: { type: Boolean, default: false },
    paymentQRCode: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Rental || mongoose.model("Rental", rentalSchema);
