const Transaction = require("../models/Transaction");






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
  