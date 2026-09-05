"use client";
import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { adminApi, type CmsRecord } from "@/lib/admin-api";

type Draft = { id: string; name: string; description: string; slug: string; displayOrder: number };
const slugify = (value: string) => value.toLowerCase().trim().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const fromRow = (row: CmsRecord): Draft => ({ id: row.id, name: String(row.name ?? ""), description: String(row.description ?? ""), slug: String(row.slug ?? ""), displayOrder: Number(row.displayOrder ?? 0) });
const packageCount = (row: CmsRecord) => Number((row._count as { packages?: number } | undefined)?.packages ?? 0);

export function PackageCategoryManager() {
  const [rows, setRows] = useState<CmsRecord[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const nameFieldRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try { setRows(await adminApi.cmsList("package-categories", "")); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Package categories could not be loaded."); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const isEditorOpen = draft !== null;
  useEffect(() => {
    if (!isEditorOpen) return;
    nameFieldRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setDraft(null); };
    document.addEventListener("keydown", onKeyDown);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", onKeyDown); };
  }, [isEditorOpen]);

  function open(row?: CmsRecord) {
    setDraft(row ? fromRow(row) : { id: "", name: "", description: "", slug: "", displayOrder: rows.length });
    setError(""); setSuccess("");
  }

  async function save() {
    if (!draft) return;
    setBusy(true); setError("");
    try {
      const data = { name: draft.name.trim(), description: draft.description.trim(), slug: draft.slug.trim() || slugify(draft.name), displayOrder: draft.displayOrder };
      if (draft.id) await adminApi.cmsUpdate("package-categories", draft.id, data);
      else await adminApi.cmsCreate("package-categories", data);
      setSuccess("Package category saved and live on the site.");
      setDraft(null);
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Package category could not be saved."); }
    finally { setBusy(false); }
  }

  async function remove(row: CmsRecord) {
    if (!confirm(`Remove the "${String(row.name)}" package category?`)) return;
    setError(""); setSuccess("");
    try {
      const result = await adminApi.cmsArchive("package-categories", row.id);
      if (!result?.archived) throw new Error("The server did not confirm the removal.");
      setRows((current) => current.filter((item) => item.id !== row.id));
      setSuccess(`Removed "${String(row.name)}".`);
    } catch (cause) {
      // The backend blocks removal (409) while packages still belong to this category.
      setError(cause instanceof Error ? cause.message : `"${String(row.name)}" could not be removed. Please try again.`);
    }
  }

  async function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= rows.length) return;
    const next = [...rows];
    [next[index], next[target]] = [next[target], next[index]];
    setRows(next); setError("");
    try {
      await Promise.all(next.map((row, position) => adminApi.cmsUpdate("package-categories", row.id, { displayOrder: position })));
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Order could not be saved."); await load(); }
  }

  return <div className="admin-cms admin-package-manager">
    <header className="admin-page-head"><p>Packages content</p><h1>Package categories</h1><span>The top-level cards shown in &ldquo;Choose the support you need&rdquo;.</span></header>
    <div className="admin-cms-toolbar"><button className="admin-primary" onClick={() => open()}><Plus /> Add Category</button></div>
    {error && <p className="admin-error" role="alert">{error}</p>}
    {success && <p className="admin-success" role="status">{success}</p>}
    <section className="admin-package-category-list" aria-label="Package categories">
      {rows.length === 0 ? <p>No package categories yet.</p> : rows.map((row, index) => {
        const item = fromRow(row);
        const count = packageCount(row);
        return <article className="admin-package-category-card" key={row.id}>
          <div className="admin-package-category-order">
            <button type="button" disabled={index === 0} aria-label={`Move ${item.name} earlier`} onClick={() => void move(index, -1)}><ArrowUp /></button>
            <button type="button" disabled={index === rows.length - 1} aria-label={`Move ${item.name} later`} onClick={() => void move(index, 1)}><ArrowDown /></button>
          </div>
          <div className="admin-package-category-body">
            <div className="admin-package-category-head">
              <div><strong>{item.name}</strong><span>/packages/{item.slug} &middot; {count} package{count === 1 ? "" : "s"}</span></div>
              <div className="admin-package-category-actions">
                <button type="button" onClick={() => open(row)} aria-label={`Edit ${item.name}`}>Edit</button>
                <button type="button" className="admin-danger-action" onClick={() => void remove(row)} aria-label={`Remove ${item.name}`}>Remove</button>
              </div>
            </div>
            <p className="admin-package-category-description">{item.description}</p>
          </div>
        </article>;
      })}
    </section>
    {draft && <div className="admin-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setDraft(null); }}>
      <aside className="admin-modal-dialog" role="dialog" aria-modal="true" aria-label={draft.id ? "Edit package category" : "Add package category"}>
        <div className="admin-panel-title"><h2>{draft.id ? "Edit Package Category" : "Add Package Category"}</h2><button type="button" onClick={() => setDraft(null)} aria-label="Close"><X /></button></div>
        <form className="admin-form" onSubmit={(event) => { event.preventDefault(); void save(); }}>
          <label>Title<input ref={nameFieldRef} value={draft.name} required onChange={(event) => { const oldAuto = !draft.slug || draft.slug === slugify(draft.name); setDraft({ ...draft, name: event.target.value, slug: oldAuto ? slugify(event.target.value) : draft.slug }); }} /></label>
          <label>Description<textarea value={draft.description} required onChange={(event) => setDraft({ ...draft, description: event.target.value })} /></label>
          <label>Slug (used in the page URL)<input value={draft.slug} required pattern="[a-z0-9]+(-[a-z0-9]+)*" onChange={(event) => setDraft({ ...draft, slug: slugify(event.target.value) })} /></label>
          <label>Order<input type="number" value={draft.displayOrder} onChange={(event) => setDraft({ ...draft, displayOrder: Number(event.target.value) })} /></label>
          <div className="admin-modal-actions"><button className="admin-primary" type="submit" disabled={busy}>{draft.id ? "Save Changes" : "Add Category"}</button><button type="button" onClick={() => setDraft(null)}>Cancel</button></div>
        </form>
      </aside>
    </div>}
  </div>;
}
