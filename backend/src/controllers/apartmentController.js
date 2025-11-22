const Apartment = require("../models/apartmentModel");

// ==============================
// 1) GET LIST + PAGINATION
// ==============================
exports.getApartments = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 6;
    const skip = (page - 1) * limit;

    const apartments = await Apartment.find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Apartment.countDocuments();

    res.json({
      apartments,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server khi lấy danh sách." });
  }
};

// ==============================
// 2) SEARCH (FULL FILTER SUPPORT)
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

    // TEXT SEARCH
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } }
      ];
    }

    // PRICE RANGE
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // AREA RANGE
    if (minArea || maxArea) {
      filter.area = {};
      if (minArea) filter.area.$gte = Number(minArea);
      if (maxArea) filter.area.$lte = Number(maxArea);
    }

    // BEDROOMS
    if (rooms) {
      filter.bedrooms = Number(rooms);
    }

    // STATUS
    if (status) {
      filter.status = status;
    }

    // QUERY DB
    const apartments = await Apartment.find(filter).sort({ createdAt: -1 });

    res.json(apartments);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server khi tìm kiếm." });
  }
};

// ==============================
// 3) GET 1 APARTMENT
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
// 4) CREATE (FIXED)
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
    } = req.body;

    // Utilities dưới dạng array (FormData gửi utilities[])
    let utilities = req.body["utilities[]"];
    if (!utilities) utilities = [];
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
// 5) UPDATE (FIXED)
// ==============================
exports.updateApartment = async (req, res) => {
  try {
    const apt = await Apartment.findById(req.params.id);
    if (!apt)
      return res.status(404).json({ message: "Không tìm thấy căn hộ." });

    const {
      title,
      area,
      price,
      bedrooms,
      bathrooms,
      address,
      floor,
      description,
      status,
    } = req.body;

    // =======================
    // UPDATE BASICS
    // =======================
    if (title !== undefined) apt.title = title;
    if (area !== undefined) apt.area = area;
    if (price !== undefined) apt.price = price;
    if (bedrooms !== undefined) apt.bedrooms = bedrooms;
    if (bathrooms !== undefined) apt.bathrooms = bathrooms;
    if (description !== undefined) apt.description = description;
    if (status !== undefined) apt.status = status;

    // =======================
    // UPDATE LOCATION
    // =======================
    if (!apt.location) apt.location = {};

    if (address !== undefined && address.trim() !== "") {
      apt.location.address = address;
    }

    if (floor !== undefined && floor !== "")
      apt.location.floor = floor;

    // =======================
    // UTILITIES (array)
    // =======================
// UTILITIES FIX
let utilitiesList = [];

if (req.body.utilities) {
    if (Array.isArray(req.body.utilities)) {
        // Trường hợp nhiều tiện ích được gửi lên từ FormData
        utilitiesList = req.body.utilities.map(u => u.trim());
    } else {
        try {
            // Trường hợp frontend gửi dạng JSON string
            utilitiesList = JSON.parse(req.body.utilities);
        } catch {
            // Trường hợp chỉ 1 tiện ích (string)
            utilitiesList = [req.body.utilities.trim()];
        }
    }

    apt.utilities = utilitiesList;
}

    // =======================
    // ADD NEW IMAGES
    // =======================
    const newImages = req.files ? req.files.map((f) => f.path) : [];
    if (newImages.length > 0) {
      apt.images = [...apt.images, ...newImages];
    }

    const updated = await apt.save();
    res.json(updated);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi cập nhật căn hộ." });
  }
};

// ==============================
// 6) DELETE
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
