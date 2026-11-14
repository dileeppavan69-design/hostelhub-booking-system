# HostelHub — Room Allotment Backend Management System

[![Group](https://img.shields.io/badge/Group-NU--AIAGAI2C--G10-blue.svg)](file:///C:/Users/dileep/.gemini/antigravity/scratch/hostelhub)
[![Lead](https://img.shields.io/badge/Lead-Naveen%20U-informational.svg)](file:///C:/Users/dileep/.gemini/antigravity/scratch/hostelhub)
[![Section](https://img.shields.io/badge/Section-AIAGAI2C-purple.svg)](file:///C:/Users/dileep/.gemini/antigravity/scratch/hostelhub)
[![Card](https://img.shields.io/badge/Card-160%20of%20375-yellow.svg)](file:///C:/Users/dileep/.gemini/antigravity/scratch/hostelhub)
[![Theme](https://img.shields.io/badge/Theme-10%20of%2030%20(Room%20Allotment)-green.svg)](file:///C:/Users/dileep/.gemini/antigravity/scratch/hostelhub)
[![Course](https://img.shields.io/badge/Course-Backend%20Development%20Fundamentals-orange.svg)](file:///C:/Users/dileep/.gemini/antigravity/scratch/hostelhub)
[![Tests](https://img.shields.io/badge/Tests-15%2F15%20Passing-brightgreen.svg)](file:///C:/Users/dileep/.gemini/antigravity/scratch/hostelhub)

---

## 1. Project Identification & Group Details

- **Course:** Backend Development Fundamentals (Modules 1 to 3 · 100 marks)
- **Student Lead / Submitter:** Naveen U
- **Section:** AIAGAI2C
- **Group:** Group 10 of 15 (`NU-AIAGAI2C-G10`)
- **Card Number:** Card 160 of 375
- **Theme 10 of 30:** Room allotment
- **System Name:** **HostelHub**
- **Client Problem Statement:**  
  > *"Rooms are allotted from a paper file. The warden cannot quickly tell which rooms are free in each block. Please build us a system that fixes this."*

---

## 2. Who Does What — 6 Member Division

Each group part is clearly isolated and implemented with dedicated sections:

| Part | Role & Responsibilities | Assigned Member | Implemented File / Section |
| :--- | :--- | :--- | :--- |
| **Part 1** | **Server and Routes**<br>Express server initialization, routing setup, status codes, 404 & error handlers | **Naveen U** (Lead) | `server.js` (Part 1: Lines 1–160) |
| **Part 2** | **Database Architecture**<br>SQLite database schema (`residents`, `rooms`, `allotments`), foreign key cascades, seed data | **Member 2** | `server.js` (Part 2: Lines 161–280) |
| **Part 3** | **REST Endpoints**<br>CRUD endpoints for rooms (`name`, `block`), residents, and the multi-table `JOIN` endpoint | **Member 3** | `server.js` (Part 3: Lines 330–480) |
| **Part 4** | **Validation & Search**<br>Input validation middleware (`validateRoom`, `validateResident`, `validateAllotment`), block search query | **Member 4** | `server.js` (Part 4: Lines 281–329) |
| **Part 5** | **Twist Rule: Return Flow**<br>Return allotment endpoint, double-return `409 Already returned` prevention, resident history | **Member 5** | `server.js` (Part 5: Lines 481–570), `test.js` |
| **Part 6** | **Postman Collection & README**<br>Complete Postman v2.1 collection with assertion scripts, test runner, and demo day script | **Member 6** | `HostelHub.postman_collection.json`, `README.md` |

---

## 3. Architecture & Repository Structure (All Files in One Folder)

Everything is cleanly placed directly in one single root folder:

```text
hostelhub/
├── server.js                             # Complete Express server (Parts 1 to 5)
├── test.js                               # Automated verification test suite (15 tests)
├── package.json                          # NPM dependencies and run scripts
├── README.md                             # Comprehensive project documentation & demo script
├── HostelHub.postman_collection.json     # Postman v2.1 collection with automated tests
├── HostelHub_Submission_NU-AIAGAI2C-G10.zip # Submission zip archive ready to upload to ERP
├── .gitignore                            # Ignores local databases and system logs
└── hostelhub.db                          # Relational SQLite database
```

---

## 4. Setup & Running Instructions

### Step 1: Open the Project Directory
```bash
cd C:\Users\dileep\.gemini\antigravity\scratch\hostelhub
```

### Step 2: Install Dependencies (Optional)
```bash
npm install
```
*(Note: `server.js` has a built-in zero-dependency engine, allowing it to run immediately out-of-the-box on standard Node.js even before `npm install`)*

### Step 3: Run the Server
```bash
npm start
# OR:
node server.js
```
The server will start on `http://localhost:3000`.

### Step 4: Run Verification Tests
```bash
npm test
# OR:
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
| Method | Endpoint | Description | Status Code |
| :--- | :--- | :--- | :--- |
| `GET` | `/rooms` | Get all rooms (supports `?block=Block A`, `?name=101`) | `200 OK` |
| `GET` | `/rooms/free` | Warden helper: view unoccupied rooms | `200 OK` |
| `GET` | `/rooms/:id` | Get single room by ID | `200 OK`, `404 Not Found` |
| `POST` | `/rooms` | Add room (`name`, `block`, `capacity`) | `201 Created`, `400 Bad Request` |
| `PUT` | `/rooms/:id` | Update existing room | `200 OK`, `400 Bad Request`, `404 Not Found` |
| `DELETE`| `/rooms/:id` | Delete a room | `200 OK`, `404 Not Found` |

### 5.2 Residents Endpoints
| Method | Endpoint | Description | Status Code |
| :--- | :--- | :--- | :--- |
| `GET` | `/residents` | List all residents | `200 OK` |
| `GET` | `/residents/:id` | Get single resident by ID | `200 OK`, `404 Not Found` |
| `POST` | `/residents` | Register new resident (`name`, `email`, `phone`) | `201 Created`, `400 Bad Request` |
| `GET` | `/residents/:id/history` | **Twist Test 3**: List returned allotments for resident | `200 OK`, `404 Not Found` |

### 5.3 Allotments Endpoints
| Method | Endpoint | Description | Status Code |
| :--- | :--- | :--- | :--- |
| `GET` | `/allotments` | **Mandatory Join Endpoint**: Allotments joined with `resident_name` & `room_name` | `200 OK` |
| `GET` | `/allotments/:id` | Single allotment with joined resident & room details | `200 OK`, `404 Not Found` |
| `POST` | `/allotments` | Create allotment (`resident_id`, `room_id`, `allotment_date`) | `201 Created`, `400 Bad Request`, `409 Conflict` |
| `POST` | `/allotments/:id/return` | **Twist Tests 1 & 2**: Set return date. Returns `409` if already returned | `200 OK`, `404 Not Found`, `409 Conflict` |

---

## 6. Detailed Twist Walkthrough (Return Flow)

- **Test 1 (`POST /allotments/1/return`)**:  
  Sets `return_date`, marks room as returned, and responds with `200 OK`.
- **Test 2 (`POST /allotments/1/return` again)**:  
  Detects that `return_date` is already set, halts, and responds with `409 Conflict` and `{ "message": "Already returned" }`.
- **Test 3 (`GET /residents/1/history`)**:  
  Queries returned allotments for Resident 1, responds with `200 OK` including joined room name and block.

---

## 7. Demo Day Guide (Mon 16 Nov — 3-Minute Live Demo)

- **0:00 – 0:45 (Problem & Architecture)**:
  - Lead Naveen U introduces HostelHub (NU-AIAGAI2C-G10, Theme 10).
  - Demonstrates `GET /rooms/free?block=Block A` to show the warden instant vacant room status.
- **0:45 – 1:30 (CRUD, Search & Validation)**:
  - Demonstrates `GET /rooms?block=Block A` (search query parameter).
  - Demonstrates `POST /rooms` validation error (`400 Bad Request`), followed by valid creation (`201 Created`).
  - Demonstrates `GET /allotments` showing the multi-table SQL JOIN.
- **1:30 – 2:45 (Twist Return Flow Tests)**:
  - Executes Test 1: `POST /allotments/1/return` $\rightarrow$ `200 OK`.
  - Executes Test 2: `POST /allotments/1/return` $\rightarrow$ `409 Conflict` with `"Already returned"`.
  - Executes Test 3: `GET /residents/1/history` $\rightarrow$ `200 OK` listing the returned allotment.
- **2:45 – 3:00 (Verification & Q&A Conclusion)**:
  - Runs `node test.js` demonstrating 15/15 tests passing.
