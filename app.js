require("dotenv").config();
const express = require("express");
const path = require("path");

// Middlewares
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const cors = require("cors");
const helmet = require("helmet");
const notFound = require("./middlewares/not-found");
const errorHandler = require("./middlewares/error-handler");

// Routers
const indexRouter = require("./routes/index");

// Database
const connectDB = require("./db/connect");

const app = express();

app.use(cors());
app.use(helmet());
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.use("/", indexRouter);

// 404 error
app.use(notFound);

// Error handler
app.use(errorHandler);

// Connect to database and start server
const port = process.env.PORT || 5000;
const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    app.listen(port, console.log(`Server is listening on port ${port}...`));
  } catch (error) {
    console.log(error);
  }
};

start();

module.exports = app;
