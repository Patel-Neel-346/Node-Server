import express from "express";
import cookieParser from "cookie-parser";
import UserRoute from "./routes/UserRoute.js";
import { cleanupPendingUsers } from "./controller/UserController.js";
import cron from "node-cron";
import MongoDBInsatnce from "./db/DBConnect.js";
import { config } from "./Config/index.js";

const PORT = config.PORT || 6000; // Use environment variable or default to 5000
const app = express();

MongoDBInsatnce(); // Connect to MongoDB
// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

// CORS setup
// app.use((req, res, next) => {
//   res.header("Access-Control-Allow-Origin", config.CLIENT_URL);
//   res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
//   res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
//   res.header("Access-Control-Allow-Credentials", true);
//   next();
// });

// API Routes - Make sure the base path is correct and consistent
app.use("/api/v1/user", UserRoute);
// Add other routes here

// Schedule cleanup job for pending users - runs once a day at midnight
cron.schedule("0 0 * * *", async () => {
  console.log("Running cleanup job for pending users");
  await cleanupPendingUsers();
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  const errors = err.errors || [];

  res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
});

// Not found middleware
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Resource not found",
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
