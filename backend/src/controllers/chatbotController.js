const fetch = require("node-fetch");
const ChatMessage = require("../models/chatMessageModel");
const Rental = require("../models/rentalModel");
const Apartment = require("../models/apartmentModel");

// =====================================================
// SYSTEM PROMPT – NGÔN NGỮ TỰ NHIÊN + HIỆN ĐẠI
// =====================================================
const BASE_SYSTEM_PROMPT = `
Bạn là Trợ lý AI SMARTBUILDING – một trợ lý thân thiện, chuyên nghiệp và hiểu toàn bộ hệ thống căn hộ.

Giọng văn:
- Ngắn gọn, tự nhiên, dễ hiểu.
- Tư vấn như một nhân viên chăm sóc khách hàng.
- Chủ động gợi ý bước tiếp theo.
- Chỉ trả lời trong phạm vi: căn hộ, thuê nhà, hợp đồng, thanh toán, tiện ích, OTP, tin tức.

====================================
QUY TRÌNH HỢP ĐỒNG SMARTBUILDING
====================================
1) User tạo đơn → status = "pending"
2) Admin duyệt → status = "approved"
3) User ký hợp đồng → contractSigned = true
4) User thanh toán VNPAY → paymentDone = true
5) Thành công → status = "rented"

Hủy:
- pending → hủy ngay
- approved/rented → chuyển "cancelling", admin xác nhận → "cancelled"

====================================
EMAIL & OTP
====================================
- OTP gửi qua email khi đăng ký / quên mật khẩu.
- Thanh toán xong → gửi email xác nhận.
- Không nhận email → hướng dẫn kiểm tra spam.

====================================
ĐỀ XUẤT CĂN HỘ THEO SỐ NGƯỜI
====================================
1 người → Studio hoặc 1PN  
2 người → 1–2PN  
3–4 người → 2PN+  
Gia đình đông → 3PN+

====================================
CÁCH TRẢ LỜI
====================================
- Luôn bám sát dữ liệu thật của user.
- Gợi ý rõ ràng bước tiếp theo.
- Khi user hỏi tìm căn hộ → phải đề xuất rõ ràng + kèm link /apartments/:id.
- Luôn nói tự nhiên, dễ hiểu.
`;


// =====================================================
// BUILD userContext để cá nhân hóa trả lời
// =====================================================
function buildUserContext(rentals = []) {
  if (!rentals.length) {
    return `Người dùng hiện chưa có hợp đồng nào. Có thể đề xuất phòng phù hợp khi họ mô tả nhu cầu.`;
  }

  const r = rentals[0];

  let nextStep = "";
  if (r.status === "pending") nextStep = "Đơn đang chờ admin duyệt.";
  if (r.status === "approved" && !r.contractSigned)
    nextStep = "Admin đã duyệt. Bạn cần vào mục 'Hợp đồng của tôi' để ký.";
  if (r.contractSigned && !r.paymentDone)
    nextStep = "Bạn đã ký hợp đồng. Bây giờ bạn có thể thanh toán VNPAY.";
  if (r.paymentDone)
    nextStep = "Bạn đã thanh toán thành công. Email xác nhận đã được gửi.";
  if (r.status === "cancelling")
    nextStep = "Yêu cầu hủy của bạn đang chờ admin xác nhận.";
  if (r.status === "cancelled")
    nextStep = "Hợp đồng đã hủy. Bạn có thể tìm căn hộ khác nếu muốn.";

  return `
THÔNG TIN NGƯỜI DÙNG:
- Căn hộ: ${r.apartment?.title || "Không rõ"}
- Trạng thái: ${r.status}
- Đã ký hợp đồng: ${r.contractSigned}
- Đã thanh toán: ${r.paymentDone}
- Gợi ý tiếp theo: ${nextStep}
  `;
}


// =====================================================
// Lọc căn hộ theo số người
// =====================================================
function filterApartmentsByPeople(apartments, num) {
  if (num <= 1) return apartments.filter(a => a.bedrooms <= 1);
  if (num === 2) return apartments.filter(a => a.bedrooms <= 2);
  if (num >= 3 && num <= 4) return apartments.filter(a => a.bedrooms >= 2);
  return apartments.filter(a => a.bedrooms >= 3);
}


