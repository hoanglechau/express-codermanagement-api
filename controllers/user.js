const User = require("../models/User");
const { CustomError } = require("../utils/helpers");
const { validationResult } = require("express-validator");
const { StatusCodes } = require("http-status-codes");
const roleType = ["employee", "manager"];

const ObjectId = require("mongoose").Types.ObjectId;

// Check if the id is valid
const isValidObjectId = id => {
  if (ObjectId.isValid(id)) {
    if (String(new ObjectId(id)) === id) {
      return true;
    }
    return false;
  }
  return false;
};

// Create a new user
const createUser = async (req, res, next) => {
  let { name, role } = req.body;
  const errors = validationResult(req);

  try {
    // Check if the required data is missing
    if (!errors.isEmpty()) {
      throw new CustomError(
        402,
        "Bad Request",
        "Error: Missing required data!"
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ name });
    if (existingUser) {
      const error = new Error("User already exists!");
      error.statusCode = 404;
      throw error;
    }

    // If no role is chosen, default to employee
    if (!role) {
      role = "employee";
    }

    // Check if role type is correct
    if (!roleType.includes(role)) {
      throw new CustomError(
        402,
        "Bad Request",
        "Error: Role must be employee or manager!"
      );
    }

    // Create new user
    const user = await User.create(req.body);
    res
      .status(StatusCodes.CREATED)
      .json({ user, message: "Create user successfully!" });
  } catch (err) {
    next(err);
  }
};

// Get all users
const getUsers = async (req, res, next) => {
  const page = req.query.page ? req.query.page : 1;
  const filter = req.query ? req.query : {};
  const limit = req.query.limit ? req.query.limit : 10;

  try {
    const skip = (Number(page) - 1) * Number(limit);

    // Population is the process of automatically replacing the specified paths in the document with document(s) from other collection(s). We may populate a single document, multiple documents, a plain object, multiple plain objects, or all objects returned from a query
    const users = await User.find(filter).populate("tasks");
    const result = users
      .filter(item => item.isDeleted != true)
      .slice(skip, Number(limit) + skip);

    res.status(StatusCodes.OK).json({
      users: result,
      page,
      total: result.length,
      message: "Get users successfully!",
    });
  } catch (err) {
    next(err);
  }
};

// Get a single user by name
const getSingleUserByName = async (req, res, next) => {
  const name = req.params.name.toLowerCase();

  try {
    // Check if the required data is missing
    if (!name) {
      const error = new Error("Missing name of user!");
      error.statusCode = 404;
      throw error;
    }

    // Find the user by name
    const users = await User.find({}).populate("tasks");
    const user = users.filter(item => item.name.toLowerCase() === name);

    // Check if the user exists
    if (!user || user.isDeleted) {
      const error = new Error("User does not exist!");
      error.statusCode = 500;
      throw error;
    }

    res
      .status(StatusCodes.OK)
      .json({ user, message: "Get user successfully!" });
  } catch (err) {
    next(err);
  }
};

// Get all tasks of a user
const getUserTasks = async (req, res, next) => {
  const { id: userId } = req.params;

  try {
    // Check if the required data is missing
    if (!userId) {
      const error = new Error("Missing required data!");
      error.statusCode = 404;
      throw error;
    }
    // Find the user by id
    const user = await User.findOne({ _id: userId });

    // Check if the user exists
    if (!user || user.isDeleted) {
      const error = new Error("User does not exist!");
      error.statusCode = 500;
      throw error;
    }

    res
      .status(StatusCodes.OK)
      .json({ tasks: user.tasks, message: "Get user's tasks successfully!" });
  } catch (err) {
    next(err);
  }
};

// Update a user
const updateUser = async (req, res, next) => {
  const userId = req.params.id;
  const { name, role } = req.body;

  try {
    if (!userId) {
      const error = new Error("Missing required data.");
      error.statusCode = 404;
      throw error;
    }

    if (!isValidObjectId(userId)) {
      const error = new Error("Id must be ObjectID");
      error.statusCode = 400;
      throw error;
    }
    const user = await User.findById(userId);

    // Check for missing data
    if (!name || !role) {
      const error = new Error("Missing required data!");
      error.statusCode = 404;
      throw error;
    }

    // Check if the user exists
    if (!user || user.isDeleted) {
      const error = new Error("User does not exist!");
      error.statusCode = 500;
      throw error;
    }

    // Check if the role type is correct
    if (!roleType.includes(role)) {
      throw new Error("Role must be employee or manager!");
    }

    // Update the user, using option new: true to return latest data
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name, role },
      {
        new: true,
      }
    );

    res
      .status(StatusCodes.OK)
      .json({ user: updatedUser, message: "Update user successfully!" });
  } catch (err) {
    next(err);
  }
};

// Delete a user
const deleteUser = async (req, res, next) => {
  const { id: userId } = req.params;

  try {
    // Check for missing data
    if (!userId) {
      const error = new Error("Missing required data!");
      error.statusCode = 404;
      throw error;
    }

    // Check if userId is correct
    if (!isValidObjectId(userId)) {
      const error = new Error("User id must be ObjectID!");
      error.statusCode = 400;
      throw error;
    }

    // Find the user
    const user = await User.findById(userId);

    // Check if the user exists
    if (!user || user.isDeleted) {
      const error = new Error("User does not exist!");
      error.statusCode = 500;
      throw error;
    }

    // Soft delete - still keeps the user in the database
    const deletedUser = await User.findByIdAndUpdate(
      userId,
      { isDeleted: true },
      { new: true }
    );

    res
      .status(StatusCodes.OK)
      .json({ user: deletedUser, message: "Delete user successfully!" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createUser,
  getUsers,
  getSingleUserByName,
  getUserTasks,
  updateUser,
  deleteUser,
};
