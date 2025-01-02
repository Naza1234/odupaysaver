const User = require("../models/User");
require("dotenv").config();
const twilio = require("twilio");
const bcrypt = require("bcrypt");
const LoginCheck = require("../models/LoginCheck");
const axios = require("axios"); // Replace fetch with axios

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(accountSid, authToken);

// Function to send a verification code
exports.sendVerificationCode = async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "Oops! It looks like you forgot to provide a phone number. Please double-check and try again—we can’t send a code without it!",
        hint: "Ensure your phone number is in the format +1234567890.",
      });
    }

    // Generate a 6-digit random verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000);

    // Send SMS using Twilio
    await client.messages.create({
      body: `Your verification code is: ${verificationCode}`,
      from: twilioPhoneNumber,
      to: phoneNumber,
    });

    res.status(200).json({
      success: true,
      message: `Hello! Your verification code has been sent to ${phoneNumber}. Please check your SMS inbox and enter the code to proceed.`,
      data: { phoneNumber, code: verificationCode },
    });
  } catch (error) {
    console.error("Error sending verification code:", error.message);
    res.status(500).json({
      message: "Failed to send verification code.",
      error: error.message,
    });
  }
};

// User Sign-Up Controller
exports.userSignUp = async (req, res) => {
  try {
    const { phoneNumber, email, nin } = req.body;

    if (!phoneNumber || !email || !nin) {
      return res.status(400).json({
        success: false,
        message: "All fields (phoneNumber, email, nin) are required.",
      });
    }

    const existingUser = await User.findOne({ PhoneNumber: phoneNumber });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Whoops! This phone number is already on our system. If it’s yours, try logging in instead of signing up. Need help? Contact support!",
      });
    }

    const requestBody = { phoneNumber, email, nin };

    // Call the Wema Bank API using axios
    const response = await axios.post(
      "https://apiplayground.alat.ng/wallet-creation/api/CustomerAccount/GenerateWalletAccountForPartnerships/Request",
      requestBody,
      {
        headers: {
          "x-api-key": process.env.WEMA_API_KEY,
          "Ocp-Apim-Subscription-Key": process.env.WEMA_SUBSCRIPTION_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.status === 200) {
      return res.status(200).json({
        success: true,
        message: "Move on to the next step",
        Response: response.data,
      });
    } else {
      return res.status(response.status).json({
        success: false,
        message: "Failed to create wallet.",
        Response: response.data,
      });
    }
  } catch (error) {
    console.error("Error during user sign-up:", error.message);
    return res.status(500).json({
      success: false,
      message: "An error occurred while registering the user. Please try again later.",
      error: error.message,
    });
  }
};

