const express = require("express");
const router = express.Router();
const { SignUp, login, logout } = require("../controller/user.controller.js");
const {VerifyJWT} = require('../middlewares/auth.middleware.js')

const upload = require("../middlewares/multer.js");

router.post(
  "/add",
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverimage", maxCount: 1 },
  ]),
  SignUp
);


router.post("/login", login)
router.post('/logout', VerifyJWT , logout)

module.exports =  router ;
