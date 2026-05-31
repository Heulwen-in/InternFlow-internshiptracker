import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getApplication, updateApplication } from "../api/applicationApi";
import { getCompanies } from "../api/companyApi";
import { createNote, deleteNote, getNotes } from "../api/noteApi";
import { createInterview, deleteInterview, getApplicationInterviews } from "../api/interviewApi";

const statuses = ["Saved", "Applied", "Online Assessment", "Interview", "Offer", "Rejected"];

const toInputDate = (value) => {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
};

function EditApplication() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [companies, setCompanies] = useState([]);
  const [form, setForm] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [notesError, setNotesError] = useState("");
  const [statusHistory, setStatusHistory] = useState([]);
  const [notes, setNotes] = useState([]);
  const [noteContent, setNoteContent] = useState("");
  const [interviews, setInterviews] = useState([]);
  const [interviewForm, setInterviewForm] = useState({
    interviewDate: "",
    interviewType: "",
    meetingLink: "",
    notes: "",
  });

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError("");
      setNotesError("");

      try {
        const [applicationRes, companiesRes] = await Promise.all([
          getApplication(id),
          getCompanies(),
        ]);

        const application = applicationRes.data.application;
        const interviewsRes = await getApplicationInterviews(id);
        setInterviews(interviewsRes.data.interviews || []);
        setStatusHistory(application.statusHistory || []);
        setCompanies(companiesRes.data.companies);
        setForm({
          companyId: String(application.companyId),
          roleTitle: application.roleTitle,
          jobUrl: application.jobUrl || "",
          location: application.location || "",
          workType: application.workType || "Remote",
          status: application.status || "Saved",
          appliedDate: toInputDate(application.appliedDate),
          deadline: toInputDate(application.deadline),
          priority: application.priority || "Medium",
        });

        try {
          const notesRes = await getNotes(id);
          setNotes(notesRes.data.notes || []);
        } catch {
          setNotesError("Failed to load notes");
        }
      } catch {
        setError("Failed to load application");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [id]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    try {
      await updateApplication(id, {
        ...form,
        companyId: Number(form.companyId),
      });

      navigate("/applications");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update application");
    }
  };

  const handleCreateNote = async (event) => {
    event.preventDefault();
  
    if (!noteContent.trim()) return;
  
    const res = await createNote(id, { content: noteContent });
    setNotes((current) => [res.data.note, ...current]);
    setNoteContent("");
  };
  
  const handleDeleteNote = async (noteId) => {
    await deleteNote(noteId);
    setNotes((current) => current.filter((note) => note.id !== noteId));
  };

  const handleCreateInterview = async (event) => {
    event.preventDefault();
  
    const res = await createInterview(id, interviewForm);
    setInterviews((current) => [...current, res.data.interview]);
    setInterviewForm({
      interviewDate: "",
      interviewType: "Technical",
      meetingLink: "",
      notes: "",
    });
  };
  
  const handleDeleteInterview = async (interviewId) => {
    await deleteInterview(interviewId);
    setInterviews((current) =>
      current.filter((interview) => interview.id !== interviewId)
    );
  };

  if (isLoading) {
    return (
      <main className="dashboard">
        <p className="muted">Loading application...</p>
      </main>
    );
  }

  if (!form) {
    return (
      <main className="dashboard">
        <Link to="/applications" className="back-link">
          &lt; Back to applications
        </Link>
        {error && <div className="alert">{error}</div>}
        {!error && <p className="muted">Application not found.</p>}
      </main>
    );
  }

  return (
    <main className="dashboard">
      <Link to="/applications" className="back-link">
        &lt; Back to applications
      </Link>

      <header className="dashboard-header">
        <div>
          <h1>Edit Application</h1>
          <p>Update role details, status, deadline, and priority.</p>
        </div>
      </header>

      {error && <div className="alert">{error}</div>}

      <form className="auth-card wide-form" onSubmit={handleSubmit}>
        <label>
          Company
          <select
            value={form.companyId}
            onChange={(e) => setForm({ ...form, companyId: e.target.value })}
            required
          >
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

        <button type="submit">Save Changes</button>
      </form>

      <section className="table-card compact-card">
        <h2>Status History</h2>
        {statusHistory.length === 0 ? (
          <p className="muted">No status history yet.</p>
        ) : (
          <ul className="timeline">
            {statusHistory.map((item) => (
              <li key={item.id}>
                <strong>
                  {item.oldStatus || "Created"} → {item.newStatus}
                </strong>
                <span>{new Date(item.changedAt).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="table-card compact-card">
        <h2>Notes</h2>
        {notesError && <div className="alert">{notesError}</div>}
        <form className="inline-form" onSubmit={handleCreateNote}>
          <textarea
          placeholder="Add interview feedback, recruiter details, or next steps"
          value={noteContent}
          onChange={(e) => setNoteContent(e.target.value)}
          />
          <button type="submit">Add Note</button>
          </form>

          {notes.length === 0 ? (
            <p className="muted">No notes yet.</p>
          ) : (
          <ul className="note-list">
            {notes.map((note) => (
              <li key={note.id}>
                <p>{note.content}</p>
                <span>{new Date(note.createdAt).toLocaleString()}</span>
                <button
                type="button"
                className="button-danger"
                onClick={() => handleDeleteNote(note.id)}>
                  Delete
                  </button>
                  </li>
                ))}
                </ul>
              )}
              </section>

              <section className="table-card compact-card">
                <h2>Interviews</h2>
                
                <form className="inline-form" onSubmit={handleCreateInterview}>
                  <input
                  type="datetime-local"
                  value={interviewForm.interviewDate}
                  onChange={(e) =>
                    setInterviewForm({ ...interviewForm, interviewDate: e.target.value })
                  }
                  required
                  />
                  
                  <select
                  value={interviewForm.interviewType}
                  onChange={(e) =>
                    setInterviewForm({ ...interviewForm, interviewType: e.target.value })
                  }
                  >
                    <option>HR</option>
                    <option>Technical</option>
                    <option>Behavioral</option>
                    <option>Final</option>
                  </select>
                    
                  <input
                    placeholder="Meeting link"
                    value={interviewForm.meetingLink}
                    onChange={(e) =>
                      setInterviewForm({ ...interviewForm, meetingLink: e.target.value })
                    }
                  />
                  <textarea
                    placeholder="Interview notes"
                    value={interviewForm.notes}
                    onChange={(e) =>
                      setInterviewForm({ ...interviewForm, notes: e.target.value })
                    }
                    />
                    
                    <button type="submit">Add Interview</button>
                  </form>
                  
                  {interviews.length === 0 ? (
                    <p className="muted">No interviews scheduled yet.</p>
                  ) : (
                    <ul className="note-list">
                      {interviews.map((interview) => (
                        <li key={interview.id}>
                          <strong>{interview.interviewType || "Interview"}</strong>
                          <span>{new Date(interview.interviewDate).toLocaleString()}</span>
                          {interview.meetingLink && <a href={interview.meetingLink}>Meeting link</a>}
                          {interview.notes && <p>{interview.notes}</p>}
                          <button
                            type="button"
                            className="button-danger"
                            onClick={() => handleDeleteInterview(interview.id)}
                          >
                            Delete
                            </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </section>
                  </main>
                );
              }

export default EditApplication;