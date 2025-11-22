const express = require("express");
const router = express.Router();
const upload = require("../middleware/uploadApartmentImage");

const {
  searchApartments,
  getApartments,
  getApartmentById,
  createApartment,
  updateApartment,
  deleteApartment
} = require("../controllers/apartmentController");

const { protect, admin } = require("../middleware/authMiddleware");

// =============================
// PUBLIC ROUTES
// =============================
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
  upload.array("images", 5),
  createApartment
);

router.put(
  "/:id",
  protect,
  admin,
  upload.array("images", 5),
  updateApartment
);

router.delete(
  "/:id",
  protect,
  admin,
  deleteApartment
);

module.exports = router;
