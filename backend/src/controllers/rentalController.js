const Rental = require("../models/rentalModel");
const Apartment = require("../models/apartmentModel");
const Invoice = require("../models/invoiceModel");


// ======================================================
// 1️⃣ USER TẠO ĐƠN THUÊ → ADMIN NHẬN THÔNG BÁO
// ======================================================
exports.createRental = async (req, res) => {
  const { apartmentId, months, startDate, endDate } = req.body;

  try {
    const apartment = await Apartment.findById(apartmentId);
    if (!apartment)
      return res.status(404).json({ message: "Căn hộ không tồn tại." });

    if (apartment.status !== "available")
      return res.status(400).json({ message: "Căn hộ hiện không thể thuê." });

    const rental = await Rental.create({
      apartment: apartment._id,
      user: req.user._id,
      months,
      startDate,
      endDate,
      status: "pending",
      totalPrice: apartment.price * months,
      adminUnread: true,      // 🔥 Thông báo cho admin
      userUnread: false
    });

    // GIỮ CHỖ căn hộ khi có đơn pending
    apartment.status = "reserved";
    await apartment.save();

    res.status(201).json(rental);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ======================================================
// 2️⃣ LẤY DANH SÁCH ĐƠN THUÊ CỦA USER + RESET userUnread
// ======================================================
exports.getMyRentals = async (req, res) => {
  try {
    // user xem ⇒ đánh dấu đã đọc
    await Rental.updateMany(
      { user: req.user._id, userUnread: true },
      { userUnread: false }
    );

    const rentals = await Rental.find({ user: req.user._id })
      .populate("apartment")
      .sort({ createdAt: -1 });

    res.json(rentals);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ======================================================
// 3️⃣ ADMIN XEM DANH SÁCH PENDING + RESET adminUnread
// ======================================================
exports.getPendingRentals = async (req, res) => {
  try {
    await Rental.updateMany(
      { adminUnread: true },
      { adminUnread: false }
    );

    const rentals = await Rental.find({ status: "pending" })
      .populate("apartment user");

    res.json(rentals);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ======================================================
// 4️⃣ ADMIN LẤY TOÀN BỘ RENTALS
// ======================================================
exports.getAllRentals = async (req, res) => {
  try {
    const rentals = await Rental.find()
      .populate("apartment user")
      .sort({ createdAt: -1 });

    res.json(rentals);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ======================================================
// 5️⃣ ADMIN DUYỆT ĐƠN → USER NHẬN THÔNG BÁO
// ======================================================
exports.approveRental = async (req, res) => {
  try {
    const rental = await Rental.findById(req.params.id).populate("apartment");

    if (!rental)
      return res.status(404).json({ message: "Không tìm thấy đơn thuê." });

    rental.status = "approved";

    rental.userUnread = true;     // 🔥 báo cho user
    rental.adminUnread = false;

    await rental.save();

    res.json(rental);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ======================================================
// 6️⃣ USER KÝ HỢP ĐỒNG → ADMIN NHẬN THÔNG BÁO
// ======================================================
exports.signContract = async (req, res) => {
  try {
    const rental = await Rental.findById(req.params.id).populate("apartment");

    if (!rental || rental.user.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Không có quyền ký hợp đồng." });

    if (rental.status !== "approved")
      return res.status(400).json({ message: "Chỉ ký sau khi admin duyệt." });

    rental.contractText = req.body.contractText;
    rental.contractSigned = true;

    rental.adminUnread = true;   // 🔥 báo admin
    rental.userUnread = false;

    await rental.save();

    res.json({
      message: "Ký hợp đồng thành công. Vui lòng thanh toán.",
      rental
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ======================================================
// 7️⃣ GET RENTAL BY ID
// ======================================================
exports.getRentalById = async (req, res) => {
  try {
    const rental = await Rental.findById(req.params.id)
      .populate("apartment")
      .populate("user");

    if (!rental)
      return res.status(404).json({ message: "Không tìm thấy đơn thuê." });

    res.json(rental);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ======================================================
// 8️⃣ HỦY RENTAL (User hoặc Admin)
// ======================================================
exports.cancelRental = async (req, res) => {
  try {
    const rental = await Rental.findById(req.params.id).populate("apartment");
    if (!rental)
      return res.status(404).json({ message: "Không tìm thấy đơn thuê." });

    const { finish } = req.body;

    // -----------------------------
    // TRƯỜNG HỢP 1: ADMIN HOÀN TẤT HỦY
    // -----------------------------
    if (finish && rental.status === "cancelling") {
      rental.status = "cancelled";

      if (rental.apartment) {
        rental.apartment.status = "available";
        await rental.apartment.save();
      }

      await Invoice.updateMany(
        { rental: rental._id, status: "unpaid" },
        { status: "cancelled" }
      );

      rental.userUnread = true;   // 🔥 Báo người dùng
      rental.adminUnread = false;

      await rental.save();
      return res.json({ 
        message: "Hủy hợp đồng hoàn tất.",
        rental 
      });
    }

    // -----------------------------
    // TRƯỜNG HỢP 2: USER YÊU CẦU HỦY
    // -----------------------------
    if (["approved", "rented", "reserved"].includes(rental.status)) {
      rental.status = "cancelling";

      rental.adminUnread = true;   // 🔥 báo admin
      rental.userUnread = false;

    } else {
      // pending → hủy ngay
      rental.status = "cancelled";

      if (rental.apartment) {
        rental.apartment.status = "available";
        await rental.apartment.save();
      }

      await Invoice.updateMany(
        { rental: rental._id, status: "unpaid" },
        { status: "cancelled" }
      );

      rental.adminUnread = true;
      rental.userUnread = false;
    }

    await rental.save();

    res.json({
      message: rental.status === "cancelled" 
        ? "Đơn thuê đã hủy thành công." 
        : "Đơn thuê đang chờ xử lý hủy.",
      rental
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
