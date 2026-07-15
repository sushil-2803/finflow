# FinFlow - Personal Expense Manager

FinFlow is a full-stack personal finance app for monthly budgeting, expense tracking, savings management, and special-purpose expense groups. It helps track everyday spending, close monthly budgets into savings, and spend from accumulated savings without mixing those transactions into active monthly budgets.

## Features

- **Google authentication**: Sign in with Google OAuth backed by server-side ID token verification.
- **JWT-secured sessions**: Access and refresh tokens protect API requests and keep users signed in.
- **Dashboard overview**: View overall savings, current monthly balance, active expense groups, recent transactions, and payment method analytics.
- **Monthly budgets**: Create budgets by month and year with custom start and end dates.
- **Budget closing workflow**: Close a monthly budget to lock it and automatically transfer the remaining amount into overall savings.
- **Expense tracking**: Add, edit, delete, search, and paginate expenses with title, amount, payment method, seller, notes, and date.
- **Budget-linked expenses**: Assign expenses to active monthly budgets so budget totals and remaining balances update automatically.
- **Savings-funded expenses**: Mark an expense as paid from savings to deduct it from overall savings, skip monthly budget deduction, and log it in the savings ledger.
- **Special expense groups**: Create active trackers for trips, events, campaigns, weddings, or other one-off spending categories.
- **Group-linked expenses**: Attach expenses to active groups and track total group spending separately from normal budget flow.
- **Savings ledger**: Record direct savings withdrawals and view historical savings transactions.
- **Profile sync**: User profile data refreshes after budget closures and savings transactions so balances stay current.
- **Responsive UI**: React dashboard with Vite, Tailwind-based styling, Lucide icons, and Recharts visualizations.
- **API validation and error handling**: Express validators, centralized error responses, and protected resource ownership checks.

## Project Structure

```text
expense-manager/
├── backend/              # Node.js, Express, MongoDB API
│   ├── src/
│   │   ├── config/       # Database, JWT, Passport config
│   │   ├── controllers/  # Auth, budget, expense, group, savings logic
│   │   ├── middleware/   # Auth, validation, error handling
│   │   ├── models/       # Mongoose schemas
│   │   ├── routes/       # API route definitions
│   │   ├── app.js
│   │   └── server.js
│   └── package.json
├── frontend/             # React + Vite client
│   ├── src/
│   │   ├── api/          # Axios client
│   │   ├── components/   # Reusable UI components
│   │   ├── context/      # Auth context
│   │   ├── pages/        # App pages
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
└── README.md
```

## Setup

### Prerequisites

- Node.js
- npm
- MongoDB running locally or a MongoDB connection string
- Google OAuth credentials for production Google sign-in

### 1. Clone and Install

```bash
git clone <your-repository-url>
cd expense-manager

cd backend
npm install

cd ../frontend
npm install
```

### 2. Configure Backend Environment

Create `backend/.env`:

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/expense_manager

JWT_SECRET=replace_with_a_strong_access_token_secret
JWT_REFRESH_SECRET=replace_with_a_strong_refresh_token_secret

GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
```

Create OAuth credentials in Google Cloud Console and add `http://localhost:5173` to the authorized JavaScript origins for local development.

For your production deployment, use these public URLs:

```env
CLIENT_URL=https://expense.sushildubey.cloud
GOOGLE_CALLBACK_URL=https://expenseapi.sushildubey.cloud/api/auth/google/callback
```

### 3. Configure Frontend Environment

Create `frontend/.env` if the API is not running on the default URL:

```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

For your production frontend build:

```env
VITE_API_URL=https://expenseapi.sushildubey.cloud/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

### 4. Run the Backend

```bash
cd backend
npm run dev
```

The API runs at `http://localhost:5000`.

### 5. Run the Frontend

Open a second terminal:

```bash
cd frontend
npm run dev
```

The client runs at `http://localhost:5173`.

### 6. Build for Production

```bash
cd frontend
npm run build
```

To start the backend in production mode:

```bash
cd backend
npm start
```

## Docker Setup

### Local Docker Compose

The local Compose file starts MongoDB, the backend API, and the frontend web app.

```bash
docker compose --env-file .env.docker up --build
```

