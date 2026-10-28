
import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

const API = "http://localhost:5000/api/applications";

const STATUSES = [
  "Applied",
  "Interview",
  "Offer",
  "Rejected",
  "Accepted",
  "Declined"
];

const TRANSITIONS = {
  Applied: ["Interview", "Rejected"],
  Interview: ["Offer", "Rejected"],
  Offer: ["Accepted", "Declined"]
};

const EMPTY_FORM = () => ({
  companyName: "",
  jobRole: "",
  jobType: "Full-time",
  appliedDate: new Date().toISOString().slice(0, 10),
  expectedSalary: "",
  notes: ""
});

function App() {
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState({});
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [historyId, setHistoryId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  async function loadApplications() {
    try {
      const response = await axios.get(API, {
        params: { company: search, status }
      });

      setApplications(response.data.data);

      const statsResponse = await axios.get(`${API}/stats`);
      setStats(statsResponse.data.data);
    } catch {
      setMessage("Could not load applications. Check the backend.");
    }
  }

  useEffect(() => {
    loadApplications();
  }, [search, status]);

  function updateForm(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value
    });
  }

  async function addApplication(event) {
    event.preventDefault();
    setMessage("");

    try {
      await axios.post(API, form);
      setMessage("Application added successfully!");
      setForm(EMPTY_FORM());
      await loadApplications();
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Could not add application."
      );
    }
  }

  async function changeStatus(id, nextStatus) {
    setMessage("");

    try {
      await axios.patch(`${API}/${id}/status`, {
        status: nextStatus
      });

      setMessage("Status updated successfully!");
      await loadApplications();
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Status update failed."
      );
    }
  }

  function startEdit(app) {
    setEditing(app._id);

    setEditForm({
      companyName: app.companyName,
      jobRole: app.jobRole,
      jobType: app.jobType,
      expectedSalary: app.expectedSalary ?? "",
      notes: app.notes || ""
    });
  }

  async function saveEdit(event) {
    event.preventDefault();
    setMessage("");

    try {
      await axios.put(`${API}/${editing}`, editForm);

      setEditing(null);
      setMessage("Application updated successfully!");
      await loadApplications();
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Application update failed."
      );
    }
  }

  async function deleteApplication(application) {
    const confirmed = window.confirm(
      `Delete ${application.companyName} application?`
    );

    if (!confirmed) return;

    try {
      await axios.delete(`${API}/${application._id}`);
      setMessage("Application deleted successfully!");
      await loadApplications();
    } catch (error) {
      setMessage(error.response?.data?.message || "Delete failed.");
    }
  }

  return (
    <main className="container">
      <header>
        <p className="eyebrow">CAREER ORGANIZER</p>
        <h1>Job Application Tracker</h1>
        <p>Every application, one clear place.</p>
      </header>

      <section className="stats">
        {STATUSES.map(name => (
          <article className="stat" key={name}>
            <span>{name}</span>
            <strong>{stats[name] ?? 0}</strong>
          </article>
        ))}
      </section>

      <section className="panel">
        <h2>Add an application</h2>

        <form onSubmit={addApplication} className="form-grid">
          <label>
            Company Name
            <input
              name="companyName"
              value={form.companyName}
              onChange={updateForm}
              required
            />
          </label>

          <label>
            Job Role
            <input
              name="jobRole"
              value={form.jobRole}
              onChange={updateForm}
              required
            />
          </label>

          <label>
            Job Type
            <select
              name="jobType"
              value={form.jobType}
              onChange={updateForm}
              required
            >
              <option>Full-time</option>
              <option>Internship</option>
              <option>Contract</option>
            </select>
          </label>

          <label>
            Applied Date
            <input
              type="date"
              name="appliedDate"
              max={new Date().toISOString().slice(0, 10)}
              value={form.appliedDate}
              onChange={updateForm}
              required
            />
          </label>

          <label>
            Expected Salary (optional)
            <input
              type="number"
              min="0"
              name="expectedSalary"
              value={form.expectedSalary}
              onChange={updateForm}
            />
          </label>

          <label>
            Notes (optional)
            <input
              name="notes"
              value={form.notes}
              onChange={updateForm}
            />
          </label>

          <button className="primary" type="submit">
            + Add Application
          </button>
        </form>

        {message && <p className="message">{message}</p>}
      </section>

      <section className="panel">
        <div className="toolbar">
          <h2>Your applications</h2>

          <input
            placeholder="Search company..."
            value={search}
            onChange={event => setSearch(event.target.value)}
          />

          <select
            value={status}
            onChange={event => setStatus(event.target.value)}
          >
            <option value="">All statuses</option>
            {STATUSES.map(item => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="application-list">
          {applications.map(app => (
            <article className="application" key={app._id}>
              <div className="application-info">
                <span className="app-id">{app.applicationId}</span>

                <h3>{app.companyName}</h3>
                <p>{app.jobRole} · {app.jobType}</p>

                <small>
                  Applied: {app.appliedDate.slice(0, 10)}
                </small>

                {app.isOverdue && (
                  <p className="overdue">Follow-up Overdue</p>
                )}
              </div>

              <div className="actions">
                <span className={`badge ${app.status.toLowerCase()}`}>
                  {app.status}
                </span>

                <button onClick={() => startEdit(app)}>
                  Edit
                </button>

                <button
                  onClick={() =>
                    setHistoryId(
                      historyId === app._id ? null : app._id
                    )
                  }
                >
                  {historyId === app._id ? "Hide History" : "History"}
                </button>

                {TRANSITIONS[app.status]?.length > 0 && (
                  <select
                    key={`${app._id}-${app.status}`}
                    defaultValue=""
                    aria-label="Update application status"
                    onChange={event => {
                      const nextStatus = event.target.value;
                      if (nextStatus) {
                        changeStatus(app._id, nextStatus);
                      }
                    }}
                  >
                    <option value="">Update status</option>
                    {TRANSITIONS[app.status].map(next => (
                      <option key={next} value={next}>
                        {next}
                      </option>
                    ))}
                  </select>
                )}

                {(app.status === "Applied" ||
                  ["Rejected", "Accepted", "Declined"].includes(app.status)) && (
                  <button
                    className="danger"
                    onClick={() => deleteApplication(app)}
                  >
                    Delete
                  </button>
                )}
              </div>

              {editing === app._id && (
                <form onSubmit={saveEdit} className="form-grid edit-form">
                  <h3>Edit Application</h3>

                  <label>
                    Company Name
                    <input
                      required
                      value={editForm.companyName}
                      onChange={event =>
                        setEditForm({
                          ...editForm,
                          companyName: event.target.value
                        })
                      }
                    />
                  </label>

                  <label>
                    Job Role
                    <input
                      required
                      value={editForm.jobRole}
                      onChange={event =>
                        setEditForm({
                          ...editForm,
                          jobRole: event.target.value
                        })
                      }
                    />
                  </label>

                  <label>
                    Job Type
                    <select
                      value={editForm.jobType}
                      onChange={event =>
                        setEditForm({
                          ...editForm,
                          jobType: event.target.value
                        })
                      }
                    >
                      <option>Full-time</option>
                      <option>Internship</option>
                      <option>Contract</option>
                    </select>
                  </label>

                  <label>
                    Expected Salary
                    <input
                      type="number"
                      min="0"
                      value={editForm.expectedSalary}
                      onChange={event =>
                        setEditForm({
                          ...editForm,
                          expectedSalary: event.target.value
                        })
                      }
                    />
                  </label>

                  <label>
                    Notes
                    <input
                      value={editForm.notes}
                      onChange={event =>
                        setEditForm({
                          ...editForm,
                          notes: event.target.value
                        })
                      }
                    />
                  </label>

                  <button className="primary" type="submit">
                    Save Changes
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditing(null)}
                  >
                    Cancel
                  </button>
                </form>
              )}

              {historyId === app._id && (
                <div className="history">
                  <h4>Status History</h4>

                  {app.statusHistory?.map((item, index) => (
                    <p key={index}>
                      <strong>{item.status}</strong>
                      {" · "}
                      {new Date(item.changedAt).toLocaleString()}
                    </p>
                  ))}

                  {!app.statusHistory?.length && (
                    <p>No status history available.</p>
                  )}
                </div>
              )}
            </article>
          ))}

          {applications.length === 0 && (
            <p>No applications found. Add your first one!</p>
          )}
        </div>
      </section>
    </main>
  );
}

export default App;
