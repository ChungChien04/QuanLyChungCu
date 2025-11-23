const Rental = require("../models/rentalModel");
const Apartment = require("../models/apartmentModel");

// 1️⃣ User tạo đơn thuê
exports.createRental = async (req, res) => {
  const { apartmentId, startDate, endDate } = req.body;
  try {
    const apartment = await Apartment.findById(apartmentId);
    if (!apartment) return res.status(404).json({ message: "Căn hộ không tồn tại." });
    if (apartment.status !== "available") 
      return res.status(400).json({ message: "Căn hộ hiện không thể thuê." });

    const rental = await Rental.create({
      apartment: apartment._id,
      user: req.user._id,
      startDate,
      endDate,
      totalPrice: apartment.price,
      status: "pending"
    });

    // Cập nhật trạng thái nhà là 'reserved' để giữ chỗ
    apartment.status = "reserved"; 
    await apartment.save();

    res.status(201).json(rental);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 2️⃣ Lấy danh sách thuê của tôi
exports.getMyRentals = async (req, res) => {
  try {
    const rentals = await Rental.find({ user: req.user._id })
      .populate("apartment") 
      .sort({ createdAt: -1 });

    if (!rentals.length) return res.json([]);

    res.json(rentals);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// 3️⃣ Admin xem pending rentals
exports.getPendingRentals = async (req, res) => {
  try { 
    const rentals = await Rental.find({ status: "pending" }).populate("apartment user");
    res.json(rentals);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 4️⃣ Admin xem tất cả rentals
exports.getAllRentals = async (req, res) => {
  try {
    const rentals = await Rental.find().populate("apartment user").sort({ createdAt: -1 });
    res.json(rentals);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 5️⃣ Admin duyệt rental
exports.approveRental = async (req, res) => {
  try {
    const rental = await Rental.findById(req.params.id).populate("apartment");
    if (!rental) return res.status(404).json({ message: "Không tìm thấy đơn thuê." });

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
      return res.status(400).json({ message: "Chỉ ký hợp đồng sau khi admin duyệt." });

    // Cập nhật chữ ký
    rental.contractText = req.body.contractText; 
    rental.contractSigned = true;

    // Lưu ý: Status vẫn giữ là "approved". Chỉ khi thanh toán xong mới đổi sang "rented".
    await rental.save();

    res.json({ message: "Ký hợp đồng thành công. Vui lòng thanh toán để hoàn tất.", rental });
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

    if (!rental) return res.status(404).json({ message: "Không tìm thấy đơn thuê." });

    res.json(rental);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 8️⃣ Hủy rental
exports.cancelRental = async (req, res) => {
  try {
    const rental = await Rental.findById(req.params.id).populate("apartment");
    if (!rental) return res.status(404).json({ message: "Không tìm thấy đơn thuê." });

    const { finish } = req.body;

    // Admin xác nhận hủy hoàn tất
    if (finish && rental.status === "cancelling") {
      rental.status = "cancelled";
      if (rental.apartment) {
        rental.apartment.status = "available";
        await rental.apartment.save();
      }
      await rental.save();
      return res.json({ message: "Đơn thuê đã bị hủy hoàn tất.", rental });
    }

    // Yêu cầu hủy thông thường
    if (rental.status === "approved" || rental.status === "rented") {
      rental.status = "cancelling"; // Chờ xử lý tiền cọc
    } else {
      // Nếu mới pending, hủy luôn và nhả phòng
      rental.status = "cancelled";
      if (rental.apartment && rental.status !== "rented") {
          rental.apartment.status = "available";
          await rental.apartment.save();
      }
    }

    await rental.save();
    res.json({ message: "Đơn thuê đang hủy.", rental });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};