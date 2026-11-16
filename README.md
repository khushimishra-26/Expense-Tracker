# 🛡️ Budgeteer — Your Money's Knight in Shining Armour

**Guarding your budget, slaying overspending, and keeping your finances in check.**

Budgeteer is a personal expense tracking and budget management application designed to help users monitor their spending, understand their financial habits, and stay within their monthly budgets.

From everyday expenses to monthly financial goals, Budgeteer makes managing money simple, intuitive, and insightful.

**[🌐 Live Demo](https://expense-tracker-frontend-five-psi.vercel.app/login)** 

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React.js, JavaScript, HTML, CSS |
| Build Tool | Vite |
| Routing | React Router |
| Data Visualization | Recharts |
| Backend | Python, FastAPI |
| Database | SQLite / PostgreSQL (via SQLAlchemy configuration) |
| ORM | SQLAlchemy |
| Authentication | JWT, OAuth2, bcrypt |
| Validation | Pydantic |
| Database Migrations | Alembic |
| API Communication | REST APIs, Fetch API |
| Version Control | Git, GitHub |

---

## 🏗️ Application Architecture

Budgeteer follows a client-server architecture.

- **Frontend:** React handles the user interface, navigation, interactive charts, and API communication.
- **Backend:** FastAPI exposes REST endpoints for authentication, expenses, and budgets.
- **Database:** SQLAlchemy manages database operations and relationships between users, expenses, budgets, and refresh tokens.
- **Authentication:** Short-lived access tokens and rotating refresh tokens maintain authenticated sessions.

```text
                 USER
                   |
                   v
          REACT FRONTEND (Vite)
                   |
          REST API Communication
                   |
                   v
             FASTAPI BACKEND
                   |
          +--------+--------+
          |        |        |
          v        v        v
       Users    Expenses  Budgets
          |        |        |
          +--------+--------+
                   |
                   v
             SQLAlchemy ORM
                   |
                   v
              DATABASE
```

---

## 📂 Project Structure

```text
Expense-Tracker/
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.jsx
│   │   │   ├── ProtectedLayout.jsx
│   │   │   ├── AuthBrand.jsx
│   │   │   └── CategoryInput.jsx
│   │   │
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── AddExpense.jsx
│   │   │   ├── Budget.jsx
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   │
│   │   ├── App.jsx
│   │   ├── AuthContext.jsx
│   │   ├── api.js
│   │   └── utils.js
│   │
│   └── package.json
│
├── backend/
│   ├── routers/
│   │   ├── auth.py
│   │   ├── users.py
│   │   ├── expenses.py
│   │   └── budgets.py
│   │
│   ├── alembic/
│   ├── main.py
│   ├── models.py
│   ├── schema.py
│   ├── crud.py
│   ├── auth.py
│   ├── database.py
│   └── requirements.txt
│
└── README.md
```

---

## ✨ Key Features

### 1. Expense Management
- Add expenses with titles, amounts, and categories.
- Organize transactions using predefined or custom categories.
- Store expenses securely against individual user accounts.
- View and analyse spending patterns.

### 2. Interactive Analytics Dashboard
- **Category-wise breakdown:** Visualize spending distribution using interactive pie charts.
- **Category comparison:** Compare expenditure across different categories using bar charts.
- **Expense trends:** Track spending patterns through daily, monthly, and yearly trend visualizations.

### 3. Smart Budget Management
- Set an overall monthly spending budget.
- Create individual budgets for different expense categories.
- Track actual spending against allocated budgets.
- Visual progress indicators highlight budget utilization and overspending.
- Update or remove existing budgets.

### 4. Secure Authentication
- User registration and login.
- Password hashing using bcrypt.
- JWT-based access authentication.
- Secure HTTP-only refresh-token cookies.
- Automatic access-token renewal and session management.
- User-specific expense and budget data.

### 5. Personalized Experience
- INR-based expense tracking.
- Custom expense categories.
- Clean, intuitive dashboard interface.

---

## ⚙️ Getting Started

Follow these steps to run Budgeteer locally.

### Prerequisites

- Python 3.9+
- Node.js and npm
- Git

### 1. Clone the repository

```bash
git clone https://github.com/khushimishra-26/Expense-Tracker.git

cd Expense-Tracker
```

### 2. Set up the backend

```bash
cd backend

python -m venv venv
```

Activate the virtual environment:

**macOS / Linux**
```bash
source venv/bin/activate
```

**Windows**
```bash
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
pip install python-multipart
```

Create a `.env` file inside the backend directory:

```env
SECRET_KEY=your_generated_secret_key
DATABASE_URL=sqlite:///./expenses.db
FRONTEND_URL=http://localhost:5173
COOKIE_SECURE=false
```

Generate a secret key using:

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

Start the backend:

```bash
uvicorn main:app --reload
```

Backend API documentation:

`http://localhost:8000/docs`

### 3. Set up the frontend

Open another terminal:

```bash
cd frontend

npm install
```

Create a `.env` file inside the frontend directory:

```env
VITE_API_URL=http://localhost:8000
```

Start the development server:

```bash
npm run dev
```

Open the application:

`http://localhost:5173`

---

## 🚀 Future Enhancements

The following features are planned to make Budgeteer more comprehensive:

- **Recurring Expenses:** Automatically track recurring payments, subscriptions, and bills.
- **Financial Insights:** Introduce intelligent spending analysis and personalized saving recommendations.
- **Data Export:** Export expense reports in CSV and PDF formats.
- **Budget Notifications:** Alerts when spending approaches or exceeds budget limits.
- **Savings Goals:** Set financial targets and monitor progress.
- **Multi-Currency Support:** Enable expense tracking across different currencies.
- **Mobile Responsiveness:** Further optimize the application for mobile devices.
- **AI-Powered Financial Assistant:** Provide conversational insights into spending habits and budgeting decisions.

---

## 🎯 Project Objective

The objective of Budgeteer is to simplify personal financial management by bringing expense tracking, budget planning, and spending analytics together in one application.

It combines a modern frontend, RESTful backend architecture, database management, and secure authentication to deliver a practical full-stack application.

---

**Budgeteer — Keeping your kingdom rich and your worries poor.** 👑

*Built with ❤️ and a mission to make financial management simpler.*
