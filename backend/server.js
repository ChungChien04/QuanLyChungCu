const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');   // ⭐ phải có
const createDefaultAdmin = require("./src/utils/createAdmin.js");
const newsRoutes = require("./src/routes/newsRoutes");

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ⭐ STATIC CHUẨN — chỉ để 1 dòng duy nhất  
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// DB Connect
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB connected successfully!");

    await createDefaultAdmin();
  } catch (err) {
    console.error("❌ MongoDB connect error:", err.message);
    process.exit(1);
  }
};
connectDB();

// Routes
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/apartments', require('./src/routes/apartmentRoutes'));
app.use('/api/chatbot', require('./src/routes/chatbotRoutes'));
app.use('/api/reports', require('./src/routes/reportRoutes'));
app.use('/api/reviews', require('./src/routes/reviewRoutes'));
app.use("/api/news", newsRoutes);

// Test
app.get('/', (req, res) => {
  res.send("API Server for Apartment Management is running!");
});

// Server start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running at http://localhost:${PORT}`)
);
