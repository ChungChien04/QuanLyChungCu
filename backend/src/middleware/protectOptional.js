const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

exports.protectOptional = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id).select("-password");
    } catch (err) {
      req.user = null;
    }
  } else {
    req.user = null;
  }

  next();
};