Local services:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`
- MongoDB: `localhost:27017`

Update `.env.docker` before running if you need different ports, secrets, OAuth credentials, or frontend/backend URLs.

### Publish Multi-Arch Images to Docker Hub

`docker-bake.hcl` builds and pushes two images:

- `<dockerhub-username>/finflow-frontend:<tag>`
- `<dockerhub-username>/finflow-backend:<tag>`

The bake config targets `linux/amd64` and `linux/arm64`, so the published images can run on standard Linux servers and Raspberry Pi 5.

```bash
docker login
docker buildx create --use --name finflow-builder
```

Then set Bake variables and publish:

```bash
DOCKERHUB_NAMESPACE=your-dockerhub-username \
IMAGE_TAG=latest \
VITE_API_URL=https://expenseapi.sushildubey.cloud/api \
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com \
docker buildx bake -f docker-bake.hcl --push
```

On Windows PowerShell:

```powershell
$env:DOCKERHUB_NAMESPACE="your-dockerhub-username"
$env:IMAGE_TAG="latest"
$env:VITE_API_URL="https://expenseapi.sushildubey.cloud/api"
$env:GOOGLE_CLIENT_ID="your_google_client_id.apps.googleusercontent.com"
docker buildx bake -f docker-bake.hcl --push
```

Google OAuth and backend secrets are still runtime configuration for the backend container. The frontend image bakes `VITE_API_URL` and `VITE_GOOGLE_CLIENT_ID` during its Vite build.

For this deployment, the frontend image should be built with:

```text
VITE_API_URL=https://expenseapi.sushildubey.cloud/api
```

And the backend runtime environment should include:

```text
CLIENT_URL=https://expense.sushildubey.cloud
GOOGLE_CALLBACK_URL=https://expenseapi.sushildubey.cloud/api/auth/google/callback
```

That `CLIENT_URL` value is what the Express CORS middleware uses to allow requests from the frontend domain.

### Deploy from Docker Hub

Use `docker-compose.deploy.yml` on a server that already has access to a running MongoDB instance.

1. Copy `.env.deploy.example` to `.env.deploy`.
2. Set `DOCKERHUB_NAMESPACE`, `IMAGE_TAG`, `MONGODB_URI`, JWT secrets, OAuth credentials, and public URLs.
3. Start the app:

```bash
docker compose --env-file .env.deploy -f docker-compose.deploy.yml pull
docker compose --env-file .env.deploy -f docker-compose.deploy.yml up -d
```

This deploy compose file does not create MongoDB. It expects `MONGODB_URI` to point to an existing database.

Sample `.env.deploy` values for your domains:

```env
DOCKERHUB_NAMESPACE=your-dockerhub-username
IMAGE_TAG=latest
BACKEND_PORT=5000
FRONTEND_PORT=80
NODE_ENV=production
CLIENT_URL=https://expense.sushildubey.cloud
MONGODB_URI=mongodb://user:password@your-existing-mongo-host:27017/expense_manager?authSource=admin
JWT_SECRET=replace_with_a_long_random_secret
JWT_REFRESH_SECRET=replace_with_another_long_random_secret
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=https://expenseapi.sushildubey.cloud/api/auth/google/callback
```

Sample deploy commands:

```bash
docker compose --env-file .env.deploy -f docker-compose.deploy.yml pull
docker compose --env-file .env.deploy -f docker-compose.deploy.yml up -d
docker compose --env-file .env.deploy -f docker-compose.deploy.yml logs -f
```

## App Flow

1. Sign in using Google OAuth.
2. Create a monthly budget for the active month.
3. Record expenses and optionally link them to a budget or special expense group.
4. Mark expenses as paid from savings when they should reduce overall savings instead of a monthly budget.
5. Close a completed monthly budget to transfer the remaining balance into overall savings.
6. Use the Savings page to view savings balance, record direct savings withdrawals, and review savings history.

## API Overview

All routes are prefixed with `/api`.

| Area | Routes |
| --- | --- |
| Auth | `POST /auth/google`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me` |
| Budgets | `POST /budgets`, `GET /budgets`, `GET /budgets/:id`, `PUT /budgets/:id`, `DELETE /budgets/:id`, `POST /budgets/:id/close` |
| Expenses | `POST /expenses`, `GET /expenses`, `GET /expenses/:id`, `PUT /expenses/:id`, `DELETE /expenses/:id` |
| Groups | `POST /groups`, `GET /groups`, `GET /groups/:id`, `PUT /groups/:id`, `DELETE /groups/:id` |
| Savings | `GET /savings`, `POST /savings/spend`, `GET /savings/history` |

## Tech Stack

### Frontend

- React 19
- Vite
- React Router
- Axios
- Recharts
- Lucide React
- Tailwind CSS tooling
- ESLint

### Backend

- Node.js
- Express
- MongoDB
- Mongoose
- Passport
- Google Auth Library
- JSON Web Tokens
- Express Validator
- Helmet
- CORS
- dotenv
- Nodemon

## Data Models

- **User**: Profile, auth identity, and overall savings balance.
- **MonthlyBudget**: Monthly budget amount, expense totals, remaining balance, date range, and closed status.
- **Expense**: Expense details, payment method, optional budget link, optional group link, and optional savings transaction link.
- **ExpenseGroup**: Special spending tracker with status and total spent.
- **SavingsTransaction**: Savings withdrawals and savings-funded expense ledger records.
- **RefreshToken**: Refresh token storage for session renewal.

## Useful Scripts

### Backend

```bash
npm run dev    # Start API with nodemon
npm start      # Start API with node
```

### Frontend

```bash
npm run dev      # Start Vite dev server
npm run build    # Build production assets
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## Notes

- MongoDB must be running before starting the backend.
- The frontend defaults to `http://localhost:5000/api` if `VITE_API_URL` is not set.
- The backend allows the frontend origin from `CLIENT_URL`, defaulting to `http://localhost:5173`. For production, set it to `https://expense.sushildubey.cloud`.
- Closed budgets are locked to preserve historical budget accuracy.
- Savings-funded expenses deduct from overall savings and are not counted against monthly budget totals.
