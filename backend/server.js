const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

require("dotenv").config({ path: path.join(__dirname, ".env.local") });
if (!process.env.MONGO_URI) {
  require("dotenv").config({ path: path.join(__dirname, ".env") });
}

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/applications", require("./routes/applicationRoutes"));

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Job Application Tracker API is running",
    data: null
  });
});

let connectionPromise;

async function connectDatabase() {
  if (mongoose.connection.readyState === 1) return;
  if (!connectionPromise) {
    connectionPromise = mongoose.connect(process.env.MONGO_URI)
      .catch(error => {
        connectionPromise = null;
        throw error;
      });
  }
  await connectionPromise;
}

app.use(async (req, res, next) => {
  try {
    await connectDatabase();
    next();
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    res.status(500).json({
      success: false,
      message: "Database connection failed",
      data: null
    });
  }
});

// Vercel uses the exported Express app.
module.exports = app;

// Local development still starts a server.
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
