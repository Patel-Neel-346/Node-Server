// import express from "express";
// import cookieParser from "cookie-parser";
// import UserRoute from "./routes/UserRoute.js";
// import { cleanupPendingUsers } from "./controller/UserController.js";
// import cron from "node-cron";
// import MongoDBInsatnce from "./db/DBConnect.js";
// import { config } from "./Config/index.js";
// import swaggerJSDoc from "swagger-jsdoc";
// import swaggerUi from "swagger-ui-express";
// import { version } from "mongoose";

// const PORT = config.PORT || 6000; // Use environment variable or default to 5000
// const app = express();

// // Replace the existing Swagger setup in app.js with this:

// // Swagger configuration
// const swaggerOptions = {
//   definition: {
//     openapi: "3.0.0",
//     info: {
//       title: "Authentication API",
//       version: "1.0.0",
//       description: "API documentation for the authentication service",
//       contact: {
//         name: "API Support",
//         email: "support@example.com",
//       },
//     },
//     servers: [
//       {
//         url: `http://localhost:${PORT}`,
//         description: "Development server",
//       },
//     ],
//     components: {
//       securitySchemes: {
//         bearerAuth: {
//           type: "http",
//           scheme: "bearer",
//           bearerFormat: "JWT",
//         },
//         cookieAuth: {
//           type: "apiKey",
//           in: "cookie",
//           name: "accessToken",
//         },
//       },
//     },
//   },
//   apis: ["./src/routes/*.js"], // Path to the API routes files
// };

// const swaggerSpec = swaggerJSDoc(swaggerOptions);

// // Swagger UI setup
// app.use(
//   "/api-docs",
//   swaggerUi.serve,
//   swaggerUi.setup(swaggerSpec, {
//     explorer: true,
//     customCss: ".swagger-ui .topbar { display: none }", // Optional: Hide the top bar
//   })
// );

// MongoDBInsatnce(); // Connect to MongoDB
// // Middleware
// app.use(express.json());
// app.use(cookieParser());
// app.use(express.static("public"));
// app.use(express.urlencoded({ extended: true }));

// // CORS setup
// // app.use((req, res, next) => {
// //   res.header("Access-Control-Allow-Origin", config.CLIENT_URL);
// //   res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
// //   res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
// //   res.header("Access-Control-Allow-Credentials", true);
// //   next();
// // });

// // API Routes - Make sure the base path is correct and consistent
// app.use("/api/v1/user", UserRoute);
// // Add other routes here

// // Schedule cleanup job for pending users - runs once a day at midnight
// cron.schedule("0 0 * * *", async () => {
//   console.log("Running cleanup job for pending users");
//   await cleanupPendingUsers();
// });

// // Error handling middleware
// app.use((err, req, res, next) => {
//   console.error(err.stack);
//   const statusCode = err.statusCode || 500;
//   const message = err.message || "Internal Server Error";
//   const errors = err.errors || [];

//   res.status(statusCode).json({
//     success: false,
//     message,
//     errors,
//   });
// });

// // Not found middleware
// app.use((req, res) => {
//   res.status(404).json({
//     success: false,
//     message: "Resource not found",
//   });
// });

// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });

// export default app;

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

const PORT = config.PORT || 6000; // Use environment variable or default to 6000
const app = express();

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Authentication API",
      version: "1.0.0",
      description: "API documentation for the authentication service",
      contact: {
        name: "API Support",
        email: "support@example.com",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "accessToken",
        },
      },
    },
  },
  apis: ["./src/routes/*.js"], // Path to the API routes files
};

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
