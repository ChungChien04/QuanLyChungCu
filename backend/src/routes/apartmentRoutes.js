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
  deleteApartment
} = apartmentController;

// =============================
// PUBLIC ROUTES
// =============================
router.get("/", getApartments);                  // hỗ trợ style mới
router.get("/search", searchApartments);
router.get("/:id", getApartmentById);

// =============================
// ADMIN ROUTES
// =============================
router.post(
  "/",
  protect,
  admin,
  upload.array("images", 10),     // gộp, cho phép tối đa
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
