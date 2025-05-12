const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Authentication Service API",
      version: "1.0.0",
      description:
        "A comprehensive API for user authentication, registration, and profile management",
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
      {
        url: `https://api.yourdomain.com`,
        description: "Production server",
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
      schemas: {
        User: {
          type: "object",
          required: ["firstName", "lastName", "email", "password"],
          properties: {
            _id: {
              type: "string",
              description: "Auto-generated MongoDB ID",
              example: "60d21b4667d0d8992e610c85",
            },
            firstName: {
              type: "string",
              description: "User's first name",
              example: "John",
            },
            lastName: {
              type: "string",
              description: "User's last name",
              example: "Doe",
            },
            email: {
              type: "string",
              format: "email",
              description: "User's email address",
              example: "john.doe@example.com",
            },
            phoneNumber: {
              type: "string",
              description: "User's phone number (optional)",
              example: "+1234567890",
            },
            status: {
              type: "string",
              enum: ["pending", "active"],
              description: "User account status",
              example: "active",
            },
            profilePicture: {
              type: "string",
              description: "Path to profile picture",
              example: "/uploads/profiles/user123.jpg",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "User creation timestamp",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "User last update timestamp",
            },
          },
        },
        OTP: {
          type: "object",
          properties: {
            email: {
              type: "string",
              format: "email",
              description: "Email to which OTP was sent",
            },
            phoneNumber: {
              type: "string",
              description: "Phone number to which OTP was sent",
            },
            notificationMethods: {
              type: "array",
              items: {
                type: "string",
                enum: ["email", "sms", "both"],
              },
              description: "Methods used to send the OTP",
            },
            otp: {
              type: "string",
              description: "One-Time Password",
            },
            purpose: {
              type: "string",
              enum: ["registration", "login", "password-reset"],
              description: "Purpose of the OTP",
            },
            expiresAt: {
              type: "string",
              format: "date-time",
              description: "OTP expiration time",
            },
          },
        },
        ApiResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              description: "Indicates if the request was successful",
            },
            message: {
              type: "string",
              description: "Response message",
            },
            data: {
              type: "object",
              description: "Response payload",
            },
          },
        },
        Error: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            message: {
              type: "string",
              description: "Error message",
            },
            errors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  msg: {
                    type: "string",
                    description: "Validation error message",
                  },
                  param: {
                    type: "string",
                    description: "Parameter that failed validation",
                  },
                  location: {
                    type: "string",
                    description:
                      "Location of the parameter (body, query, etc.)",
                  },
                },
              },
            },
          },
        },
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: {
              type: "string",
              format: "email",
              example: "user@example.com",
            },
            password: {
              type: "string",
              format: "password",
              example: "Password123",
            },
          },
        },
        TokenResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            message: {
              type: "string",
              example: "Login successful",
            },
            data: {
              type: "object",
              properties: {
                user: {
                  type: "object",
                  properties: {
                    id: {
                      type: "string",
                      example: "60d21b4667d0d8992e610c85",
                    },
                    firstName: {
                      type: "string",
                      example: "John",
                    },
                    lastName: {
                      type: "string",
                      example: "Doe",
                    },
                    email: {
                      type: "string",
                      example: "john.doe@example.com",
                    },
                  },
                },
                accessToken: {
                  type: "string",
                  example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                },
                refreshToken: {
                  type: "string",
                  example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                },
              },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
      {
        cookieAuth: [],
      },
    ],
  },
  apis: ["./src/routes/*.js"], // Path to the API routes files
};

export default swaggerOptions;
