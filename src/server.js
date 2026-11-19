const express = require("express");
const coursesRouter = require("./routes/courses");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Welcome to CodeCraftHub API"
  });
});

app.use("/api/courses", coursesRouter);

// Basic error handler
app.use((error, req, res, next) => {
  console.error(error);

  res.status(500).json({
    error: "Internal server error"
  });
});

app.listen(port, () => {
  console.log(`CodeCraftHub API running at http://localhost:${port}`);
});