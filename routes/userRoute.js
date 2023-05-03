const express = require("express");
const { body } = require("express-validator");
const {
  createUser,
  getSingleUserById,
  getSingleUserByName,
  getUsers,
  editUser,
  deleteUser,
} = require("../controllers/user.controller");
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
 * @route GET api/users/:id
 * @description Get user by id
 * @access public
 */
router.get("/:id", getSingleUserById);

// READ
/**
 * @route GET api/users/:id
 * @description Get user by id
 * @access public
 */
router.get("/:name", getSingleUserByName);

// UPDATE
/**
 * @route PUT api/users/:id
 * @description Update user's information
 * @access private, manager
 * @requiredBody: updateinfo
 */
router.put("/:id", editUser);

// DELETE
/**
 * @route DELETE api/users/:id
 * @description Delete user by id
 * @access private, manager
 */
router.delete("/:id", deleteUser);

module.exports = router;
