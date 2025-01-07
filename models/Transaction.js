const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0, // Ensure no negative values
    },
    type: {
      type: String,
      required: true,
    },
    date: {
      type: String, // ISO date format recommended, e.g., "YYYY-MM-DD"
      required: true,
    },
    transactionDate: {
      type: String, // ISO date format recommended
      required: true,
    },
    narration: {
      type: String,
      default: "No narration provided",
      trim: true,
    },
    status: {
      type: String,
      required: true,
      default: "Default",
    },
    creditType: {
      type: String,
      required: true,
      default: "Default",
    },
    sender: {
      type: String,
      required: true,
    },
    senderAccountNumber: {
      type: String,
      required: true,
    },
    destinationBank: {
      type: String,
      required: true,
    },
    destinationAccountNumber: {
      type: String,
      required: true,
    },
    recieverName: {
      type: String,
      required: true,
      trim: true,
    },
    referenceId: {
      type: String,
      unique: true,
      required: true,
    },
    isViewReceiptEnabled: {
      type: Boolean,
      default: true,
    },
    tranId: {
      type: String,
      unique: true,
      required: true,
      default: function () {
        return `TRX-${Math.floor(100000000 + Math.random() * 900000000)}`; // Generate a unique transaction ID
      },
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
