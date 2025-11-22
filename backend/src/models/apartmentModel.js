const mongoose = require('mongoose');



const apartmentSchema = new mongoose.Schema({
  title: { type: String, required: true },

  // số căn hộ (không bắt buộc)
  number: { type: String },

  // thông tin cơ bản
  area: { type: Number, required: true },
  price: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ["available", "rented", "sold"], 
    default: "available" 
  },

  // chi tiết phòng
  bedrooms: { type: Number, default: 1 },
  bathrooms: { type: Number, default: 1 },

  // mô tả
  description: { type: String, default: "" },

  // địa chỉ / tầng
  location: {
    address: { type: String, default: "" },
    floor: { type: Number, default: null }
  },

  // tiện ích
  utilities: [{ type: String }],

  // ảnh
  images: [{ type: String }]
  
}, { timestamps: true });


module.exports = mongoose.model("Apartment", apartmentSchema);


module.exports = mongoose.model("Apartment", apartmentSchema);
