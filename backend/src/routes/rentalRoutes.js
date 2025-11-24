const express = require("express");
const router = express.Router();
const rentalController = require("../controllers/rentalController");
const { protect, admin } = require("../middleware/authMiddleware");

// USER ROUTES
router.post("/", protect, rentalController.createRental);
router.get("/my-rentals", protect, rentalController.getMyRentals);
router.put("/:id/sign", protect, rentalController.signContract);
router.put("/:id/cancel", protect, rentalController.cancelRental);

// ADMIN ROUTES
router.get("/pending", protect, admin, rentalController.getPendingRentals);
router.get("/all", protect, admin, rentalController.getAllRentals);
router.put("/:id/approve", protect, admin, rentalController.approveRental);
router.put("/:id/cancel-admin", protect, admin, rentalController.cancelRental);
router.get("/:id", protect, rentalController.getRentalById);


module.exports = router;
