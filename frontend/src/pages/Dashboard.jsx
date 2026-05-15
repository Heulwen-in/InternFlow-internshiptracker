import { useAuth } from "../context/useAuth";

function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <main className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1>InternFlow</h1>
          <p>Welcome, {user?.name}. Your tracker foundation is ready.</p>
        </div>
        <button type="button" onClick={logout}>
          Logout
        </button>
      </header>

      <section className="dashboard-grid">
        <article>
          <span>Total applications</span>
          <strong>0</strong>
        </article>
        <article>
          <span>Interviews</span>
          <strong>0</strong>
        </article>
        <article>
          <span>Offers</span>
          <strong>0</strong>
        </article>
      </section>
    </main>
  );
}

export default Dashboard;
