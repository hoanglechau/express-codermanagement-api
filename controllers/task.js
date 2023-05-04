const Task = require("../models/Task");
const User = require("../models/User");
const { CustomError } = require("../utils/helpers");
const { StatusCodes } = require("http-status-codes");
let taskStatus = ["pending", "working", "review", "done", "archive"];
const ObjectId = require("mongoose").Types.ObjectId;

// Check if id is valid ObjectId
function isValidObjectId(id) {
  if (ObjectId.isValid(id)) {
    if (String(new ObjectId(id)) === id) return true;
    return false;
  }
  return false;
}

// Create a new task
const createTask = async (req, res, next) => {
  const { name, description, status, assignee } = req.body;

  try {
    // Check if required data is missing
    if (!name || !description || !status)
      throw new CustomError(
        402,
        "Bad Request",
        "Error: Missing required data!"
      );

    // Check if task status is valid
    if (!taskStatus.includes(status)) {
      throw new CustomError(402, "Bad Request", "Task status is not valid!");
    }

    // Check if task already exists
    const existingTask = await Task.findOne({ name });
    if (existingTask) {
      const error = new Error("Task already exists!");
      error.statusCode = 404;
      throw error;
    }

    // Create a new task
    const task = await Task.create(req.body);

    // Add task to the task collection
    // If assignee is included in the request body, the new task will be assigned to that user
    // $addToSet operator adds a value to an array unless the value is already present, in which case $addToSet does nothing to that array
    await Task.findByIdAndUpdate(assignee, {
      $addToSet: { tasks: task._id },
    });

    res
      .status(StatusCodes.CREATED)
      .json({ task, message: "Create task successfully!" });
  } catch (err) {
    next(err);
  }
};

// Get all tasks
const getTasks = async (req, res, next) => {
  const page = req.query.page ? req.query.page : 1;
  const filter = req.query ? req.query : {};
  const limit = req.params.limit ? req.params.limit : 10;

  try {
    const skip = (Number(page) - 1) * Number(limit);

    const tasks = await Task.find(filter).populate("assignee");
    const result = tasks
      .filter(item => item.isDeleted != true)
      .slice(skip, Number(limit) + skip);

    res.status(StatusCodes.OK).json({
      tasks: result,
      page,
      total: result.length,
      message: "Get all tasks successfully!",
    });
  } catch (err) {
    next(err);
  }
};

// Get a single task
const getSingleTask = async (req, res, next) => {
  const { id: taskId } = req.params;

  try {
    // Check for missing data
    if (!taskId) {
      const error = new Error("Missing required data!");
      error.statusCode = 404;
      throw error;
    }

    // Check if taskId is valid
    if (!isValidObjectId(taskId)) {
      const error = new Error("Task id must be ObjectID!");
      error.statusCode = 400;
      throw error;
    }

    // Get the task
    const task = await Task.findById(taskId).populate("assignee");

    // Check if the task exists
    if (!task || task.isDeleted) {
      const error = new Error("Task does not exist!");
      error.statusCode = 500;
      throw error;
    }

    res
      .status(StatusCodes.OK)
      .json({ task, message: "Get task successfully!" });
  } catch (err) {
    next(err);
  }
};

// Update a task
const updateTask = async (req, res, next) => {
  const taskId = req.params.id;
  const { status } = req.body;
  console.log(status);

  try {
    // Check for missing data
    if (!taskId) {
      const error = new Error("Missing required data!");
      error.statusCode = 404;
      throw error;
    }

    // Check if taskId is valid
    if (!isValidObjectId(taskId)) {
      const error = new Error("Task id must be ObjectID!");
      error.statusCode = 400;
      throw error;
    }

    // Get the task
    const task = await Task.findById(taskId);

    // Check if the task exists
    if (!task || task.isDeleted) {
      const error = new Error("Task does not exist!");
      error.statusCode = 500;
      throw error;
    }

    // Check if task status is valid
    if (!taskStatus.includes(status)) {
      throw new Error("Task status is not valid!");
    }

    // If the task is already done, it can only be archived
    if (task.status === "done" && status !== "archive") {
      const error = new Error("Completed tasks can only be archived");
      error.statusCode = 500;
      throw error;
    }

    // Update the task with option to return the latest data
    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      { status },
      {
        new: true,
      }
    );

    res
      .status(StatusCodes.OK)
      .json({ task: updatedTask, message: "Update task successfully!" });
  } catch (err) {
    next(err);
  }
};

// Assign a task to a user when there's a userId. Else, unassign the task
const assignTask = async (req, res, next) => {
  const { id: taskId } = req.params;
  const { assignee: userId } = req.body;

  try {
    // Check for missing data
    if (!taskId) {
      const error = new Error("Missing required data!");
      error.statusCode = 404;
      throw error;
    }

    // Check if the taskId is valid
    if (!isValidObjectId(taskId)) {
      const error = new Error("Task id must be ObjectID!");
      error.statusCode = 400;
      throw error;
    }

    const task = await Task.findById(taskId);

    // Check if the task exists
    if (!task || task.isDeleted) {
      const error = new Error("Task does not exist!");
      error.statusCode = 500;
      throw error;
    }

    // If there is a userId in the request body, assign the task to the user
    if (userId) {
      // Check if the userId is valid
      if (!isValidObjectId(userId)) {
        const error = new Error("User id must be ObjectID!");
        error.statusCode = 400;
        throw error;
      }

      const user = await User.findById(userId);

      // Check if the user exists
      if (!user || user.isDeleted) {
        const error = new Error("User does not exist!");
        error.statusCode = 500;
        throw error;
      }

      // Update the task with the new assignee and an option to return the latest data
      const updatedTask = await Task.findByIdAndUpdate(
        taskId,
        { assignee: userId },
        { new: true }
      );

      // Update the user with the new task and an option to return the latest data
      user.tasks.push(taskId);
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { tasks: user.tasks },
        { new: true }
      );

      res.status(StatusCodes.OK).json({
        task: updatedTask,
        user: updatedUser,
        message: "Assign task successfully!",
      });
    } else {
      // else, unassign the task
      const updatedTask = await Task.findByIdAndUpdate(
        taskId,
        { $unset: { assignee: "" } },
        { new: true }
      );

      res.status(StatusCodes.OK).json({
        task: updatedTask,
        message: "Unassign task successfully!",
      });
    }
  } catch (err) {
    next(err);
  }
};

// Delete a task
const deleteTask = async (req, res, next) => {
  const { id: taskId } = req.params;

  try {
    // Check for missing data
    if (!taskId) {
      const error = new Error("Missing required data!");
      error.statusCode = 404;
      throw error;
    }

    // Check if taskId is valid
    if (!isValidObjectId(taskId)) {
      const error = new Error("Task id must be ObjectID!");
      error.statusCode = 400;
      throw error;
    }

    const task = await Task.findById(taskId);

    // Check if the task exists
    if (!task || task.isDeleted) {
      const error = new Error("Task does not exist!");
      error.statusCode = 500;
      throw error;
    }

    // Soft delete - still keep the task in the database
    const deletedTask = await Task.findByIdAndUpdate(
      taskId,
      { isDeleted: true },
      { new: true }
    );

    res
      .status(StatusCodes.OK)
      .json({ task: deletedTask, message: "Delete task successfully!" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createTask,
  getTasks,
  getSingleTask,
  updateTask,
  assignTask,
  deleteTask,
};
