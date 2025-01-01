const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    accountNumber: {
      type: String,
      required: true,
    },
    accountName: {
      type: String,
      required: true,
    },
    bankName: {
      type: String,
      required: true,
    },
    transactionType: {
      type: String,
      required: true,
      enum: ["deposit", "withdrawal", "airtime", "cardDeposit", "data"], // Ensure only valid transaction types are used
    },
    amount: {
      type: Number,
      required: true,
      min: 0, // Ensure no negative values
    },
    description: {
      type: String,
      default: "No description provided",
      trim: true,
    },
    transactionId: {
      type: String,
      unique: true,
      required: true,
      default: function () {
        return `TRX-${Math.floor(100000000 + Math.random() * 900000000)}`; // Generates a unique transaction ID
      },
    },
    receiverNo: {
      type: String,
      match: [/^\d{10,15}$/, "Invalid receiver number"], // Optional field for airtime transactions
    },
    networkProvider: {
      type: String, // Optional field for airtime or data transactions
      enum: ["MTN", "Airtel", "Glo", "9mobile"], // Add more if needed
    },
    dataValue: {
      type: String, // Optional field for data transactions
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User", // Reference to the User model
    },
  },
  {
    timestamps: true, // Automatically adds `createdAt` and `updatedAt` fields
  }
);

module.exports = mongoose.model("Transaction", transactionSchema);
