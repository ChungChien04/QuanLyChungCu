const fetch = require("node-fetch");
const ChatMessage = require("../models/chatMessageModel");
const Rental = require("../models/rentalModel");
const Apartment = require("../models/apartmentModel");

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// ====================== SYSTEM PROMPT ======================
const BASE_SYSTEM_PROMPT = `
Bạn là Trợ lý AI SMARTBUILDING – hỗ trợ tìm căn hộ, hợp đồng, thanh toán, tiện ích...

Khi người dùng hỏi về căn hộ cụ thể:
- CHỈ sử dụng danh sách căn hộ được cung cấp trong hệ thống.
- KHÔNG tự bịa căn hộ hoặc ID.
- Link căn hộ luôn có dạng: ${FRONTEND_URL}/apartments/<ObjectID 24 ký tự>.
`;

// ====================== USER CONTEXT ======================
function buildUserContext(rentals = []) {
  if (!rentals.length) {
    return `Người dùng hiện chưa có hợp đồng nào.`;
  }

  const r = rentals[0];

  let nextStep = "";
  if (r.status === "pending") nextStep = "Đơn đang chờ admin duyệt.";
  if (r.status === "approved" && !r.contractSigned)
    nextStep = "Admin đã duyệt, bạn cần vào mục 'Hợp đồng của tôi' để ký.";
  if (r.contractSigned && !r.paymentDone)
    nextStep = "Bạn đã ký hợp đồng, tiếp theo bạn có thể thanh toán qua VNPAY.";
  if (r.paymentDone)
    nextStep = "Bạn đã thanh toán thành công.";
  if (r.status === "cancelling")
    nextStep = "Yêu cầu hủy đang chờ admin xác nhận.";
  if (r.status === "cancelled") nextStep = "Hợp đồng đã hủy.";

  return `
THÔNG TIN NGƯỜI DÙNG:
- Căn đang thuê: ${r.apartment?.title || "Không rõ"}
- Trạng thái hợp đồng: ${r.status}
- Đã ký: ${r.contractSigned}
- Đã thanh toán: ${r.paymentDone}
- Bước tiếp theo: ${nextStep}
`;
}

// ====================== FILTER BY PEOPLE ======================
function filterApartmentsByPeople(apartments, num) {
  if (num <= 1) return apartments.filter((a) => a.bedrooms <= 1);
  if (num === 2) return apartments.filter((a) => a.bedrooms <= 2);
  if (num >= 3 && num <= 4) return apartments.filter((a) => a.bedrooms >= 2);
  return apartments.filter((a) => a.bedrooms >= 3);
}

// ====================== BUDGET PARSER ======================
// parse "5 triệu", "7tr", "năm triệu"
function extractBudgetFromText(text) {
  if (!text) return null;
  const lower = text.toLowerCase();

  // số dạng 5 triệu / 7tr
  const m = lower.match(/(\d+)\s*(triệu|tr)/i);
  if (m) {
    const num = parseInt(m[1], 10);
    if (!isNaN(num)) return num * 1_000_000;
  }

  // chữ: một/hai/ba/bốn/năm/sáu/bảy/tám/chín/mười triệu
  const WORD_TO_NUMBER = {
    một: 1,
    mot: 1,
    hai: 2,
    ba: 3,
    bốn: 4,
    bon: 4,
    tư: 4,
    tu: 4,
    năm: 5,
    nam: 5,
    sáu: 6,
    sau: 6,
    bảy: 7,
    bay: 7,
    tám: 8,
    tam: 8,
    chín: 9,
    chin: 9,
    mười: 10,
    muoi: 10,
  };

  const m2 = lower.match(
    /(một|mot|hai|ba|bốn|bon|tư|tu|năm|nam|sáu|sau|bảy|bay|tám|tam|chín|chin|mười|muoi)\s*triệu/
  );
  if (m2) {
    const w = m2[1];
    const num = WORD_TO_NUMBER[w];
    if (num) return num * 1_000_000;
  }

  return null;
}

