const fetch = require("node-fetch");
const ChatMessage = require("../models/chatMessageModel");
const Rental = require("../models/rentalModel");
const Apartment = require("../models/apartmentModel");

// =====================================================
// BASE CONFIG
// =====================================================
const FRONTEND_URL = "http://localhost:5173";

// =====================================================
// SYSTEM PROMPT – RÕ RÀNG, TỰ NHIÊN, ĐÚNG NGỮ CẢNH
// =====================================================
const BASE_SYSTEM_PROMPT = `
Bạn là Trợ lý AI SMARTBUILDING – hỗ trợ khách hàng tìm căn hộ, tư vấn hợp đồng, thanh toán, OTP và tin tức.

Giọng văn:
- Ngắn gọn, tự nhiên, dễ hiểu.
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
- Thanh toán thành công → gửi email xác nhận.
- Không nhận email → hướng dẫn kiểm tra spam.

====================================
ĐỀ XUẤT CĂN HỘ THEO SỐ NGƯỜI
====================================
1 người → Studio hoặc 1PN  
2 người → 1–2PN  
3–4 người → 2PN+  
Gia đình đông → 3PN+

====================================
QUY ĐỊNH BẮT BUỘC VỀ LINK CĂN HỘ
====================================
- Khi trả lời về căn hộ → luôn dùng link ĐẦY ĐỦ:
  ${FRONTEND_URL}/apartments/<ObjectID 24 ký tự>
- KHÔNG được dùng dạng /apartments/<id>.
- KHÔNG được tạo mã phòng (A101, B202…).
- Chỉ sử dụng ID thật từ hệ thống.

====================================
CÁCH TRẢ LỜI
====================================
- Luôn bám sát dữ liệu thật.
- Gợi ý bước tiếp theo rõ ràng.
- Khi người dùng hỏi tìm căn hộ → phải trả lại danh sách + link đầy đủ.
`;


// =====================================================
// BUILD USER CONTEXT
// =====================================================
function buildUserContext(rentals = []) {
  if (!rentals.length) {
    return `Người dùng hiện chưa có hợp đồng nào. Có thể đề xuất phòng phù hợp theo nhu cầu.`;
  }

  const r = rentals[0];

  let nextStep = "";
  if (r.status === "pending") nextStep = "Đơn đang chờ admin duyệt.";
  if (r.status === "approved" && !r.contractSigned)
    nextStep = "Admin đã duyệt, bạn cần vào mục 'Hợp đồng của tôi' để ký.";
  if (r.contractSigned && !r.paymentDone)
    nextStep = "Bạn đã ký hợp đồng, tiếp theo bạn có thể thanh toán qua VNPAY.";
  if (r.paymentDone)
    nextStep = "Bạn đã thanh toán thành công, email xác nhận đã được gửi.";
  if (r.status === "cancelling")
    nextStep = "Yêu cầu hủy đang chờ admin xác nhận.";
  if (r.status === "cancelled")
    nextStep = "Hợp đồng đã hủy, bạn có thể tìm căn hộ khác.";

  return `
THÔNG TIN NGƯỜI DÙNG:
- Căn đang thuê: ${r.apartment?.title || "Không rõ"}
- Trạng thái hợp đồng: ${r.status}
- Đã ký: ${r.contractSigned}
- Đã thanh toán: ${r.paymentDone}
- Bước tiếp theo: ${nextStep}
  `;
}


// =====================================================
// FILTER CĂN HỘ THEO SỐ NGƯỜI
// =====================================================
function filterApartmentsByPeople(apartments, num) {
  if (num <= 1) return apartments.filter(a => a.bedrooms <= 1);
  if (num === 2) return apartments.filter(a => a.bedrooms <= 2);
  if (num >= 3 && num <= 4) return apartments.filter(a => a.bedrooms >= 2);
  return apartments.filter(a => a.bedrooms >= 3);
}


// =====================================================
// MAIN CHATBOT
// =====================================================
exports.askChatbot = async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.json({ response: "Bạn muốn hỏi điều gì ạ?" });

  const apiKey = process.env.GEMINI_API_KEY;

  try {
    // LOAD data
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


    // =====================================================
    // NHẬN DẠNG SỐ NGƯỜI TÌM PHÒNG (TỰ ĐỘNG)
    // =====================================================
    let numPeople = null;

    if (/1 người|một mình/i.test(prompt)) numPeople = 1;
    if (/2 người|hai người/i.test(prompt)) numPeople = 2;
    if (/3 người|ba người/i.test(prompt)) numPeople = 3;
    if (/4 người|bốn người/i.test(prompt)) numPeople = 4;
    if (/5|6|7|gia đình/i.test(prompt)) numPeople = 5;

    // Nếu user hỏi tìm phòng → trả kết quả ngay
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
➡ Link: ${FRONTEND_URL}/apartments/${a._id}\n`
              )
              .join("\n") +
            `Bạn muốn xem căn nào trước?`
        });
      }
    }


    // =====================================================
    // MULTITURN HISTORY
    // =====================================================
    const contents = [];

    history.forEach((m) =>
      contents.push({
        role: m.role === "bot" ? "model" : "user",
        parts: [{ text: m.content }],
      })
    );

    contents.push({ role: "user", parts: [{ text: prompt }] });


    // =====================================================
    // SYSTEM INSTRUCTION + FULL LINK LIST
    // =====================================================
    const systemText =
      BASE_SYSTEM_PROMPT +
      "\n\n" +
      userContext +
      "\n\nDANH SÁCH CĂN HỘ AVAILABLE (LUÔN TRẢ LINK ĐẦY ĐỦ):\n" +
      apartments
        .map(
          (a) =>
            `• ${a.title} – ${a.bedrooms}PN – ${a.area}m² – ${a.price.toLocaleString()}đ/tháng
➡ Link: ${FRONTEND_URL}/apartments/${a._id}`
        )
        .join("\n");


    // =====================================================
    // GỌI GEMINI API
    // =====================================================
    const apiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          systemInstruction: { parts: [{ text: systemText }] },
        }),
      }
    );

    const data = await apiRes.json();
    const answer =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Mình chưa hiểu ý bạn lắm, bạn mô tả rõ hơn được không ạ?";


    // LƯU HISTORY
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
// API: LẤY LỊCH SỬ CHAT
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
