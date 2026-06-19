# InvenTrack — Inventory & Order Management System

A production-ready, fully containerized Inventory & Order Management System built with FastAPI, React, and PostgreSQL.

## Tech Stack

| Layer         | Technology                  |
|---------------|-----------------------------|
| Backend       | Python 3.11 + FastAPI        |
| Frontend      | React 18 + Vite              |
| Database      | PostgreSQL 15               |
| ORM           | SQLAlchemy 2.0              |
| Containerization | Docker + Docker Compose  |

---

## 🚀 Getting Started

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- Git

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd assignmenet
```

### 2. Configure Environment Variables
```bash
cp .env.example .env
```
Edit `.env` and set your desired credentials. **Never commit `.env` to version control.**

### 3. Start All Services
```bash
docker-compose up --build
```

This single command will:
- Build the backend and frontend Docker images
- Start the PostgreSQL database and **automatically create all tables** via `init.sql`
- Start the FastAPI backend on port `8000`
- Start the React frontend on port `80`

### 4. Access the Application
| Service       | URL                         |
|---------------|-----------------------------|
| Frontend      | http://localhost             |
| Backend API   | http://localhost:8000        |
| API Docs      | http://localhost:8000/docs   |
| ReDoc         | http://localhost:8000/redoc  |

---

## 🗄️ Database Table Creation Commands

The tables are created automatically by `backend/init.sql` when Docker starts. To run manually:

```bash
# Connect to the running PostgreSQL container
docker-compose exec db psql -U inventory_user -d inventory_db

# Inside psql — run the script:
\i /docker-entrypoint-initdb.d/init.sql

# Or run individual CREATE TABLE commands:
```

**Tables created:**
1. `products` — Product catalog with SKU, price, quantity
2. `customers` — Customer records with email uniqueness
3. `orders` — Order headers with customer reference and total
4. `order_items` — Order line items (product + quantity + price)

---

## 📁 Project Structure

```
assignmenet/
├── backend/
│   ├── app/
│   │   ├── config.py       # Pydantic settings (reads from .env)
│   │   ├── database.py     # SQLAlchemy engine & session
│   │   ├── models.py       # ORM models
│   │   ├── schemas.py      # Pydantic request/response schemas
│   │   ├── crud.py         # Database operations + business logic
│   │   ├── main.py         # FastAPI app entry point
│   │   └── routers/
│   │       ├── products.py
│   │       ├── customers.py
│   │       ├── orders.py
│   │       └── dashboard.py
│   ├── init.sql            # DB table creation SQL (auto-run by Docker)
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── services/api.js  # Axios API client
│   │   ├── hooks/useFetch.js
│   │   ├── components/      # Sidebar, Modal
│   │   ├── pages/           # Dashboard, Products, Customers, Orders
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css        # Global design system
│   ├── nginx.conf
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
├── .env.example
├── .env                     # (gitignored — do not commit)
├── .gitignore
└── .dockerignore
```

---

## ⚙️ Business Logic

- **Unique SKU**: Products cannot share SKU codes (enforced at DB + API level)
- **Unique Email**: Customer emails must be unique
- **Non-negative Stock**: Product quantity cannot go below 0
- **Inventory Check**: Orders are rejected if any product has insufficient stock
- **Auto Stock Deduction**: Placing an order automatically reduces product quantities
- **Auto Total Calculation**: Order total is computed from item prices × quantities

---

## 🐳 Docker Commands Reference

```bash
# Start all services
docker-compose up -d

# Rebuild after code changes
docker-compose up --build

# Stop all services
docker-compose down

# View logs
docker-compose logs -f backend
docker-compose logs -f db

# Connect to PostgreSQL
docker-compose exec db psql -U inventory_user -d inventory_db

# Push backend image to Docker Hub
docker tag assignmenet-backend <dockerhub-username>/inventrack-backend:latest
docker push <dockerhub-username>/inventrack-backend:latest
```

---

## ☁️ Deployment

### Database — PostgreSQL on Render
1. Go to [Render](https://render.com) and click **New** -> **PostgreSQL**.
2. Name your database, set standard username/password, and select your hosting region.
3. Select the free tier and click **Create Database**.
4. Once provisioned, copy the **Internal Database URL** (or External Database URL if connecting outside Render).

### Backend — Render
1. Push your code to GitHub.
2. Create a new **Web Service** on [Render](https://render.com).
3. Connect your repository, set the **Root Directory** to `backend/`.
4. Set the **Start Command** to `uvicorn app.main:app --host 0.0.0.0 --port 8000`.
5. Add the following environment variables:
   - `DATABASE_URL` = (Paste your copied Render PostgreSQL URL)
   - `CORS_ORIGINS` = (Paste your deployed Vercel URL, e.g. `https://your-frontend.vercel.app`)
6. Deploy! *(FastAPI's startup metadata hook will automatically initialize your database tables on Render PostgreSQL).*

### Frontend — Vercel
1. Create a new project on [Vercel](https://vercel.com) and import your repository.
2. Set the **Root Directory** to `frontend/`.
3. Add the environment variable:
   - `VITE_API_URL` = (Paste your deployed Render backend web service URL)
4. Deploy!

