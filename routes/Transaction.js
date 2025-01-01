const express = require("express");
const router = express.Router();
const controllers = require("../controllers/transactionControllers");
const checkLoginStatus = require("../middleware/checkLoginStatus");

// Create a transaction
router.post("/create-transaction/:accessId", checkLoginStatus, controllers.createTransaction);

// Get all transactions for a user
router.get("/user-transactions/:accessId", checkLoginStatus, controllers.getTransactionsForUser);

// Get a specific transaction
router.get("/transaction/:accessId/:transactionId", checkLoginStatus, controllers.getTransactionById);

// Delete all transactions for a user
router.delete("/user-transactions/:accessId", checkLoginStatus, controllers.deleteAllTransactionsForUser);

// Delete a specific transaction
router.delete("/transaction/:accessId/:transactionId", checkLoginStatus, controllers.deleteTransactionById);

module.exports = router;
