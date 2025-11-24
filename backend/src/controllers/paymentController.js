const crypto = require("crypto");
const qs = require("qs");
const moment = require("moment");
const Rental = require("../models/rentalModel");
const Apartment = require("../models/apartmentModel");
const Invoice = require("../models/invoiceModel"); 
const sendEmail = require("../utils/sendEmail"); 

// ⭐ CẤU HÌNH VNPAY
const vnp_TmnCode = "IRVNQU1B";
const vnp_HashSecret = "KZGUMEOKS3OFGMZ7XLEJUF1IRQL6V5R0";
const vnp_Url = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
const vnp_ReturnUrl = "http://localhost:5000/api/payments/vnpay_return"; 

// --- CSS STYLES CHO EMAIL (Dùng chung) ---
const headerStyle = `background-color: #15803d; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;`;
const bodyStyle = `font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);`;
const tableStyle = `width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;`;
const thStyle = `background-color: #f3f4f6; padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb; font-weight: bold;`;
const tdStyle = `padding: 12px; border-bottom: 1px solid #e5e7eb;`;
const footerStyle = `background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 10px 10px;`;
const btnStyle = `display: inline-block; background-color: #15803d; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 10px;`;

// --- Hàm tiện ích tạo URL VNPay ---
const createVnpUrl = (req, amount, txnRef, orderInfo) => {
    let date = new Date();
    let createDate = moment(date).format("YYYYMMDDHHmmss");
    let ipAddr = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    let vnp_Params = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode: vnp_TmnCode,
      vnp_Locale: "vn",
      vnp_CurrCode: "VND",
      vnp_TxnRef: txnRef,
      vnp_OrderInfo: orderInfo,
      vnp_OrderType: "other",
      vnp_Amount: amount * 100, 
      vnp_ReturnUrl: vnp_ReturnUrl,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: createDate
    };

    vnp_Params = sortObject(vnp_Params);
    let signData = qs.stringify(vnp_Params, { encode: false });
    let hmac = crypto.createHmac("sha512", vnp_HashSecret);
    let signed = hmac.update(new Buffer.from(signData, 'utf-8')).digest("hex"); 
    vnp_Params['vnp_SecureHash'] = signed;

    return vnp_Url + "?" + qs.stringify(vnp_Params, { encode: false });
}

