const mongoose = require("mongoose");

// LoginCheck Schema
const loginCheckSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  loginTime: {
    type: Date,
    required: true,
    default: Date.now, 
  },
  autoLogoutTime: {
    type: Date,
    required: true,
    default: function() {
      const oneWeekLater = new Date(this.loginTime);
      oneWeekLater.setDate(this.loginTime.getDate() + 7); 
      return oneWeekLater;
    },
  },
  accessId: {
    type: String,
    required: true,
    unique: true,
    default: function() {
      return `OduPay${Math.random().toString(36).substring(2, 8).toUpperCase()}${Math.floor(1000000 + Math.random() * 9000000)}`; 
    },
  },
});


// Middleware to update fields when the document is directly updated (e.g., using updateOne, findByIdAndUpdate)
loginCheckSchema.pre('findOneAndUpdate', function(next) {
    const update = this.getUpdate();
    if (update.loginTime) {
      // If loginTime is being updated, modify autoLogoutTime and accessId
      update.autoLogoutTime = new Date(update.loginTime);
      update.autoLogoutTime.setDate(update.loginTime.getDate() + 7); // Set auto logout time 1 week after login time
  
      // Generate a random alphanumeric string with letters and numbers
      const randomString = Math.random().toString(36).substring(2, 8); // Get random letters and numbers
      update.accessId = `OduPay${randomString}${Math.floor(1000000 + Math.random() * 9000000)}`; // Example: OduPayABC1234
    }
    next();
  });

const LoginCheck = mongoose.model("LoginCheck", loginCheckSchema);

module.exports = LoginCheck;