// Generate Wallet Account Controller
exports.generateWalletAccount = async (req, res) => {
  try {
    const { phoneNumber, otp, trackingId } = req.body;

    if (!phoneNumber || !otp || !trackingId) {
      return res.status(400).json({
        success: false,
        message: "All fields (phoneNumber, otp, trackingId) are required.",
      });
    }

    const payload = { phoneNumber, otp, trackingId };

    // Call the API using axios
    const response = await axios.post(
      "https://apiplayground.alat.ng/wallet-creation/api/CustomerAccount/GenerateWalletAccountForPartnershipsV2/Otp",
      payload,
      {
        headers: {
          "x-api-key": process.env.WEMA_API_KEY,
          "Ocp-Apim-Subscription-Key": process.env.WEMA_SUBSCRIPTION_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.status === 200) {
      return res.status(200).json({
        success: true,
        message: "Wallet account generated successfully.",
        Response: response.data,
      });
    } else {
      return res.status(response.status).json({
        success: false,
        message: "Failed to generate wallet account.",
        Response: response.data,
      });
    }
  } catch (error) {
    console.error("Error generating wallet account:", error.message);
    return res.status(500).json({
      success: false,
      message: "An error occurred while generating the wallet account. Please try again later.",
      error: error.message,
    });
  }
};

// User Account Details Retrieval Controller
exports.getAccountDetailsAndSignUp = async (req, res) => {
  try {
    const { phoneNumber, password, pin } = req.body;

    if (!phoneNumber || !password || !pin) {
      return res.status(400).json({
        success: false,
        message: "All fields (phoneNumber, password, pin) are required.",
      });
    }

    // Make the GET request using axios
    const response = await axios.get(
      `https://apiplayground.alat.ng/wallet-creation/api/CustomerAccount/GetPartnershipAccountDetails`,
      {
        params: { phoneNumber },
        headers: {
          "x-api-key": process.env.WEMA_API_KEY,
          "Ocp-Apim-Subscription-Key": process.env.WEMA_SUBSCRIPTION_KEY,
        },
      }
    );

    if (!response.data || !response.data.status) {
      return res.status(response.status).json({
        success: false,
        message: response.data,
      });
    }

    const { accountNumber, firstName, lastName, email } = response.data.data;

    const existingUser = await User.findOne({ PhoneNumber: phoneNumber });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Whoops! This phone number is already on our system. If it’s yours, try logging in instead of signing up. Need help? Contact support!",
      });
    }

    const newUser = new User({
      FullName: `${firstName} ${lastName}`,
      PhoneNumber: phoneNumber,
      Password: password,
      Pin: pin,
      Email: email,
      AccountNumber: accountNumber,
    });

    await newUser.save();

    const loginCheck = new LoginCheck({ userId: newUser._id });
    await loginCheck.save();

    return res.status(201).json({
      success: true,
      message: "User registered successfully!",
      loginData: {
        loginTime: loginCheck.loginTime,
        autoLogoutTime: loginCheck.autoLogoutTime,
        accessId: loginCheck.accessId,
      },
    });
  } catch (error) {
    console.error("Error during user sign-up:", error.message);
    return res.status(500).json({
      success: false,
      message: "An error occurred while processing your request. Please try again later.",
      error: error.message,
    });
  }
};



// // User Sign-Up Controller
// exports.userSignUp = async (req, res) => {
//   try {
//     const { fullName, phoneNumber, password, pin} = req.body;

//     // Check if all required fields are provided
//     if (!fullName || !phoneNumber || !password || !pin) {
//       return res.status(400).json({
//         success: false,
//         message: "All fields (fullName, phoneNumber, password, pin) are required.",
//       });
//     }

//     // Check if the phone number already exists
//     const existingUser = await User.findOne({ PhoneNumber: phoneNumber });
//     if (existingUser) {
//         return res.status(400).json({
//             success: false,
//             message: "Whoops! This phone number is already on our system. If it’s yours, try logging in instead of signing up. Need help? Contact support!",
//           });
          
//     }

   
//     // Generate a unique account number (e.g., random 10-digit number)
//     const accountNumber = Math.floor(1000000000 + Math.random() * 9000000000);

//     // Create a new user object
//     const newUser = new User({
//       FullName: fullName,
//       PhoneNumber: phoneNumber,
//       Password:  password,
//       Pin: pin,
//       AccountNumber: accountNumber,
//     });

//     // Save the user to the database
//     await newUser.save();

//     const loginCheck = new LoginCheck({
//         userId: newUser._id, // Link LoginCheck to the newly created user
//       });
  
//       await loginCheck.save(); // Save the login check document
  
     
//       return res.status(201).json({
//         success: true,
//         message: "User registered successfully!",
//         loginData: {
//           loginTime: loginCheck.loginTime,
//           autoLogoutTime: loginCheck.autoLogoutTime,
//           accessId: loginCheck.accessId,
//         },
//       });
//   } catch (error) {
//     console.error("Error during user sign-up:", error.message);
//     return res.status(500).json({
//       success: false,
//       message: "An error occurred while registering the user. Please try again later.",
//       error: error.message,
//     });
//   }
// };



