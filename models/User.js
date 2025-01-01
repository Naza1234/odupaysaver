const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

// Define the User schema
const UserSchema = new mongoose.Schema({
  PhoneNumber: {
    type: String,
    required: true,
    unique: true,
  },
  FullName: {
    type: String,
    required: true,
    trim: true,
  },
  Password: {
    type: String,
    required: true,
  },
  Pin: {
    type: String,
    default:"0000",
    length: 4, // Ensure pin is exactly 4 characters
  },
  ProfileImage: {
    type: String,
    default: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRZYgW4c4mScN4iMaoZM2YNPO2iV7aaxtmDVg&s", // Default value for when no image is provided
  },
  AccountBalance: {
    type: Number,
    default: 0.0,
    min: 0, // Prevent negative balances
  },
  AccountNumber: {
    type: String,
    required: true,
    unique: true,
  },
  Email: {
    type: String,
    required: true,
    
  },
}, { timestamps: true });

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
