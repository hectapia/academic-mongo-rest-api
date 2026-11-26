# Academic Mongo REST API

A Node.js and Express REST API backed by MongoDB, with GitHub OAuth protecting write operations.
The API source is written in TypeScript.

## Project overview

Campus Records is a full-stack academic directory for browsing and managing student, department, and course records. The React interface provides searchable directories and collection totals. The API exposes the same data as JSON and supports record creation, updates, and deletion for authenticated users.

Reads are public. Write operations require a GitHub-authenticated session. Without OAuth configuration, the app still works as a read-only directory.

## Architecture

```text
React + Vite frontend
        │ credentialed JSON requests
        ▼
Express + TypeScript REST API ── MongoDB Node.js driver ── MongoDB
        │
        └── GitHub OAuth and session authentication for writes
```

The frontend requests data from the API, whose routes pass requests through validation and authentication middleware to collection controllers. The controllers use the MongoDB Node.js driver to read or change documents. The API returns JSON responses; invalid IDs return `400`, and valid IDs without a matching record return `404`.

The API connects to the database selected by `MONGODB_DATABASE`, if set, or by the database name in `MONGODB_URL`. It uses the `students`, `departments`, and `courses` collections in that database. The data is not bundled with the application; it comes from the MongoDB instance configured for the environment.

## MongoDB collections

MongoDB adds an `_id` field (an `ObjectId`) to each document. The application uses these collection names and fields:

| Collection | Fields |
| --- | --- |
| `students` | `fname`, `lname`, `email`, `major`, `gender`, `city`, `state`, and optional `birthdate` |
| `departments` | `department`, `deptCode` |
| `courses` | `deptCode`, `courseNum`, `courseName` |

Fields are stored as strings. `deptCode` is shared by department and course documents to associate courses with a department; MongoDB does not enforce this as a relational foreign key.

## Repository layout

```text
src/
  config/       Environment and OAuth configuration
  controllers/  MongoDB collection operations
  data/         MongoDB connection
  middleware/   Authentication, validation, and async error handling
  models/       TypeScript document and input types
  routes/       REST and Swagger routes
frontend/
  src/          React application and API client
test/           API integration tests
```

## Requirements

- Node.js 20 or newer
- MongoDB, either local or hosted
- A GitHub OAuth app if you want to use the protected create, update, and delete endpoints

## Run locally

1. Install dependencies with `npm ci`.
2. Copy `.env.example` to `.env`.
3. Set `MONGODB_URL`, optionally set `MONGODB_DATABASE` when the URI points at a different default database, and set a long, unique `SESSION_SECRET` in `.env`.
4. To enable record management, set `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, and `CALLBACK_URL` in `.env`. Configure the OAuth app callback URL to `http://localhost:3001/github/callback`.
5. In one terminal, start the API with `npm start` (or `npm run dev` to restart automatically).
6. In another terminal, run `npm --prefix frontend ci`, copy `frontend/.env.example` to `frontend/.env.local`, then start React with `npm run dev:frontend`.

By default, the API listens on port `3001` and the React app on port `5173`. Open:

- React app: <http://localhost:5173/>
- Swagger UI: <http://localhost:3001/api-docs/>

Override the API URL with `VITE_API_BASE_URL` in `frontend/.env.local`. If you change the frontend origin, set the same origin in `FRONTEND_URL` in the API `.env`.

## Build

Run `npm run build` to type-check and compile the API into `dist/`. The `dist/` directory is generated and ignored by Git.

Run `npm run build:frontend` to type-check and build the React app.

## Tests

Run `npm test` to compile the project and exercise its HTTP endpoints. Tests use an isolated fake database and do not require MongoDB credentials.

Run `npm run swagger:generate` to regenerate the checked-in Swagger document.

## Use the React app

Open <http://localhost:5173/> after both servers are running. Use the sidebar to switch between student, department, and course directories. Each directory supports searching and refreshing records; the dashboard shows totals across all three collections.

Reading records is public. Creating, editing, and deleting records requires signing in with GitHub. Configure the GitHub OAuth variables in `.env` and set the OAuth app callback URL to `http://localhost:3001/github/callback` to enable those actions. Without OAuth configuration, the app remains available in read-only mode and displays that status.

## Use Swagger UI

Open <http://localhost:3001/api-docs/> while the API is running. Swagger documents the collection and individual-record endpoints for `/students`, `/departments`, and `/courses`.

To view records, expand a `GET` operation (for example, `GET /students/`), click **Try it out**, then **Execute**. The response status and JSON body appear below the operation. The documentation page does not load records automatically; run a `GET` operation to retrieve them. Use an ID from a collection response with a `GET /{id}` operation to retrieve one record.

Collection reads are public. `POST`, `PUT`, and `DELETE` operations require a GitHub-authenticated session; configure OAuth as described above before using them.
