import streamlit as st
import pandas as pd
import requests

BASE_URL = "http://127.0.0.1:8000"

st.set_page_config(
    page_title="AI Expense Tracker",
    layout="centered"
)

# ---------------- SESSION ---------------- #

if "token" not in st.session_state:
    st.session_state.token = None

# ---------------- TITLE ---------------- #

st.title("AI Expense Tracker")

# ======================================================
# LOGIN / REGISTER
# ======================================================

if st.session_state.token is None:
    login_tab, register_tab = st.tabs(["Login", "Register"])

    # ---------------- LOGIN ---------------- #

    with login_tab:

        st.subheader("Login to your account")

        username = st.text_input("Username", key="login_username")
        password = st.text_input(
            "Password",
            type="password",
            key="login_password"
        )

        if st.button("Login", use_container_width=True):
            response = requests.post(
                f"{BASE_URL}/auth/login",
                json={
                    "username": username,
                    "password": password
                }
            )

            if response.status_code == 200:
                data = response.json()
                st.session_state.token = data["access_token"]
                st.success("Login Successful!")
                st.rerun()

            else:
                try:
                    st.error(response.json()["detail"])
                except:
                    st.error("Invalid username or password.")

    # ---------------- REGISTER ---------------- #

    with register_tab:
        st.subheader("Create a new account")
        new_username = st.text_input(
            "Username",
            key="register_username"
        )
        new_email = st.text_input(
            "Email",
            key="register_email"
        )
        new_password = st.text_input(
            "Password",
            type="password",
            key="register_password"
        )
        confirm_password = st.text_input(
            "Confirm Password",
            type="password"
        )
        if st.button("Register", use_container_width=True):

            if new_password != confirm_password:
                st.error("Passwords do not match!")

            else:

                response = requests.post(
                    f"{BASE_URL}/users/register",
                    json={
                        "username": new_username,
                        "email": new_email,
                        "password": new_password
                    }
                )

                if response.status_code in [200, 201]:

                    st.success(
                        "Registration successful! Please login."
                    )

                else:

                    try:
                        st.error(response.json()["detail"])
                    except:
                        st.error("Registration failed.")

# ======================================================
# AFTER LOGIN
# ======================================================

else:

# ================================================
# DASHBOARD
# ================================================

    headers = {
        "Authorization": f"Bearer {st.session_state.token}"
    }

# ---------------- SIDEBAR ---------------- #

    st.sidebar.title("AI Expense Tracker")

    page = st.sidebar.radio(
        "Navigation",
        [
            "Dashboard",
            "Expenses"
        ]
    )

    st.sidebar.divider()

    if st.sidebar.button("Logout", use_container_width=True):
        st.session_state.token = None
        st.rerun()

# ---------------- DASHBOARD ---------------- #

    if page == "Dashboard":
        st.subheader("Expense Dashboard")

    # ---------- Get Expenses ---------- #

        response = requests.get(
            f"{BASE_URL}/expenses",
            headers=headers
        )

        expenses = []
        if response.status_code == 200:
            expenses = response.json()
        if expenses:
            df = pd.DataFrame(expenses)

        # ---------- Dashboard Cards ---------- #

            total_spending = df["amount"].sum()
            total_expenses = len(df)
            average_expense = round(df["amount"].mean(), 2)

            col1, col2, col3 = st.columns(3)

            col1.metric(
                "💸 Total Spending",
                f"₹{total_spending:.2f}"
            )
            col2.metric(
                "📝 Total Expenses",
                total_expenses
            )
            col3.metric(
                "📈 Average Expense",
                f"₹{average_expense}"
            )

            st.divider()

        # ---------- Expense Table ---------- #

            left, right = st.columns([2, 1])

            with left:
                st.subheader("Expenses")

                if "created_at" in df.columns:
                    df["created_at"] = pd.to_datetime(
                        df["created_at"]
                    )
                    df["Month"] = df["created_at"].dt.strftime("%B")

                st.dataframe(
                    df,
                    use_container_width=True
                )

            # ---------- AI Insights ---------- #

            with right:

                st.subheader("🤖 AI Insights")

                highest = (
                    df.groupby("category")["amount"]
                    .sum()
                    .idxmax()
                )
                highest_amount = (
                    df.groupby("category")["amount"]
                    .sum()
                    .max()
                )
                st.info(
                    f"""
                ### Summary

            💰 Total Spending

            ₹{total_spending:.2f}

            📊 Average Expense

            ₹{average_expense}

            🏆 Highest Spending Category

            {highest}

            💸 Amount

            ₹{highest_amount:.2f}

            These are placeholder insights.
            They will later be generated by an AI model.
            """
                    )


    # ================================================
# EXPENSES
# ================================================

    elif page == "Expenses":
        st.title("Expenses")

    # ---------- Load Categories ---------- #

        category_response = requests.get(
            f"{BASE_URL}/categories",
            headers=headers
        )
        categories = []
        if category_response.status_code == 200:
            categories = category_response.json()

    # ---------- Add Expense ---------- #

        st.subheader("Add Expense")

        with st.form("expense_form"):
            title = st.text_input("Title")
            amount = st.number_input(
                "Amount",
                min_value=0.0,
                placeholder=None,
                step=1.0
            )
            category = st.text_input(
                "Category",
                placeholder="e.g. Food, Travel, Shopping"
            )

            submitted = st.form_submit_button("Add Expense")

            if submitted:
                response = requests.post(
                    f"{BASE_URL}/expenses",
                    headers=headers,
                    json={
                        "title": title,
                        "amount": amount,
                        "category": category
                    }
                )
                if response.status_code in [200, 201]:
                    st.success("Expense Added Successfully!")
                    st.rerun()
                else:
                    st.error(response.text)

    # ---------- Expense List ---------- #

        st.subheader("My Expenses")

        response = requests.get(
            f"{BASE_URL}/expenses",
            headers=headers
        )

        if response.status_code == 200:
            expenses = response.json()
            if expenses:
                df = pd.DataFrame(expenses)
                st.dataframe(
                    df,
                    use_container_width=True
                )
                st.divider()
                st.subheader("Delete Expense")
                expense_ids = [
                    expense["id"] for expense in expenses
                ]
                expense_id = st.selectbox(
                    "Select Expense",
                    expense_ids
                )

                if st.button("Delete Expense"):
                    delete_response = requests.delete(
                        f"{BASE_URL}/expenses/{expense_id}",
                        headers=headers
                    )
                    if delete_response.status_code == 200:
                        st.success("Expense Deleted!")
                        st.rerun()
                    else:
                        st.error(delete_response.text)

            else:
                st.info("No expenses added yet.")

        else:
            st.error("Unable to fetch expenses.")