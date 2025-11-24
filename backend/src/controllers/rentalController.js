const Rental = require("../models/rentalModel");
const Apartment = require("../models/apartmentModel");
const Invoice = require("../models/invoiceModel"); 
// 1️⃣ User tạo đơn thuê
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
    });

    // GIỮ CHỖ căn hộ khi có đơn pending
    apartment.status = "reserved";
    await apartment.save();

    res.status(201).json(rental);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 2️⃣ Lấy danh sách hợp đồng của tôi
exports.getMyRentals = async (req, res) => {
  try {
    const rentals = await Rental.find({ user: req.user._id })
      .populate("apartment")
      .sort({ createdAt: -1 });

    res.json(rentals);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 3️⃣ Admin xem các đơn pending
exports.getPendingRentals = async (req, res) => {
  try {
    const rentals = await Rental.find({ status: "pending" })
      .populate("apartment user");
    res.json(rentals);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 4️⃣ Admin xem tất cả rental
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

// 5️⃣ Admin duyệt
exports.approveRental = async (req, res) => {
  try {
    const rental = await Rental.findById(req.params.id).populate("apartment");

    if (!rental)
      return res.status(404).json({ message: "Không tìm thấy đơn thuê." });

    rental.status = "approved";
    await rental.save();

    res.json(rental);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 6️⃣ User ký hợp đồng
exports.signContract = async (req, res) => {
  try {
    const rental = await Rental.findById(req.params.id).populate("apartment");

    if (!rental || rental.user.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Không có quyền ký hợp đồng." });

    if (rental.status !== "approved")
      return res.status(400).json({ message: "Chỉ ký sau khi admin duyệt." });

    rental.contractText = req.body.contractText;
    rental.contractSigned = true;

    await rental.save();

    res.json({
      message: "Ký hợp đồng thành công. Vui lòng thanh toán.",
      rental
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 7️⃣ Lấy rental theo ID
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

// 8️⃣ Hủy rental (user hoặc admin)
exports.cancelRental = async (req, res) => {
  try {
    const rental = await Rental.findById(req.params.id).populate("apartment");
    if (!rental)
      return res.status(404).json({ message: "Không tìm thấy đơn thuê." });

    const { finish } = req.body;

    // ---------------------------------------------------------
    // TRƯỜNG HỢP 1: Admin xác nhận hoàn tất hủy (Từ trạng thái 'cancelling')
    // ---------------------------------------------------------
    if (finish && rental.status === "cancelling") {
      rental.status = "cancelled";

      // Trả phòng
      if (rental.apartment) {
        rental.apartment.status = "available"; 
        await rental.apartment.save();
      }

      // 🔥 LOGIC MỚI: Hủy tất cả hóa đơn chưa thanh toán của hợp đồng này
      await Invoice.updateMany(
        { rental: rental._id, status: "unpaid" },
        { status: "cancelled" }
      );

      await rental.save();
      return res.json({ message: "Hủy hợp đồng hoàn tất. Các hóa đơn liên quan đã bị hủy.", rental });
    }

    // ---------------------------------------------------------
    // TRƯỜNG HỢP 2: Yêu cầu hủy
    // ---------------------------------------------------------
    
    // Nếu đang thuê/đã duyệt -> Chuyển sang chờ hủy (chưa hủy hóa đơn vội)
    if (["approved", "rented", "reserved"].includes(rental.status)) {
      rental.status = "cancelling";
    } else {
      // Nếu mới là pending -> Hủy luôn
      rental.status = "cancelled";

      if (rental.apartment) {
        rental.apartment.status = "available";
        await rental.apartment.save();
      }

      // 🔥 LOGIC MỚI: Hủy hóa đơn ngay lập tức (nếu có lỡ tạo)
      await Invoice.updateMany(
        { rental: rental._id, status: "unpaid" },
        { status: "cancelled" }
      );
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