// src/models/UserModel.js
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  // Added phone number field
  phoneNumber: {
    type: String,
    // Not required by default to maintain backward compatibility
    // but will be validated when provided
    unique: true,
    sparse: true, // This allows null values to exist (for backward compatibility)
  },
  password: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "active"],
    default: "active",
  },
  registrationAttempts: {
    type: Number,
    default: 0,
  },
  lastRegistrationAttempt: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field on document update
UserSchema.pre("save", function (next) {
  this.updatedAt = Date.now();

  // If this is a pending user being modified, increment registration attempts
  if (this.status === "pending" && this.isModified()) {
    this.registrationAttempts += 1;
    this.lastRegistrationAttempt = Date.now();
  }

  next();
});

const User = mongoose.model("User", UserSchema);
export default User;
