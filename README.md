# HostelHub — Room Allotment Backend Management System

[![Group](https://img.shields.io/badge/Group-NU--AIAGAI2C--G10-blue.svg)](file:///C:/Users/dileep/.gemini/antigravity/scratch/hostelhub)
[![Theme](https://img.shields.io/badge/Theme-10%20of%2030%20(Room%20Allotment)-green.svg)](file:///C:/Users/dileep/.gemini/antigravity/scratch/hostelhub)
[![Course](https://img.shields.io/badge/Course-Backend%20Development%20Fundamentals-orange.svg)](file:///C:/Users/dileep/.gemini/antigravity/scratch/hostelhub)
[![Tests](https://img.shields.io/badge/Tests-15%2F15%20Passing-brightgreen.svg)](file:///C:/Users/dileep/.gemini/antigravity/scratch/hostelhub)

---

## 1. Project Overview & Problem Statement

> **Client Brief Scenario:**  
> *"Rooms are allotted from a paper file. The warden cannot quickly tell which rooms are free in each block. Please build us a system that fixes this."*

**HostelHub** is a production-ready RESTful backend built with **Node.js, Express, and SQLite** that replaces paper-based room tracking with an automated, queryable system. 

### Key Capabilities
- **Room Management & Search**: Complete CRUD operations for rooms (`name`, `block`, `capacity`) with query parameter filtering (e.g. `GET /rooms?block=Block A`) and a dedicated free-rooms inspection endpoint (`GET /rooms/free`) for wardens.
- **Relational Integrity**: 3 SQLite tables (`residents`, `rooms`, `allotments`) linked with foreign keys and cascade rules.
- **Join Endpoint**: Comprehensive join endpoint (`GET /allotments`) providing allotment records enriched with resident names and room names.
- **Input Validation**: Robust validation middleware checking required fields and data types, returning clear 400 Bad Request error responses.
- **The Twist (Return Flow)**:
  1. `POST /allotments/:id/return` records the return date and releases room occupancy.
  2. Returning an already returned allotment responds with **HTTP 409 Conflict** and the message `"Already returned"`.
  3. `GET /residents/:id/history` queries and returns the resident's historical returned allotments.

---

## 2. Team Member Division (Parts 1 to 6)

| Part | Role & Responsibilities | Assigned Member | Implemented Files |
| :--- | :--- | :--- | :--- |
| **Part 1** | **Server and Routes**<br>Express server initialization, middleware stack, error handling, status code conventions | Member 1 | `src/server.js`, `src/app.js` |
| **Part 2** | **Database Architecture**<br>3 related SQLite tables (`residents`, `rooms`, `allotments`), schema DDL, query helpers, seed data | Member 2 | `src/db/database.js`, `src/db/seed.js` |
| **Part 3** | **REST Endpoints**<br>CRUD endpoints for rooms, residents, allotments, and the mandatory multi-table JOIN endpoint | Member 3 | `src/routes/rooms.js`, `src/routes/allotments.js` |
| **Part 4** | **Validation & Search**<br>Body validation for add/update, standard error payloads, and query param search by block | Member 4 | `src/middleware/validation.js`, `src/routes/rooms.js` |
| **Part 5** | **Twist Rule & Return Flow**<br>Return flow logic (`409 Already returned`), resident history endpoint, automated test suite | Member 5 | `src/routes/allotments.js`, `src/routes/residents.js`, `test/api.test.js` |
| **Part 6** | **Postman & Documentation**<br>Postman collection with automated test scripts, documentation, and demo day script | Member 6 | `HostelHub.postman_collection.json`, `README.md` |

---

## 3. Directory Structure

```text
hostelhub/
├── package.json                          # Dependencies and npm scripts
├── README.md                             # Comprehensive project documentation & demo guide
├── HostelHub.postman_collection.json     # Postman collection (v2.1) with test assertions
├── .gitignore                            # Ignores node_modules and local SQLite databases
├── src/
│   ├── server.js                         # Application entrypoint & HTTP server listener
│   ├── app.js                            # Express app configuration & middleware routing
│   ├── mini-express.js                   # Zero-dependency Express-compatible fallback engine
│   ├── db/
│   │   ├── database.js                   # Unified SQLite driver (supports sqlite3 & node:sqlite)
│   │   └── seed.js                       # Sample data populator for rooms, residents & allotments
│   ├── routes/
│   │   ├── rooms.js                      # Room CRUD, block search & free-room queries
│   │   ├── residents.js                  # Resident endpoints & allotment history
│   │   └── allotments.js                 # Allotment creation, JOIN view & return flow twist
│   └── middleware/
│       └── validation.js                 # Request payload validation guards
└── test/
    └── api.test.js                       # 15 automated verification tests (covers Twist Tests 1-3)
```

---

## 4. Setup & Running Instructions

### Prerequisites
- Node.js (v18, v20, v22, or v24)
- npm (v9+) or any standard terminal

### Step 1: Clone or Navigate to the Project
```bash
cd C:\Users\dileep\.gemini\antigravity\scratch\hostelhub
```

### Step 2: Install Dependencies
```bash
npm install
```
*(Note: The codebase contains a built-in fallback engine, so the server and automated test suite can execute immediately even before `npm install` is executed!)*

### Step 3: Seed the Database
Populate the SQLite database with sample rooms across Block A, Block B, and Block C, residents, and initial allotments:
```bash
npm run seed
```

### Step 4: Start the Server
```bash
npm start
```
The server will start on `http://localhost:3000`.

### Step 5: Run Automated Tests
```bash
npm test
```
All **15 tests** will execute and report passing status:
```text
========================================================
 RUNNING HOSTELHUB VERIFICATION TEST SUITE (NU-AIAGAI2C-G10)
========================================================
  [PASS] Server root GET / returns 200 and project metadata
  [PASS] GET /rooms returns 200 and room list
  [PASS] Search by query parameter: GET /rooms?block=Block A
  [PASS] GET /rooms/:id returns 200 for existing room
  [PASS] GET /rooms/:id returns 404 for non-existing room
  [PASS] POST /rooms creates new room and returns 201
  [PASS] POST /rooms fails with 400 when name is missing (Validation)
  [PASS] POST /rooms fails with 400 when block is missing (Validation)
  [PASS] PUT /rooms/:id updates room and returns 200
  [PASS] DELETE /rooms/:id deletes room and returns 200
  [PASS] One join endpoint: GET /allotments joins resident name and room name
  [PASS] GET /rooms/free returns only unallotted rooms

--- VERIFYING BRIEF TWIST TESTS ---
  [PASS] Test 1: Return a allotment -> 200
  [PASS] Test 2: Return it again -> 409 and message "Already returned"
  [PASS] Test 3: GET /residents/1/history -> 200, it is listed
========================================================
 TEST RESULTS: 15 PASSED, 0 FAILED
========================================================
```

---

## 5. API Reference & Status Codes

### 5.1 Rooms Endpoints
| Method | Endpoint | Description | Status Codes |
| :--- | :--- | :--- | :--- |
| `GET` | `/rooms` | Get all rooms. Supports query search: `?block=Block A` or `?name=101` | `200 OK` |
| `GET` | `/rooms/free` | Helper for warden: lists only unoccupied rooms, filterable by `?block=` | `200 OK` |
| `GET` | `/rooms/:id` | Get room by ID | `200 OK`, `404 Not Found` |
| `POST` | `/rooms` | Add room (`name`, `block`, optional `capacity`) | `201 Created`, `400 Bad Request` |
| `PUT` | `/rooms/:id` | Update existing room | `200 OK`, `400 Bad Request`, `404 Not Found` |
| `DELETE`| `/rooms/:id` | Delete a room | `200 OK`, `404 Not Found` |

### 5.2 Residents Endpoints
| Method | Endpoint | Description | Status Codes |
| :--- | :--- | :--- | :--- |
| `GET` | `/residents` | List all residents | `200 OK` |
| `GET` | `/residents/:id` | Get single resident by ID | `200 OK`, `404 Not Found` |
| `POST` | `/residents` | Register a new resident (`name`, `email`, `phone`) | `201 Created`, `400 Bad Request` |
| `GET` | `/residents/:id/history` | **Twist Test 3**: List returned allotments for resident `:id` | `200 OK`, `404 Not Found` |

### 5.3 Allotments Endpoints
| Method | Endpoint | Description | Status Codes |
| :--- | :--- | :--- | :--- |
| `GET` | `/allotments` | **Mandatory Join Endpoint**: Allotments joined with `resident_name` & `room_name` | `200 OK` |
| `GET` | `/allotments/:id` | Single allotment with joined resident and room details | `200 OK`, `404 Not Found` |
| `POST` | `/allotments` | Create new allotment (`resident_id`, `room_id`, optional `allotment_date`) | `201 Created`, `400 Bad Request`, `409 Conflict` |
| `POST` | `/allotments/:id/return` | **Twist Tests 1 & 2**: Set return date. Returns `409` on second return | `200 OK`, `404 Not Found`, `409 Conflict` |

---

## 6. Detailed Twist Walkthrough (Return Flow)

The assignment twist requires custom stateful return logic for hostel rooms:

### Test 1: Return an Allotment (`POST /allotments/1/return`)
- **Request**:
  ```http
  POST /allotments/1/return HTTP/1.1
  Host: localhost:3000
  Content-Type: application/json

  {
    "return_date": "2026-11-14T12:00:00Z"
  }
  ```
- **Response**: `200 OK`
  ```json
  {
    "message": "Room allotment successfully returned.",
    "allotment": {
      "id": 1,
      "resident_id": 1,
      "resident_name": "Alex Johnson",
      "room_id": 1,
      "room_name": "Room 101",
      "room_block": "Block A",
      "allotment_date": "2026-11-01T09:00:00Z",
      "return_date": "2026-11-14T12:00:00Z",
      "status": "returned"
    }
  }
  ```

### Test 2: Return It Again (`POST /allotments/1/return`)
- **Request**:
  ```http
  POST /allotments/1/return HTTP/1.1
  Host: localhost:3000
  Content-Type: application/json

  {}
  ```
- **Response**: `409 Conflict`
  ```json
  {
    "message": "Already returned",
    "error": "Conflict",
    "returned_at": "2026-11-14T12:00:00Z"
  }
  ```

### Test 3: List Resident's Returned Allotments (`GET /residents/1/history`)
- **Request**:
  ```http
  GET /residents/1/history HTTP/1.1
  Host: localhost:3000
  ```
- **Response**: `200 OK`
  ```json
  [
    {
      "allotment_id": 1,
      "resident_id": 1,
      "resident_name": "Alex Johnson",
      "room_id": 1,
      "room_name": "Room 101",
      "room_block": "Block A",
      "allotment_date": "2026-11-01T09:00:00Z",
      "return_date": "2026-11-14T12:00:00Z"
    },
    {
      "allotment_id": 2,
      "resident_id": 1,
      "resident_name": "Alex Johnson",
      "room_id": 2,
      "room_name": "Room 102",
      "room_block": "Block A",
      "allotment_date": "2026-10-01T09:00:00Z",
      "return_date": "2026-10-31T18:00:00Z"
    }
  ]
  ```

---

## 7. Postman Collection Testing Guide

1. Open **Postman**.
2. Click **Import** (top left).
3. Select the file: [`HostelHub.postman_collection.json`](file:///C:/Users/dileep/.gemini/antigravity/scratch/hostelhub/HostelHub.postman_collection.json).
4. Notice the pre-configured variable `baseUrl` set to `http://localhost:3000`.
5. Run the **"1. Twist Return Flow (The Required Tests)"** folder in Postman Collection Runner to see all 3 Twist tests pass with green assertions!

---

## 8. Demo Day Guide (Mon 16 Nov — 3-Minute Live Demo)

### 3-Minute Live Demo Walkthrough
- **Minute 0:00 – 0:45 (The Problem & Architecture)**:
  - *"Our client's warden managed room allotments on paper and couldn't see which rooms were vacant in each block. We built HostelHub using Node.js, Express, and a relational SQLite database with 3 linked tables."*
  - Show `GET /rooms/free?block=Block A` to demonstrate how the warden instantly sees free rooms in Block A.
- **Minute 0:45 – 1:30 (CRUD, Search & Validation)**:
  - Demonstrate `GET /rooms?block=Block A` (search query parameter).
  - Demonstrate `POST /rooms` with missing fields showing `400 Bad Request` validation error, followed by valid room creation with `201 Created`.
  - Demonstrate the multi-table JOIN endpoint `GET /allotments`, showing resident name and room name in a single query.
- **Minute 1:30 – 2:45 (The Twist Return Flow Tests)**:
  - Execute **Test 1**: `POST /allotments/1/return` -> shows `200 OK` and sets return date.
  - Execute **Test 2**: `POST /allotments/1/return` again -> shows `409 Conflict` with `"Already returned"`.
  - Execute **Test 3**: `GET /residents/1/history` -> shows `200 OK` listing the returned allotment with room and date details.
- **Minute 2:45 – 3:00 (Conclusion & Testing)**:
  - Run `npm test` in the terminal to show all 15 automated tests passing.

### Individual Member Q&A Preparation

- **Question for Part 1 (Server & Routes)**:  
  *Q: "How did you structure the Express application and handle unhandled routes?"*  
  *A:* "We separated server startup (`server.js`) from application setup (`app.js`). We mounted modular sub-routers (`/rooms`, `/residents`, `/allotments`) and used a catch-all 404 handler along with an error-handling middleware (`err, req, res, next`) returning appropriate HTTP status codes."

- **Question for Part 2 (Database)**:  
  *Q: "What are the relationships between the 3 tables and how do foreign keys behave?"*  
  *A:* "The `allotments` table is a junction table referencing `residents(id)` and `rooms(id)` via foreign keys. It stores `allotment_date` and `return_date`. When `return_date` is `NULL`, the room is actively occupied."

- **Question for Part 3 (REST Endpoints)**:  
  *Q: "How does the JOIN endpoint work?"*  
  *A:* "In `GET /allotments`, we execute an inner `JOIN` between `allotments`, `residents`, and `rooms`. We alias `residents.name AS resident_name` and `rooms.name AS room_name` so the consumer receives flat, human-readable records without extra network roundtrips."

- **Question for Part 4 (Validation & Search)**:  
  *Q: "How do you handle invalid inputs and block filtering?"*  
  *A:* "We created express middleware (`validateRoom`, `validateResident`, `validateAllotment`) that checks for empty strings or invalid types before hitting the database, returning `400 Bad Request` with structured error JSON. For search, we read `req.query.block` and use SQLite's `LIKE ?` operator for case-insensitive filtering."

- **Question for Part 5 (Twist Rule)**:  
  *Q: "Explain how you prevented double returns and verified Test 2."*  
  *A:* "When `POST /allotments/:id/return` is invoked, we first select the allotment by ID. If `return_date` is already populated, we halt execution and immediately return HTTP `409 Conflict` with `{ message: 'Already returned' }`. Otherwise, we update `return_date` to the current timestamp and return `200 OK`."

- **Question for Part 6 (Postman & README)**:  
  *Q: "How does the Postman collection assert the assignment requirements?"*  
  *A:* "We structured the collection with environment variables (`{{baseUrl}}`) and JavaScript test scripts (`pm.test()`, `pm.expect()`) checking HTTP status codes (200, 201, 400, 404, 409), JSON payload structures, and specific error messages."

---

## 9. Submission Checklist (Hand In by Sun 15 Nov)

- [x] Express server with modular routes for `residents`, `rooms`, and `allotments`
- [x] SQLite database with 3 related tables and foreign keys
- [x] CRUD operations for rooms (`GET all`, `GET :id`, `POST`, `PUT`, `DELETE`) with proper HTTP status codes
- [x] One JOIN endpoint (`GET /allotments`) combining allotments, resident name, and room name
- [x] Input validation on add and update returning clear `400` error messages
- [x] Search by query parameter (`GET /rooms?block=Block A`)
- [x] Twist Rule: `POST /allotments/:id/return` returning `409` and `"Already returned"` on double return
- [x] Twist Rule: `GET /residents/:id/history` listing returned allotments
- [x] Postman Collection (`HostelHub.postman_collection.json`) with automated tests
- [x] Automated test suite (`test/api.test.js`) with 15/15 tests passing
- [x] Comprehensive `README.md` with member division table and 3-minute demo script
