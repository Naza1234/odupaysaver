const express = require("express");
const controls = require("../controllers/User");
const middleware =require("../controllers/middleware")
const router = express.Router();

// Route to send a verification code
router.post("/send-verification-code",controls.sendVerificationCode);
router.post("/signup",controls.userSignUp);
router.post("/verify-user-credential",controls.generateWalletAccount);
router.post("/create-account",controls.getAccountDetailsAndSignUp);
router.post("/login",controls.loginUser);
router.get("/get-user-by-accessId/:accessId",middleware.checkLoginSession,controls.sendUserData);
router.put("/update-userData/:accessId",middleware.checkLoginSession,controls.updateUserData);
router.put("/change-password",controls.changeUserPassword);

module.exports = router;
