// backend/src/controllers/invoiceController.js
const Invoice = require("../models/invoiceModel");
const Rental = require("../models/rentalModel");
const SystemSetting = require("../models/systemSettingModel");

// 1. Lấy cài đặt
exports.getSettings = async (req, res) => {
  try {
    let setting = await SystemSetting.findOne();
    if (!setting) setting = await SystemSetting.create({}); 
    res.json(setting);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// 2. Cập nhật cài đặt
exports.updateSettings = async (req, res) => {
  try {
    let setting = await SystemSetting.findOne();
    if (!setting) {
        setting = await SystemSetting.create(req.body);
    } else {
        Object.assign(setting, req.body);
        await setting.save();
    }
    res.json(setting);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// 3. Chuẩn bị dữ liệu lập hóa đơn
exports.prepareInvoices = async (req, res) => {
  try {
    const rentals = await Rental.find({ status: "rented" })
        .populate("apartment", "title number")
        .populate("user", "name email");

    const setting = await SystemSetting.findOne() || new SystemSetting();
    
    const preparedData = await Promise.all(rentals.map(async (r) => {
      const lastInvoice = await Invoice.findOne({ rental: r._id }).sort({ createdAt: -1 });
      const oldIndex = lastInvoice ? lastInvoice.electricNewIndex : 0; 

      return {
        rentalId: r._id,
        apartmentTitle: r.apartment.title,
        userName: r.user.name,
        commonFee: setting.commonFee,
        cleaningFee: setting.cleaningFee,
        electricPrice: setting.electricityPrice,
        electricOldIndex: oldIndex,
        electricNewIndex: "",
      };
    }));

    res.json(preparedData);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// 4. Tạo hóa đơn
exports.createInvoices = async (req, res) => {
  try {
    const { invoices, month, year } = req.body; 
    const createdInvoices = [];

    for (const item of invoices) {
        if (item.electricNewIndex === "" || Number(item.electricNewIndex) < item.electricOldIndex) continue;

        const usage = item.electricNewIndex - item.electricOldIndex;
        
        // Ép kiểu số để tính toán
        const electricPrice = Number(item.electricPrice);
        const commonFee = Number(item.commonFee);
        const cleaningFee = Number(item.cleaningFee);

        const electricTotal = usage * electricPrice;
        const totalAmount = commonFee + cleaningFee + electricTotal;

        const rental = await Rental.findById(item.rentalId);

        const newInvoice = await Invoice.create({
            rental: item.rentalId,
            user: rental.user,
            apartment: rental.apartment,
            month,
            year,
            commonFee,
            cleaningFee,
            electricOldIndex: item.electricOldIndex,
            electricNewIndex: item.electricNewIndex,
            electricUsage: usage,
            electricPrice,
            electricTotal,
            totalAmount,
            status: "unpaid"
        });
        createdInvoices.push(newInvoice);
    }

    res.status(201).json({ message: `Đã tạo ${createdInvoices.length} hóa đơn`, data: createdInvoices });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// 5. [QUAN TRỌNG] User xem hóa đơn
exports.getMyInvoices = async (req, res) => {
  try {
    const { rentalId } = req.params;
    const rental = await Rental.findById(rentalId);
    if (!rental || rental.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Không có quyền truy cập" });
    }

    const invoices = await Invoice.find({ rental: rentalId }).sort({ createdAt: -1 });
    res.json(invoices);
  } catch (err) { res.status(500).json({ message: err.message }); }
};4
// 6. [USER] Đếm số hóa đơn CHƯA THANH TOÁN (Dùng cho chấm đỏ Navbar)
exports.getUnpaidCount = async (req, res) => {
  try {
    const count = await Invoice.countDocuments({ 
      user: req.user._id, 
      status: "unpaid" 
    });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// 7. [ADMIN] Lấy danh sách hóa đơn (Có lọc theo tháng/năm)
exports.getAdminInvoices = async (req, res) => {
  try {
    const { month, year, status } = req.query;
    let query = {};

    if (month) query.month = month;
    if (year) query.year = year;
    if (status) query.status = status; 

    const invoices = await Invoice.find(query)
      .populate("apartment", "title")
      .populate("user", "name")
      .sort({ createdAt: -1 }); 

    res.json(invoices);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};