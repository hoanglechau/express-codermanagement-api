const express = require("express");
const { body } = require("express-validator");
const {
  createUser,
  getSingleUserByName,
  getUserTasks,
  getUsers,
  updateUser,
  deleteUser,
} = require("../controllers/user");
const router = express.Router();

// CREATE
/**
 * @route POST api/users
 * @description Create a new user
 * @access private, manager
 * @requiredBody: name
 */
router.post("/", body("name").isString(), createUser);

// READ
/**
 * @route GET api/users
 * @description Get a list of users
 * @access private
 * @allowedQueries: name
 */
router.get("/", getUsers);

// READ
/**
 * @route GET api/users/:id/tasks
 * @description Get all tasks of a user
 * @access public
 */
router.get("/:id/tasks", getUserTasks);

// READ
/**
 * @route GET api/users/:name
 * @description Get user by name
 * @access public
 */
router.get("/:name", getSingleUserByName);

// UPDATE
/**
 * @route PUT api/users/:id
 * @description Update user's information
 * @access private, manager
 * @requiredBody: name, role (optional)
 */
router.put("/:id", updateUser);

// DELETE
/**
 * @route DELETE api/users/:id
 * @description Delete user by id
 * @access private, manager
 */
router.delete("/:id", deleteUser);

module.exports = router;
