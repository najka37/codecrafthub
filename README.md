# The CodeCraftHub learning management system (LMS)

A simple REST API to track your personal learning goals and courses.

## Overview

CodeCraftHub helps developers keep track of courses they want to learn. Built with Node.js and Express, the platform provides a straightforward REST API for managing your learning journey. Course data is stored in `courses.json`; no database or user accounts are required.

## Features

- Full CRUD operations for courses
- JSON file-based storage (no database needed)
- RESTful API design
- Automatically creates `courses.json` when the app first runs
- Automatically assigns numeric IDs and creation timestamps
- Validates required fields, dates, and course statuses
- Handles missing courses and file or request errors

## Installation

Clone or download the project, then open a terminal in the project directory. Install the Node.js dependencies:

```bash
npm install
```

## Running the application

Start the Express server:

```bash
npm start
```

The server uses port 5000 by default. It prints the data file path and API URL when it starts. The API will be available at `http://localhost:5000`.

## API endpoint documentation

All endpoints use JSON. Each course has a generated `id` and `created_at`, plus `name`, `description`, `target_date`, and `status`. The target date must be a valid `YYYY-MM-DD` date. Status must be `Not Started`, `In Progress`, or `Completed`.

### 1. Add a course

`POST /api/courses`

```bash
curl -X POST http://localhost:5000/api/courses \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Python Basics",
    "description": "Learn Python fundamentals",
    "target_date": "2025-12-31",
    "status": "Not Started"
  }'
```

### 2. Get all courses

`GET /api/courses`

```bash
curl http://localhost:5000/api/courses
```

### 3. Get course statistics

`GET /api/courses/stats`

```bash
curl http://localhost:5000/api/courses/stats
```

Example response:

```json
{
  "total": 3,
  "by_status": {
    "Not Started": 1,
    "In Progress": 1,
    "Completed": 1
  }
}
```

### 4. Get a specific course

`GET /api/courses/<id>`

Replace `<id>` with a course's numeric ID, such as `1`:

```bash
curl http://localhost:5000/api/courses/1
```

### 5. Update a course

`PUT /api/courses/<id>`

The API accepts only the fields being changed and keeps the remaining values. For example:

```bash
curl -X PUT http://localhost:5000/api/courses/1 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "In Progress"
  }'
```

### 6. Delete a course

`DELETE /api/courses/<id>`

```bash
curl -X DELETE http://localhost:5000/api/courses/1
```

A successful delete returns HTTP `204 No Content`.

## Testing

Start the server first, then run the `curl` examples above from another terminal. Check that the responses are appropriate and that changes persist in `courses.json`. To test validation, submit a course with a missing field, an invalid date, or a status outside the allowed values. To test the not-found response, request or update an ID that does not exist.

In Windows PowerShell, `curl` may refer to `Invoke-WebRequest`, which uses different options. Use `curl.exe` to run the examples as written, or use PowerShell's `Invoke-RestMethod` command.

## Troubleshooting

**Problem:** `Cannot find module 'express'`  
**Solution:** Run `npm install` from the project directory.

**Problem:** Port 5000 is already in use  
**Solution:** Stop the other application using port 5000, or set a different port before starting the app. In PowerShell, for example: `$env:PORT=5001; npm start`.

**Problem:** A request returns `400 Bad Request`  
**Solution:** Include the required course fields when creating a course. Use a real date in `YYYY-MM-DD` format and one of the allowed status values.

**Problem:** A request returns `404 Course not found`  
**Solution:** Check the ID with `GET /api/courses` and use an existing numeric ID.

**Problem:** A request returns `500`  
**Solution:** Check the server terminal for details, ensure the project directory is writable, and confirm `courses.json` contains valid JSON.

## Project structure

```text
codecrafthub/
├── app.js           # Main Express application
├── courses.json     # Data storage (auto-created)
└── package.json     # Dependencies and start script
```