// 1. Tạo URL thanh toán HỢP ĐỒNG
exports.createPaymentUrl = async (req, res) => {
  try {
    const rentalId = req.params.id;
    const rental = await Rental.findById(rentalId);
    if (!rental) return res.status(404).json({ message: "Không tìm thấy hợp đồng" });
    
    const paymentUrl = createVnpUrl(req, rental.totalPrice, rentalId, `Thanh toan thue nha #${rentalId}`);
    res.status(200).json({ url: paymentUrl });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 2. Tạo URL thanh toán HÓA ĐƠN
exports.createInvoicePaymentUrl = async (req, res) => {
  try {
    const invoiceId = req.params.id;
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) return res.status(404).json({ message: "Hóa đơn không tồn tại" });
    
    const txnRef = `INV-${invoiceId}`;
    const paymentUrl = createVnpUrl(req, invoice.totalAmount, txnRef, `Thanh toan hoa don thang ${invoice.month}`);
    res.status(200).json({ url: paymentUrl });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 3. Xử lý kết quả (Redirect + Gửi Email)
exports.vnpayReturn = async (req, res) => {
  let vnp_Params = req.query;
  let secureHash = vnp_Params['vnp_SecureHash'];

  delete vnp_Params['vnp_SecureHash'];
  delete vnp_Params['vnp_SecureHashType'];

  vnp_Params = sortObject(vnp_Params);
  let signData = qs.stringify(vnp_Params, { encode: false });
  let hmac = crypto.createHmac("sha512", vnp_HashSecret);
  let signed = hmac.update(new Buffer.from(signData, 'utf-8')).digest("hex");

  const clientUrl = "http://localhost:5173/my-rentals";

  if (secureHash === signed) {
    const txnRef = vnp_Params['vnp_TxnRef'];
    const rspCode = vnp_Params['vnp_ResponseCode'];

    if (rspCode === "00") {
        
        // =============================================
        // TRƯỜNG HỢP A: THANH TOÁN HÓA ĐƠN (INV-)
        // =============================================
        if (txnRef.startsWith("INV-")) {
            const invoiceId = txnRef.split("INV-")[1];
            
            try {
                const invoice = await Invoice.findByIdAndUpdate(invoiceId, { 
                    status: "paid", 
                    paymentDate: new Date(),
                    isViewedByAdmin: false 
                }, { new: true }).populate("user apartment");

                // 🔥 EMAIL HÓA ĐƠN CHI TIẾT
                if (invoice && invoice.user) {
                    const emailHtml = `
                    <div style="${bodyStyle}">
                        <div style="${headerStyle}">
                            <h2 style="margin:0;">SMART BUILDING</h2>
                            <p style="margin:5px 0 0; font-size:14px;">XÁC NHẬN THANH TOÁN HÓA ĐƠN</p>
                        </div>
                        <div style="padding: 20px;">
                            <p>Kính gửi cư dân <b>${invoice.user.name}</b>,</p>
                            <p>Hệ thống đã ghi nhận thanh toán thành công cho hóa đơn dịch vụ <b>Tháng ${invoice.month}/${invoice.year}</b>.</p>
                            
                            <div style="background:#f0fdf4; padding:15px; border-left: 4px solid #15803d; margin: 15px 0;">
                                <p style="margin:0; font-weight:bold; color:#166534;">Căn hộ: ${invoice.apartment.title}</p>
                                <p style="margin:5px 0 0; color:#166534;">Mã giao dịch: ${vnp_Params['vnp_TransactionNo']}</p>
                            </div>

                            <table style="${tableStyle}">
                                <thead>
                                    <tr>
                                        <th style="${thStyle}">Khoản phí</th>
                                        <th style="${thStyle}">Chi tiết</th>
                                        <th style="${thStyle} text-align:right;">Thành tiền</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td style="${tdStyle}">Tiền điện</td>
                                        <td style="${tdStyle}">
                                            <div style="font-size:12px; color:#666;">CS Mới: ${invoice.electricNewIndex} - CS Cũ: ${invoice.electricOldIndex}</div>
                                            <div>SD: <b>${invoice.electricUsage} kW</b> x ${invoice.electricPrice.toLocaleString()}đ</div>
                                        </td>
                                        <td style="${tdStyle} text-align:right;">${invoice.electricTotal.toLocaleString()} đ</td>
                                    </tr>
                                    <tr>
                                        <td style="${tdStyle}">Phí quản lý chung</td>
                                        <td style="${tdStyle}">Cố định</td>
                                        <td style="${tdStyle} text-align:right;">${invoice.commonFee.toLocaleString()} đ</td>
                                    </tr>
                                    <tr>
                                        <td style="${tdStyle}">Phí vệ sinh</td>
                                        <td style="${tdStyle}">Cố định</td>
                                        <td style="${tdStyle} text-align:right;">${invoice.cleaningFee.toLocaleString()} đ</td>
                                    </tr>
                                    <tr style="background-color: #fffbeb;">
                                        <td colspan="2" style="${tdStyle} font-weight:bold; text-align:right; color:#b45309;">TỔNG CỘNG</td>
                                        <td style="${tdStyle} font-weight:bold; text-align:right; color:#dc2626; font-size:16px;">
                                            ${invoice.totalAmount.toLocaleString()} VNĐ
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                            <p>Cảm ơn Quý cư dân đã thanh toán đúng hạn.</p>
                        </div>
                        <div style="${footerStyle}">
                            <p><b>Ban Quản Lý Tòa Nhà SmartBuilding</b></p>
                            <p>Hotline: 1900 1234 | Email: support@smartbuilding.vn</p>
                            <p>Địa chỉ: 123 Đường ABC, Quận XYZ, TP. Đà Nẵng</p>
                        </div>
                    </div>
                    `;
                    await sendEmail({ to: invoice.user.email, subject: `[ĐÃ THANH TOÁN] Hóa đơn T${invoice.month} - ${invoice.apartment.title}`, html: emailHtml });
                }
                return res.redirect(`${clientUrl}?status=invoice_success`);
            } catch (e) {
                console.error(e);
                return res.redirect(`${clientUrl}?status=error`);
            }
        } 
        
        // =============================================
        // TRƯỜNG HỢP B: THANH TOÁN HỢP ĐỒNG (Rental)
        // =============================================
        else {
            const rentalId = txnRef;
            const rental = await Rental.findById(rentalId).populate("apartment user");

            if (!rental) return res.redirect(`${clientUrl}?status=error`);

            rental.paymentDone = true;
            rental.status = "rented"; 
            rental.isViewedByAdmin = false;

            if (rental.apartment) {
                rental.apartment.status = "rented";
                await rental.apartment.save();
            }
            await rental.save();

            // EMAIL HỢP ĐỒNG CHI TIẾT
            try {
                const contractUrl = `${req.protocol}://${req.get("host")}/uploads/pdf/hopdong.pdf`;
                
                const emailHtml = `
                <div style="${bodyStyle}">
                    <div style="${headerStyle}">
                        <h2 style="margin:0;">SMART BUILDING</h2>
                        <p style="margin:5px 0 0; font-size:14px;">XÁC NHẬN HỢP ĐỒNG THUÊ CĂN HỘ</p>
                    </div>
                    <div style="padding: 20px;">
                        <p>Xin chào cư dân mới <b>${rental.user.name}</b>,</p>
                        <p>Chúc mừng bạn! Hợp đồng thuê căn hộ của bạn đã được kích hoạt thành công sau khi thanh toán.</p>
                        
                        <div style="background:#eff6ff; padding:15px; border-left: 4px solid #2563eb; margin: 20px 0;">
                            <h3 style="margin-top:0; color:#1e40af;">Thông tin hợp đồng</h3>
                            <ul style="list-style: none; padding: 0;">
                                <li style="padding: 5px 0;"><b>Căn hộ:</b> ${rental.apartment.title}</li>
                                <li style="padding: 5px 0;"><b>Thời hạn:</b> ${new Date(rental.startDate).toLocaleDateString("vi-VN")} - ${new Date(rental.endDate).toLocaleDateString("vi-VN")}</li>
                                <li style="padding: 5px 0;"><b>Tổng thanh toán:</b> ${rental.totalPrice.toLocaleString()} VNĐ</li>
                                <li style="padding: 5px 0;"><b>Mã giao dịch:</b> ${vnp_Params['vnp_TransactionNo']}</li>
                            </ul>
                        </div>

                        <p>Bạn có thể tải về hoặc xem chi tiết điều khoản hợp đồng tại đây:</p>
                        <div style="text-align:center; margin: 25px 0;">
                            <a href="${contractUrl}" style="${btnStyle}">📄 Xem Hợp Đồng</a>
                        </div>

                        <p>Vui lòng liên hệ Ban Quản Lý để nhận bàn giao chìa khóa và thẻ cư dân.</p>
                    </div>
                    <div style="${footerStyle}">
                        <p><b>Ban Quản Lý Tòa Nhà SmartBuilding</b></p>
                        <p>Hotline: 1900 1234 | Email: support@smartbuilding.vn</p>
                    </div>
                </div>
                `;

                await sendEmail({ 
                    to: rental.user.email, 
                    subject: `[HOÀN TẤT] Hợp đồng thuê căn hộ - ${rental.apartment.title}`, 
                    html: emailHtml 
                });
            } catch (emailErr) {
                console.error("Lỗi gửi mail:", emailErr.message);
            }

            return res.redirect(`${clientUrl}?status=success`);
        }
    } else {
        return res.redirect(`${clientUrl}?status=failed`);
    }
  } else {
    return res.redirect(`${clientUrl}?status=invalid`);
  }
};

// ============================================================
// 4. ADMIN: Xác nhận thanh toán thủ công
// ============================================================

// A. Thủ công Hợp đồng
exports.manualPayRental = async (req, res) => {
  try {
    const rental = await Rental.findById(req.params.id).populate("apartment user");
    if (!rental) return res.status(404).json({ message: "Không tìm thấy hợp đồng" });

    rental.paymentDone = true;
    rental.status = "rented"; 
    rental.isViewedByAdmin = true;

    if (rental.apartment) {
        rental.apartment.status = "rented";
        await rental.apartment.save();
    }
    await rental.save();

    // EMAIL THỦ CÔNG (HỢP ĐỒNG)
    try {
        const contractUrl = `${req.protocol}://${req.get("host")}/uploads/pdf/hopdong.pdf`;
        const emailHtml = `
        <div style="${bodyStyle}">
            <div style="${headerStyle}">
                <h2 style="margin:0;">SMART BUILDING</h2>
                <p style="margin:5px 0 0; font-size:14px;">XÁC NHẬN THANH TOÁN (TIỀN MẶT)</p>
            </div>
            <div style="padding: 20px;">
                <p>Xin chào <b>${rental.user.name}</b>,</p>
                <p>Ban quản lý xác nhận đã nhận được khoản thanh toán <b>Tiền mặt / Chuyển khoản</b> cho hợp đồng thuê căn hộ <b>${rental.apartment.title}</b>.</p>
                
                <div style="background:#f3f4f6; padding:15px; border-radius:5px; text-align:center; margin: 15px 0;">
                    <p style="font-size:18px; font-weight:bold; color:#15803d; margin:0;">${rental.totalPrice.toLocaleString()} VNĐ</p>
                    <p style="font-size:12px; color:#666; margin:5px 0 0;">Đã thanh toán</p>
                </div>

                <p>Hợp đồng của bạn đã chính thức có hiệu lực.</p>
                <div style="text-align:center; margin: 20px 0;">
                    <a href="${contractUrl}" style="${btnStyle}">Xem Hợp Đồng</a>
                </div>
            </div>
            <div style="${footerStyle}">
                <p><b>Ban Quản Lý Tòa Nhà SmartBuilding</b></p>
            </div>
        </div>
        `;
        await sendEmail({ to: rental.user.email, subject: "[XÁC NHẬN] Thanh toán hợp đồng thành công", html: emailHtml });
    } catch (e) { console.error(e); }

    res.json({ message: "Đã xác nhận thanh toán hợp đồng thành công!" });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// B. Thủ công Hóa đơn
exports.manualPayInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate("user apartment");
    if (!invoice) return res.status(404).json({ message: "Không tìm thấy hóa đơn" });

    invoice.status = "paid";
    invoice.paymentDate = new Date();
    invoice.isViewedByAdmin = true; 

    await invoice.save();

    // 🔥 EMAIL THỦ CÔNG (HÓA ĐƠN)
    try {
        const emailHtml = `
        <div style="${bodyStyle}">
            <div style="${headerStyle}">
                <h2 style="margin:0;">SMART BUILDING</h2>
                <p style="margin:5px 0 0; font-size:14px;">XÁC NHẬN THANH TOÁN (TIỀN MẶT)</p>
            </div>
            <div style="padding: 20px;">
                <p>Xin chào <b>${invoice.user.name}</b>,</p>
                <p>Ban quản lý xác nhận đã thu tiền mặt cho hóa đơn dịch vụ tháng <b>${invoice.month}/${invoice.year}</b>.</p>
                
                <div style="background:#f3f4f6; padding:15px; border-radius:5px; margin: 15px 0;">
                    <p>Căn hộ: <b>${invoice.apartment.title}</b></p>
                    <p>Điện: ${invoice.electricTotal.toLocaleString()} đ</p>
                    <p>Phí chung: ${invoice.commonFee.toLocaleString()} đ</p>
                    <p>Vệ sinh: ${invoice.cleaningFee.toLocaleString()} đ</p>
                    <hr style="border-top:1px dashed #ccc;">
                    <p style="font-size:16px; font-weight:bold; color:#dc2626; text-align:right;">TỔNG CỘNG: ${invoice.totalAmount.toLocaleString()} VNĐ</p>
                </div>
                
                <p>Trạng thái hóa đơn trên hệ thống đã được cập nhật: <b style="color:green;">ĐÃ THANH TOÁN</b>.</p>
            </div>
            <div style="${footerStyle}">
                <p><b>Ban Quản Lý Tòa Nhà SmartBuilding</b></p>
            </div>
        </div>
        `;
        
        await sendEmail({ to: invoice.user.email, subject: `[XÁC NHẬN] Thanh toán hóa đơn T${invoice.month}`, html: emailHtml });
    } catch (e) { console.error(e); }

    res.json({ message: "Đã xác nhận thanh toán hóa đơn thành công!" });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ... các hàm admin khác (giữ nguyên) ...
exports.getAdminUnreadCount = async (req, res) => { /*...*/ };
exports.getAdminAllPayments = async (req, res) => { /*...*/ };
exports.markAllAsViewed = async (req, res) => { /*...*/ };

function sortObject(obj) {
  let sorted = {};
  let str = [];
  let key;
  for (key in obj){
    if (Object.prototype.hasOwnProperty.call(obj, key)) str.push(encodeURIComponent(key));
  }
  str.sort();
  for (key = 0; key < str.length; key++) {
    sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
  }
  return sorted;
}