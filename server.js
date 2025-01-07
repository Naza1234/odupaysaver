const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');

const corsOptions = {
  origin: 'https://autoauction.space',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
};

app.use(cors(corsOptions));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use("/image", express.static("./image"));

// Import all routes
const userRoutes = require('./routes/User');
const transactionRoutes = require('./routes/Transaction');

// Use the routes
app.use("/user", userRoutes);
app.use("/transaction", transactionRoutes);





// Database connection
const url = "mongodb+srv://odupay:nbuADv0idIlTu6PM@odupay.rstth.mongodb.net/?retryWrites=true&w=majority&appName=odupay";
const port = 3000;
// nbuADv0idIlTu6PM
// odupay
mongoose
  .connect(url)
  .then(() => {
    console.log('Connected to the database');
    app.use("/",(req,res)=>{
        res.end('origin')
      })
    app.listen(port, () => {
      console.log(`Server is now running on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.log(error.message);
  });