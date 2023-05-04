const mongoose = require("mongoose");
const { Schema } = mongoose;

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["manager", "employee"],
      default: "employee",
    },
    // has a reference to the task model
    // The ref option is what tells Mongoose which model to use during population
    // A user may have one, many, or no task he/she is responsible for
    tasks: [{ type: Schema.Types.ObjectId, ref: "Task" }],
    isDeleted: { type: Boolean, default: false, required: true },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
