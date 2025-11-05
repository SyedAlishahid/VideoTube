const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

const User = new mongoose.Schema({
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
        required: false
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
  });




  const UserSchema = mongoose.model("UserModel" , User);
  module.exports = {UserSchema};