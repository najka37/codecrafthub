const fs = require("fs/promises");
const path = require("path");

const dataDirectory = path.join(__dirname, "../../data");
const dataFile = path.join(dataDirectory, "courses.json");

async function readCourses() {
  try {
    const fileContents = await fs.readFile(dataFile, "utf8");
    if (fileContents.trim() === "") {
      return [];
    }

    return JSON.parse(fileContents);
  } catch (error) {
    if (error.code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

async function writeCourses(courses) {
  await fs.mkdir(dataDirectory, { recursive: true });

  // Writing to a temporary file helps reduce the chance of a corrupted file.
  const temporaryFile = `${dataFile}.tmp`;

  await fs.writeFile(
    temporaryFile,
    JSON.stringify(courses, null, 2),
    "utf8"
  );

  await fs.rename(temporaryFile, dataFile);
}

module.exports = {
  readCourses,
  writeCourses
};
