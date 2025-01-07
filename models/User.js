const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

// Define the Card schema
const CardSchema = new mongoose.Schema({
  fullPan: {
    type: String,
    required: true,
  },
  expiryDate: {
    type: String,
    required: true,
  },
  cardKey: {
    type: String,
  },
  cardType: {
    type: String,
    required: true, // e.g., Debit or Credit
  },
  cardStatus: {
    type: String,
    default: "active", // Can be active, blocked, or expired
  },
  creditLimit: {
    type: Number,
    default: 0,
  },
  amount: {
    type: Number,
    default: 0,
  },
});

// Define the Address schema
const AddressSchema = new mongoose.Schema({
  buildingNumber: { type: String, required: true },
  apartment: { type: String },
  street: { type: String, required: true },
  city: { type: String, required: true },
  town: { type: String },
  state: { type: String, required: true },
  lga: { type: String },
  lcda: { type: String },
  landmark: { type: String },
  additionalInformation: { type: String },
  country: { type: String, required: true },
  fullAddress: { type: String },
  postalCode: { type: String },
});

// Define the User schema
const UserSchema = new mongoose.Schema(
  {
    PhoneNumber: { type: String, required: true, unique: true },
    FullName: { type: String, required: true, trim: true },
    Password: { type: String, required: true },
    Pin: { type: String, default: "0000", length: 4 },
    ProfileImage: { type: String, default: "https://default-image-url.com" },
    trackingId: { type: String, default: "00000000-0000-0000-0000-000000000000" },
    AccountBalance: { type: Number, default: 0.0, min: 0 },
    AccountTire: { type: Number, default: 1 },
    AccountNumber: { type: String, required: true, unique: true },
    Email: { type: String, required: true },
    Addresses: { type: [AddressSchema], default: [] },
    Cards: { type: [CardSchema], default: [] }, // Added Cards field
  },
  { timestamps: true }
);

// Hash password and pin before saving
UserSchema.pre("save", async function (next) {
  if (this.isModified("Password")) {
    this.Password = await bcrypt.hash(this.Password, 10);
  }
  next();
});

// Create the User model
const User = mongoose.model("User", UserSchema);

module.exports = User;
