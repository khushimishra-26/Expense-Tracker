import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line, ResponsiveContainer,
} from "recharts";
import { api } from "../api";
import { CHART_COLORS, money, parseDate, totalsByCategory } from "../utils";

const AXIS = { fontSize: 12, fill: "#7a6670" };
const GRID = "#efe3e7";

// Group expenses by day ("2026-11-12"), month ("2026-11") or year ("2026").
function trendData(expenses, period) {
  const length = { daily: 10, monthly: 7, yearly: 4 }[period];
  const totals = {};
  for (const e of expenses) {
    const d = parseDate(e.created_at);
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString();
    const key = local.slice(0, length);
    totals[key] = (totals[key] || 0) + Number(e.amount);
  }
  return Object.keys(totals)
    .sort()
    .map((key) => ({ period: key, amount: Math.round(totals[key] * 100) / 100 }));
}

// The pie only has 6 colours, so smaller categories fold into "Other".
function pieData(byCategory) {
  if (byCategory.length <= CHART_COLORS.length) return byCategory;
  const top = byCategory.slice(0, CHART_COLORS.length - 1);
  const rest = byCategory.slice(CHART_COLORS.length - 1).reduce((sum, c) => sum + c.value, 0);
  // If a category is already called "Other", add to it instead of showing two "Other" slices
  const existing = top.find((c) => c.name === "Other");
  if (existing) {
    return top.map((c) => (c === existing ? { ...c, value: Math.round((c.value + rest) * 100) / 100 } : c));
  }
  return [...top, { name: "Other", value: Math.round(rest * 100) / 100 }];
}

export default function Dashboard() {
  const [expenses, setExpenses] = useState([]);
  const [period, setPeriod] = useState("monthly");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("/expenses/")
      .then(setExpenses)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading…</p>;
  if (error) return <p className="error">{error}</p>;

  if (expenses.length === 0) {
    return (
      <div className="card">
        <h1>Dashboard</h1>
        <p className="muted">
          No expenses yet. <Link to="/add-expense">Add your first expense</Link>.
        </p>
      </div>
    );
  }

  const byCategory = totalsByCategory(expenses);
  const pie = pieData(byCategory);

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>

      <section className="card">
        <h2>Expenses by category</h2>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={pie}
              dataKey="value"
              nameKey="name"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={1}
              stroke="#fff"
              strokeWidth={2}
            >
              {pie.map((entry, i) => (
                <Cell key={entry.name} fill={CHART_COLORS[i]} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => money(v)} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </section>

      <section className="card">
        <h2>Compare categories</h2>
        <ResponsiveContainer width="100%" height={Math.max(180, byCategory.length * 44)}>
          <BarChart data={byCategory} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid stroke={GRID} horizontal={false} />
            <XAxis type="number" tick={AXIS} tickLine={false} axisLine={false} tickFormatter={money} />
            <YAxis type="category" dataKey="name" tick={AXIS} tickLine={false} axisLine={false} width={100} />
            <Tooltip formatter={(v) => [money(v), "Spent"]} cursor={{ fill: "#f8eef0" }} />
            <Bar dataKey="value" fill={CHART_COLORS[0]} radius={[0, 4, 4, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </section>

      <section className="card">
        <div className="card-header">
          <h2>Expense trend</h2>
          <div className="toggle">
            {["daily", "monthly", "yearly"].map((p) => (
              <button
                key={p}
                className={period === p ? "active" : ""}
                onClick={() => setPeriod(p)}
              >
                {p[0].toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trendData(expenses, period)} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="period" tick={AXIS} tickLine={false} axisLine={{ stroke: GRID }} padding={{ left: 20, right: 20 }} />
            <YAxis tick={AXIS} tickLine={false} axisLine={false} tickFormatter={money} width={70} />
            <Tooltip formatter={(v) => [money(v), "Spent"]} />
            <Line
              type="monotone"
              dataKey="amount"
              stroke={CHART_COLORS[0]}
              strokeWidth={2}
              dot={{ r: 4, fill: CHART_COLORS[0] }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </section>
    </div>
  );
}
