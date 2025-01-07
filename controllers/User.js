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



exports.userSignUp = async (req, res) => {
  try {
    // Hardcoded test data
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

    const requestBody = {
                          phoneNumber : phoneNumber,
                          email : email , 
                          nin : nin 
                        };

    // Call the Wema Bank API using axios
    axios
      .post(
        "https://apiplayground.alat.ng/wallet-creation/api/CustomerAccount/GenerateWalletAccountForPartnerships/Request",
        requestBody,
        {
          headers: {
            "x-api-key": process.env.WEMA_API_KEY,
            "Ocp-Apim-Subscription-Key": process.env.WEMA_SUBSCRIPTION_KEY,
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
          },
        }
      )
      .then((response) => {
      
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
      })
      .catch((error) => {
        return res.status(error.response?.status || 500).json({
          success: false,
          message: error.response?.data.message|| "Failed to create wallet.",
          error: error.response?.data || "An unexpected error occurred.",
        });
      });
  } catch (error) {
    // Handle unexpected server-side errors
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
    const { phoneNumber, password, pin ,trackingId} = req.body;

    if (!phoneNumber || !password || !pin || !trackingId) {
      return res.status(400).json({
        success: false,
        message: "All fields (phoneNumber, password, pin , trackingId) are required.",
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
      trackingId : trackingId,
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


// "buildingNumber": "string",
// "apartment": "string",
// "street": "string",
// "city": "string",
// "town": "string",
// "state": "string",
// "lga": "string",
// "lcda": "string",
// "landmark": "string",
// "additionalInformation": "string",
// "country": "string",
// "fullAddress": "string",
// "postalCode": "string"


// Controller function for submitting Tier 1 partner address
exports.submitTier1PartnerAddress = async (req, res) => {
  try {
    // Extract data from the request body
    const { userId } = req;

    const {
      residentialAddress,
      accountNumber,
      nin,
      bvn,
      liveImageOfFace,
    } = req.body;

    // Validate the required fields
    if (!residentialAddress || !accountNumber || !nin || !bvn || !liveImageOfFace) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    // API Endpoint
    const url = "http://apiplayground.alat.ng/account-upgrade/api/CustomerAccount/SubmitTier1PartnerAddress";

    // Headers
    const headers = {
      "x-api-key": process.env.WEMA_API_KEY,
      "Ocp-Apim-Subscription-Key": process.env.WEMA_SUBSCRIPTION_KEY, // Replace with your API key or store it in .env
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
    };

    // Payload
    const payload = {
      residentialAddress,
      accountNumber,
      nin,
      bvn,
      liveImageOfFace,
    };

    // Make the API call
    const response = await axios.post(url, payload, { headers });

    const user = await User.findById(userId);
    user.Addresses.push(residentialAddress);

    // Save the updated user document
    await user.save();
    // Respond with the API response data
    res.status(response.status).json({
      success: true,
      message: "Request successful",
      data: response.data,
    });
  } catch (error) {
    console.error("Error submitting Tier 1 partner address:", error.message);

    // Handle error response
    if (error.response) {
      return res.status(error.response.status).json({
        success: false,
        message: error.response.data || "API request failed.",
      });
    }

    res.status(500).json({
      success: false,
      message: "An internal server error occurred.",
    });
  }
};



exports.submitPartnerAddress = async (req, res) => {
  try {
    // Extract residentialAddress and accountNumber from req.body
    const { userId } = req;
    const { residentialAddress, accountNumber } = req.body;

    // Validation: Ensure required fields are provided
    if (!residentialAddress || !accountNumber) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: 'residentialAddress' or 'accountNumber'.",
      });
    }

    // Define API URL
    const apiUrl = "http://apiplayground.alat.ng/account-upgrade/api/CustomerAccount/SubmitPartnerAddress";

    // Set headers
    const headers = {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
      "x-api-key": process.env.WEMA_API_KEY,
      "Ocp-Apim-Subscription-Key": process.env.WEMA_SUBSCRIPTION_KEY,
    };

    // Define payload
    const payload = {
      residentialAddress,
      accountNumber,
    };

    // Make API request
    const apiResponse = await axios.post(apiUrl, payload, { headers });

    const user = await User.findById(userId);
     user.Addresses[0] = {
      ...user.Addresses[0],
      ...residentialAddress, // Merge updated fields
    };

    // Save the updated user document
    await user.save();
    // Send API response back to the frontend
    res.status(apiResponse.status).json({
      success: true,
      message: "Partner address submitted successfully.",
      data: apiResponse.data,
    });
  } catch (error) {
    // Handle errors
    console.error("Error submitting partner address:", error.message);
    if (error.response) {
      // API responded with an error status code
      return res.status(error.response.status).json({
        success: false,
        message: error.response.data || "Error from the API.",
      });
    }
    // Other errors (e.g., network issues)
    res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};












exports.requestCard = async (req, res) => {
  try {
    // Extract userId from the request body
    const { cardKey, amount, creditLimit } = req.body;
    const { userId } = req;
    // Find the user by their ID
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Get the first address from the user's Addresses array
    const primaryAddress = user.Addresses[0];

    if (!primaryAddress) {
      return res.status(400).json({ error: "No address found for the user." });
    }

    // Prepare the payload for the external API
    const payload = {
      accountNumber: user.AccountNumber,
      emailaddress: user.Email,
      phoneNumber: user.PhoneNumber,
      streetAddress: primaryAddress.street,
      city: primaryAddress.city,
      nearestBustop: primaryAddress.landmark || "Not provided", // Default value if landmark is missing
      state: primaryAddress.state,
      compoundName: primaryAddress.additionalInformation || "Not provided", // Default value if missing
      lga: primaryAddress.lga,
      lcda: primaryAddress.lcda,
      apartment: primaryAddress.apartment,
      cardKey: cardKey, // From req.body
      amount: amount, // From req.body
      creditLimit: creditLimit, // From req.body
    };

    // Make the request to the external API
    const response = await axios.post(
      "https://apiplayground.alat.ng/card-management/api/Partner/partnerCard/request",
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

    // Respond with the data from the external API
    res.status(200).json({ success: true, data: response.data });
  } catch (error) {
    console.error("Error in requestCardController:", error);

    if (error.response) {
      // Handle errors from the external API
      res.status(error.response.status).json({ error: error.response.data });
    } else {
      // Handle other errors
      res.status(500).json({ error: "An error occurred while processing your request." });
    }
  }
};


exports.changeCardPin = async (req, res) => {
  try {
    // Extract the userId and card data from the request
    const { userId } = req;
    const { newPin, oldPin, fullPan } = req.body;

    // Validate inputs
    if (!newPin || !oldPin || !fullPan) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Find the card by fullPan
    const card = user.Cards.find((card) => card.fullPan === fullPan);
    if (!card) {
      return res.status(404).json({ message: "Card not found." });
    }

    // Prepare the API payload
    const payload = {
      accountNumber: user.AccountNumber,
      newPin,
      oldPin,
      expiryDate: card.expiryDate,
      emailAddress: user.Email,
      fullPan,
    };

    // Make the API request
    const response = await axios.post(
      "https://apiplayground.alat.ng/card-management/api/Partner/partnerCard/changeCardPin",
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

    // Handle successful response
    if (response.status === 200) {
      return res.status(200).json({ message: "Card PIN updated successfully." });
    } else {
      return res
        .status(response.status)
        .json({ message: response.data || "Failed to update card PIN." });
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Internal server error." });
  }
};


exports.activateCard = async (req, res) => {
  try {
    // Extract the userId and card data from the request
    const { userId } = req;
    const { newPin, fullPan } = req.body;

    // Validate inputs
    if (!newPin || !fullPan) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Find the card by fullPan
    const card = user.Cards.find((card) => card.fullPan === fullPan);
    if (!card) {
      return res.status(404).json({ message: "Card not found." });
    }

    // Prepare the API payload
    const payload = {
      accountNumber: user.AccountNumber,
      newPin,
      expiryDate: card.expiryDate,
      emailAddress: user.Email,
      fullPan,
    };

    // Make the API request
    const response = await axios.post(
      "https://apiplayground.alat.ng/card-management/api/Partner/partnerCard/activateCard",
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

    // Handle successful response
    if (response.status === 200) {
      // Update card status to "active" in the database
      card.cardStatus = "active";
      await user.save();

      return res.status(200).json({ message: "Card activated successfully." });
    } else {
      return res
        .status(response.status)
        .json({ message: response.data || "Failed to activate card." });
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Internal server error." });
  }
};


exports.retrieveCard = async (req, res) => {
  try {
    // Extract userId from the request
    const { userId } = req;

    // Find the user by their ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Get the account number from the user's model
    const accountNumber = user.AccountNumber;
    if (!accountNumber) {
      return res.status(400).json({ message: "Account number not found for this user." });
    }

    // Make the GET request to retrieve the card
    const response = await axios.get(
      `https://apiplayground.alat.ng/card-management/api/Partner/partnerCard/retrieveCard/${accountNumber}`,
      {
        headers: {
          "x-api-key": process.env.WEMA_API_KEY,
          "Cache-Control": "no-cache",
          "Ocp-Apim-Subscription-Key": "fb8be6bba5b24dfa9e42758aa276287a",
        },
      }
    );

    // Handle the API response
    if (response.status === 200) {
      return res.status(200).json(response.data); // Return the retrieved card data
    } else {
      return res
        .status(response.status)
        .json({ message: response.data || "Failed to retrieve card." });
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Internal server error." });
  }
};