// ====================== AREA PARSER (m²) ======================
function extractAreaRange(text) {
  if (!text) return null;
  const lower = text.toLowerCase();

  // dạng 40-60m2
  const range = lower.match(/(\d+)\s*[-–]\s*(\d+)\s*(m2|m²|m vuông)/i);
  if (range) {
    const min = parseInt(range[1], 10);
    const max = parseInt(range[2], 10);
    if (!isNaN(min) && !isNaN(max)) return { min, max };
  }

  // dạng "trên 50m2", "hơn 70m²"
  const above = lower.match(/(trên|hơn|từ)\s*(\d+)\s*(m2|m²|m vuông)/i);
  if (above) {
    const v = parseInt(above[2], 10);
    if (!isNaN(v)) return { min: v, max: null };
  }

  // dạng "dưới 50m2"
  const below = lower.match(/(dưới|nhỏ hơn)\s*(\d+)\s*(m2|m²|m vuông)/i);
  if (below) {
    const v = parseInt(below[2], 10);
    if (!isNaN(v)) return { min: null, max: v };
  }

  // dạng "khoảng 50m2", "tầm 50 mét vuông"
  const around = lower.match(
    /(khoảng|tầm|cỡ)\s*(\d+)\s*(m2|m²|m vuông)/i
  );
  if (around) {
    const v = parseInt(around[2], 10);
    if (!isNaN(v)) return { min: v - 5, max: v + 5 };
  }

  // dạng "50m2" đơn lẻ → +- 5m2
  const single = lower.match(/(\d+)\s*(m2|m²|m vuông)/i);
  if (single) {
    const v = parseInt(single[1], 10);
    if (!isNaN(v)) return { min: v - 5, max: v + 5 };
  }

  return null;
}

// ====================== FLOOR PARSER ======================
function extractFloorFilter(text) {
  if (!text) return null;
  const lower = text.toLowerCase();

  // "tầng 10"
  const exact = lower.match(/tầng\s+(\d{1,2})/i);
  if (exact) {
    const v = parseInt(exact[1], 10);
    if (!isNaN(v)) return { min: v, max: v };
  }

  // "trên tầng 5"
  const above = lower.match(/trên\s+tầng\s+(\d{1,2})/i);
  if (above) {
    const v = parseInt(above[1], 10);
    if (!isNaN(v)) return { min: v + 1, max: null };
  }

  // "dưới tầng 5"
  const below = lower.match(/dưới\s+tầng\s+(\d{1,2})/i);
  if (below) {
    const v = parseInt(below[1], 10);
    if (!isNaN(v)) return { min: null, max: v - 1 };
  }

  // "tầng cao"
  if (/tầng cao/i.test(lower)) {
    return { min: 10, max: null }; // tùy dự án, bạn có thể chỉnh
  }

  // "tầng thấp"
  if (/tầng thấp/i.test(lower)) {
    return { min: null, max: 5 };
  }

  // "tầng trung", "tầng giữa"
  if (/tầng trung|tầng giữa/i.test(lower)) {
    return { min: 5, max: 15 };
  }

  return null;
}

// ====================== AMENITY / UTILITIES PARSER ======================
// LƯU Ý: schema Apartment đang dùng field "utilities: [String]"
const AMENITY_KEYWORDS = [
  {
    value: "pool",
    keywords: [/hồ bơi/i, /bể bơi/i, /pool/i],
  },
  {
    value: "gym",
    keywords: [/gym/i, /phòng gym/i, /phòng tập/i],
  },
  {
    value: "parking",
    keywords: [/bãi xe/i, /chỗ để xe/i, /gửi xe/i, /gara/i, /parking/i],
  },
  {
    value: "playground",
    keywords: [/khu vui chơi/i, /sân chơi/i],
  },
  {
    value: "supermarket",
    keywords: [/siêu thị/i, /cửa hàng tiện lợi/i, /mart/i],
  },
];

function extractAmenityFilters(text) {
  if (!text) return [];
  const res = [];
  for (const item of AMENITY_KEYWORDS) {
    if (item.keywords.some((re) => re.test(text))) {
      res.push(item.value);
    }
  }
  return res;
}

