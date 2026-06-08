import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createApplication } from "../api/applicationApi";
import {
  createCompany,
  deleteCompany,
  getCompanies,
  updateCompany,
} from "../api/companyApi";

const statuses = [
  "Saved",
  "Applied",
  "Online Assessment",
  "Interview",
  "Offer",
  "Rejected",
];

const getWebsiteUrl = (website) => {
  if (!website) return "";
  return website.startsWith("http://") || website.startsWith("https://")
    ? website
    : `https://${website}`;
};

function NewApplication() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [error, setError] = useState("");
  const [companyForm, setCompanyForm] = useState({ name: "", website: "" });
  const [linkForm, setLinkForm] = useState({ companyId: "", website: "" });

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

  const selectedCompany = companies.find(
    (company) => String(company.id) === form.companyId
  );

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

  const handleDeleteCompany = async (company) => {
    if (!confirm(`Delete ${company.name}?`)) return;

    setError("");

    try {
      await deleteCompany(company.id);
      setCompanies((current) => current.filter((item) => item.id !== company.id));

      if (form.companyId === String(company.id)) {
        setForm((current) => ({ ...current, companyId: "" }));
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to delete company. Remove its applications first."
      );
    }
  };

  const handleStartAddLink = (company) => {
    setError("");
    setLinkForm({ companyId: String(company.id), website: company.website || "" });
  };

  const handleCancelAddLink = () => {
    setLinkForm({ companyId: "", website: "" });
  };

  const handleSaveCompanyLink = async (company) => {
    const website = linkForm.website.trim();

    if (!website) {
      setError("Please enter the company link first.");
      return;
    }

    setError("");

    try {
      const res = await updateCompany(company.id, {
        name: company.name,
        website,
        industry: company.industry,
        location: company.location,
      });

      const updatedCompany = res.data.company;
      setCompanies((current) =>
        current.map((item) =>
          item.id === updatedCompany.id ? { ...item, ...updatedCompany } : item
        )
      );
      handleCancelAddLink();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add company link");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.companyId) {
      setError("Please select or add the company you applied to.");
      return;
    }

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
          <p>Choose the company applied to, then add the role details below.</p>
        </div>
      </header>

      {error && <div className="alert">{error}</div>}

      <section className="application-stack">
        <section className="table-card compact-card application-flow-card">
          <div className="comment-section__header">
            <div>
              <h2>Company Applied</h2>
              <p>Select an existing company or add a new one for this application.</p>
            </div>
            {selectedCompany && <span>Selected</span>}
          </div>

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

          {selectedCompany && (
            <div className="selected-company-card">
              <div>
                <span>Current company</span>
                <strong>{selectedCompany.name}</strong>
              </div>
              {selectedCompany.website && (
                <a
                  href={getWebsiteUrl(selectedCompany.website)}
                  target="_blank"
                  rel="noreferrer"
                >
                  {selectedCompany.website}
                </a>
              )}
            </div>
          )}

          {companies.length > 0 && (
            <div className="company-suggestions">
              <div className="section-header">
                <h3>Company suggestions</h3>
                <span className="muted">Name and company link</span>
              </div>

              <div className="company-suggestion-list">
                {companies.map((company) => {
                  const isSelected = form.companyId === String(company.id);
                  const applicationCount = company._count?.applications || 0;
                  const isAddingLink = linkForm.companyId === String(company.id);

                  return (
                    <article
                      className="company-suggestion-card"
                      data-selected={isSelected}
                      key={company.id}
                    >
                      <button
                        type="button"
                        className="company-suggestion-main"
                        onClick={() =>
                          setForm((current) => ({
                            ...current,
                            companyId: String(company.id),
                          }))
                        }
                      >
                        <strong>{company.name}</strong>
                        {company.website ? (
                          <span>{company.website}</span>
                        ) : isAddingLink ? (
                          <span>Adding company link</span>
                        ) : (
                          <span>No company link yet</span>
                        )}
                      </button>

                      {isAddingLink && (
                        <div className="company-link-editor">
                          <input
                            placeholder="https://company.com"
                            value={linkForm.website}
                            onChange={(e) =>
                              setLinkForm((current) => ({
                                ...current,
                                website: e.target.value,
                              }))
                            }
                          />
                          <div>
                            <button
                              type="button"
                              className="button-ghost"
                              onClick={handleCancelAddLink}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveCompanyLink(company)}
                            >
                              Save Link
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="company-suggestion-actions">
                        {company.website && (
                          <a
                            href={getWebsiteUrl(company.website)}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Open link
                          </a>
                        )}
                        {!company.website && !isAddingLink && (
                          <button
                            type="button"
                            className="button-neutral"
                            onClick={() => handleStartAddLink(company)}
                          >
                            Add link
                          </button>
                        )}
                        <button
                          type="button"
                          className="button-delete"
                          onClick={() => handleDeleteCompany(company)}
                          disabled={applicationCount > 0}
                          title={
                            applicationCount > 0
                              ? "Cannot delete a company that already has applications"
                              : "Delete company"
                          }
                        >
                          Delete
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}

          <div className="section-divider">
            <span>or add company</span>
          </div>

          <form className="company-inline-form" onSubmit={handleCreateCompany}>
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

            <button type="submit">Add Company</button>
          </form>
        </section>

        <form
          className="table-card compact-card application-flow-card"
          onSubmit={handleSubmit}
        >
          <div className="comment-section__header">
            <div>
              <h2>Application Details</h2>
              <p>Add the role information, dates, and tracking status.</p>
            </div>
          </div>

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
