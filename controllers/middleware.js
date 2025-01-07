const LoginCheck = require("../models/LoginCheck"); // Import the LoginCheck model
const axios = require("axios");
const Transaction = require("../models/Transaction"); // Assuming your transaction model is in the models folder
const User = require("../models/User"); // Assuming your user model is in the models folder
require("dotenv").config();

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




exports.syncTransactions = async (req) => {
  try {
    // Retrieve user ID from the request or derive it from the login session
    const { userId } = req;
    if (!userId) {
      console.warn("User ID not found in request. Deriving from session...");
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

      userId = loginSession.userId;
    }

    // Fetch the user's account number from the User model
    const user = await User.findById(userId);
    if (!user) {
      console.warn("User not found. Aborting transaction sync.");
      return;
    }

    const accountNumber = user.accountNumber; // Assume accountNumber exists in User schema
    if (!accountNumber) {
      console.warn("Account number not found for the user. Aborting transaction sync.");
      return;
    }

    // Define hardcoded parameters for now
    const payload = {
      accountNumber,
      from: "2023-01-01", // Replace with actual range if needed
      to: "2023-12-31", // Replace with actual range if needed
      keyWord: "", // Replace with actual keyword if needed
    };

    // Make the API call to fetch transaction history
    const response = await axios.post(
      "https://apiplayground.alat.ng/ws-acct-mgt/api/AccountMaintenance/CustomerAccount/transhistoryV2",
      payload,
      {
        headers: {
          "x-api-key": process.env.WEMA_API_KEY,
          "Ocp-Apim-Subscription-Key": process.env.WEMA_SUBSCRIPTION_KEY,
          
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        
        },
      }
    );

    const { result, successful } = response.data;

    // Check if the API call was successful and process the results
    if (successful && Array.isArray(result)) {
      result.forEach(async (transaction) => {
        try {
          // Check if the transaction already exists in the database
          const exists = await Transaction.findOne({ referenceId: transaction.referenceId });

          if (!exists) {
            // Save the new transaction to the database
            await Transaction.create({
              title: transaction.title,
              amount: transaction.amount,
              type: transaction.type,
              date: transaction.date,
              transactionDate: transaction.transactionDate,
              narration: transaction.narration,
              status: transaction.status,
              creditType: transaction.creditType,
              sender: transaction.sender,
              senderAccountNumber: transaction.senderAccountNumber,
              destinationBank: transaction.destinationBank,
              destinationAccountNumber: transaction.destinationAccountNumber,
              recieverName: transaction.recieverName,
              referenceId: transaction.referenceId,
              isViewReceiptEnabled: transaction.isViewReceiptEnabled,
              tranId: transaction.tranId,
              userId, // Link the transaction to the user
            });

            console.log(`Transaction ${transaction.referenceId} saved successfully.`);
          } else {
            console.log(`Transaction ${transaction.referenceId} already exists. Skipping.`);
          }
        } catch (err) {
          console.error(`Error processing transaction ${transaction.referenceId}:`, err.message);
        }
      });
    } else {
      console.error("Failed to fetch transaction history:", response.data.message || "Unknown error");
    }
  } catch (err) {
    console.error("Error in syncTransactions:", err.message);
  }
};
