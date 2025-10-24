// Load environment variables from .env (make sure you added them in Render too)
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
// const connectToMongo = require("./database/db");

const app = express();

// ✅ Connect to MongoDB

const mongoose = require("mongoose");
const mongoURI = process.env.MONGODB_URI;

const connectToMongo = () => {
  mongoose
    .connect(mongoURI, { useNewUrlParser: true })
    .then(() => {
      console.log("Connected to MongoDB Successfully");
    })
    .catch((error) => {
      console.error("Error connecting to MongoDB", error);
    });
};
connectToMongo();
// ✅ Always use Render's PORT or fallback to 4000 for local dev
const port = process.env.PORT || 4000;

// ✅ Setup CORS — fallback added for local testing
app.use(
  cors({
    origin: process.env.FRONTEND_API_LINK || "http://localhost:3000",
    credentials: true,
  })
);

// ✅ Middleware
app.use(express.json());
app.use("/media", express.static(path.join(__dirname, "media")));

// ✅ Root route (for Render health check)
app.get("/", (req, res) => {
  res.send("✅ Server is up and running on Render!");
});

// ✅ API Routes
try {
  app.use("/api/admin", require("./routes/details/admin-details.route"));
  app.use("/api/faculty", require("./routes/details/faculty-details.route"));
  app.use("/api/student", require("./routes/details/student-details.route"));

  app.use("/api/branch", require("./routes/branch.route"));
  app.use("/api/subject", require("./routes/subject.route"));
  app.use("/api/notice", require("./routes/notice.route"));
  app.use("/api/timetable", require("./routes/timetable.route"));
  app.use("/api/material", require("./routes/material.route"));
  app.use("/api/exam", require("./routes/exam.route"));
  app.use("/api/marks", require("./routes/marks.route"));
} catch (err) {
  console.error("❌ Error loading routes:", err.message);
}

// ✅ Start server
app.listen(port, () => {
  console.log(`🚀 Server listening on port ${port}`);
});
