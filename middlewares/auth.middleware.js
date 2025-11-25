const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const { UserSchema } = require("../model/user.model.js");

const VerifyJWT = async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer", "");
    if (!token) {
     return res.status(402).json({
        success: false,
        message: "Token not found",
      });
    }

    const Verifyuser = jwt.verify(token, process.env.SECRET_ACCESS_KEY);
    const User = UserSchema.findOne(Verifyuser?._id).select(
      "-password -refreshtoken"
    )

    if(!User){
       return res.status(402).json({
        success: false,
        message: "User not found",
      });
    }

    req.user = User;
    next();
  } catch (error){
       return res.status(500).json({
        success: false,
        message: "Interval Server Error",
      });
    }

};

module.exports = { VerifyJWT };
