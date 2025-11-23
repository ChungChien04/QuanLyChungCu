const Apartment = require("../models/apartmentModel");

// ==============================
// 1) GET LIST + PAGINATION
// ==============================
// ==============================
// 1) GET LIST (KHÔNG GIỚI HẠN SỐ LƯỢNG)
// ==============================
exports.getApartments = async (req, res) => {
  try {
    const apartments = await Apartment.find().sort({ createdAt: -1 });

    res.json({
      apartments,
      total: apartments.length
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server khi lấy danh sách." });
  }
};

// ==============================
// 2) SEARCH
// ==============================
exports.searchApartments = async (req, res) => {
  try {
    const {
      minPrice,
      maxPrice,
      minArea,
      maxArea,
      rooms,
      status,
      q
    } = req.query;

    let filter = {};

    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } }
      ];
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    if (minArea || maxArea) {
      filter.area = {};
      if (minArea) filter.area.$gte = Number(minArea);
      if (maxArea) filter.area.$lte = Number(maxArea);
    }

    if (rooms) filter.bedrooms = Number(rooms);

    if (status) filter.status = status;

    const apartments = await Apartment.find(filter).sort({ createdAt: -1 });
    res.json(apartments);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server khi tìm kiếm." });
  }
};

// ==============================
// 3) GET BY ID
// ==============================
exports.getApartmentById = async (req, res) => {
  try {
    const apartment = await Apartment.findById(req.params.id);
    if (!apartment)
      return res.status(404).json({ message: "Không tìm thấy căn hộ." });

    res.json(apartment);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server." });
  }
};

// ==============================
// 4) CREATE
// ==============================
exports.createApartment = async (req, res) => {
  try {
    let {
      title,
      area,
      price,
      bedrooms,
      bathrooms,
      address,
      floor,
      description,
      status,
      featured 
    } = req.body;

    let utilities = req.body["utilities[]"] || [];
    if (!Array.isArray(utilities)) utilities = [utilities];

    const imagePaths = req.files ? req.files.map((f) => f.path) : [];

    const apartment = await Apartment.create({
      title,
      area,
      price,
      bedrooms,
      bathrooms,
      description,
      status,
      featured,
      utilities,
      location: {
        address: address || "",
        floor: floor || null,
      },
      images: imagePaths,
    });

    res.status(201).json(apartment);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi tạo căn hộ." });
  }
};
// ==============================
// 5) UPDATE (FIX IMAGE DELETE + REPLACE)
// ==============================
const fs = require("fs");
const path = require("path");

exports.updateApartment = async (req, res) => {
  try {
    const id = req.params.id;

    const apt = await Apartment.findById(id);
    if (!apt) return res.status(404).json({ message: "Không tìm thấy căn hộ." });

    // =============================
    // 1️⃣ OLD IMAGES TỪ FE GỬI LÊN
    // =============================
    let oldImages = [];
    if (req.body.oldImages) {
      try {
        oldImages = JSON.parse(req.body.oldImages); 
      } catch {
        oldImages = [];
      }
    }

    const originalImages = apt.images || [];

    // =============================
    // 2️⃣ ẢNH MỚI UPLOAD
    // =============================
    let newImages = [];
    if (req.files && req.files.length > 0) {
      newImages = req.files.map((f) => f.path.replace(/\\/g, "/"));
    }

    // =============================
    // 3️⃣ DANH SÁCH ẢNH CUỐI CÙNG
    // =============================
    const finalImages = [...oldImages, ...newImages];

    // =============================
    // 4️⃣ XOÁ FILE ẢNH BỊ XÓA
    // =============================
    const removedImages = originalImages.filter((img) => !oldImages.includes(img));

    removedImages.forEach((img) => {
      const filePath = path.join(__dirname, "..", img);
      if (fs.existsSync(filePath)) {
        fs.unlink(filePath, () => {});
      }
    });

    // =============================
    // 5️⃣ UPDATE FIELD KHÁC
    // =============================
    const {
      title, area, price, bedrooms, bathrooms,
      address, floor, description, status, featured
    } = req.body;

    if (title !== undefined) apt.title = title;
    if (area !== undefined) apt.area = area;
    if (price !== undefined) apt.price = price;
    if (bedrooms !== undefined) apt.bedrooms = bedrooms;
    if (bathrooms !== undefined) apt.bathrooms = bathrooms;
    if (description !== undefined) apt.description = description;
    if (status !== undefined) apt.status = status;
    if (featured !== undefined)
      apt.featured = featured === "true" || featured === true;

    if (!apt.location) apt.location = {};
    if (address !== undefined) apt.location.address = address;
    if (floor !== undefined) apt.location.floor = floor;

    // Utilities
    if (req.body.utilities) {
      let list = [];
      try {
        list = JSON.parse(req.body.utilities);
      } catch {
        list = [req.body.utilities];
      }
      apt.utilities = list;
    }

    // set ảnh cuối cùng
    apt.images = finalImages;

    const updated = await apt.save();
    res.json(updated);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi cập nhật căn hộ." });
  }
};


// ==============================
// 6) FEATURED
// ==============================
exports.getFeaturedApartments = async (req, res) => {
  try {
    // bỏ limit(6)
    const apartments = await Apartment.find({ featured: true });
    res.json({ apartments });
  } catch (err) {
    res.status(500).json({ message: "Không thể tải căn hộ nổi bật." });
  }
};


// ==============================
// 7) DELETE
// ==============================
exports.deleteApartment = async (req, res) => {
  try {
    const apt = await Apartment.findById(req.params.id);
    if (!apt)
      return res.status(404).json({ message: "Không tìm thấy căn hộ." });

    await apt.deleteOne();
    res.json({ message: "Đã xoá căn hộ." });
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi xoá căn hộ." });
  }
};
