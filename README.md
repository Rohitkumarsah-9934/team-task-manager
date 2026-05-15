# 🚀 TeamFlow — Team Task Manager

A full-stack MERN application for managing projects, assigning tasks, and tracking progress with role-based access control.

## ✨ Features

- **Authentication** — JWT-based signup/login with protected routes
- **Projects** — Create, update, delete projects with color coding and status tracking
- **Team Management** — Add/remove members, assign Admin/Member roles per project
- **Task Board** — Kanban-style board (Todo → In Progress → Review → Done)
- **Task Assignment** — Assign tasks to team members, set priorities and due dates
- **Comments** — Add comments on tasks for collaboration
- **Dashboard** — Stats overview (total, in-progress, overdue, completed tasks)
- **My Tasks** — View all tasks assigned to you across projects
- **Role-Based Access** — Admins can manage members, create/delete tasks; Members can update status of their tasks

## 🛠 Tech Stack

**Backend:** Node.js, Express, MongoDB (Mongoose), JWT, bcryptjs, express-validator  
**Frontend:** React 18, React Router v6, Tailwind CSS, Lucide Icons, react-hot-toast, date-fns, axios

## 📁 Project Structure

```
team-task-manager/
├── server/               # Express backend
│   ├── models/           # Mongoose models (User, Project, Task)
│   ├── routes/           # API routes (auth, users, projects, tasks)
│   ├── middleware/        # JWT auth + role middleware
│   └── index.js          # Entry point
└── client/               # React frontend
    └── src/
        ├── pages/        # Page components
        ├── components/   # Reusable components (Layout)
        ├── context/      # AuthContext
        └── utils/        # Axios instance
```

## 🚀 Local Setup

### Backend

```bash
cd server
npm install
cp .env.example .env   # Fill in MONGO_URI and JWT_SECRET
npm run dev            # Runs on port 5000
```

### Frontend

```bash
cd client
npm install
# For local dev, proxy is already set to localhost:5000
npm start              # Runs on port 3000
```

## 🌐 Railway Deployment

### Deploy Backend

1. Create new Railway project
2. Add service → Deploy from GitHub (select `server/` root)
3. Add environment variables:
   - `MONGO_URI` — MongoDB Atlas connection string
   - `JWT_SECRET` — Random secret (use `openssl rand -hex 32`)
   - `CLIENT_URL` — Your frontend URL (Vercel/Railway)
4. Railway auto-detects Node.js and deploys

### Deploy Frontend (Vercel recommended)

```bash
cd client
# Create .env with:
REACT_APP_API_URL=https://your-backend.up.railway.app/api

npm run build
# Deploy build/ folder to Vercel
```

Or deploy client as a second Railway service with the same env var.

## 🔐 API Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/register` | — | Register user |
| POST | `/api/auth/login` | — | Login |
| GET | `/api/auth/me` | ✅ | Get current user |
| PUT | `/api/auth/profile` | ✅ | Update profile |
| GET | `/api/projects` | ✅ | Get user's projects |
| POST | `/api/projects` | ✅ | Create project |
| PUT | `/api/projects/:id` | Admin | Update project |
| DELETE | `/api/projects/:id` | Owner | Delete project |
| POST | `/api/projects/:id/members` | Admin | Add member |
| PUT | `/api/projects/:id/members/:userId` | Admin | Change role |
| DELETE | `/api/projects/:id/members/:userId` | Admin | Remove member |
| GET | `/api/tasks?project=id` | Member | Get project tasks |
| GET | `/api/tasks/my` | ✅ | Get my tasks |
| POST | `/api/tasks` | Member | Create task |
| PUT | `/api/tasks/:id` | Member/Admin | Update task |
| DELETE | `/api/tasks/:id` | Admin/Creator | Delete task |
| POST | `/api/tasks/:id/comments` | Member | Add comment |
| GET | `/api/tasks/dashboard/stats` | ✅ | Dashboard stats |

## 📽 Demo

> Record a 2-5 min video showing: Register → Create Project → Add Member → Create Tasks → Kanban Board → Dashboard

---

Built with ❤️ using the MERN Stack
