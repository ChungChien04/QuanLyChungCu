// /backend/src/controllers/reviewController.js
const Review = require("../models/reviewModel");

/* ======================================================
   1) USER: Tạo review (hiển thị ngay)
====================================================== */
exports.createReview = async (req, res) => {
  try {
    const { apartmentId } = req.params;
    const { rating, content, serviceType } = req.body;

    // ❌ Chặn admin đánh giá
    if (req.user.role === "admin") {
      return res
        .status(403)
        .json({ message: "Quản trị viên không được phép viết đánh giá." });
    }

    // ❌ Validate đầu vào
    if (!rating || !content.trim()) {
      return res
        .status(400)
        .json({ message: "Vui lòng nhập điểm và nội dung đánh giá." });
    }

    // ❌ Kiểm tra rating hợp lệ
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Điểm đánh giá phải từ 1 đến 5." });
    }

    // ❌ Mỗi user chỉ 1 review / căn
    const exists = await Review.findOne({
      apartment: apartmentId,
      user: req.user._id,
    });

    if (exists) {
      return res
        .status(400)
        .json({ message: "Bạn đã đánh giá căn hộ này rồi." });
    }


    const review = await Review.create({
      apartment: apartmentId,
      user: req.user._id,
      rating,
      content,
      serviceType,
      status: "approved",
    });

    // ⭐ Populate ngay để frontend hiển thị tức thì
    const fullReview = await Review.findById(review._id).populate(
      "user",
      "name"
    );

    return res.status(201).json({
      message: "Đã gửi đánh giá!",
      review: fullReview,
    });
  } catch (err) {
    console.error("Create review error:", err);
    res.status(500).json({ message: "Lỗi server khi gửi đánh giá." });
  }
};

/* ======================================================
   2) USER: Cập nhật review của chính mình
====================================================== */
exports.updateUserReview = async (req, res) => {
  try {
    const { rating, content, serviceType } = req.body;

    const review = await Review.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!review) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền sửa đánh giá này." });
    }

    review.rating = rating ?? review.rating;
    review.content = content ?? review.content;
    review.serviceType = serviceType ?? review.serviceType;

    await review.save();

    const fullReview = await Review.findById(review._id).populate(
      "user",
      "name"
    );

    res.json({ message: "Đã cập nhật đánh giá!", review: fullReview });
  } catch (err) {
    console.error("Update review error:", err);
    res.status(500).json({ message: "Lỗi khi cập nhật đánh giá." });
  }
};

/* ======================================================
   3) USER: Xoá review của chính mình
====================================================== */
exports.deleteUserReview = async (req, res) => {
  try {
    const review = await Review.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!review) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền xoá đánh giá này." });
    }

    await review.deleteOne();
    res.json({ message: "Đã xoá đánh giá!" });
  } catch (err) {
    console.error("Delete review error:", err);
    res.status(500).json({ message: "Lỗi server khi xoá đánh giá." });
  }
};

/* ======================================================
   4) PUBLIC: Lấy danh sách review của căn hộ
====================================================== */
exports.getReviewsByApartment = async (req, res) => {
  try {
    const { apartmentId } = req.params;

    const reviews = await Review.find({
      apartment: apartmentId,
      status: "approved",
    })
      .populate("user", "name")
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (err) {
    console.error("Get reviews error:", err);
    res.status(500).json({ message: "Lỗi server khi lấy danh sách đánh giá." });
  }
};

/* ======================================================
   5) ADMIN: Lấy toàn bộ review
====================================================== */
exports.getAllReviews = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const reviews = await Review.find(filter)
      .populate("user", "name email")
      .populate("apartment", "title price")
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (err) {
    console.error("Admin getAllReviews error:", err);
    res.status(500).json({ message: "Lỗi server khi lấy danh sách đánh giá." });
  }
};

/* ======================================================
   6) ADMIN: Cập nhật trạng thái review
====================================================== */
exports.updateReviewStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const review = await Review.findById(req.params.id);
    if (!review)
      return res.status(404).json({ message: "Không tìm thấy đánh giá." });

    review.status = status;
    await review.save();

    res.json({ message: "Đã cập nhật trạng thái!", review });
  } catch (err) {
    console.error("Admin updateReviewStatus error:", err);
    res.status(500).json({ message: "Lỗi khi cập nhật trạng thái." });
  }
};

/* ======================================================
   7) ADMIN: Xoá review
====================================================== */
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: "Không tìm thấy đánh giá." });
    }

    await review.deleteOne();

    res.json({ message: "Đã xoá đánh giá." });
  } catch (err) {
    console.error("Admin delete review error:", err);
    res.status(500).json({ message: "Lỗi khi xoá đánh giá." });
  }
};
exports.replyReview = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content.trim()) {
      return res.status(400).json({ message: "Nội dung phản hồi không được trống." });
    }

    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: "Không tìm thấy đánh giá." });

    review.reply = {
      content,
      repliedAt: new Date()
    };

    await review.save();

    res.json({ message: "Đã phản hồi đánh giá!", review });
  } catch (err) {
    console.error("Reply review error:", err);
    res.status(500).json({ message: "Lỗi server khi phản hồi đánh giá." });
  }
};
exports.deleteReply = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: "Không tìm thấy đánh giá." });

    review.reply = { content: "", repliedAt: null };
    await review.save();

    res.json({ message: "Đã xoá phản hồi!", review });
  } catch (err) {
    console.error("Delete reply error:", err);
    res.status(500).json({ message: "Lỗi server khi xoá phản hồi." });
  }
};

