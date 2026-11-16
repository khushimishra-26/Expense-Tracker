import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import logo from "../assets/logo.png";

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <aside className="sidebar">
      <div className="brand">
        <img className="brand-logo brand-logo-small" src={logo} alt="" />
        <h2 className="logo">Budgeteer</h2>
      </div>
      <p className="hello">Hi, {user.username}</p>
      <nav>
        <NavLink to="/" end>Dashboard</NavLink>
        <NavLink to="/add-expense">Add Expense</NavLink>
        <NavLink to="/budget">Set Budget</NavLink>
      </nav>
      <button className="logout" onClick={handleLogout}>Logout</button>
    </aside>
  );
}
