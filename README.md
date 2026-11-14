# HostelHub — Room Allotment Backend Management System

[![Group](https://img.shields.io/badge/Group-NU--AIAGAI2C-G10-blue.svg)](file:///C:/Users/dileep/.gemini/antigravity/scratch/hostelhub)
[![Theme](https://img.shields.io/badge/Theme-10%20of%2030%20(Room%20Allotment)-green.svg)](file:///C:/Users/dileep/.gemini/antigravity/scratch/hostelhub)
[![Course](https://img.shields.io/badge/Course-Backend%20Development%20Fundamentals-orange.svg)](file:///C:/Users/dileep/.gemini/antigravity/scratch/hostelhub)
[![Tests](https://img.shields.io/badge/Tests-15%2F15%20Passing-brightgreen.svg)](file:///C:/Users/dileep/.gemini/antigravity/scratch/hostelhub)

---

## 1. Project Overview & Problem Statement

> **Client Brief Scenario:**  
> *"Rooms are allotted from a paper file. The warden cannot quickly tell which rooms are free in each block. Please build us a system that fixes this."*

**HostelHub** is a clean, production-ready RESTful backend built with **Node.js, Express, and SQLite** in an **all-in-one single folder structure**.

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

| Part | Role & Responsibilities | Assigned Member | Implemented Sections in `server.js` |
| :--- | :--- | :--- | :--- |
| **Part 1** | **Server and Routes**<br>Express server initialization, middleware stack, error handling, status code conventions | Member 1 | `server.js` (Part 1 Section) |
| **Part 2** | **Database Architecture**<br>3 related SQLite tables (`residents`, `rooms`, `allotments`), schema DDL, query helpers, auto-seed data | Member 2 | `server.js` (Part 2 Section) |
| **Part 3** | **REST Endpoints**<br>CRUD endpoints for rooms, residents, allotments, and the mandatory multi-table JOIN endpoint | Member 3 | `server.js` (Part 3 Section) |
| **Part 4** | **Validation & Search**<br>Body validation for add/update, standard error payloads, and query param search by block | Member 4 | `server.js` (Part 4 Section) |
| **Part 5** | **Twist Rule & Return Flow**<br>Return flow logic (`409 Already returned`), resident history endpoint, test suite | Member 5 | `server.js` (Part 5 Section), `test.js` |
| **Part 6** | **Postman & Documentation**<br>Postman collection with automated test scripts, documentation, and demo day script | Member 6 | `HostelHub.postman_collection.json`, `README.md` |

---

## 3. Single-Folder Directory Structure

All files reside directly in one single root directory:

```text
hostelhub/
├── server.js                             # Complete Express server (Parts 1 to 5)
├── test.js                               # Automated test suite (15 tests, Twist Tests 1-3)
├── package.json                          # Dependencies & npm run scripts (start, test, dev)
├── README.md                             # Comprehensive project documentation & demo guide
├── HostelHub.postman_collection.json     # Postman collection (v2.1) with test assertions
├── HostelHub_Submission_NU-AIAGAI2C-G10.zip # Submission zip ready to upload to ERP
├── .gitignore                            # Ignores local databases and dependencies
└── hostelhub.db                          # Generated SQLite database file
```

---

## 4. Setup & Running Instructions

### Step 1: Open Terminal in the Project Folder
```bash
cd C:\Users\dileep\.gemini\antigravity\scratch\hostelhub
```

### Step 2: Install Dependencies (Optional)
```bash
npm install
```
*(Note: `server.js` includes a smart built-in engine, so it runs immediately out-of-the-box with Node.js even before `npm install` is run!)*

### Step 3: Run the Server
```bash
npm start
# OR directly:
node server.js
```
The server will start on `http://localhost:3000`.

### Step 4: Run the Automated Verification Tests
```bash
npm test
# OR directly:
node test.js
```
All **15 tests** pass:
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

- **Test 1 (`POST /allotments/1/return`)**: Sets return date, returns `200 OK`.
- **Test 2 (`POST /allotments/1/return` again)**: Returns `409 Conflict` with `{ "message": "Already returned" }`.
- **Test 3 (`GET /residents/1/history`)**: Returns `200 OK` listing the returned allotment with room and date details.

---

## 7. Demo Day Guide (Mon 16 Nov — 3-Minute Live Demo)

- **Minute 0:00 – 0:45 (The Problem & Architecture)**:
  - Explain the warden's paper-file problem and how HostelHub's 3 linked tables solve it.
  - Show `GET /rooms/free?block=Block A` to demonstrate instant vacant room lookup.
- **Minute 0:45 – 1:30 (CRUD, Search & Validation)**:
  - Demonstrate `GET /rooms?block=Block A` (query search).
  - Demonstrate validation on `POST /rooms` returning `400 Bad Request`, then valid creation returning `201 Created`.
  - Demonstrate the multi-table JOIN endpoint `GET /allotments`.
- **Minute 1:30 – 2:45 (The Twist Return Flow Tests)**:
  - Run Test 1: `POST /allotments/1/return` -> `200 OK`.
  - Run Test 2: `POST /allotments/1/return` -> `409 Conflict` with `"Already returned"`.
  - Run Test 3: `GET /residents/1/history` -> `200 OK` showing historical allotments.
- **Minute 2:45 – 3:00 (Conclusion & Testing)**:
  - Run `node test.js` in terminal showing 15/15 tests passing.
