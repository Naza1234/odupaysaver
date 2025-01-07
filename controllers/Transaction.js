const Transaction = require("../models/Transaction");
const axios = require("axios");
require("dotenv").config();
const User = require("../models/User");

const subscriptionKey = process.env.WEMA_SUBSCRIPTION_KEY
const wemaApiKKey = process.env.WEMA_API_KEY

exports.getAllBanks = async (req, res) => {
  try {
    // Define the endpoint
    const endpoint = "https://apiplayground.alat.ng/debit-wallet/api/Shared/GetAllBanks";

    // Make the GET request using axios
    const response = await axios.get(endpoint, {
      headers: {
        "Cache-Control": "no-cache",
        "Ocp-Apim-Subscription-Key": subscriptionKey, // Take the key from the .env file
      },
    });


    // Respond to the frontend with the API response
    return res.status(200).json({
      success: true,
      message: "Banks retrieved successfully.",
      data: response.data,
    });
  } catch (error) {
    // Log the error for debugging
    console.error("Error during API call:", error.message);
    console.error("Full Error:", error.response?.data || error);

    // Respond with an appropriate error message
    return res.status(error.response?.status || 500).json({
      success: false,
      message: "Failed to retrieve banks.",
      error: error.response?.data || "An unexpected error occurred.",
    });
  }
};


exports.accountNameEnquiry = async (req, res) => {
  try {
    // Extract parameters from the request body
    const { bankCode, accountNumber } = req.body;

    // Validate the input parameters
    if (!bankCode || !accountNumber) {
      return res.status(400).json({
        success: false,
        message: "Both bankCode and accountNumber are required.",
      });
    }

    // Construct the API URL using the parameters
    const apiUrl = `https://apiplayground.alat.ng/debit-wallet/api/Shared/AccountNameEnquiry/${bankCode}/${accountNumber}`;

    // Make the GET request to the API
    const response = await axios.get(apiUrl, {
      headers: {
        "Ocp-Apim-Subscription-Key":subscriptionKey,
        "Cache-Control": "no-cache",
      },
    });

    // Send the API response back to the frontend
    return res.status(response.status).json({
      success: true,
      message: "Account name enquiry successful.",
      data: response.data,
    });
  } catch (error) {
    console.error("Error during account name enquiry:", error.message);

    // Handle different error scenarios
    if (error.response) {
      // API responded with a status code outside the 2xx range
      return res.status(error.response.status).json({
        success: false,
        message: "Failed to perform account name enquiry.",
        error: error.response.data,
      });
    } else if (error.request) {
      // No response was received from the API
      return res.status(500).json({
        success: false,
        message: "No response received from the API. Please try again later.",
      });
    } else {
      // Something went wrong while setting up the request
      return res.status(500).json({
        success: false,
        message: "An error occurred while processing the request.",
        error: error.message,
      });
    }
  }
};



exports.processClientTransfer = async (req, res) => {
  try {
    // Extract the request body from the client
    const {
      securityInfo,
      amount,
      destinationBankCode,
      destinationBankName,
      destinationAccountNumber,
      destinationAccountName,
      sourceAccountNumber,
      narration,
    } = req.body;

    // Validate required fields
    if (!securityInfo || !amount || !destinationBankCode || !destinationAccountNumber || !sourceAccountNumber ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields. Please provide all necessary details.",
      });
    }

    // Define the request payload
    const requestBody = {
      securityInfo,
      amount,
      destinationBankCode,
      destinationBankName,
      destinationAccountNumber,
      destinationAccountName,
      sourceAccountNumber,
      narration,
      transactionReference : "jujnn",
      useCustomNarration : true,
    };

    // Make the API call to Wema Bank's endpoint
    const response = await axios.post(
      "https://apiplayground.alat.ng/debit-wallet/api/Shared/ProcessClientTransfer",
      requestBody,
      {
        headers: {
          "access": wemaApiKKey,
          "Content-Type": "application/json-patch+json",
          "Cache-Control": "no-cache",
          "Ocp-Apim-Subscription-Key": subscriptionKey,
        },
      }
    );

    // Respond to the client with the API response
    return res.status(response.status).json({
      success: true,
      message: "Transfer processed successfully.",
      data: response.data,
    });
  } catch (error) {
    // Handle errors and respond to the client
    console.error("Error during transfer processing:", error.message);
    return res.status(error.response?.status || 500).json({
      success: false,
      message: "An error occurred while processing the transfer.",
      error: error.response?.data || error.message,
    });
  }
};




