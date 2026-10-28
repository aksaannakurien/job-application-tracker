
# Job Application Tracker

A MERN stack web application for managing job applications and tracking recruitment progress.

## Technologies
- MongoDB Atlas
- Express.js
- React.js
- Node.js
- Mongoose
- Axios
- CSS

## Features
- Add, edit, view, and delete job applications.
- Automatically generate application IDs.
- Search by company and filter by status.
- Display application counts by status.
- Track status history and timestamps.
- Highlight overdue follow-ups after seven days.
- Validate duplicate active applications.
- Enforce valid status transitions.
- Validate applied dates and required fields.

## Project Structure
- `frontend/` - React user interface
- `backend/` - Express API and MongoDB integration
- `screenshots/` - Project screenshots

## Setup

### Backend
```bash
cd backend
npm install
```

Create `backend/.env`:
```env
PORT=5000
MONGO_URI=your_mongodb_atlas_connection_string
```

Start the backend:
```bash
npm run dev
```

### Frontend
Open another terminal:
```bash
cd frontend
npm install
npm run dev
```

Open the local URL shown by Vite, usually `http://localhost:5173`.

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/applications` | List applications |
| GET | `/api/applications/stats` | Get status counts |
| GET | `/api/applications/:id` | Get application details |
| POST | `/api/applications` | Create application |
| PUT | `/api/applications/:id` | Edit application |
| PATCH | `/api/applications/:id/status` | Update status |
| DELETE | `/api/applications/:id` | Delete application |

Search and filter are supported through query parameters, for example:
`/api/applications?company=ICTAK&status=Applied`

## Screenshots
Save two screenshots in the `screenshots/` folder:
- `dashboard.png`
- `application-list.png`

## Database
MongoDB Atlas stores application records and status history.
