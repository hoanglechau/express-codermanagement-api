const Task = require("../models/Task");
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
  const { name, description, status, user_name } = req.body;

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
    const tasks = await Task.find({});
    if (tasks.filter(item => (item.name = name))) {
      const error = new Error("Task already exists!");
      error.statusCode = 404;
      throw error;
    }

    // Create a new task
    const task = await Task.create(req.body);

    // Add task to the task collection
    // If user_name is included in the request body, the new task will be assigned to that user
    // $addToSet operator adds a value to an array unless the value is already present, in which case $addToSet does nothing to that array
    await Task.findByIdAndUpdate(user_name, {
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
  const filter = req.query.filter ? req.query.filter : {};
  const limit = req.params.limit ? req.params.limit : 10;

  try {
    const skip = (Number(page) - 1) * Number(limit);

    const tasks = await Task.find(filter).populate("user_name");
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
    const task = await Task.findById(taskId).populate("user_name");

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
    const updatedTask = await Task.findByIdAndUpdate(taskId, req.body, {
      new: true,
    });

    res
      .status(StatusCodes.OK)
      .json({ task: updatedTask, message: "Update task successfully!" });
  } catch (err) {
    next(err);
  }
};

// Assign a task to a user
const assignTask = async (req, res, next) => {
  const { id: taskId } = req.params;
  const { user_name: user } = req.body;

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

    // Update the task with the new user_name and an option to return the latest data
    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      { user_name: user },
      { new: true }
    );

    res
      .status(StatusCodes.OK)
      .json({ task: updatedTask, message: "Assign task successfully!" });
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
