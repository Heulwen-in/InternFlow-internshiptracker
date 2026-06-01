import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createApplication } from "../api/applicationApi";
import { createCompany, getCompanies } from "../api/companyApi";

const statuses = [
  "Saved",
  "Applied",
  "Online Assessment",
  "Interview",
  "Offer",
  "Rejected",
];

function NewApplication() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [error, setError] = useState("");
  const [companyForm, setCompanyForm] = useState({ name: "", website: "" });

  const [form, setForm] = useState({
    companyId: "",
    roleTitle: "",
    jobUrl: "",
    location: "",
    workType: "Remote",
    status: "Saved",
    appliedDate: "",
    deadline: "",
    priority: "Medium",
  });

  useEffect(() => {
    const loadCompanies = async () => {
      const res = await getCompanies();
      setCompanies(res.data.companies);
    };

    loadCompanies();
  }, []);

  const handleCreateCompany = async (event) => {
    event.preventDefault();
    setError("");

    try {
      const res = await createCompany(companyForm);
      const company = res.data.company;

      setCompanies((current) => [company, ...current]);
      setForm((current) => ({ ...current, companyId: String(company.id) }));
      setCompanyForm({ name: "", website: "" });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create company");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    try {
      await createApplication({
        ...form,
        companyId: Number(form.companyId),
      });

      navigate("/applications");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create application");
    }
  };

  return (
    <main className="dashboard">
      <Link to="/applications" className="back-link">
        ← Back to applications
      </Link>

      <header className="dashboard-header">
        <div>
          <h1>Add Application</h1>
          <p>Create a company first, then attach an application to it.</p>
        </div>
      </header>

      {error && <div className="alert">{error}</div>}

      <section className="form-grid">
        <form className="auth-card" onSubmit={handleCreateCompany}>
          <h2>Add Company</h2>

          <label>
            Company name
            <input
              value={companyForm.name}
              onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
              required
            />
          </label>

          <label>
            Website
            <input
              value={companyForm.website}
              onChange={(e) =>
                setCompanyForm({ ...companyForm, website: e.target.value })
              }
            />
          </label>

          <button type="submit">Save Company</button>
        </form>

        <form className="auth-card" onSubmit={handleSubmit}>
          <h2>Application Details</h2>

          <label>
            Company
            <select
              value={form.companyId}
              onChange={(e) => setForm({ ...form, companyId: e.target.value })}
              required
            >
              <option value="">Select company</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Role title
            <input
              value={form.roleTitle}
              onChange={(e) => setForm({ ...form, roleTitle: e.target.value })}
              required
            />
          </label>

          <label>
            Job URL
            <input
              value={form.jobUrl}
              onChange={(e) => setForm({ ...form, jobUrl: e.target.value })}
            />
          </label>

          <label>
            Location
            <input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </label>

          <label>
            Work type
            <select
              value={form.workType}
              onChange={(e) => setForm({ ...form, workType: e.target.value })}
            >
              <option>Remote</option>
              <option>Hybrid</option>
              <option>On-site</option>
            </select>
          </label>

          <label>
            Status
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              {statuses.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </label>

          <label>
            Applied date
            <input
              type="date"
              value={form.appliedDate}
              onChange={(e) => setForm({ ...form, appliedDate: e.target.value })}
            />
          </label>

          <label>
            Deadline
            <input
              type="date"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
            />
          </label>

          <label>
            Priority
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
          </label>

          <button type="submit">Save Application</button>
        </form>
      </section>
    </main>
  );
}

export default NewApplication;
