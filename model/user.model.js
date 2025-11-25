const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

const User = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      trim: true,
    },
    fullname: {
      type: String,
      required: false,
      lowercase: true,
      trim: true,
      unique: true,
    },
    avatar: {
      type: String,
      required: true,
    },
    coverimage: {
      type: String,
      required: false,
    },
    videohistory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video",
    },
    refreshtoken: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

User.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});


User.methods.comparePassword = async function (oldPassword) {
  return await bcrypt.compare(oldPassword, this.password);
};

User.methods.generateToken = function () {
  return jwt.sign(
    {
      id: this._id,
      username: this.username,
      email: this.email,
      fullname: this.fullname,
    },
    process.env.SECRET_ACCESS_KEY,
    {
      expiresIn: process.env.ACCESS_KEY_EXPIRE,
    }
  );
};

User.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      id: this._id,
    },
    process.env.REFRESH_TOKEN_KEY,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRE,
    }
  );
};

const UserSchema = mongoose.model("UserModel", User);
module.exports = { UserSchema };
