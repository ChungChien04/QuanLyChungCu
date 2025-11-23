const Rental = require("../models/rentalModel");
const Apartment = require("../models/apartmentModel");
const sendEmail = require("../utils/sendEmail"); 
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

    // Lock căn hộ ngay khi user bấm thuê
    apartment.status = "reserved"; 
    await apartment.save();

    res.status(201).json(rental);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



exports.getMyRentals = async (req, res) => {
  try {
    // Lấy tất cả rental của user và populate thông tin căn hộ
    const rentals = await Rental.find({ user: req.user._id })
      .populate("apartment") // populate toàn bộ thông tin căn hộ
      .sort({ createdAt: -1 }); // sắp xếp mới nhất trước

    if (!rentals.length) return res.json([]); // nếu không có rental, trả mảng rỗng

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
  const rental = await Rental.findById(req.params.id).populate("apartment");
  if (!rental) return res.status(404).json({ message: "Không tìm thấy đơn thuê." });

  rental.status = "approved";
  await rental.save();

  if (rental.apartment) {
    rental.apartment.status = "rented"; 
    await rental.apartment.save();
  }

  res.json(rental);
};


// 6️⃣ User ký hợp đồng
exports.signContract = async (req, res) => {
  try {
    const rental = await Rental.findById(req.params.id).populate("apartment");
    
    if (!rental || rental.user.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Không có quyền ký hợp đồng." });

    if (rental.status !== "approved")
      return res.status(400).json({ message: "Chỉ ký hợp đồng sau khi admin duyệt." });

    rental.contractSigned = true;
    rental.status = "rented";
    // Nếu rental có apartment đã populate, đảm bảo trạng thái apartment là 'rented'
    if (rental.apartment) {
      rental.apartment.status = "rented";
      await rental.apartment.save();
    }

    await rental.save();

    res.json({ message: "Ký hợp đồng thành công.", rental });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// 7️⃣ User thanh toán
exports.payRental = async (req, res) => {
  try {
    const rental = await Rental.findById(req.params.id).populate("user apartment");
    if (!rental || rental.user._id.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Không có quyền thanh toán." });

    if (!rental.contractSigned)
      return res.status(400).json({ message: "Cần ký hợp đồng trước khi thanh toán." });

    rental.paymentDone = true;
    rental.paymentQRCode = `/uploads/qrcode/qrcode.jpg`;
    await rental.save();

    const userEmail = rental.user.email;
    const apartmentTitle = rental.apartment?.title || "căn hộ";
    const totalPrice = rental.totalPrice.toLocaleString();
    const startDate = new Date(rental.startDate).toLocaleDateString();
    const endDate = new Date(rental.endDate).toLocaleDateString();
    const contractTermsUrl = `${req.protocol}://${req.get("host")}/uploads/pdf/hopdong.pdf`;
    const signature = req.body.signature || "";

    const emailHtml = `
      <h2>Thanh toán hợp đồng thành công</h2>
      <p>Xin chào <b>${rental.user.name}</b>,</p>
      <p>Bạn đã thanh toán thành công hợp đồng thuê <b>${apartmentTitle}</b>.</p>
      <ul>
        <li>Thời gian thuê: ${startDate} - ${endDate}</li>
        <li>Tổng tiền: ${totalPrice} đ</li>
      </ul>
      <p>Bạn có thể xem <a href="${contractTermsUrl}" target="_blank">điều khoản hợp đồng tại đây</a>.</p>
      <p>Chữ ký của bạn: <b>${signature}</b></p>
      <p>Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!</p>
    `;

    await sendEmail({
      to: userEmail,
      subject: "Thanh toán hợp đồng thành công",
      html: emailHtml,
    });

    res.json({ message: "Thanh toán thành công, email đã gửi.", qr: rental.paymentQRCode });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Khởi tạo thanh toán: trả về đường dẫn ảnh QR cố định (không mark paid)
exports.initiatePayment = async (req, res) => {
  try {
    const rental = await Rental.findById(req.params.id);
    if (!rental || rental.user.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Không có quyền thanh toán." });

    if (!rental.contractSigned)
      return res.status(400).json({ message: "Cần ký hợp đồng trước khi thanh toán." });

    // Trả về URL tới file QR cố định trong thư mục uploads
    const qrPath = `/uploads/qrcode/qrcode.jpg`;
    // Optionally save the qr path on rental for record
    rental.paymentQRCode = qrPath;
    await rental.save();

    // Bao gồm host để frontend dễ dùng
    const fullUrl = `${req.protocol}://${req.get("host")}${qrPath}`;
    res.json({ qr: fullUrl });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// 📌 Lấy rental theo ID
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

// 8️⃣ Hủy rental (User hoặc Admin)
exports.cancelRental = async (req, res) => {
  try {
    const rental = await Rental.findById(req.params.id).populate("apartment");
    if (!rental) return res.status(404).json({ message: "Không tìm thấy đơn thuê." });

    const { finish } = req.body;

    // Nếu Admin hoàn tất thủ tục hủy
    if (finish && rental.status === "cancelling") {
      rental.status = "cancelled";
      if (rental.apartment) {
        rental.apartment.status = "available";
        await rental.apartment.save();
      }
      await rental.save();
      return res.json({ message: "Đơn thuê đã bị hủy hoàn tất.", rental });
    }

    // Nếu hủy thông thường
    if (rental.status === "approved" || rental.status === "rented") {
      rental.status = "cancelling"; // trạng thái chờ hủy
    } else {
      rental.status = "cancelled";
      if (rental.apartment && rental.status !== "rented") rental.apartment.status = "available";
      if (rental.apartment) await rental.apartment.save();
    }

    await rental.save();
    res.json({ message: "Đơn thuê đang hủy.", rental });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
