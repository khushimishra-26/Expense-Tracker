import { useEffect, useState } from "react";
import { api } from "../api";
import { CATEGORIES, isThisMonth, money } from "../utils";
import CategoryInput from "../components/CategoryInput";

const OVERALL = ""; // empty category = overall budget

export default function Budget() {
  const [budgets, setBudgets] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [category, setCategory] = useState(OVERALL);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");

  function load() {
    Promise.all([api("/budgets/"), api("/expenses/")])
      .then(([b, e]) => {
        setBudgets(b);
        setExpenses(e);
      })
      .catch((err) => setError(err.message));
  }

  useEffect(load, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await api("/budgets/", {
        method: "PUT",
        body: { category: category.trim() || null, amount },
      });
      setAmount("");
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    setError("");
    try {
      await api(`/budgets/${id}`, { method: "DELETE" });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  // Spending this month, for comparing against each budget
  const monthExpenses = expenses.filter((e) => isThisMonth(e.created_at));
  function spentFor(budgetCategory) {
    return monthExpenses
      .filter((e) => budgetCategory === null || e.category === budgetCategory)
      .reduce((sum, e) => sum + Number(e.amount), 0);
  }

  // Overall budget first, then categories alphabetically
  const sorted = [...budgets].sort((a, b) =>
    a.category === null ? -1 : b.category === null ? 1 : a.category.localeCompare(b.category)
  );

  return (
    <div className="budget-page">
      <h1>Set budget</h1>
      <div className="card form-card">
        <p className="muted">Monthly budgets. Setting one that already exists updates it.</p>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleSubmit}>
          <CategoryInput
            label="Category"
            value={category}
            onChange={setCategory}
            options={CATEGORIES}
            placeholder="Leave empty for overall budget"
            maxLength={50}
          />
          <label>
            Amount
            <input type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          </label>
          <button type="submit">Save budget</button>
        </form>
      </div>

      <div className="card">
        <h2>This month</h2>
        {sorted.length === 0 && <p className="muted">No budgets set yet.</p>}
        {sorted.map((b) => {
          const spent = spentFor(b.category);
          const limit = Number(b.amount);
          const percent = Math.min((spent / limit) * 100, 100);
          const over = spent > limit;
          return (
            <div key={b.id} className="budget-row">
              <div className="budget-info">
                <strong>{b.category ?? "Overall"}</strong>
                <span className={over ? "error-text" : "muted"}>
                  {money(spent)} of {money(limit)}{over && " (over budget)"}
                </span>
              </div>
              <div className="progress">
                <div className={over ? "bar over" : "bar"} style={{ width: `${percent}%` }} />
              </div>
              <button className="link-button" onClick={() => handleDelete(b.id)}>Remove</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
