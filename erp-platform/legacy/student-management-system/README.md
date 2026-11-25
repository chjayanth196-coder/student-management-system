# 🎓 Student Management System

A full-stack MERN web app where **students log in** to see their own attendance and results, and **admins/teachers log in** to a separate panel to manage students and enter that data. Everything is stored in **MongoDB**.

---

## What's included

- **JWT authentication** — one login page, routes you to the student or admin dashboard based on your account's role.
- **Student portal** — dashboard summary, attendance log with %, results/report card grouped by term, read-only profile.
- **Admin panel** — add/edit/delete student accounts, mark attendance per student, add/edit exam results per student.
- **MongoDB storage** via Mongoose — `User`, `Attendance`, and `Result` collections.

```
student-management-system/
├── server/     ← Node + Express + MongoDB API
└── client/     ← React frontend
```

---

## 1. Prerequisites

- [Node.js](https://nodejs.org) v16 or later
- A MongoDB database — either:
  - **Local**: install MongoDB Community Server and run it (`mongod`), or
  - **Cloud (recommended, free tier available)**: create a cluster at [MongoDB Atlas](https://www.mongodb.com/atlas) and copy its connection string

---

## 2. Backend setup

```bash
cd server
npm install
cp .env.example .env
```

Open `.env` and fill in:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/student_management_system   # or your Atlas connection string
JWT_SECRET=replace_this_with_a_long_random_string
JWT_EXPIRES_IN=7d

ADMIN_NAME=Admin User
ADMIN_EMAIL=admin@school.com
ADMIN_PASSWORD=Admin@123
```

Create your first admin account (run once):

```bash
npm run seed:admin
```

Start the API server:

```bash
npm run dev
```

The API runs at `http://localhost:5000`. You should see `MongoDB connected` and `Server running on port 5000` in the terminal.

---

## 3. Frontend setup

Open a **second terminal**:

```bash
cd client
npm install
cp .env.example .env
npm start
```

This opens `http://localhost:3000` in your browser.

---

## 4. Using the app

1. Go to `http://localhost:3000/login`.
2. **Log in as admin** with the email/password from your `.env` (e.g. `admin@school.com` / `Admin@123`).
3. In the admin panel:
   - **Manage Students** → add a student (name, email, temporary password, roll no., class, etc.)
   - **Manage Attendance** → select that student → mark attendance day by day
   - **Manage Results** → select that student → add exam results per subject/term
4. **Log out**, then log back in with the student's email and the temporary password you set. The student will see their own dashboard, attendance %, and full report card — nothing from other students.

---

## 5. How data flows to MongoDB

Every add/edit/delete in the admin panel calls the Express API, which writes straight to your MongoDB database through Mongoose models:

- `User` collection — holds both admins and students (a `role` field tells them apart), plus student profile fields (roll no., class, parent contact, etc.)
- `Attendance` collection — one document per student per date per subject
- `Result` collection — one document per student per exam/subject, with grade auto-calculated from marks

You can inspect this data anytime with [MongoDB Compass](https://www.mongodb.com/products/compass) or `mongosh`, pointed at the same `MONGO_URI`.

---

## 6. Deploying (when you're ready to go live)

- **Backend**: deploy `server/` to Render, Railway, or a VPS; set the same environment variables there.
- **Frontend**: deploy `client/` to Vercel or Netlify; set `REACT_APP_API_URL` to your deployed backend's URL.
- **Database**: use MongoDB Atlas (already cloud-hosted) — just make sure your backend's `MONGO_URI` points to it.

---

## 7. Notes

- Passwords are hashed with bcrypt before being stored — never saved in plain text.
- JWTs expire after the period set in `JWT_EXPIRES_IN` (default 7 days); students/admins will need to log in again after that.
- Only admins can create student accounts, mark attendance, or enter results — students have read-only access to their own records, enforced both in the UI and on the backend.
