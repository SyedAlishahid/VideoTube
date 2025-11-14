const express = require("express");
const router = express.Router();
const { SignUp } = require("../controller/user.controller.js");

const upload = require("../middlewares/multer.js");

router.post(
  "/add",
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverimage", maxCount: 1 },
  ]),
  SignUp
);

module.exports =  router ;