exports.getTransactionsForUser = async (req, res) => {
    try {
      const transactions = await Transaction.find({ userId: req.userId }); // Find transactions by userId
  
      if (transactions.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No transactions found for this user",
        });
      }
  
      return res.status(200).json({
        success: true,
        transactions,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error fetching transactions",
        error: error.message,
      });
    }
};
  

exports.getTransactionById = async (req, res) => {
    try {
      const { transactionId } = req.params;
  
      const transaction = await Transaction.findOne({
        _id: transactionId,
        userId: req.userId, // Ensure the transaction belongs to the logged-in user
      });
  
      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: "Transaction not found",
        });
      }
  
      return res.status(200).json({
        success: true,
        transaction,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error fetching transaction",
        error: error.message,
      });
    }
};
  

exports.deleteAllTransactionsForUser = async (req, res) => {
    try {
      const result = await Transaction.deleteMany({ userId: req.userId }); // Delete all transactions for the user
  
      return res.status(200).json({
        success: true,
        message: `${result.deletedCount} transaction(s) deleted successfully`,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error deleting transactions",
        error: error.message,
      });
    }
};



exports.deleteTransactionById = async (req, res) => {
    try {
      const { transactionId } = req.params;
  
      const transaction = await Transaction.findOneAndDelete({
        _id: transactionId,
        userId: req.userId, // Ensure the transaction belongs to the logged-in user
      });
  
      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: "Transaction not found or does not belong to this user",
        });
      }
  
      return res.status(200).json({
        success: true,
        message: "Transaction deleted successfully",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error deleting transaction",
        error: error.message,
      });
    }
};
  


