const express = require("express");
const crypto = require("crypto");
const {
  readCourses,
  writeCourses
} = require("../services/fileStore");

const router = express.Router();

const allowedStatuses = [
  "Not Started",
  "In Progress",
  "Completed"
];

function isValidDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(value));
}

function validateCourseFields(body, partial = false) {
  const errors = [];

  if (!partial || body.courseName !== undefined) {
    if (!body.courseName || typeof body.courseName !== "string") {
      errors.push("courseName is required and must be a string");
    }
  }

  if (!partial || body.description !== undefined) {
    if (!body.description || typeof body.description !== "string") {
      errors.push("description is required and must be a string");
    }
  }

  if (!partial || body.targetCompletionDate !== undefined) {
    if (!isValidDate(body.targetCompletionDate)) {
      errors.push(
        "targetCompletionDate must use YYYY-MM-DD format"
      );
    }
  }

  if (body.status !== undefined &&
      !allowedStatuses.includes(body.status)) {
    errors.push(
      `status must be one of: ${allowedStatuses.join(", ")}`
    );
  }

  return errors;
}

// GET /api/courses
router.get("/", async (req, res, next) => {
  try {
    const courses = await readCourses();
    res.json(courses);
  } catch (error) {
    next(error);
  }
});

// GET /api/courses/:id
router.get("/:id", async (req, res, next) => {
  try {
    const courses = await readCourses();
    const course = courses.find((item) => item.id === req.params.id);

    if (!course) {
      return res.status(404).json({
        error: "Course not found"
      });
    }

    res.json(course);
  } catch (error) {
    next(error);
  }
});

// POST /api/courses
router.post("/", async (req, res, next) => {
  try {
    const errors = validateCourseFields(req.body);

    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const courses = await readCourses();
    const now = new Date().toISOString();

    const newCourse = {
      id: crypto.randomUUID(),
      courseName: req.body.courseName,
      description: req.body.description,
      targetCompletionDate: req.body.targetCompletionDate,
      status: req.body.status || "Not Started",
      createdAt: now,
      updatedAt: now
    };

    courses.push(newCourse);
    await writeCourses(courses);

    res.status(201).json(newCourse);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/courses/:id
router.patch("/:id", async (req, res, next) => {
  try {
    const errors = validateCourseFields(req.body, true);

    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const courses = await readCourses();
    const courseIndex = courses.findIndex(
      (item) => item.id === req.params.id
    );

    if (courseIndex === -1) {
      return res.status(404).json({
        error: "Course not found"
      });
    }

    const updatedCourse = {
      ...courses[courseIndex],
      ...req.body,
      updatedAt: new Date().toISOString()
    };

    courses[courseIndex] = updatedCourse;
    await writeCourses(courses);

    res.json(updatedCourse);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/courses/:id
router.delete("/:id", async (req, res, next) => {
  try {
    const courses = await readCourses();
    const courseIndex = courses.findIndex(
      (item) => item.id === req.params.id
    );

    if (courseIndex === -1) {
      return res.status(404).json({
        error: "Course not found"
      });
    }

    courses.splice(courseIndex, 1);
    await writeCourses(courses);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
