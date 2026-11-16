// The project name, logo and taglines shown beside the Login and Register forms.
export default function AuthBrand() {
  return (
    <section className="auth-brand">
      <img className="brand-logo brand-logo-large" src="frontend/public/logo.png" alt="Budgeteer" />
      <h1 className="brand-name">Budgeteer</h1>
      <p className="tagline tagline-main">Serving the nation, from paupers to royalty!</p>
      <p className="tagline">Guarding your budget, slaying overspending, and keeping your finances in check — so you can live happily ever after</p>
    </section>
  );
}