exports.getAllBills = async (req, res) => {
  try {
    // Define API URL
    const apiUrl = "https://apiplayground.alat.ng/bills-payment/api/BillsPayment/GetAllBills";

    // Set headers
    const headers = {
      "access":wemaApiKKey, // Store the access key in your .env file
      "Ocp-Apim-Subscription-Key":subscriptionKey, // Store subscription key in .env
      "Cache-Control": "no-cache",
    };

    // Make API request
    const apiResponse = await axios.get(apiUrl, { headers });

      // Send API response back to the frontend
      const sortedArray = await apiResponse.data.result.map(category => ({
        id: category.id,
        name: category.name
      }));

    res.status(apiResponse.status).json({
      success: true,
      message: "Fetched all bills successfully.",
      data: sortedArray,
    });
  } catch (error) {
    // Handle errors
    console.error("Error fetching bills:", error.message);
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

exports.getABill = async (req, res) => {
  try {
    // Get the category ID from the request parameters
    const { id } = req.params;

    // Define API URL
    const apiUrl = "https://apiplayground.alat.ng/bills-payment/api/BillsPayment/GetAllBills";

    // Set headers
    const headers = {
      "access":wemaApiKKey, // Store the access key in your .env file
      "Ocp-Apim-Subscription-Key":subscriptionKey, // Store subscription key in .env
      "Cache-Control": "no-cache",
    };

    // Make API request
    const apiResponse = await axios.get(apiUrl, { headers });

    // Parse the response to find the category by ID
    const categories = apiResponse.data.result;
    const selectedCategory = categories.find(category => category.id == id);
    // Extract the billers with the required structure
    const billers = selectedCategory.billers.map((biller) => ({
      id: biller.id,
      name: biller.name,
      identifier: biller.identifier,
      shortCode: biller.shortCode,
      isAquired: biller.isAquired,
      requiredValidation: biller.requiredValidation,
      charge: biller.charge,
      flow: biller.flow,
    }));

    if (!selectedCategory) {
      return res.status(404).json({
        success: false,
        message: `Category with ID ${id} not found.`,
      });
    }

  
    // Send response back to the frontend
    res.status(200).json({
      success: true,
      message: "Fetched category and its bills successfully.",
      data:billers,
    });
  } catch (error) {
    // Handle errors
    console.error("Error fetching bills:", error.message);
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

exports.getBillerPackages = async (req, res) => {
  try {
    // Get the category ID and biller ID from the request parameters
    const { categoryId, billerId } = req.params;

    // Define API URL
    const apiUrl = "https://apiplayground.alat.ng/bills-payment/api/BillsPayment/GetAllBills";

    // Set headers
    const headers = {
      "access": wemaApiKKey, // Store the access key in your .env file
      "Ocp-Apim-Subscription-Key": subscriptionKey, // Store subscription key in .env
      "Cache-Control": "no-cache",
    };

    // Make API request
    const apiResponse = await axios.get(apiUrl, { headers });

    // Parse the response to find the category by ID
    const categories = apiResponse.data.result;
    const selectedCategory = categories.find((category) => category.id == categoryId);

    if (!selectedCategory) {
      return res.status(404).json({
        success: false,
        message: `Category with ID ${categoryId} not found.`,
      });
    }

    // Find the specific biller within the category
    const selectedBiller = selectedCategory.billers.find((biller) => biller.id == billerId);

    if (!selectedBiller) {
      return res.status(404).json({
        success: false,
        message: `Biller with ID ${billerId} not found in category ${categoryId}.`,
      });
    }

    // Extract the packages
    const packages = selectedBiller.packages.map((pkg) => ({
      id: pkg.id,
      name: pkg.name,
      isAmountEditable: pkg.isAmountEditable,
      enabledForBNPL: pkg.enabledForBNPL,
      amount: pkg.amount,
      minAmount: pkg.minAmount,
      maxAmount: pkg.maxAmount,
    }));

    // Send response back to the frontend
    res.status(200).json({
      success: true,
      message: "Fetched biller packages successfully.",
      data: packages,
    });
  } catch (error) {
    // Handle errors
    console.error("Error fetching biller packages:", error.message);
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




exports.validateCustomer = async (req, res) => {
  try {
    // Extract data from req.body
    const {identifier, packageId } = req.body;

    // Ensure all required fields are provided
    if (!identifier || packageId === undefined) {
      return res.status(400).json({
        success: false,
        message: "channelId, identifier, and packageId are required.",
      });
    }

    // Define API URL
    const apiUrl = "https://apiplayground.alat.ng/bills-payment/api/BillsPayment/ValidateCustomer";

    // Set headers
    const headers = {
      "access": wemaApiKKey, // Store the access key in your .env file
      "Ocp-Apim-Subscription-Key": subscriptionKey, // Store subscription key in .env
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
    };

    // Define request payload
    const payload = {
      "channelId": wemaApiKKey,
      identifier,
      packageId,
    };

    // Make POST request to the API
    const apiResponse = await axios.post(apiUrl, payload, { headers });

    // Send API response back to the frontend
    res.status(200).json({
      success: true,
      message: "Customer validated successfully.",
      data: apiResponse.data,
    });
  } catch (error) {
    // Handle errors
    console.error("Error validating customer:", error.message);

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



exports.payBill = async (req, res) => {
  try {
    // Extract userId from req and request body data
    const { userId } = req;
    const {
      // clientId,
      amount,
      charge,
      transactionReference,
      packageId,
      customerIdentifier,
      securityInfo,
    } = req.body;

    // Validate required fields in req.body
    if (
      !amount ||
      !charge ||
      !transactionReference ||
      packageId === undefined ||
      !customerIdentifier ||
      !securityInfo
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields in the request body.",
      });
    }

    // Find the user in the database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Extract additional user details
    const customerEmail = user.Email;
    const customerPhoneNumber = user.PhoneNumber;
    const customerName = user.FullName;

    // Define API URL
    const apiUrl = "https://apiplayground.alat.ng/bills-payment/api/Shared/PayBill";

    // Set headers
    const headers = {
      "access": wemaApiKKey, // Store the access key in your .env file
      "Ocp-Apim-Subscription-Key": subscriptionKey, // Store subscription key in .env
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
     
    };

    // Define request payload
    const payload = {
      "channelId": wemaApiKKey,
      customerAccount: user.AccountNumber, // Use the AccountNumber from the user model
      amount,
      charge,
      transactionReference,
      packageId,
      customerIdentifier,
      customerEmail,
      customerPhoneNumber,
      customerName,
      securityInfo,
    };

    // Make POST request to the API
    const apiResponse = await axios.post(apiUrl, payload, { headers });

    // Send API response back to the frontend
    res.status(200).json({
      success: true,
      message: "Bill payment request successful.",
      data: apiResponse.data,
    });
  } catch (error) {
    // Handle errors
    console.error("Error making bill payment request:", error.message);

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