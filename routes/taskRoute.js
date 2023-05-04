const express = require("express");
const {
  createTask,
  getSingleTask,
  getTasks,
  updateTask,
  deleteTask,
  assignTask,
} = require("../controllers/task");
const { body } = require("express-validator");
const router = express.Router();

// CREATE
/**
 * @route POST api/tasks
 * @description Create a new task
 * @access private, manager
 * @requiredBody: name
 */
router.post("/", body("name").isString(), createTask);

// READ
/**
 * @route GET api/tasks
 * @description Get a list of tasks
 * @access private
 * @allowedQueries: name, status, assignee
 */
router.get("/", getTasks);

// READ
/**
 * @route GET api/tasks/:id
 * @description Get task by id
 * @access public
 */
router.get("/:id", getSingleTask);

// UPDATE
/**
 * @route PUT api/tasks/:id
 * @description Update task's information
 * @access private, manager
 * @requiredBody: status
 */
router.put("/:id", updateTask);

// UPDATE
/**
 * @route PATCH api/tasks/:id
 * @description Assign tasks or unassign tasks
 * @access private, manager
 * @requiredBody: assignee
 */
router.patch("/:id", assignTask);

// DELETE
/**
 * @route DELETE api/tasks/:id
 * @description Delete tasks by id
 * @access private, manager
 */
router.delete("/:id", deleteTask);

module.exports = router;
