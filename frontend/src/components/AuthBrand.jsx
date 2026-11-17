// The project name, logo and taglines shown beside the Login and Register forms.
export default function AuthBrand() {
  return (
    <section className="auth-brand">
      <img className="brand-logo brand-logo-large" src="frontend/src/assets/logo.png" alt="Budgeteer" />
      <h1 className="brand-name">Budgeteer</h1>
      <p className="tagline tagline-main">Serving the nation - From paupers to royalty</p>
      <p className="tagline">Saves your budget from overspending to maintain your peaceful life</p>
      <p className="tagline">Always at your service</p>
    </section>
  );
}
