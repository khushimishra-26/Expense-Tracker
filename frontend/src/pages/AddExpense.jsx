import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { CATEGORIES } from "../utils";
import CategoryInput from "../components/CategoryInput";

export default function AddExpense() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: "", amount: "", category: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function update(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api("/expenses/", {
        method: "POST",
        body: { title: form.title.trim(), amount: form.amount, category: form.category.trim() },
      });
      navigate("/");
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1>Add expense</h1>
      <div className="card form-card">
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleSubmit}>
          <label>
            Title
            <input name="title" value={form.title} onChange={update} required maxLength={200} placeholder="e.g. Lunch" />
          </label>
          <label>
            Amount
            <input name="amount" type="number" min="0.01" step="0.01" value={form.amount} onChange={update} required />
          </label>
          <CategoryInput
            label="Category"
            value={form.category}
            onChange={(category) => setForm({ ...form, category })}
            options={CATEGORIES}
            placeholder="Pick or type a category"
            required
            maxLength={50}
          />
          <button type="submit" disabled={submitting}>
            {submitting ? "Saving…" : "Add expense"}
          </button>
        </form>
      </div>
    </div>
  );
}
