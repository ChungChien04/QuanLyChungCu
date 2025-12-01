// backend/src/controllers/invoiceController.js
const Invoice = require("../models/invoiceModel");
const Rental = require("../models/rentalModel");
const SystemSetting = require("../models/systemSettingModel");

/**
 * 1. Lấy cài đặt hệ thống (đơn giá, phí chung, vệ sinh, ...)
 */
exports.getSettings = async (req, res) => {
  try {
    let setting = await SystemSetting.findOne();
    if (!setting) {
      setting = await SystemSetting.create({});
    }
    res.json(setting);
  } catch (err) {
    console.error("getSettings error:", err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * 2. Cập nhật cài đặt hệ thống
 */
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
  } catch (err) {
    console.error("updateSettings error:", err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * 3. Chuẩn bị dữ liệu lập hóa đơn tháng
 *    FE gọi: GET /api/invoices/prepare?month=12&year=2025 (tuỳ bạn dùng month/year hay không)
 */
exports.prepareInvoices = async (req, res) => {
  try {
    // Lấy tất cả hợp đồng đang thuê
    const rentals = await Rental.find({ status: "rented" })
      .populate("apartment", "title number")
      .populate("user", "name email");

    // Không có căn hộ nào đang thuê -> trả mảng rỗng, không lỗi
    if (!rentals.length) {
      return res.json([]);
    }

    // Lấy cài đặt hệ thống, nếu chưa có thì tạo với default
    let setting = await SystemSetting.findOne();
    if (!setting) {
      setting = await SystemSetting.create({});
    }

    const preparedListPromises = rentals.map(async (r) => {
      // Nếu rental không gắn apartment hoặc user -> bỏ qua để tránh crash
      if (!r.apartment || !r.user) {
        return null;
      }

      // Lấy hoá đơn gần nhất của rental để biết chỉ số điện cũ
      const lastInvoice = await Invoice.findOne({ rental: r._id }).sort({
        createdAt: -1,
      });
      const oldIndex =
        lastInvoice && lastInvoice.electricNewIndex != null
          ? lastInvoice.electricNewIndex
          : 0;

      return {
        rentalId: r._id,
        apartmentId: r.apartment._id,
        apartmentTitle: r.apartment.title || "",
        apartmentNumber: r.apartment.number || "",
        userName: r.user.name || "",
        userEmail: r.user.email || "",
        commonFee: setting.commonFee ?? 0,
        cleaningFee: setting.cleaningFee ?? 0,
        electricPrice: setting.electricityPrice ?? 0,
        electricOldIndex: oldIndex,
        electricNewIndex: "", // FE sẽ nhập
      };
    });

    const preparedDataRaw = await Promise.all(preparedListPromises);
    // loại bỏ các phần tử null (rental thiếu apartment/user)
    const preparedData = preparedDataRaw.filter(Boolean);

    res.json(preparedData);
  } catch (err) {
    console.error("prepareInvoices error:", err);
    res
      .status(500)
      .json({ message: "Lỗi server khi chuẩn bị dữ liệu hóa đơn." });
  }
};

/**
 * 4. Tạo hoá đơn hàng loạt từ dữ liệu FE gửi lên
 */
exports.createInvoices = async (req, res) => {
  try {
    const { invoices, month, year } = req.body;
    const createdInvoices = [];

    for (const item of invoices) {
      // Bỏ qua dòng chưa nhập chỉ số mới hoặc nhập sai
      if (
        item.electricNewIndex === "" ||
        Number(item.electricNewIndex) < item.electricOldIndex
      ) {
        continue;
      }

      const usage =
        Number(item.electricNewIndex) - Number(item.electricOldIndex);

      const electricPrice = Number(item.electricPrice) || 0;
      const commonFee = Number(item.commonFee) || 0;
      const cleaningFee = Number(item.cleaningFee) || 0;

      const electricTotal = usage * electricPrice;
      const totalAmount = commonFee + cleaningFee + electricTotal;

      const rental = await Rental.findById(item.rentalId);
      if (!rental) continue;

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
        status: "unpaid",
      });

      createdInvoices.push(newInvoice);
    }

    res.status(201).json({
      message: `Đã tạo ${createdInvoices.length} hóa đơn`,
      data: createdInvoices,
    });
  } catch (err) {
    console.error("createInvoices error:", err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * 5. [USER] Xem hóa đơn của một rental
 */
exports.getMyInvoices = async (req, res) => {
  try {
    const { rentalId } = req.params;
    const rental = await Rental.findById(rentalId);
    if (!rental || rental.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Không có quyền truy cập" });
    }

    const invoices = await Invoice.find({ rental: rentalId }).sort({
      createdAt: -1,
    });
    res.json(invoices);
  } catch (err) {
    console.error("getMyInvoices error:", err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * 6. [USER] Đếm số hóa đơn CHƯA THANH TOÁN
 */
exports.getUnpaidCount = async (req, res) => {
  try {
    const count = await Invoice.countDocuments({
      user: req.user._id,
      status: "unpaid",
    });
    res.json({ count });
  } catch (err) {
    console.error("getUnpaidCount error:", err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * 7. [ADMIN] Lấy danh sách hoá đơn (có thể lọc theo tháng/năm/trạng thái)
 */
exports.getAdminInvoices = async (req, res) => {
  try {
    const { month, year, status } = req.query;
    const query = {};

    if (month) query.month = month;
    if (year) query.year = year;
    if (status) query.status = status;

    const invoices = await Invoice.find(query)
      .populate("apartment", "title")
      .populate("user", "name")
      .sort({ createdAt: -1 });

    res.json(invoices);
  } catch (err) {
    console.error("getAdminInvoices error:", err);
    res.status(500).json({ message: err.message });
  }
};
