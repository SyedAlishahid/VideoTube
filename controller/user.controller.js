const mongoose = require("mongoose");
const { UserSchema } = require("../model/user.model.js");
const { VideoUploader } = require("../cloudinary/cloudinary.js");

const DataInserter = async (req, res) => {
  try {
    //First of all we fetch fro model
    const { username, email, fullname, password } = req.body;

    if (!username || !email || !fullname || !password) {
      res.status(400).json({
        success: false,
        message: "All fields required",
      });
    }

    // check if user already exist
    const existedUser = await UserSchema.findOne({ email });

    if (existedUser) {
      res.status(400).json({
        success: false,
        message: "User already Exist!",
      });
    }

    // locally Saved in PC
    const avatarpath = req.files?.avatar?.[0]?.path;
    const coverImagepath = req.files?.coverimage?.[0]?.path;

    if (!avatarpath) {
      res.status(500).json({
        success: false,
        message: "Avator is nesccesory!",
      });
    }

    //Uploading on Cloudinary
    const CoverImg = coverImagepath ? await VideoUploader(coverImagepath): null
    const Avatar = await VideoUploader(avatarpath);
    //Saving in DB
    const user = await UserSchema.create({
      username,
      fullname,
      password,
      email,
      coverimage: CoverImg?.url || '',
      avatar: Avatar.url,
    });

    //Hiding pass/Refresh-token
    const hideDetails = await UserSchema.findById(user._id).select(
      "-password -refreshtoken"
    );

    //returning 201 = good request
    return res.status(201).json({
      success: true,
      Payload: hideDetails,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = { DataInserter };
