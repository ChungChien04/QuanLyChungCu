// backend/src/controllers/newsController.js
const News = require("../models/newsModel");

// GET: user thường → chỉ status true; admin → tất cả
exports.getAllNews = async (req, res) => {
  try {
    const isAdmin = req.user?.isAdmin || req.user?.role === "admin";

    const filter = {};
    if (!isAdmin) filter.status = true;

    const items = await News.find(filter)
      .sort({ createdAt: -1 })
      .populate("createdBy", "name email");

    res.json(items);
  } catch (err) {
    console.error("getAllNews error:", err);
    res.status(500).json({ message: "Lỗi server khi lấy tin tức." });
  }
};

// GET 1 tin
exports.getNewsById = async (req, res) => {
  try {
    const item = await News.findById(req.params.id).populate(
      "createdBy",
      "name email"
    );

    if (!item) {
      return res
        .status(404)
        .json({ message: "Tin không tồn tại hoặc đã bị xoá." });
    }

    const isAdmin = req.user?.isAdmin || req.user?.role === "admin";

    if (!isAdmin && item.status === false) {
      return res
        .status(403)
        .json({ message: "Tin tức này đã bị ẩn khỏi hệ thống." });
    }

    res.json(item);
  } catch (err) {
    console.error("getNewsById error:", err);
    res.status(500).json({ message: "Lỗi server khi lấy tin." });
  }
};

// CREATE tin tức
exports.createNews = async (req, res) => {
  try {
    const { title, content, description, status, images = [] } = req.body;

    if (!title || !content) {
      return res
        .status(400)
        .json({ message: "Thiếu tiêu đề hoặc nội dung." });
    }

    const news = await News.create({
      title,
      content,
      description,
      images,
      thumbnail: images?.[0] || "",
      status: status ?? true,
      createdBy: req.user._id,
    });

    const populated = await news.populate("createdBy", "name email");
    res.status(201).json(populated);
  } catch (err) {
    console.error("createNews error:", err);
    res.status(500).json({ message: "Lỗi tạo tin tức." });
  }
};

// UPDATE tin tức
exports.updateNews = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, content, images, status } = req.body;

    const news = await News.findById(id);
    if (!news) {
      return res.status(404).json({ message: "Không tìm thấy tin." });
    }

    if (title !== undefined) news.title = title;
    if (description !== undefined) news.description = description;
    if (content !== undefined) news.content = content;

    if (Array.isArray(images)) {
      news.images = images;
      news.thumbnail = images[0] || news.thumbnail || "";
    }

    if (status !== undefined) news.status = status;

    await news.save();
    const populated = await news.populate("createdBy", "name email");

    res.json(populated);
  } catch (err) {
    console.error("updateNews error:", err);
    res.status(500).json({ message: "Cập nhật thất bại." });
  }
};

// DELETE
exports.deleteNews = async (req, res) => {
  try {
    const deleted = await News.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Không tìm thấy tin tức." });
    }
    res.json({ message: "Đã xoá." });
  } catch (err) {
    console.error("deleteNews error:", err);
    res.status(500).json({ message: "Lỗi xoá tin tức." });
  }
};
