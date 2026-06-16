import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router";

/* ── Types ─────────────────────────────────────────────────────────────── */
interface CampaignRow {
  id: number;
  subject: string;
  previewText: string | null;
  htmlContent: string;
  templateName: string | null;
  recipientCount: number | null;
  sentCount: number | null;
  failedCount: number | null;
  status: string;
  createdAt: string;
  sentAt: string | null;
}
interface AudienceUser { id: number; name: string | null; email: string | null; avatar: string | null; }
interface TemplateInfo { id: string; name: string; description: string; }
interface Toast { id: number; message: string; type: "success" | "error" | "info"; }

/* ── API helpers ───────────────────────────────────────────────────────── */
const api = {
  async get<T>(path: string): Promise<T> {
    const res = await fetch(`/api/admin${path}`, { credentials: "include" });
    if (res.status === 401) throw new Error("UNAUTHORIZED");
    return res.json();
  },
  async post<T>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(`/api/admin${path}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (res.status === 401) throw new Error("UNAUTHORIZED");
    return res.json();
  },
};

/* ── Tabs ──────────────────────────────────────────────────────────────── */
const TABS = [
  { id: "compose", icon: "edit", label: "Compose" },
  { id: "audience", icon: "group", label: "Audience" },
  { id: "templates", icon: "palette", label: "Templates" },
  { id: "history", icon: "history", label: "History" },
] as const;
type TabId = (typeof TABS)[number]["id"];

export default function AdminEmail() {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [tab, setTab] = useState<TabId>("compose");
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Check auth
  useEffect(() => {
    api.get<{ authenticated: boolean }>("/check")
      .then((d) => { if (!d.authenticated) navigate("/admin/login"); else setAuthed(true); })
      .catch(() => navigate("/admin/login"));
  }, [navigate]);

  const addToast = useCallback((message: string, type: Toast["type"] = "info") => {
    const id = Date.now();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  const logout = async () => {
    await api.post("/logout");
    navigate("/admin/login");
  };

  if (authed === null) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--surface)" }}>
        <div className="neu-card p-8"><p style={{ color: "var(--on-surface-variant)" }}>Loading...</p></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--surface)" }}>
      {/* Toast container */}
      <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8 }}>
        {toasts.map((t) => (
          <div
            key={t.id}
            className="neu-extruded"
            style={{
              padding: "12px 20px",
              borderRadius: "var(--radius)",
              fontFamily: "Manrope, sans-serif",
              fontSize: "13px",
              fontWeight: 600,
              color: t.type === "error" ? "var(--error)" : t.type === "success" ? "#3d8c5c" : "var(--on-surface)",
              animation: "modalSlideUp 0.3s ease-out",
              maxWidth: "360px",
            }}
          >
            {t.message}
          </div>
        ))}
      </div>

      {/* Header */}
      <header
        className="neu-extruded flex items-center justify-between"
        style={{ padding: "16px 28px", borderRadius: 0 }}
      >
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined" style={{ fontSize: "24px", color: "var(--primary)" }}>
            campaign
          </span>
          <div>
            <h1 style={{ fontFamily: "Manrope, sans-serif", fontSize: "18px", fontWeight: 700, color: "var(--on-surface)", margin: 0 }}>
              Email Campaigns
            </h1>
            <p style={{ fontFamily: "Manrope, sans-serif", fontSize: "11px", color: "var(--on-surface-variant)", margin: 0 }}>
              Mannyatra Admin
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="neu-subtle flex items-center gap-2"
          style={{
            borderRadius: "var(--radius-full)",
            padding: "8px 16px",
            border: "none",
            cursor: "pointer",
            backgroundColor: "var(--surface)",
            fontFamily: "Manrope, sans-serif",
            fontSize: "12px",
            fontWeight: 600,
            color: "var(--on-surface-variant)",
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>logout</span>
          Logout
        </button>
      </header>

      {/* Tab bar */}
      <div className="flex gap-2 overflow-x-auto" style={{ padding: "16px 28px 0", scrollbarWidth: "none" }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-5 py-2 rounded-full whitespace-nowrap transition-all duration-200 ${tab === t.id ? "neu-inset" : "neu-subtle hover:scale-[1.02]"}`}
            style={{
              backgroundColor: "var(--surface)",
              border: "none",
              cursor: "pointer",
              fontFamily: "Manrope, sans-serif",
              fontSize: "13px",
              fontWeight: 600,
              color: tab === t.id ? "var(--primary)" : "var(--on-surface-variant)",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "16px", fontVariationSettings: tab === t.id ? "'FILL' 1" : "'FILL' 0" }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ padding: "20px 28px 40px" }}>
        {tab === "compose" && <ComposeTab addToast={addToast} />}
        {tab === "audience" && <AudienceTab />}
        {tab === "templates" && <TemplatesTab addToast={addToast} />}
        {tab === "history" && <HistoryTab addToast={addToast} />}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   COMPOSE TAB
   ══════════════════════════════════════════════════════════════════════════ */

