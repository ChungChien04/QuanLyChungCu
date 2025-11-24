// /backend/src/controllers/reportController.js
const User = require('../models/userModel');
const Apartment = require('../models/apartmentModel');
const Contract = require('../models/contractModel');

exports.getDashboardStats = async (req, res) => {
  try {
    const totalResidents = await User.countDocuments({ role: 'resident' });
    const totalApartments = await Apartment.countDocuments();
    const rentedApartments = await Apartment.countDocuments({ status: 'rented' });
    const availableApartments = await Apartment.countDocuments({ status: 'available' });

    const totalRevenue = await Payment.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, sum: { $sum: '$amount' } } },
    ]);

    const activeContracts = await Contract.countDocuments({ status: 'active' });

    res.json({
      totalResidents,
      totalApartments,
      rentedApartments,
      availableApartments,
      activeContracts,
      totalRevenue: totalRevenue[0]?.sum || 0,
    });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi lấy báo cáo tổng quan.' });
  }
};