// ====================== MAIN CHATBOT ======================
exports.askChatbot = async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.json({ response: "Bạn muốn hỏi điều gì ạ?" });

  const apiKey = process.env.GEMINI_API_KEY;

  try {
    let history = [];
    let rentals = [];

    // 1) Load tất cả căn hộ CÒN TRỐNG
    let apartments = await Apartment.find({ status: "available" }).limit(60);

    // Nếu không còn căn hộ trống → nói thẳng, không gọi AI
    if (!apartments.length) {
      return res.json({
        response:
          "Hiện tại hệ thống không còn căn hộ nào ở trạng thái **còn trống**. " +
          "Bạn có thể thử lại sau hoặc liên hệ ban quản lý tòa nhà để được hỗ trợ thêm.",
      });
    }

    // 2) Nếu user đã login: lấy history + rentals
    if (req.user?._id) {
      history = await ChatMessage.find({ user: req.user._id })
        .sort({ createdAt: 1 })
        .limit(30);

      rentals = await Rental.find({ user: req.user._id })
        .populate("apartment")
        .sort({ createdAt: -1 });
    }

    const userContext = req.user?._id ? buildUserContext(rentals) : "";

    // 3) PHÂN TÍCH Ý ĐỊNH CÓ CẤU TRÚC
    let numPeople = null;
    const lowerPrompt = prompt.toLowerCase();

    // số người
    if (/1 người|một mình/i.test(lowerPrompt)) numPeople = 1;
    if (/2 người|hai người/i.test(lowerPrompt)) numPeople = 2;
    if (/3 người|ba người/i.test(lowerPrompt)) numPeople = 3;
    if (/4 người|bốn người/i.test(lowerPrompt)) numPeople = 4;
    if (/5|6|7|gia đình/i.test(lowerPrompt)) numPeople = 5;

    // ngân sách
    const maxBudget = extractBudgetFromText(prompt);

    // diện tích
    const areaRange = extractAreaRange(prompt);

    // tầng
    const floorFilter = extractFloorFilter(prompt);

    // tiện ích
    const amenityFilters = extractAmenityFilters(prompt);

    const isSearchIntent =
      /căn hộ|phòng|thuê/i.test(lowerPrompt) ||
      numPeople ||
      maxBudget ||
      areaRange ||
      floorFilter ||
      amenityFilters.length;

    // 4) Nếu phát hiện intent tìm kiếm → lọc trực tiếp từ DB
    if (isSearchIntent) {
      let filtered = apartments;

      // lọc theo ngân sách
      if (maxBudget) {
        filtered = filtered.filter((a) => a.price <= maxBudget);
      }

      // lọc theo số người (bedrooms)
      if (numPeople) {
        filtered = filterApartmentsByPeople(filtered, numPeople);
      }

      // lọc theo diện tích
      if (areaRange) {
        filtered = filtered.filter((a) => {
          if (areaRange.min != null && a.area < areaRange.min) return false;
          if (areaRange.max != null && a.area > areaRange.max) return false;
          return true;
        });
      }

      // lọc theo tầng
      if (floorFilter) {
        filtered = filtered.filter((a) => {
          const floor = a.location?.floor;
          if (floor == null) return false; // không biết tầng thì bỏ qua
          if (floorFilter.min != null && floor < floorFilter.min) return false;
          if (floorFilter.max != null && floor > floorFilter.max) return false;
          return true;
        });
      }

      // lọc theo tiện ích (AND: phải có đủ các tiện ích yêu cầu)
      if (amenityFilters.length) {
        filtered = filtered.filter((a) =>
          amenityFilters.every(
            (am) => a.utilities && a.utilities.includes(am)
          )
        );
      }

      const top = filtered.slice(0, 6);

      if (!top.length) {
        return res.json({
          response:
            "Mình chưa tìm được căn hộ nào phù hợp với các tiêu chí bạn đưa ra " +
            "(ngân sách / diện tích / tầng / số người / tiện ích). " +
            "Bạn có thể nới rộng tiêu chí và hỏi lại nhé.",
        });
      }

      return res.json({
        response:
          "Mình đã lọc căn hộ dựa trên tiêu chí của bạn:\n\n" +
          top
            .map(
              (a, i) =>
                `${i + 1}. **${a.title}**  
• Giá: ${a.price.toLocaleString()} đ/tháng  
• Diện tích: ${a.area} m²  
• Tầng: ${a.location?.floor ?? "Không rõ"}  
• Phòng ngủ: ${a.bedrooms}  
• Tiện ích: ${(a.utilities || []).join(", ") || "Không rõ"}  
➡ Link: ${FRONTEND_URL}/apartments/${a._id}\n`
            )
            .join("\n") +
          "Bạn muốn xem chi tiết căn nào trước?",
      });
    }

    // 5) Nếu không phải câu hỏi tìm căn cụ thể → AI trả lời chung (FAQ, quy trình...)
    const contents = [];
    history.forEach((m) => {
      contents.push({
        role: m.role === "bot" ? "model" : "user",
        parts: [{ text: m.content }],
      });
    });
    contents.push({ role: "user", parts: [{ text: prompt }] });

    const systemText =
      BASE_SYSTEM_PROMPT +
      "\n\n" +
      userContext +
      "\n\nDANH SÁCH CĂN HỘ CÒN TRỐNG (KHÔNG ĐƯỢC TỰ BỊA THÊM):\n" +
      apartments
        .map(
          (a) =>
            `• ${a.title} – ${a.bedrooms}PN – ${a.area}m² – ${a.price.toLocaleString()} đ/tháng  
Tầng: ${a.location?.floor ?? "Không rõ"}
Tiện ích: ${(a.utilities || []).join(", ") || "Không rõ"}
➡ Link: ${FRONTEND_URL}/apartments/${a._id}`
        )
        .join("\n");

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

    // lưu lịch sử nếu có user
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
  } catch (err) {
    console.error("Chatbot error:", err);
    res.status(500).json({
      response: "Hệ thống đang quá tải, bạn thử lại sau giúp mình nhé.",
    });
  }
};

// ====================== LỊCH SỬ CHAT ======================
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
