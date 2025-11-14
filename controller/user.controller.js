const mongoose = require("mongoose");
const { UserSchema } = require("../model/user.model.js");
const { VideoUploader } = require("../cloudinary/cloudinary.js");

//Access and refresh Token Generate
const GenerateRefreshandAccessTokens = async (userId) => {
  try {
    const user = await UserSchema.findById({ userId });
    const accessToken = generateToken();
    const refreshToken = generateRefreshToken();

    // its saving value of user.refreshtoken after finding though id!
    user.refreshToken = refreshToken;
    //e.g it is use like if we save this token it say add password also or
    // other required field in model but it say dont validate it our choice what we want to save
    const UserTokenUpdated = await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const SignUp = async (req, res) => {
  try {
    //First of all we fetch fro model
    const { username, email, fullname, password } = req.body;

    if (!username || !email || !fullname || !password) {
      res.status(400).json({
        success: false,
        message: "All fields required",
      });
    }

    if (password.length < 6 || password.length > 8) {
      return res.status(402).json({
        success: false,
        message: "Password must be at least 8 characters long",
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
    const CoverImg = coverImagepath
      ? await VideoUploader(coverImagepath)
      : null;
    const Avatar = await VideoUploader(avatarpath);
    //Saving in DB
    const user = await UserSchema.create({
      username,
      fullname,
      password,
      email,
      coverimage: CoverImg?.url || "",
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

const login = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email) {
      res.status(400).json({
        success: false,
        message: "UserName or Email required!",
      });
    }

    // This is mongo-DB Feature to find thoungh multiple fields. e.g: email, password
    const FindUser = await UserSchema.findOne({
      $or: [{ email }, { username }],
    });

    if (!FindUser) {
      res.status(400).json({
        success: false,
        message: "User Not found!",
      });
    }

    //Check password
    const passChecker = UserSchema.comparePassword(password);

    if (!passChecker) {
      res.status(400).json({
        success: false,
        message: "Wrong Password!",
      });
    }

    const hideCredientials = UserSchema.findById(FindUser._id).select(
      "-password -refreshToken"
    )

    const { accessToken, refreshToken } = GenerateRefreshandAccessTokens(
      FindUser._id
    );

    return res
      .status(200)
      .cookie(refreshToken, "refreshToken")
      .cookie(accessToken, "accessToken")
      .json({
        success: true,
        message: "You are successfully LoggedIn",
        payload: refreshToken, accessToken, hideCredientials
      });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = { SignUp, login };
