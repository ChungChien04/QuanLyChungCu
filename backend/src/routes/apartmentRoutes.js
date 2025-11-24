const express = require("express");
const router = express.Router();

const apartmentController = require("../controllers/apartmentController");
const upload = require("../middleware/uploadApartmentImage");
const { protect, admin } = require("../middleware/authMiddleware");

// Destructure để hỗ trợ cách dùng mới
const {
  searchApartments,
  getApartments,
  getApartmentById,
  createApartment,
  updateApartment,
  deleteApartment,
  getFeaturedApartments
} = apartmentController;

// =============================
// PUBLIC ROUTES
// =============================

// ⭐ ROUTE FEATURED — phải đặt TRƯỚC /:id để không bị nhầm với id
router.get("/featured", getFeaturedApartments);

router.get("/", getApartments);
router.get("/search", searchApartments);
router.get("/:id", getApartmentById);

// =============================
// ADMIN ROUTES
// =============================
router.post(
  "/",
  protect,
  admin,
  upload.array("images", 10),
  createApartment
);

router.put(
  "/:id",
  protect,
  admin,
  upload.array("images", 10),
  updateApartment
);

router.delete(
  "/:id",
  protect,
  admin,
  deleteApartment
);

module.exports = router;