function ComposeTab({ addToast }: { addToast: (m: string, t?: Toast["type"]) => void }) {
  const [campaignId, setCampaignId] = useState<number | null>(null);
  const [subject, setSubject] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [templateId, setTemplateId] = useState("blank");
  const [heading, setHeading] = useState("");
  const [body, setBody] = useState("");
  const [heroImage, setHeroImage] = useState("");
  const [ctaText, setCtaText] = useState("");
  const [ctaUrl, setCtaUrl] = useState("");
  const [htmlPreview, setHtmlPreview] = useState("");
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [sending, setSending] = useState(false);
  const [posterMode, setPosterMode] = useState(false);

  // Autosave
  const autosaveRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const saveDraft = useCallback(async () => {
    if (!subject.trim()) return;
    // Build HTML first
    let html: string;
    if (posterMode) {
      const res = await api.post<{ html: string }>("/templates/poster", {
        heroImage, title: heading, subtitle: body, ctaText, ctaUrl,
      });
      html = res.html;
    } else {
      const res = await api.post<{ html: string }>("/templates/preview", {
        templateId, heading, body, heroImage, ctaText, ctaUrl, previewText,
      });
      html = res.html;
    }
    const result = await api.post<{ id: number; saved: boolean }>("/campaigns", {
      id: campaignId, subject, previewText, htmlContent: html, templateName: posterMode ? "poster" : templateId,
    });
    if (result.saved) {
      setCampaignId(result.id);
      addToast("Draft saved ✓", "success");
    }
  }, [subject, previewText, templateId, heading, body, heroImage, ctaText, ctaUrl, campaignId, posterMode, addToast]);

  // Ctrl+S to save
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        saveDraft();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [saveDraft]);

  // Autosave every 30s
  useEffect(() => {
    autosaveRef.current = setInterval(() => {
      if (subject.trim()) saveDraft();
    }, 30000);
    return () => { if (autosaveRef.current) clearInterval(autosaveRef.current); };
  }, [saveDraft, subject]);

  // Live preview
  const updatePreview = useCallback(async () => {
    try {
      if (posterMode) {
        const res = await api.post<{ html: string }>("/templates/poster", {
          heroImage, title: heading || "Your Title", subtitle: body || "Your subtitle", ctaText: ctaText || "Explore", ctaUrl: ctaUrl || "#",
        });
        setHtmlPreview(res.html);
      } else {
        const res = await api.post<{ html: string }>("/templates/preview", {
          templateId, heading, body, heroImage, ctaText, ctaUrl, previewText,
        });
        setHtmlPreview(res.html);
      }
    } catch { /* ignore */ }
  }, [templateId, heading, body, heroImage, ctaText, ctaUrl, previewText, posterMode]);

  useEffect(() => {
    const timer = setTimeout(updatePreview, 500);
    return () => clearTimeout(timer);
  }, [updatePreview]);

  const sendTest = async () => {
    if (!campaignId) { await saveDraft(); }
    const cid = campaignId;
    if (!cid) { addToast("Save draft first", "error"); return; }
    setSending(true);
    try {
      const res = await api.post<{ success: boolean; error?: string }>(`/campaigns/${cid}/send-test`, {
        email: "mtars7479@gmail.com",
      });
      addToast(res.success ? "Test email sent! ✓" : `Failed: ${res.error}`, res.success ? "success" : "error");
    } finally { setSending(false); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Editor */}
      <div className="space-y-4">
        {/* Mode toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setPosterMode(false)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all ${!posterMode ? "neu-inset" : "neu-subtle"}`}
            style={{ border: "none", cursor: "pointer", backgroundColor: "var(--surface)", fontFamily: "Manrope, sans-serif", color: !posterMode ? "var(--primary)" : "var(--on-surface-variant)" }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>edit</span>
            Template Editor
          </button>
          <button
            onClick={() => setPosterMode(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all ${posterMode ? "neu-inset" : "neu-subtle"}`}
            style={{ border: "none", cursor: "pointer", backgroundColor: "var(--surface)", fontFamily: "Manrope, sans-serif", color: posterMode ? "var(--primary)" : "var(--on-surface-variant)" }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>photo_camera</span>
            Travel Poster
          </button>
        </div>

        <div className="neu-extruded" style={{ borderRadius: "var(--radius)", padding: "var(--space-inner)" }}>
          <InputField label="Subject" value={subject} onChange={setSubject} placeholder="Your email subject" />
          <InputField label="Preview Text" value={previewText} onChange={setPreviewText} placeholder="Shown in inbox preview" />

          {!posterMode && (
            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>Template</label>
              <select
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                className="neu-input w-full"
                style={{ cursor: "pointer" }}
              >
                <option value="blank">Blank Template</option>
                <option value="welcome">Welcome to Mannyatra</option>
                <option value="weekly">Weekly Travel Inspiration</option>
                <option value="feature">New Feature Announcement</option>
                <option value="reengagement">Your Bucket List Misses You</option>
              </select>
            </div>
          )}

          <InputField label={posterMode ? "Title" : "Heading"} value={heading} onChange={setHeading} placeholder={posterMode ? "Discover Bali" : "Email heading"} />
          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>{posterMode ? "Subtitle" : "Body Content"}</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={posterMode ? "Paradise awaits..." : "Main email body text..."}
              className="neu-input w-full"
              rows={posterMode ? 2 : 5}
              style={{ resize: "vertical" }}
            />
          </div>
          <InputField label="Hero Image URL" value={heroImage} onChange={setHeroImage} placeholder="https://images.unsplash.com/..." />
          <div className="grid grid-cols-2 gap-3">
            <InputField label="CTA Button Text" value={ctaText} onChange={setCtaText} placeholder="Explore Now" />
            <InputField label="CTA Button URL" value={ctaUrl} onChange={setCtaUrl} placeholder="https://mannyatra.in" />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3">
          <ActionButton icon="save" label="Save Draft" onClick={saveDraft} hint="Ctrl+S" />
          <ActionButton icon="send" label="Send Test" onClick={sendTest} loading={sending} />
          <ActionButton icon="visibility" label={previewMode === "desktop" ? "Mobile" : "Desktop"} onClick={() => setPreviewMode(previewMode === "desktop" ? "mobile" : "desktop")} />
        </div>
      </div>

      {/* Preview */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "var(--on-surface-variant)" }}>preview</span>
          <span style={{ fontFamily: "Manrope, sans-serif", fontSize: "12px", fontWeight: 600, color: "var(--on-surface-variant)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Live Preview ({previewMode})
          </span>
        </div>
        <div
          className="neu-inset overflow-hidden"
          style={{
            borderRadius: "var(--radius)",
            width: previewMode === "mobile" ? "375px" : "100%",
            margin: previewMode === "mobile" ? "0 auto" : undefined,
            transition: "width 0.3s ease",
          }}
        >
          <iframe
            srcDoc={htmlPreview || "<html><body style='display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;color:#aaa'><p>Start typing to see preview...</p></body></html>"}
            title="Email Preview"
            style={{ width: "100%", height: "600px", border: "none", background: "#fff" }}
            sandbox="allow-same-origin"
          />
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   AUDIENCE TAB
   ══════════════════════════════════════════════════════════════════════════ */

function AudienceTab() {
  const [users, setUsers] = useState<AudienceUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ total: number; users: AudienceUser[] }>("/audience")
      .then((d) => setUsers(d.users))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <SkeletonGrid />;

  return (
    <div>
      <div className="neu-extruded flex items-center gap-4 mb-6" style={{ borderRadius: "var(--radius)", padding: "16px 24px" }}>
        <StatPill icon="group" label="Total Users" value={users.length} color="var(--primary)" />
        <StatPill icon="email" label="With Email" value={users.filter((u) => u.email).length} color="#3d8c5c" />
      </div>

      <div className="neu-extruded" style={{ borderRadius: "var(--radius)", padding: "var(--space-inner)" }}>
        <p style={{ ...labelStyle, marginBottom: "12px" }}>Registered Users</p>
        <div style={{ maxHeight: "400px", overflowY: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "Manrope, sans-serif", fontSize: "13px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--outline-variant)" }}>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Email</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderBottom: "1px solid var(--outline-variant)" }}>
                  <td style={tdStyle}>
                    <div className="flex items-center gap-2">
                      {u.avatar && <img src={u.avatar} alt="" style={{ width: 24, height: 24, borderRadius: "50%" }} />}
                      {u.name ?? "—"}
                    </div>
                  </td>
                  <td style={tdStyle}>{u.email ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   TEMPLATES TAB
   ══════════════════════════════════════════════════════════════════════════ */

function TemplatesTab({ addToast }: { addToast: (m: string, t?: Toast["type"]) => void }) {
  const [templates, setTemplates] = useState<TemplateInfo[]>([]);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    api.get<TemplateInfo[]>("/templates").then(setTemplates);
  }, []);

  const showPreview = async (id: string) => {
    const res = await api.post<{ html: string }>("/templates/preview", { templateId: id });
    setPreview(res.html);
    addToast(`Previewing: ${id}`, "info");
  };

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {templates.map((t) => (
          <div key={t.id} className="neu-extruded flex flex-col" style={{ borderRadius: "var(--radius)", padding: "var(--space-inner)" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "28px", color: "var(--primary)", marginBottom: "12px" }}>
              {t.id === "welcome" ? "waving_hand" : t.id === "weekly" ? "explore" : t.id === "feature" ? "new_releases" : t.id === "reengagement" ? "favorite" : "article"}
            </span>
            <h4 style={{ fontFamily: "Manrope, sans-serif", fontSize: "15px", fontWeight: 700, color: "var(--on-surface)", marginBottom: "4px" }}>{t.name}</h4>
            <p style={{ fontFamily: "Manrope, sans-serif", fontSize: "12px", color: "var(--on-surface-variant)", marginBottom: "auto", paddingBottom: "16px" }}>{t.description}</p>
            <button
              onClick={() => showPreview(t.id)}
              className="neu-subtle w-full h-9 flex items-center justify-center gap-2 text-xs font-semibold"
              style={{ borderRadius: "var(--radius-full)", border: "none", cursor: "pointer", backgroundColor: "var(--surface)", color: "var(--primary)", fontFamily: "Manrope, sans-serif" }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>visibility</span>
              Preview
            </button>
          </div>
        ))}
      </div>

      {preview && (
        <div className="neu-inset overflow-hidden" style={{ borderRadius: "var(--radius)", maxWidth: "600px", margin: "0 auto" }}>
          <div className="flex justify-end p-2">
            <button onClick={() => setPreview(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--on-surface-variant)" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>close</span>
            </button>
          </div>
          <iframe srcDoc={preview} title="Template Preview" style={{ width: "100%", height: "600px", border: "none", background: "#fff" }} sandbox="allow-same-origin" />
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   HISTORY TAB
   ══════════════════════════════════════════════════════════════════════════ */

function HistoryTab({ addToast }: { addToast: (m: string, t?: Toast["type"]) => void }) {
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<CampaignRow[]>("/campaigns");
      setCampaigns(data);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const duplicate = async (id: number) => {
    await api.post(`/campaigns/${id}/duplicate`);
    addToast("Campaign duplicated as draft ✓", "success");
    load();
  };

  if (loading) return <SkeletonGrid />;

  if (campaigns.length === 0) {
    return (
      <div className="neu-extruded flex flex-col items-center justify-center py-16" style={{ borderRadius: "var(--radius-lg)" }}>
        <span className="material-symbols-outlined" style={{ fontSize: "48px", color: "var(--outline-variant)", marginBottom: "12px" }}>inbox</span>
        <p style={{ fontFamily: "Manrope, sans-serif", fontSize: "16px", fontWeight: 600, color: "var(--on-surface-variant)" }}>No campaigns yet</p>
        <p style={{ fontFamily: "Manrope, sans-serif", fontSize: "13px", color: "var(--outline)" }}>Create one from the Compose tab!</p>
      </div>
    );
  }

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = { draft: "#6b7b8d", sending: "#c0792a", sent: "#3d8c5c", failed: "var(--error)" };
    return (
      <span style={{
        display: "inline-block", padding: "2px 10px", borderRadius: "var(--radius-full)",
        fontSize: "11px", fontWeight: 600, backgroundColor: (colors[status] ?? "#6b7b8d") + "20", color: colors[status] ?? "#6b7b8d",
      }}>
        {status}
      </span>
    );
  };

  return (
    <div className="neu-extruded" style={{ borderRadius: "var(--radius)", padding: "var(--space-inner)", overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "Manrope, sans-serif", fontSize: "13px" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--outline-variant)" }}>
            <th style={thStyle}>Subject</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>Recipients</th>
            <th style={thStyle}>Sent</th>
            <th style={thStyle}>Failed</th>
            <th style={thStyle}>Date</th>
            <th style={thStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {campaigns.map((c) => (
            <tr key={c.id} style={{ borderBottom: "1px solid var(--outline-variant)" }}>
              <td style={tdStyle}><span style={{ fontWeight: 600 }}>{c.subject}</span></td>
              <td style={tdStyle}>{statusBadge(c.status)}</td>
              <td style={tdStyle}>{c.recipientCount ?? 0}</td>
              <td style={tdStyle}>{c.sentCount ?? 0}</td>
              <td style={tdStyle}>{c.failedCount ?? 0}</td>
              <td style={tdStyle}>{c.sentAt ? new Date(c.sentAt).toLocaleDateString() : new Date(c.createdAt).toLocaleDateString()}</td>
              <td style={tdStyle}>
                <button
                  onClick={() => duplicate(c.id)}
                  className="neu-subtle flex items-center gap-1"
                  style={{ borderRadius: "var(--radius-full)", padding: "4px 10px", border: "none", cursor: "pointer", backgroundColor: "var(--surface)", fontSize: "11px", fontWeight: 600, color: "var(--primary)", fontFamily: "Manrope, sans-serif" }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "13px" }}>content_copy</span>
                  Duplicate
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   SHARED COMPONENTS
   ══════════════════════════════════════════════════════════════════════════ */

const labelStyle: React.CSSProperties = {
  display: "block",
  fontFamily: "Manrope, sans-serif",
  fontSize: "11px",
  fontWeight: 600,
  color: "var(--on-surface-variant)",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  marginBottom: "6px",
};

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "10px 12px",
  fontWeight: 600,
  fontSize: "11px",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  color: "var(--on-surface-variant)",
};

const tdStyle: React.CSSProperties = {
  padding: "10px 12px",
  color: "var(--on-surface)",
};

function InputField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <label style={labelStyle}>{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="neu-input w-full"
      />
    </div>
  );
}

function ActionButton({ icon, label, onClick, loading, hint }: { icon: string; label: string; onClick: () => void; loading?: boolean; hint?: string }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="neu-subtle flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-95"
      style={{
        borderRadius: "var(--radius-full)",
        padding: "8px 16px",
        border: "none",
        cursor: loading ? "wait" : "pointer",
        backgroundColor: "var(--surface)",
        fontFamily: "Manrope, sans-serif",
        fontSize: "12px",
        fontWeight: 600,
        color: "var(--primary)",
        opacity: loading ? 0.6 : 1,
      }}
      title={hint}
    >
      <span className="material-symbols-outlined" style={{ fontSize: "15px" }}>{icon}</span>
      {label}
      {hint && <span style={{ fontSize: "10px", color: "var(--outline)", marginLeft: "4px" }}>{hint}</span>}
    </button>
  );
}

function StatPill({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="material-symbols-outlined" style={{ fontSize: "20px", color }}>{icon}</span>
      <div>
        <span style={{ display: "block", fontFamily: "Manrope, sans-serif", fontSize: "10px", fontWeight: 600, color: "var(--on-surface-variant)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
        <span style={{ fontFamily: "Manrope, sans-serif", fontSize: "20px", fontWeight: 700, color, lineHeight: 1 }}>{value}</span>
      </div>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="neu-inset animate-pulse" style={{ height: "160px", borderRadius: "var(--radius)" }} />
      ))}
    </div>
  );
}
