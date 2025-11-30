// /backend/src/seeder.js
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Apartment = require("./models/apartmentModel");
const User = require("./models/userModel");

dotenv.config();
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB connected (Seeder)"))
  .catch((err) => console.log(err));


// ===============================
// DỮ LIỆU MẪU CHO CĂN HỘ
// ===============================
const apartmentsData = [
  {
    title: "Căn hộ Studio 35m² – Nội thất đầy đủ",
    description: "Studio nhỏ gọn, phù hợp cho người độc thân. Gần siêu thị, hồ bơi, gym.",
    price: 7500000,
    area: 35,
    bedrooms: 1,
    bathrooms: 1,
    status: "available",
    images: [
      "https://images.unsplash.com/photo-1600607687830-5b0fbcfc9c2d",
    ],
    location: { address: "Tầng 5 - Block A" },
    utilities: ["Wifi", "Thang máy", "Gym", "Hồ bơi"]
  },
  {
    title: "Căn hộ 2 phòng ngủ – View thành phố",
    description: "Căn hộ rộng rãi, thích hợp cho gia đình nhỏ, an ninh 24/7.",
    price: 12000000,
    area: 65,
    bedrooms: 2,
    bathrooms: 2,
    status: "available",
    images: [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c",
    ],
    location: { address: "Tầng 12 - Block B" },
    utilities: ["Wifi", "Máy lạnh", "Bãi xe", "Sân chơi trẻ em"]
  },
  {
    title: "Căn hộ 3 phòng ngủ – Tiện nghi cao cấp",
    description: "Nội thất cao cấp, bếp rộng, ban công lớn. Gần trung tâm thương mại.",
    price: 15000000,
    area: 90,
    bedrooms: 3,
    bathrooms: 2,
    status: "available",
    images: [
      "https://images.unsplash.com/photo-1600607687878-cb0ce5c99990",
    ],
    location: { address: "Tầng 20 - Block A" },
    utilities: ["Hồ bơi", "Gym", "Khu BBQ", "An ninh 24/7"]
  },
  {
    title: "Penthouse 2 tầng – View toàn thành phố",
    description: "Không gian sang trọng, rộng 150m², sân vườn riêng, nội thất VIP.",
    price: 30000000,
    area: 150,
    bedrooms: 3,
    bathrooms: 3,
    status: "available",
    images: [
      "https://images.unsplash.com/photo-1600585154203-650d21cd0a8b",
    ],
    location: { address: "Tầng 30 - Penthouse" },
    utilities: ["Hồ bơi riêng", "Sân vườn", "Thang máy riêng", "Bãi xe VIP"]
  }
];


// ===============================
// DỮ LIỆU MẪU USER (Admin + Cư dân)
// ===============================
const usersData = [
  {
    name: "Admin",
    email: "ADMIN_EMAIL_THUC_CUA_BAN@gmail.com",
    password: "admin123",
    role: "admin",
    phone: "0909000001",
    address: "Chung cư Tương Lai - Block A",
  },
  {
    name: "Nguyễn Văn A",
    email: "a@example.com",
    password: "123456",
    role: "resident",
    phone: "0909123456",
    address: "Block B - Tầng 10",
  }
];


// ===============================
// HÀM IMPORT DỮ LIỆU
// ===============================
const importData = async () => {
  try {
    await Apartment.deleteMany();
    await User.deleteMany();

    await Apartment.insertMany(apartmentsData);

    // ❗ ĐOẠN NÀY ĐỔI insertMany -> create từng user
    for (const user of usersData) {
      await User.create(user);   // chạy pre('save') => hash password
    }

    console.log("🌱 Dữ liệu mẫu đã được thêm thành công!");
    process.exit();
  } catch (error) {
    console.log("❌ Lỗi khi thêm dữ liệu:", error);
    process.exit(1);
  }
};

importData();
