const News = require("../models/newsModel");

exports.getAllNews = async (req, res) => {
  try {
    const items = await News.find({ status: true })
      .sort({ createdAt: -1 })
      .populate("createdBy", "name email");

    const fixed = items.map((n) => ({
      ...n._doc,
      thumbnail: n.thumbnail 
        ? `http://localhost:5000${n.thumbnail.toLowerCase()}`
        : "",
      images: n.images?.map((i) =>
        `http://localhost:5000${i.toLowerCase()}`
      ) || []
    }));

    res.json(fixed);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server khi lấy tin tức." });
  }
};




exports.getNewsById = async (req, res) => {
  try {
    const item = await News.findOne({
      _id: req.params.id,
      status: true
    }).populate("createdBy", "name email");

    if (!item)
      return res.status(404).json({ message: "Tin không tồn tại hoặc đã bị tắt." });

    const normalize = (p) => {
      if (!p) return "";
      return p.trim().toLowerCase();
    };

    const fixedItem = {
      ...item._doc,
      thumbnail: normalize(item.thumbnail),
      images: item.images?.map((i) => normalize(i)) || []
    };

    res.json(fixedItem);
  } catch {
    res.status(500).json({ message: "Lỗi server khi lấy tin." });
  }
};

exports.createNews = async (req, res) => {
  try {
    const { title, content, description, status, images = [] } = req.body;

    if (!title || !content)
      return res.status(400).json({ message: "Thiếu tiêu đề hoặc nội dung" });

    const news = await News.create({
      title,
      content,
      description,
      images,                         // ✅ lưu mảng ảnh
      thumbnail: images?.[0] || "",   // ✅ đồng bộ thumbnail từ ảnh đầu
      status: status ?? true,
      createdBy: req.user._id,
    });

    res.status(201).json(news);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi tạo tin tức." });
  }
};


exports.updateNews = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, content, images = [], status } = req.body;

    const news = await News.findById(id);
    if (!news) return res.status(404).json({ message: "Không tìm thấy tin" });

    news.title = title ?? news.title;
    news.description = description ?? news.description;
    news.content = content ?? news.content;
    news.images = images;
    news.thumbnail = images?.[0] || "";  // đồng bộ thumbnail
    news.status = status ?? news.status;

    await news.save();
    res.json(news);
  } catch (err) {
    res.status(500).json({ message: "Cập nhật thất bại" });
  }
};


exports.deleteNews = async (req, res) => {
  try {
    const deleted = await News.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res.status(404).json({ message: "Không tìm thấy tin tức." });
    res.json({ message: "Đã xoá" });
  } catch {
    res.status(500).json({ message: "Lỗi xoá tin tức." });
  }
};
