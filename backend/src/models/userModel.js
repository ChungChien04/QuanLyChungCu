// /backend/src/models/userModel.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: [true, 'Vui lòng nhập tên'], 
      trim: true 
    },

    email: { 
      type: String, 
      required: [true, 'Vui lòng nhập email'], 
      unique: true, 
      trim: true, 
      lowercase: true 
    },

    password: { 
      type: String, 
      required: [true, 'Vui lòng nhập mật khẩu'], 
      minlength: 6 
    },

    role: { 
      type: String, 
      enum: ['resident', 'admin'], 
      default: 'resident' 
    },

    // --- Thông tin cá nhân ---
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    avatar: { type: String, default: 'default-avatar.png' },

    // ⭐ GIỚI TÍNH
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      default: 'other'
    },

    // ⭐ NGÀY SINH
    birthday: {
      type: String, // dùng String cho dễ xử lý FE
      default: ''
    },

    // ⭐ THÊM MỚI: ĐẾM THÔNG BÁO CHƯA ĐỌC
    // - rentals: thông báo về hợp đồng (admin duyệt / huỷ / hoàn tất huỷ)
    // - invoices: thông báo về hoá đơn (tương tự, nếu bạn muốn dùng sau này)
    unreadNotifications: {
      rentals: { type: Number, default: 0 },
      invoices: { type: Number, default: 0 },
    },
  },

  { timestamps: true }
);

// Hash mật khẩu
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);

  next();
});

// So sánh mật khẩu
userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
