const crypto = require("crypto");
const qs = require("qs");
const moment = require("moment");
const Rental = require("../models/rentalModel");
const Apartment = require("../models/apartmentModel");
// ✅ 1. Import hàm gửi email
const sendEmail = require("../utils/sendEmail"); 

// ⭐ CẤU HÌNH VNPAY
const vnp_TmnCode = "IRVNQU1B";
const vnp_HashSecret = "KZGUMEOKS3OFGMZ7XLEJUF1IRQL6V5R0";
const vnp_Url = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
const vnp_ReturnUrl = "http://localhost:5000/api/payments/vnpay_return"; 


// 1. Tạo URL thanh toán
exports.createPaymentUrl = async (req, res) => {
  try {
    const rentalId = req.params.id;
    const rental = await Rental.findById(rentalId);

    if (!rental) return res.status(404).json({ message: "Không tìm thấy hợp đồng" });
    if (!rental.totalPrice) return res.status(400).json({ message: "Số tiền không hợp lệ" });

    // --- Bắt đầu cấu hình VNPay ---
    let date = new Date();
    let createDate = moment(date).format("YYYYMMDDHHmmss");
    let ipAddr = req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;

    let vnp_Params = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode: vnp_TmnCode,
      vnp_Locale: "vn",
      vnp_CurrCode: "VND",
      vnp_TxnRef: rentalId,
      vnp_OrderInfo: `Thanh toan thue nha #${rentalId}`,
      vnp_OrderType: "other",
      vnp_Amount: rental.totalPrice * 100, 
      vnp_ReturnUrl: vnp_ReturnUrl,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: createDate
    };

    vnp_Params = sortObject(vnp_Params);

    let signData = qs.stringify(vnp_Params, { encode: false });
    let hmac = crypto.createHmac("sha512", vnp_HashSecret);
    let signed = hmac.update(new Buffer.from(signData, 'utf-8')).digest("hex"); 
    vnp_Params['vnp_SecureHash'] = signed;

    let paymentUrl = vnp_Url + "?" + qs.stringify(vnp_Params, { encode: false });

    res.status(200).json({ url: paymentUrl });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
};

// 2. Xử lý kết quả trả về từ VNPay
exports.vnpayReturn = async (req, res) => {
  let vnp_Params = req.query;
  let secureHash = vnp_Params['vnp_SecureHash'];

  delete vnp_Params['vnp_SecureHash'];
  delete vnp_Params['vnp_SecureHashType'];

  vnp_Params = sortObject(vnp_Params);

  let signData = qs.stringify(vnp_Params, { encode: false });
  let hmac = crypto.createHmac("sha512", vnp_HashSecret);
  let signed = hmac.update(new Buffer.from(signData, 'utf-8')).digest("hex");

  // 👇 URL FRONTEND (Nhớ đổi port 5173 nếu dùng Vite)
  const clientUrl = "http://localhost:5173/my-rentals";

  if (secureHash === signed) {
    const rentalId = vnp_Params['vnp_TxnRef'];
    const rspCode = vnp_Params['vnp_ResponseCode'];

    // ✅ 2. Thêm populate "user" để lấy email
    const rental = await Rental.findById(rentalId)
        .populate("apartment")
        .populate("user");

    if (!rental) return res.redirect(`${clientUrl}?status=error`);

    if (rspCode === "00") {
        // ✅ TRƯỜNG HỢP THÀNH CÔNG (00)
        
        // Cập nhật trạng thái
        rental.paymentDone = true;
        rental.status = "rented"; 
        
        if (rental.apartment) {
            rental.apartment.status = "rented";
            await rental.apartment.save();
        }
        await rental.save();

        // ✅ 3. LOGIC GỬI EMAIL XÁC NHẬN
        try {
            const userEmail = rental.user.email;
            const apartmentTitle = rental.apartment?.title || "căn hộ";
            const totalPrice = rental.totalPrice?.toLocaleString();
            const startDate = new Date(rental.startDate).toLocaleDateString("vi-VN");
            const endDate = new Date(rental.endDate).toLocaleDateString("vi-VN");
            
            // Link PDF (Cần host thật hoặc IP public để user click vào xem được, localhost chỉ mình xem được)
            const contractTermsUrl = `${req.protocol}://${req.get("host")}/uploads/pdf/hopdong.pdf`;
            const signature = rental.contractText || "(Đã ký điện tử)";

            const emailHtml = `
              <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <h2 style="color: #2da44e;">Thanh toán thành công!</h2>
                <p>Xin chào <b>${rental.user.name}</b>,</p>
                <p>Hệ thống đã nhận được khoản thanh toán của bạn cho hợp đồng thuê <b>${apartmentTitle}</b>.</p>
                
                <div style="background: #f6f8fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
                  <ul style="list-style: none; padding: 0;">
                    <li>📅 <b>Thời gian thuê:</b> ${startDate} - ${endDate}</li>
                    <li>💰 <b>Tổng tiền:</b> ${totalPrice} đ</li>
                    <li>✍️ <b>Chữ ký của bạn:</b> ${signature}</li>
                  </ul>
                </div>

                <p>Hợp đồng của bạn đã chính thức có hiệu lực.</p>
                <p>👉 <a href="${contractTermsUrl}" target="_blank" style="color: #0969da;">Xem lại điều khoản hợp đồng tại đây</a></p>
                
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 12px; color: #666;">Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi.</p>
              </div>
            `;

            await sendEmail({
                to: userEmail,
                subject: `[Xác nhận] Thanh toán thành công đơn thuê #${rentalId}`,
                html: emailHtml,
            });
            console.log(`✅ Email xác nhận đã gửi đến ${userEmail}`);
        } catch (emailErr) {
            console.error("❌ Lỗi gửi email:", emailErr.message);
        }

        return res.redirect(`${clientUrl}?status=success`);
    } else {
        // ❌ TRƯỜNG HỢP THẤT BẠI
        console.log(`Giao dịch thất bại: ${rspCode}`);
        return res.redirect(`${clientUrl}?status=failed`);
    }
  } else {
    // Sai chữ ký
    return res.redirect(`${clientUrl}?status=invalid`);
  }
};

// Hàm sắp xếp object (Bắt buộc)
function sortObject(obj) {
  let sorted = {};
  let str = [];
  let key;
  for (key in obj){
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
        str.push(encodeURIComponent(key));
    }
  }
  str.sort();
    for (key = 0; key < str.length; key++) {
        sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
    }
    return sorted;
}