const Rental = require("../models/rentalModel");
const Apartment = require("../models/apartmentModel");

// =========================
// 1) User tạo đơn thuê
// =========================
exports.createRental = async (req, res) => {
  const { apartmentId, months, startDate, endDate } = req.body;

  try {
    const apartment = await Apartment.findById(apartmentId);
    if (!apartment)
      return res.status(404).json({ message: "Căn hộ không tồn tại." });

    if (apartment.status !== "available")
      return res.status(400).json({ message: "Căn hộ hiện không còn trống." });

    const rental = await Rental.create({
      apartment: apartment._id,
      user: req.user._id,
      months,
      startDate,
      endDate,
      totalPrice: apartment.price * months,
      status: "pending",
    });

    // Giữ chỗ căn hộ
    apartment.status = "reserved";
    await apartment.save();

    res.status(201).json(rental);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// =========================
// 2) Lấy rental của tôi
// =========================
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

// =========================
// 3) Admin: Pending rentals
// =========================
exports.getPendingRentals = async (req, res) => {
  try {
    const rentals = await Rental.find({ status: "pending" })
      .populate("apartment user");

    res.json(rentals);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// =========================
// 4) Admin: All rentals
// =========================
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

// =========================
// 5) Admin duyệt
// =========================
exports.approveRental = async (req, res) => {
  try {
    const rental = await Rental.findById(req.params.id).populate("apartment");
    if (!rental) return res.status(404).json({ message: "Không tìm thấy đơn thuê." });

    rental.status = "approved";

    rental.apartment.status = "rented";
    await rental.apartment.save();
    await rental.save();

    res.json(rental);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// =========================
// 6) User ký hợp đồng
// =========================
exports.signContract = async (req, res) => {
  try {
    const rental = await Rental.findById(req.params.id).populate("apartment");
    if (!rental) return res.status(404).json({ message: "Không tìm thấy đơn thuê." });

    if (rental.user.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Bạn không có quyền ký hợp đồng." });

    if (rental.status !== "approved")
      return res.status(400).json({ message: "Hợp đồng chỉ ký sau khi được duyệt." });

    rental.contractText = req.body.contractText || "";
    rental.contractSigned = true;
    rental.status = "rented";

    rental.apartment.status = "rented";
    await rental.apartment.save();
    await rental.save();

    res.json({
      message: "Ký hợp đồng thành công!",
      rental,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// =========================
// 7) Lấy rental theo ID
// =========================
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

// =========================
// 8) Admin / User hủy rental
// =========================
exports.cancelRental = async (req, res) => {
  try {
    const rental = await Rental.findById(req.params.id).populate("apartment");
    if (!rental)
      return res.status(404).json({ message: "Không tìm thấy đơn thuê." });

    const { finish } = req.body;

    // Admin hoàn tất hủy
    if (finish && rental.status === "cancelling") {
      rental.status = "cancelled";
      rental.apartment.status = "available";
      await rental.apartment.save();
      await rental.save();

      return res.json({ message: "Đã hoàn tất hủy hợp đồng.", rental });
    }

    // Các trạng thái có thể chuyển sang cancelling
    if (["approved", "rented", "reserved"].includes(rental.status)) {
      rental.status = "cancelling";
    } else {
      rental.status = "cancelled";
      rental.apartment.status = "available";
      await rental.apartment.save();
    }

    await rental.save();
    res.json({ message: "Đã yêu cầu hủy.", rental });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
