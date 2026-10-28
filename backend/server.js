
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

// ADD THE ROUTES HERE, AFTER THE MIDDLEWARE
app.use("/api/applications", require("./routes/applicationRoutes"));

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Job Application Tracker API is running",
    data: null
  });
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully");

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
  });
