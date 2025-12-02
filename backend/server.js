// server.js
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path'); 

const createDefaultAdmin = require("./src/utils/createAdmin.js");
const paymentRoutes = require("./src/routes/paymentRoutes");

// Routes import
const rentalRoutes = require("./src/routes/rentalRoutes"); 
const newsRoutes = require("./src/routes/newsRoutes");
const invoiceRoutes = require("./src/routes/invoiceRoutes"); 

// ✅ IMPORT ĐÚNG FILE ADMIN STATS
const adminStatsRoutes = require("./src/routes/adminStatsRoutes");

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Static chuẩn
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

// ====== ROUTES ======
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/apartments', require('./src/routes/apartmentRoutes'));
app.use('/api/chatbot', require('./src/routes/chatbotRoutes'));
app.use('/api/reports', require('./src/routes/reportRoutes'));
app.use('/api/reviews', require('./src/routes/reviewRoutes'));

app.use("/api/payments", paymentRoutes);
app.use("/api/rentals", rentalRoutes); 
app.use("/api/news", newsRoutes);

// ⭐ Route Admin Stats
app.use("/api/admin", adminStatsRoutes);

// ⭐ Route hóa đơn
app.use("/api/invoices", invoiceRoutes);

// Test route
app.get('/', (req, res) => {
  res.send("API Server for Apartment Management is running!");
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running at http://localhost:${PORT}`)
);
