const express = require("express");
const router = express.Router();
const { StatusCodes } = require("http-status-codes");
const userRoute = require("./userRoute");
const taskRoute = require("./taskRoute");

router.get("/", function(req, res) {
  res.status(StatusCodes.OK).json({ message: "Welcome to CoderManagement!" });
});

// USER
router.use("/users", userRoute);

// TASK
router.use("/tasks", taskRoute);

module.exports = router;
