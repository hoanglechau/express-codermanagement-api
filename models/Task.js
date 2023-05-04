const mongoose = require("mongoose");
const { SchemaTypes } = mongoose;

const taskSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: { type: String, required: true },
    // pending: work not started, working: is working on it, review: waiting for review result, done: review is finished with satisfaction, archive: package as references for future
    status: {
      type: String,
      enum: ["pending", "working", "review", "done", "archive"],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    // has a reference to the user model
    // A task may have one or no one assigned to it yet
    assignee: { type: SchemaTypes.ObjectId, ref: "User" },
    isDeleted: { type: Boolean, default: false, required: true },
  },
  {
    timestamps: true,
  }
);

const Task = mongoose.model("Task", taskSchema);

module.exports = Task;
