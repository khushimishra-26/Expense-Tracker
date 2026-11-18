import logo from "../assets/logo.png";

// The project name, logo and taglines shown beside the Login and Register forms.
export default function AuthBrand() {
  return (
    <section className="auth-brand">
      <img className="brand-logo brand-logo-large" src={logo} alt="Budgeteer" />
      <h1 className="brand-name">Budgeteer</h1>
      <p className="tagline tagline-main">Your Money's Knight in Shining Armor!</p>
      <p className="tagline">Saves your budget from overspending to maintain your peaceful life</p>
    </section>
  );
}