// User login controller
exports.loginUser = async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;

    // Step 1: Check if the user exists with the given phone number
    const existingUser = await User.findOne({ PhoneNumber : phoneNumber });
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "No user found with this phone number.",
      });
    }

    // Step 2: Compare the input password with the hashed password
    const isMatch = await bcrypt.compare(password, existingUser.Password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Incorrect password. Please try again.",
      });
    }

    // Step 3: Create or update the LoginCheck document for the user
    let loginCheck = await LoginCheck.findOne({ userId: existingUser._id });
    
    if (!loginCheck) {
      // If no LoginCheck document exists, create a new one
      loginCheck = new LoginCheck({
        userId: existingUser._id,
      });
    } else {
      // If a LoginCheck document already exists, update it with new data
      loginCheck.loginTime = new Date(); // Update login time to current time
      loginCheck.autoLogoutTime = new Date(loginCheck.loginTime); // Set auto logout time 1 week after login
      loginCheck.autoLogoutTime.setDate(loginCheck.loginTime.getDate() + 7);
      loginCheck.accessId = `OduPay${Math.random().toString(36).substring(2, 8).toUpperCase()}${Math.floor(1000000 + Math.random() * 9000000)}`;
    }

    await loginCheck.save(); // Save or update the LoginCheck document

    // Step 4: Respond with LoginCheck data (excluding userId)
    return res.status(200).json({
      success: true,
      message: "Login successful!",
      loginCheck: {
        loginTime: loginCheck.loginTime,
        autoLogoutTime: loginCheck.autoLogoutTime,
        accessId: loginCheck.accessId,
      },
    });

  } catch (error) {
    console.error("Error during user login:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error. Please try again later.",
    });
  }
};



// Controller to send non-restricted user data
exports.sendUserData = async (req, res) => {
  try {
    const { userId } = req; // Get the userId from the request object (set by the middleware)

    // Find the user by their userId and select only the non-restricted fields
    const user = await User.findById(userId)
      .select("PhoneNumber FullName ProfileImage AccountBalance AccountNumber");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    //Send the user data in the response
    return res.status(200).json({
      success: true,
      message: "User data retrieved successfully.",
      data: {
        phoneNumber: user.PhoneNumber,
        fullName: user.FullName,
        profileImage: user.ProfileImage,
        accountBalance: user.AccountBalance,
        accountNumber: user.AccountNumber,
      },
    });
  } catch (error) {
    console.error("Error retrieving user data:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error. Please try again later.",
    });
  }
};




// Update user data controller
exports.updateUserData = async (req, res) => {
  try {
    
    const { fullName, phoneNumber, profileImage, accountBalance, accountNumber, pin } = req.body;
    const { userId } = req;

    //Find the user by userId
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Validate and update the fields
    if (fullName) user.FullName = fullName;
    if (phoneNumber) user.PhoneNumber = phoneNumber;
    if (profileImage) user.ProfileImage = profileImage;
    if (accountBalance) user.AccountBalance = accountBalance;
    if (accountNumber) user.AccountNumber = accountNumber;
    if (pin) user.Pin = pin;

    // Save the updated user data
    await user.save();

    // Respond with the updated user data (excluding sensitive info like password)
    return res.status(200).json({
      success: true,
      message: "User data updated successfully!",
      data: {
        fullName: user.FullName,
        phoneNumber: user.PhoneNumber,
        accountNumber: user.AccountNumber,
        profileImage: user.ProfileImage,
        accountBalance: user.AccountBalance,
      },
    });
  } catch (error) {
    console.error("Error updating user data:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error. Please try again later.",
    });
  }
};



// Controller to change user password
exports.changeUserPassword = async (req, res) => {
  try {
    const { phoneNumber, password } = req.body; // Get data from the request body

    // Find the user by phone number
    const user = await User.findOne({ PhoneNumber: phoneNumber });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found with this phone number.",
      });
    }

 
   
    // Update the password in the database
    user.Password = password;

    await user.save();

    //Send success response
    return res.status(200).json({
      success: true,
      message: "Password updated successfully.",
    });
  } catch (error) {
    console.error("Error changing user password:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error. Please try again later.",
    });
  }
};


