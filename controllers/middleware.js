const LoginCheck = require("../models/LoginCheck"); // Import the LoginCheck model

// Middleware to check if the session is still active
exports.checkLoginSession = async (req, res, next) => {
  try {
    // Step 1: Extract the accessId from the request parameters
    const { accessId } = req.params;

    // Step 2: Find the LoginCheck document by accessId
    const loginSession = await LoginCheck.findOne({ accessId });

    if (!loginSession) {
      // Step 3: If no session found, return an error
      return res.status(401).json({
        success: false,
        message: "Session not found. Please log in again.",
      });
    }

    // Step 4: Check if the session is expired by comparing the current time with autoLogoutTime
    const currentTime = new Date();
    if (currentTime > loginSession.autoLogoutTime) {
      // Session expired
      return res.status(401).json({
        success: false,
        message: "Session expired. Please log in again.",
      });
    }

    // Step 5: If the session is valid, attach the userId to the request object and proceed
    req.userId = loginSession.userId; // Attach userId to the request object
    next(); // Call the next middleware or function (sendVerificationCode)
  } catch (error) {
    console.error("Error checking login session:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error. Please try again later.",
    });
  }
};