// =====================================================
// MAIN: CHATBOT
// =====================================================
exports.askChatbot = async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.json({ response: "Bạn muốn hỏi điều gì ạ?" });

  const apiKey = process.env.GEMINI_API_KEY;

  try {
    // ------------------------------------------------------
    // LOAD Lịch sử + Hợp đồng + Căn hộ
    // ------------------------------------------------------
    let history = [];
    let rentals = [];
    let apartments = [];

    if (req.user?._id) {
      history = await ChatMessage.find({ user: req.user._id })
        .sort({ createdAt: 1 })
        .limit(30);

      rentals = await Rental.find({ user: req.user._id })
        .populate("apartment")
        .sort({ createdAt: -1 });

      apartments = await Apartment.find({ status: "available" }).limit(60);
    }

    const userContext = req.user?._id ? buildUserContext(rentals) : "";


    // ------------------------------------------------------
    // Tự động nhận dạng nhu cầu tìm phòng theo số người
    // ------------------------------------------------------
    let numPeople = null;

    if (/1 người|một mình/i.test(prompt)) numPeople = 1;
    if (/2 người|hai người/i.test(prompt)) numPeople = 2;
    if (/3 người|ba người/i.test(prompt)) numPeople = 3;
    if (/4 người|bốn người/i.test(prompt)) numPeople = 4;
    if (/5|6|7|gia đình/i.test(prompt)) numPeople = 5;

    // Nếu người dùng hỏi tìm phòng → trả ngay kết quả kèm link
    if (numPeople && apartments.length > 0) {
      const filtered = filterApartmentsByPeople(apartments, numPeople).slice(0, 6);

      if (filtered.length > 0) {
        return res.json({
          response:
            `Tôi đã tìm được vài căn hộ phù hợp với nhu cầu của bạn:\n\n` +
            filtered
              .map(
                (a, i) =>
                  `${i + 1}. **${a.title}**  
• Giá: ${a.price.toLocaleString()} đ/tháng  
• Diện tích: ${a.area} m²  
• Phòng ngủ: ${a.bedrooms}  
➡ Link: http://localhost:5173/apartments/${a._id}\n`
              )
              .join("\n") +
            `\nBạn muốn xem căn nào trước?`
        });
      }
    }


    // ------------------------------------------------------
    // Tạo MULTITURN chat
    // ------------------------------------------------------
    const contents = [];

    history.forEach((m) =>
      contents.push({
        role: m.role === "bot" ? "model" : "user",
        parts: [{ text: m.content }],
      })
    );

    contents.push({ role: "user", parts: [{ text: prompt }] });


    // ------------------------------------------------------
    // GỌI GEMINI
    // ------------------------------------------------------
    const apiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          systemInstruction: {
            parts: [
              {
                text:
                  BASE_SYSTEM_PROMPT +
                  "\n\n" +
                  userContext +
                  "\n\nDANH SÁCH CĂN HỘ AVAILABLE:\n" +
                  apartments
                    .map(
                      (a) =>
                        `• ${a.title} – ${a.bedrooms}PN – ${a.area}m² – ${a.price.toLocaleString()}đ – /apartments/${a._id}`
                    )
                    .join("\n")
              },
            ],
          },
        }),
      }
    );

    const data = await apiRes.json();
    const answer =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Mình chưa hiểu ý bạn lắm, bạn mô tả rõ hơn được không ạ?";


    // ------------------------------------------------------
    // Lưu lịch sử hội thoại
    // ------------------------------------------------------
    if (req.user?._id) {
      await ChatMessage.create({
        user: req.user._id,
        role: "user",
        content: prompt,
      });

      await ChatMessage.create({
        user: req.user._id,
        role: "bot",
        content: answer,
      });
    }

    res.json({ response: answer });
  } catch (error) {
    console.log("Chatbot error:", error);
    res.status(500).json({
      response: "Hệ thống đang quá tải, bạn thử lại sau giúp mình nhé.",
    });
  }
};


// =====================================================
// API: Lấy lịch sử chat của tôi
// =====================================================
exports.getMyChatHistory = async (req, res) => {
  try {
    const history = await ChatMessage.find({ user: req.user._id }).sort({
      createdAt: 1,
    });
    res.json(history);
  } catch {
    res.status(500).json({ message: "Không tải được lịch sử." });
  }
};
