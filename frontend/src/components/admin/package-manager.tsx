"use client";
import { ArrowDown, ArrowUp, Plus, Star, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { adminApi, type CmsRecord } from "@/lib/admin-api";

type Draft = {
  id: string; categoryId: string; name: string; subtitle: string;
  price: string; priceLabel: string; description: string;
  features: string[]; isPopular: boolean; ctaLabel: string; displayOrder: number;
};

const slugify = (value: string) => value.toLowerCase().trim().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const categoryIdOf = (row: CmsRecord) => String(row.categoryId ?? (row.category as CmsRecord | undefined)?.id ?? "");
const featureLabels = (row: CmsRecord) => (Array.isArray(row.features) ? row.features : []).map((entry) => String((entry as CmsRecord)?.label ?? entry ?? "")).filter(Boolean);

function fromRow(row: CmsRecord): Draft {
  return {
    id: row.id,
    categoryId: categoryIdOf(row),
    name: String(row.name ?? ""),
    subtitle: String(row.subtitle ?? ""),
    price: row.price === null || row.price === undefined ? "" : String(row.price),
    priceLabel: String(row.priceLabel ?? ""),
    description: String(row.description ?? ""),
    features: featureLabels(row),
    isPopular: Boolean(row.isPopular),
    ctaLabel: String(row.ctaLabel ?? ""),
    displayOrder: Number(row.displayOrder ?? 0),
  };
}

export function PackageManager() {
  const [rows, setRows] = useState<CmsRecord[]>([]);
  const [categories, setCategories] = useState<CmsRecord[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [featureInput, setFeatureInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const nameFieldRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const [packages, cats] = await Promise.all([adminApi.cmsList("packages", ""), adminApi.cmsList("package-categories", "")]);
      setRows(packages); setCategories(cats);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Packages could not be loaded."); }
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

  const groups = useMemo(
    () => categories.map((category) => ({ category, items: rows.filter((row) => categoryIdOf(row) === category.id) })),
    [categories, rows],
  );

  function open(row?: CmsRecord, defaultCategoryId?: string) {
    if (row) setDraft(fromRow(row));
    else {
      const categoryId = defaultCategoryId || categories[0]?.id || "";
      const countInCategory = rows.filter((item) => categoryIdOf(item) === categoryId).length;
      setDraft({ id: "", categoryId, name: "", subtitle: "", price: "", priceLabel: "one-time", description: "", features: [], isPopular: false, ctaLabel: "", displayOrder: countInCategory });
    }
    setFeatureInput(""); setError(""); setSuccess("");
  }

  function addFeature() {
    const value = featureInput.trim();
    if (!value || !draft) return;
    setDraft({ ...draft, features: [...draft.features, value] });
    setFeatureInput("");
  }
  function removeFeature(index: number) { if (draft) setDraft({ ...draft, features: draft.features.filter((_, position) => position !== index) }); }
  function moveFeature(index: number, direction: -1 | 1) {
    if (!draft) return;
    const target = index + direction;
    if (target < 0 || target >= draft.features.length) return;
    const next = [...draft.features];
    [next[index], next[target]] = [next[target], next[index]];
    setDraft({ ...draft, features: next });
  }

  async function save() {
    if (!draft) return;
    if (!draft.categoryId) { setError("Select a package category first."); return; }
    setBusy(true); setError("");
    try {
      const categoryName = categories.find((item) => item.id === draft.categoryId)?.name;
      const data: Record<string, unknown> = {
        categoryId: draft.categoryId,
        name: draft.name.trim(),
        subtitle: draft.subtitle.trim(),
        price: draft.price.trim() === "" ? null : Number(draft.price),
        priceLabel: draft.priceLabel.trim(),
        description: draft.description.trim(),
        features: draft.features,
        isPopular: draft.isPopular,
        ctaLabel: draft.ctaLabel.trim(),
        displayOrder: draft.displayOrder,
      };
      const saved = draft.id
        ? await adminApi.cmsUpdate("packages", draft.id, data)
        : await adminApi.cmsCreate("packages", { ...data, slug: `${slugify(String(categoryName ?? ""))}-${slugify(draft.name)}`.replace(/^-|-$/g, "") });
      await adminApi.publishContent("packages", saved.id);
      // The backend already clears isPopular on sibling packages in this category, but
      // their frozen publishedSnapshot still shows the old badge until republished.
      if (draft.isPopular) {
        const siblings = rows.filter((item) => categoryIdOf(item) === draft.categoryId && item.id !== saved.id);
        for (const sibling of siblings) {
          try { await adminApi.publishContent("packages", sibling.id); } catch { /* best-effort refresh */ }
        }
      }
      setSuccess("Package saved and live on the site.");
      setDraft(null);
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Package could not be saved."); }
    finally { setBusy(false); }
  }

  async function remove(row: CmsRecord) {
    if (!confirm(`Remove the "${String(row.name)}" package?`)) return;
    setError(""); setSuccess("");
    try {
      const result = await adminApi.cmsArchive("packages", row.id);
      if (!result?.archived) throw new Error("The server did not confirm the removal.");
      setRows((current) => current.filter((item) => item.id !== row.id));
      setSuccess(`Removed "${String(row.name)}".`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : `"${String(row.name)}" could not be removed. Please try again.`);
    }
  }

  async function move(categoryItems: CmsRecord[], index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= categoryItems.length) return;
    const next = [...categoryItems];
    [next[index], next[target]] = [next[target], next[index]];
    setError("");
    try {
      for (const [position, row] of next.entries()) {
        await adminApi.cmsUpdate("packages", row.id, { displayOrder: position });
        await adminApi.publishContent("packages", row.id);
      }
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Order could not be saved."); await load(); }
  }

  return <div className="admin-cms admin-package-manager">
    <header className="admin-page-head"><p>Packages content</p><h1>Packages</h1><span>The pricing tier cards shown under each package category.</span></header>
    {error && <p className="admin-error" role="alert">{error}</p>}
    {success && <p className="admin-success" role="status">{success}</p>}
    {categories.length === 0 ? <p>Add a package category first, then come back here to add packages.</p> : groups.map(({ category, items }) => (
      <section className="admin-package-group" aria-label={`${String(category.name)} packages`} key={category.id}>
        <div className="admin-package-group-head">
          <h2>{String(category.name)}</h2>
          <button type="button" className="admin-primary" onClick={() => open(undefined, category.id)}><Plus /> Add Package</button>
        </div>
        {items.length === 0 ? <p>No packages in this category yet.</p> : <div className="admin-package-list">
          {items.map((row, index) => {
            const item = fromRow(row);
            return <article className="admin-package-list-card" key={row.id}>
              <div className="admin-package-order">
                <button type="button" disabled={index === 0} aria-label={`Move ${item.name} earlier`} onClick={() => void move(items, index, -1)}><ArrowUp /></button>
                <button type="button" disabled={index === items.length - 1} aria-label={`Move ${item.name} later`} onClick={() => void move(items, index, 1)}><ArrowDown /></button>
              </div>
              <div className="admin-package-list-body">
                <div className="admin-package-list-head">
                  <div>
                    <strong>{item.name}</strong>
                    {item.isPopular && <span className="admin-popular-badge"><Star fill="currentColor" /> Most popular</span>}
                    <span className="admin-package-meta">{item.subtitle || "No tier label"} &middot; {item.price ? `LKR ${item.price}` : "Custom pricing"}{item.priceLabel ? ` (${item.priceLabel})` : ""}</span>
                  </div>
                  <div className="admin-package-list-actions">
                    <button type="button" onClick={() => open(row)} aria-label={`Edit ${item.name}`}>Edit</button>
                    <button type="button" className="admin-danger-action" onClick={() => void remove(row)} aria-label={`Remove ${item.name}`}>Remove</button>
                  </div>
                </div>
                <p className="admin-package-description">{item.description}</p>
              </div>
            </article>;
          })}
        </div>}
      </section>
    ))}
    {draft && <div className="admin-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setDraft(null); }}>
      <aside className="admin-modal-dialog admin-modal-dialog-wide" role="dialog" aria-modal="true" aria-label={draft.id ? "Edit package" : "Add package"}>
        <div className="admin-panel-title"><h2>{draft.id ? "Edit Package" : "Add Package"}</h2><button type="button" onClick={() => setDraft(null)} aria-label="Close"><X /></button></div>
        <form className="admin-form" onSubmit={(event) => { event.preventDefault(); void save(); }}>
          <label>Package Category<select value={draft.categoryId} required onChange={(event) => setDraft({ ...draft, categoryId: event.target.value })}>{categories.map((category) => <option key={category.id} value={category.id}>{String(category.name)}</option>)}</select></label>
          <label>Tier label<input value={draft.subtitle} placeholder="e.g. For new tutors, Most popular" onChange={(event) => setDraft({ ...draft, subtitle: event.target.value })} /></label>
          <label>Name<input ref={nameFieldRef} value={draft.name} required placeholder="e.g. Starter" onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label>
          <div className="admin-form-row">
            <label>Price (LKR)<input type="number" min={0} step="0.01" value={draft.price} placeholder="Leave blank for Custom" onChange={(event) => setDraft({ ...draft, price: event.target.value })} /></label>
            <label>Price type<input value={draft.priceLabel} placeholder="e.g. one-time, from" onChange={(event) => setDraft({ ...draft, priceLabel: event.target.value })} /></label>
          </div>
          <label>Short description<textarea value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} /></label>
          <fieldset>
            <legend>Features</legend>
            {draft.features.length === 0 ? <p>No features added yet.</p> : <ol className="admin-feature-list">
              {draft.features.map((feature, index) => <li key={`${feature}-${index}`}>
                <span>{feature}</span>
                <div className="admin-feature-actions">
                  <button type="button" disabled={index === 0} aria-label={`Move "${feature}" earlier`} onClick={() => moveFeature(index, -1)}><ArrowUp /></button>
                  <button type="button" disabled={index === draft.features.length - 1} aria-label={`Move "${feature}" later`} onClick={() => moveFeature(index, 1)}><ArrowDown /></button>
                  <button type="button" aria-label={`Remove "${feature}"`} onClick={() => removeFeature(index)}><Trash2 /></button>
                </div>
              </li>)}
            </ol>}
            <div className="admin-feature-input">
              <input value={featureInput} placeholder="e.g. Logo design" onChange={(event) => setFeatureInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addFeature(); } }} />
              <button type="button" onClick={addFeature}><Plus /> Add Feature</button>
            </div>
          </fieldset>
          <label className="admin-check"><input type="checkbox" checked={draft.isPopular} onChange={(event) => setDraft({ ...draft, isPopular: event.target.checked })} /> Most popular (highlights this card; automatically unset on other packages in this category)</label>
          <label>Button label<input value={draft.ctaLabel} placeholder={`Leave blank for "Choose ${draft.name || "package"}"`} onChange={(event) => setDraft({ ...draft, ctaLabel: event.target.value })} /></label>
          <label>Order<input type="number" value={draft.displayOrder} onChange={(event) => setDraft({ ...draft, displayOrder: Number(event.target.value) })} /></label>
          <div className="admin-modal-actions"><button className="admin-primary" type="submit" disabled={busy}>{draft.id ? "Save Changes" : "Add Package"}</button><button type="button" onClick={() => setDraft(null)}>Cancel</button></div>
        </form>
      </aside>
    </div>}
  </div>;
}
