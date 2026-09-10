"use client";
import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { adminApi, type CmsRecord } from "@/lib/admin-api";
import { homeCmsContent, type HomeCmsContent } from "@/content/home-cms";

type StatItem = HomeCmsContent["stats"][number];
type Draft = { index: number | null; value: string; suffix: string; label: string; visible: boolean };

const MAX_ITEMS = 8;

export function HomeStatsManager() {
  const [pageId, setPageId] = useState("");
  const [pageStatus, setPageStatus] = useState("DRAFT");
  const [sectionKind, setSectionKind] = useState("home");
  const [extra, setExtra] = useState<Record<string, unknown> | null>(null);
  const [stats, setStats] = useState<StatItem[] | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const labelFieldRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const pages = await adminApi.cmsList("pages", "");
      const row = pages.find((item) => item.slug === "home");
      if (!row) throw new Error("The homepage content record could not be found.");
      setPageId(row.id);
      setPageStatus(String(row.status ?? "DRAFT"));
      const rowSections = Array.isArray(row.sections) ? (row.sections as CmsRecord[]) : [];
      const section = rowSections.find((item) => item.key === "content");
      if (section?.kind) setSectionKind(String(section.kind));
      // Merged with the full default shape, not just a bare {} fallback: if no
      // "content" section exists yet (e.g. right after a fresh seed, which only
      // creates a differently-keyed placeholder section) -- or one exists but is
      // missing fields another editor never touched -- saving from this screen
      // previously persisted `extra` (whatever was loaded here) verbatim, so a
      // once-missing hero/services/portfolioHeading/etc. got permanently written
      // out of the section the moment any stat was added. That's what crashed the
      // homepage (HomePage reads content.hero.eyebrow unconditionally) and why
      // removing the stat afterward never fixed it -- the section shape itself
      // stayed broken regardless of what the stats array held. Reproduced live
      // against the real data: the "home" page's content section had only
      // `{stats: []}`, and loading / crashed with exactly this TypeError.
      const content = {
        ...homeCmsContent,
        ...(section?.content && typeof section.content === "object" ? section.content : {}),
      } as Record<string, unknown>;
      const list = Array.isArray(content.stats) ? (content.stats as StatItem[]) : [];
      setStats([...list].sort((a, b) => a.order - b.order));
      setExtra(content);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Homepage stats could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const isEditorOpen = draft !== null;
  useEffect(() => {
    if (!isEditorOpen) return;
    labelFieldRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setDraft(null); };
    document.addEventListener("keydown", onKeyDown);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", onKeyDown); };
  }, [isEditorOpen]);

  function open(index?: number) {
    if (typeof index === "number" && stats) {
      const item = stats[index]!;
      setDraft({ index, value: String(item.value), suffix: item.suffix, label: item.label, visible: item.visible !== false });
    } else {
      setDraft({ index: null, value: "", suffix: "+", label: "", visible: true });
    }
    setError(""); setSuccess("");
  }

  async function persist(nextStats: StatItem[]): Promise<boolean> {
    if (!pageId || !extra) return false;
    try {
      const payload = { ...extra, stats: nextStats };
      await adminApi.cmsUpdate("pages", pageId, { sections: [{ key: "content", kind: sectionKind, content: payload, isEnabled: true }] });
      await adminApi.publishContent("pages", pageId);
      setPageStatus("PUBLISHED");
      setStats(nextStats);
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Changes could not be saved.");
      return false;
    }
  }

  async function save() {
    if (!draft || !stats) return;
    if (!draft.label.trim()) { setError("Enter a label for this stat."); return; }
    const numeric = Number(draft.value);
    if (!Number.isFinite(numeric) || numeric < 0 || !Number.isInteger(numeric)) { setError("Enter a whole number value (0 or higher)."); return; }
    setBusy(true); setError("");
    const item: StatItem = { value: numeric, suffix: draft.suffix.trim(), label: draft.label.trim(), visible: draft.visible, order: draft.index ?? stats.length };
    const next = draft.index === null ? [...stats, item] : stats.map((row, position) => (position === draft.index ? item : row));
    const reordered = next.map((row, position) => ({ ...row, order: position }));
    if (await persist(reordered)) { setSuccess(draft.index === null ? "Stat added and published." : "Stat updated and published."); setDraft(null); }
    setBusy(false);
  }

  async function remove(index: number) {
    if (!stats) return;
    const item = stats[index]!;
    if (!confirm(`Remove the "${item.label}" stat? This cannot be undone from this screen.`)) return;
    setError(""); setSuccess("");
    const next = stats.filter((_, position) => position !== index).map((row, position) => ({ ...row, order: position }));
    if (await persist(next)) setSuccess(`Removed "${item.label}".`);
  }

  async function move(index: number, direction: -1 | 1) {
    if (!stats) return;
    const target = index + direction;
    if (target < 0 || target >= stats.length) return;
    const next = [...stats];
    [next[index], next[target]] = [next[target], next[index]];
    const reordered = next.map((row, position) => ({ ...row, order: position }));
    setError("");
    if (!(await persist(reordered))) await load();
  }

  if (loading || !stats) return <div className="admin-cms"><header className="admin-page-head"><p>Home content</p><h1>Stats bar</h1></header><p role="status">Loading stats...</p></div>;

  return (
    <div className="admin-cms">
      <header className="admin-page-head">
        <p>Home content</p>
        <h1>Stats bar</h1>
        <span>The count-up numbers shown under Services on the homepage. Status: {pageStatus === "PUBLISHED" ? "Published" : "Draft"}.</span>
      </header>
      <div className="admin-cms-toolbar">
        <button onClick={() => void load()} aria-label="Refresh">Refresh</button>
        <button className="admin-primary" disabled={stats.length >= MAX_ITEMS} onClick={() => open()}><Plus /> Add Stat</button>
      </div>
      {error && <p className="admin-error" role="alert">{error}</p>}
      {success && <p className="admin-success" role="status">{success}</p>}
      {stats.length === 0 ? <p>No stats yet.</p> : <div className="admin-package-list">
        {stats.map((item, index) => (
          <article className="admin-package-list-card" key={index}>
            <div className="admin-package-order">
              <button type="button" disabled={index === 0} aria-label={`Move "${item.label}" earlier`} onClick={() => void move(index, -1)}><ArrowUp /></button>
              <button type="button" disabled={index === stats.length - 1} aria-label={`Move "${item.label}" later`} onClick={() => void move(index, 1)}><ArrowDown /></button>
            </div>
            <div className="admin-package-list-body">
              <div className="admin-package-list-head">
                <div>
                  <strong>{item.value}{item.suffix} &mdash; {item.label}</strong>
                  <span className="admin-package-meta">{item.visible === false ? "Hidden on the homepage" : "Visible on the homepage"}</span>
                </div>
                <div className="admin-package-list-actions">
                  <button type="button" onClick={() => open(index)} aria-label={`Edit "${item.label}"`}>Edit</button>
                  <button type="button" className="admin-danger-action" onClick={() => void remove(index)} aria-label={`Remove "${item.label}"`}>Remove</button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>}
      {draft && <div className="admin-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setDraft(null); }}>
        <aside className="admin-modal-dialog" role="dialog" aria-modal="true" aria-label={draft.index === null ? "Add stat" : "Edit stat"}>
          <div className="admin-panel-title"><h2>{draft.index === null ? "Add Stat" : "Edit Stat"}</h2><button type="button" onClick={() => setDraft(null)} aria-label="Close"><X /></button></div>
          <form className="admin-form" onSubmit={(event: FormEvent) => { event.preventDefault(); void save(); }}>
            <div className="admin-form-row">
              <label>Number value<input type="number" min={0} step={1} value={draft.value} required onChange={(event) => setDraft({ ...draft, value: event.target.value })} /></label>
              <label>Suffix<input value={draft.suffix} maxLength={12} placeholder="e.g. +, %, none" onChange={(event) => setDraft({ ...draft, suffix: event.target.value })} /></label>
            </div>
            <label>Label<input ref={labelFieldRef} value={draft.label} required maxLength={60} onChange={(event) => setDraft({ ...draft, label: event.target.value })} /></label>
            <label className="admin-check"><input type="checkbox" checked={draft.visible} onChange={(event) => setDraft({ ...draft, visible: event.target.checked })} /> Visible on the homepage</label>
            <div className="admin-modal-actions"><button className="admin-primary" type="submit" disabled={busy}>{draft.index === null ? "Add Stat" : "Save Changes"}</button><button type="button" onClick={() => setDraft(null)}>Cancel</button></div>
          </form>
        </aside>
      </div>}
    </div>
  );
}
