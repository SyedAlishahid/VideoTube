const mongoose = require("mongoose");
const { UserSchema } = require("../model/user.model.js");
const { VideoUploader } = require("../cloudinary/cloudinary.js");
const jwt = require("jsonwebtoken");

//Access and refresh Token Generate
const GenerateRefreshandAccessTokens = async (userId) => {
  try {
    const user = await UserSchema.findById(userId);
    const accessToken = user.generateToken();
    const refreshToken = user.generateRefreshToken();

    // its saving value of user.refreshtoken after finding though id!
    user.refreshToken = refreshToken;
    //e.g it is use like if we save this token it say add password also or
    // other required field in model but it say dont validate it our choice what we want to save
    const UserTokenUpdated = await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    console.log(error);
  }
};

const SignUp = async (req, res) => {
  try {
    //First of all we fetch fro model
    const { username, email, fullname, password } = req.body;

    if (!username || !email || !fullname || !password) {
      return res.status(400).json({
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
      return res.status(400).json({
        success: false,
        message: "User already Exist!",
      });
    }

    // locally Saved in PC
    const avatarpath = req.files?.avatar?.[0]?.path;
    const coverImagepath = req.files?.coverimage?.[0]?.path;

    if (!avatarpath) {
      return res.status(500).json({
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

    if (!username && !email) {
      return res.status(400).json({
        success: false,
        message: "UserName or Email required!",
      });
    }

    // This is mongo-DB Feature to find thoungh multiple fields. e.g: email, password
    const FindUser = await UserSchema.findOne({
      $or: [{ email }, { username }],
    });

    if (!FindUser) {
      return res.status(400).json({
        success: false,
        message: "User Not found!",
      });
    }

    //Check password
    const passChecker = await FindUser.comparePassword(password);

    if (!passChecker) {
      return res.status(400).json({
        success: false,
        message: "Wrong Password!",
      });
    }

    //Its hide password and refresh token and return only other things
    const user = await UserSchema.findById(FindUser._id).select(
      "-password -refreshToken"
    );

    const { accessToken, refreshToken } = await GenerateRefreshandAccessTokens(
      FindUser._id
    );

    //it mean cookies only handle from server!
    const opt = {
      httpOnly: true,
      secure: true,
    };
    return res
      .status(200)
      .cookie("refreshToken", refreshToken, opt)
      .cookie("accessToken", accessToken, opt)
      .json({
        success: true,
        message: "You are successfully LoggedIn",
        payload: refreshToken,
        accessToken,
        user,
      });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const logout = async (req, res) => {
  try {
    await UserSchema.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          refreshToken: undefined,
        },
      },
      {
        new: true,
      }
    );

    const opt = {
      httpOnly: true,
      secure: true,
    };

    res
      .status(200)
      .clearCookie("accessToken", opt)
      .clearCookie("refreshToken", opt)
      .json({
        message: "User Successfully Logout!",
        success: true,
      });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const RefreshTokenUpdate = async (req, res) => {
  try {
    //token comes in encrpted form
    const incomingRFtoken = req.body.refreshtoken || req.cookie.refreshtoken;

    if (!incomingRFtoken) {
      res.status(400).json({
        success: false,
        message: "refershToken cant fetch!",
      });
    }

    const DecodedToken = jwt.verify(
      incomingRFtoken,
      process.env.REFRESH_TOKEN_KEY
    );

    const UserInfo = await UserSchema.findById(DecodedToken?._id);

    if (!UserInfo) {
      res.status(400).json({
        success: false,
        message: "Token invalid!",
      });
    }

    if (DecodedToken !== user.refreshtoken) {
      res.status(400).json({
        success: false,
        message: "Token expire or used!",
      });
    }

    const opt = {
      secure: true,
      httpOnly: true,
    };

    const { accessToken, NewrefreshToken } =
      await GenerateRefreshandAccessTokens(UserInfo._id);

    res
      .status(200)
      .cookie("accessToken", accessToken, opt)
      .cookie("refreshToken", NewrefreshToken, opt)
      .json({
        success: true,
        message: "New Refresh token update successfully!",
      });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const passwordChecker = await UserSchema.comparePassword(oldPassword);

    const user = await UserSchema.findById(req.user?._id);

    if (!passwordChecker) {
      return res.status(400).json({
        success: false,
        message: "Enter correct password",
      });
    }

    user.oldPassword = newPassword;

    await UserSchema.save({ validateBeforeSave: false });

    return res.status(200).json({
      success: true,
      message: "Password changed Successfully!",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const UserInfo = async (req, res) => {
  try {
    return res.status(200).json({
      payload: req.user,
      success: true,
      message: "Successfully User Data fetched",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const changeEmailOrPassword = async (req, res) => {
  try {
    const { email, username } = req.body;

    if (!(email || username)) {
      return res.status(400).json({
        success: false,
        message: "Username or email is nessacary!",
      });
    }

    const userData = await UserSchema.findByIdAndUpdate(
      req.user?._id,
      {
        $set: {
          username,
          email,
        },
      },
      { new: true }
    ).select("-password");

    return res.status(200).json({
      success: true,
      message: "User Information Update successfully!",
      payload: userData,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  SignUp,
  login,
  logout,
  RefreshTokenUpdate,
  forgotPassword,
  UserInfo,
  changeEmailOrPassword,
};
