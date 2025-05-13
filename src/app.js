import express from "express";
import cookieParser from "cookie-parser";
import UserRoute from "./routes/UserRoute.js";
import { cleanupPendingUsers } from "./controller/UserController.js";
import cron from "node-cron";
import MongoDBInsatnce from "./db/DBConnect.js";
import { config } from "./Config/index.js";
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import cors from "cors";
import swaggerOptions from "./helpers/Swagger.js";
import fileUpload from "./middleware/File_Multer_Middleware.js";
import router from "./routes/FileRoute.js";

export const PORT = config.PORT || 6000; // Use environment variable or default to 6000
const app = express();

// Swagger configuration
// Updated Swagger configuration for app.js

const swaggerSpec = swaggerJSDoc(swaggerOptions);

MongoDBInsatnce(); // Connect to MongoDB

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

// CORS setup
app.use(
  cors({
    origin: config.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Swagger UI setup
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: ".swagger-ui .topbar { display: none }", // Optional: Hide the top bar
  })
);

// API Routes
app.use("/api/v1/user", UserRoute);
app.use("/api/v1/user/files", router);
// Root route redirect to API docs
app.get("/", (req, res) => {
  res.redirect("/api-docs");
});

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
  console.log(
    `API Documentation available at http://localhost:${PORT}/api-docs`
  );
});

export default app;
