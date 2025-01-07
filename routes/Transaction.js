const express = require("express");
const router = express.Router();
const controllers = require("../controllers/Transaction");
const checkLoginStatus = require("../controllers/middleware");

// Create a transaction
router.get("/get-banks", controllers.getAllBanks);
router.post("/get-account-enquiry", controllers.accountNameEnquiry);
// router.post("/create-transaction/:accessId", checkLoginStatus, controllers.createTransaction);
router.get("/user-transactions/:accessId", checkLoginStatus.checkLoginSession, controllers.getTransactionsForUser);
router.get("/transaction/:transactionId", controllers.getTransactionById);
router.delete("/delete-all-transactions/:accessId", checkLoginStatus.checkLoginSession, controllers.deleteAllTransactionsForUser);
router.delete("/transaction/:transactionId", controllers.deleteTransactionById);
router.get("/get-all-bills", controllers.getAllBills);
router.get("/get-a-bill/:id", controllers.getABill);
router.get("/get-bills-packages/:categoryId/:billerId", controllers.getBillerPackages);
router.post("/get-customer-validation", controllers.validateCustomer);
router.post("/user-pay-bill/:accessId", checkLoginStatus.checkLoginSession, controllers.payBill);

module.exports = router;
