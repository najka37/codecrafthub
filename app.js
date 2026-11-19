const express = require("express");
const fs = require("fs/promises");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

// Keep the JSON database beside this file so it is easy to find and back up.
const coursesFile = path.join(__dirname, "courses.json");
const allowedStatuses = ["Not Started", "In Progress", "Completed"];

app.use(express.json());

// Create the data file on the first run. If reading it fails for another
// reason, let the error handler return a useful server error instead.
async function ensureCoursesFile() {
  try {
    await fs.access(coursesFile);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    await fs.writeFile(coursesFile, "[]\n", "utf8");
  }
}

// Read all saved courses from disk.
async function readCourses() {
  await ensureCoursesFile();
  const contents = await fs.readFile(coursesFile, "utf8");
  const courses = JSON.parse(contents);
  if (!Array.isArray(courses)) {
    throw new Error("courses.json must contain a JSON array");
  }
  return courses;
}

// Save the complete course list back to disk.
async function writeCourses(courses) {
  await fs.writeFile(coursesFile, `${JSON.stringify(courses, null, 2)}\n`, "utf8");
}

// Check that a date is a real calendar date written as YYYY-MM-DD.
function isValidDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

// Validate required fields before adding or replacing a course.
function validateCourse(body) {
  const errors = [];
  for (const field of ["name", "description", "target_date", "status"]) {
    if (typeof body[field] !== "string" || body[field].trim() === "") {
      errors.push(`${field} is required and must be a non-empty string`);
    }
  }
  if (body.status !== undefined && !allowedStatuses.includes(body.status)) {
    errors.push(`status must be one of: ${allowedStatuses.join(", ")}`);
  }
  if (body.target_date !== undefined && !isValidDate(body.target_date)) {
    errors.push("target_date must be a valid date in YYYY-MM-DD format");
  }
  return errors;
}

// POST /api/courses — add a course and assign it the next numeric ID.
app.post("/api/courses", async (req, res, next) => {
  try {
    const errors = validateCourse(req.body || {});
    if (errors.length) return res.status(400).json({ errors });

    const courses = await readCourses();
    const nextId = courses.reduce((max, course) => Math.max(max, Number(course.id) || 0), 0) + 1;
    const course = {
      id: nextId,
      name: req.body.name.trim(),
      description: req.body.description.trim(),
      target_date: req.body.target_date,
      status: req.body.status,
      created_at: new Date().toISOString()
    };
    courses.push(course);
    await writeCourses(courses);
    return res.status(201).json(course);
  } catch (error) {
    return next(error);
  }
});

// GET /api/courses — return every saved course.
app.get("/api/courses", async (req, res, next) => {
  try {
    return res.json(await readCourses());
  } catch (error) {
    return next(error);
  }
});

// GET /api/courses/stats — count all courses and group them by status.
// Keep this route before /:id so "stats" is not treated as a course ID.
app.get("/api/courses/stats", async (req, res, next) => {
  try {
    const courses = await readCourses();
    const stats = {
      total: courses.length,
      by_status: {
        "Not Started": 0,
        "In Progress": 0,
        "Completed": 0
      }
    };

    for (const course of courses) {
      if (Object.hasOwn(stats.by_status, course.status)) {
        stats.by_status[course.status] += 1;
      }
    }

    return res.json(stats);
  } catch (error) {
    return next(error);
  }
});

// GET /api/courses/:id — return one course by its numeric ID.
app.get("/api/courses/:id", async (req, res, next) => {
  try {
    const course = (await readCourses()).find((item) => item.id === Number(req.params.id));
    if (!course) return res.status(404).json({ error: "Course not found" });
    return res.json(course);
  } catch (error) {
    return next(error);
  }
});

// PUT /api/courses/:id — update the supplied course fields.
app.put("/api/courses/:id", async (req, res, next) => {
  try {
    const courses = await readCourses();
    const index = courses.findIndex((item) => item.id === Number(req.params.id));
    if (index === -1) return res.status(404).json({ error: "Course not found" });

    // Accept only fields supplied by the caller, keeping the other values.
    const changes = req.body || {};
    const candidate = { ...courses[index], ...changes };
    const errors = validateCourse(candidate);
    if (errors.length) return res.status(400).json({ errors });

    const updated = {
      ...courses[index],
      name: candidate.name.trim(),
      description: candidate.description.trim(),
      target_date: candidate.target_date,
      status: candidate.status
    };
    courses[index] = updated;
    await writeCourses(courses);
    return res.json(updated);
  } catch (error) {
    return next(error);
  }
});

// DELETE /api/courses/:id — remove a course from the JSON file.
app.delete("/api/courses/:id", async (req, res, next) => {
  try {
    const courses = await readCourses();
    const index = courses.findIndex((item) => item.id === Number(req.params.id));
    if (index === -1) return res.status(404).json({ error: "Course not found" });

    courses.splice(index, 1);
    await writeCourses(courses);
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

// Report malformed JSON, corrupt data, and file read/write errors clearly.
app.use((error, req, res, next) => {
  console.error("API error:", error);
  if (res.headersSent) return next(error);
  const status = error instanceof SyntaxError && error.status === 400 ? 400 : 500;
  return res.status(status).json({
    error: status === 400 ? "Invalid JSON request body" : "Unable to process request",
    details: error.message
  });
});

// Start the API only when this file is run directly (not when imported).
if (require.main === module) {
  app.listen(PORT, () => {
    console.log("CodeCraftHub API is starting...");
    console.log(`Data will be stored in: ${coursesFile}`);
    console.log(`API is available at: http://localhost:${PORT}`);
  });
}

module.exports = app;
