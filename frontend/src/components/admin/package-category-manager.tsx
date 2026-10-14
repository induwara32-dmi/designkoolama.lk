"use client";
import Image from "next/image";
import { ArrowDown, ArrowUp, ImageIcon, Plus, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { adminApi, type CmsRecord } from "@/lib/admin-api";

type Draft = { id: string; name: string; headline: string; description: string; seoTitle: string; metaDescription: string; content: Record<string, unknown>; slug: string; displayOrder: number; cardMediaId: string; cardAltText: string };
const slugify = (value: string) => value.toLowerCase().trim().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const contentOf = (row: CmsRecord) => (row.content && typeof row.content === "object" && !Array.isArray(row.content) ? row.content as Record<string, unknown> : {});
const fromRow = (row: CmsRecord): Draft => { const content = contentOf(row); return { id: row.id, name: String(row.name ?? ""), headline: String(row.headline ?? ""), description: String(row.description ?? ""), seoTitle: typeof content.seoTitle === "string" ? content.seoTitle : "", metaDescription: typeof content.metaDescription === "string" ? content.metaDescription : "", content, slug: String(row.slug ?? ""), displayOrder: Number(row.displayOrder ?? 0), cardMediaId: String(row.cardMediaId ?? ""), cardAltText: String((row.cardMedia as { altText?: unknown } | null | undefined)?.altText ?? "") }; };
const emptyDraft = (displayOrder: number): Draft => ({ id: "", name: "", headline: "", description: "", seoTitle: "", metaDescription: "", content: {}, slug: "", displayOrder, cardMediaId: "", cardAltText: "" });
const packageCount = (row: CmsRecord) => Number((row._count as { packages?: number } | undefined)?.packages ?? 0);
const imageUrl = (asset: CmsRecord | undefined) => String(asset?.secureUrl ?? asset?.url ?? "");
const imageName = (asset: CmsRecord | undefined) => String(asset?.title ?? asset?.altText ?? "Uploaded image");
const imageTypes = "image/jpeg,image/png,image/webp,image/avif";

export function PackageCategoryManager() {
  const [rows, setRows] = useState<CmsRecord[]>([]);
  const [media, setMedia] = useState<CmsRecord[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const nameFieldRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const [categories, assets] = await Promise.all([adminApi.cmsList("package-categories", ""), adminApi.cmsList("media", "").catch(() => [] as CmsRecord[])]);
      setRows(categories); setMedia(assets);
    }
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
    setDraft(row ? fromRow(row) : emptyDraft(rows.length));
    setError(""); setSuccess(""); setLibraryOpen(false);
  }

  function selectCard(asset: CmsRecord) {
    setDraft((current) => current ? { ...current, cardMediaId: asset.id, cardAltText: String(asset.altText ?? "") } : current);
    setLibraryOpen(false);
  }

  async function uploadCard(file: File | undefined) {
    if (!file || !draft) return;
    setUploading(true); setError("");
    try {
      const body = new FormData();
      body.set("file", file);
      body.set("altText", draft.cardAltText.trim() || `${draft.name.trim() || "Package category"} card image`);
      const asset = await adminApi.uploadMedia(body);
      setMedia((current) => [asset, ...current.filter((item) => item.id !== asset.id)]);
      selectCard(asset);
      setSuccess("Card image uploaded. Select Save Changes to put it on the site.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "The card image could not be uploaded. Your changes are still here."); }
    finally { setUploading(false); }
  }

  async function save() {
    if (!draft) return;
    setBusy(true); setError("");
    try {
      const card = media.find((item) => item.id === draft.cardMediaId);
      const altText = draft.cardAltText.trim();
      if (card && altText && altText !== String(card.altText ?? "")) await adminApi.cmsUpdate("media", card.id, { altText });
      const content = { ...draft.content, seoTitle: draft.seoTitle.trim(), metaDescription: draft.metaDescription.trim() };
      const data = { name: draft.name.trim(), headline: draft.headline.trim(), description: draft.description.trim(), content, slug: draft.slug.trim() || slugify(draft.name), displayOrder: draft.displayOrder, cardMediaId: draft.cardMediaId || null };
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
          <label>Hero title<input value={draft.headline} maxLength={300} aria-describedby="pkg-hero-hint" onChange={(event) => setDraft({ ...draft, headline: event.target.value })} /></label>
          <p className="admin-hint" id="pkg-hero-hint">The large heading on this category&rsquo;s page. Leave empty to use the Title.</p>
          <label>Description<textarea value={draft.description} required aria-describedby="pkg-description-hint" onChange={(event) => setDraft({ ...draft, description: event.target.value })} /></label>
          <p className="admin-hint" id="pkg-description-hint">Shown on the category card and under the hero title.</p>
          <label>SEO title<input value={draft.seoTitle} maxLength={300} aria-describedby="pkg-seo-hint" onChange={(event) => setDraft({ ...draft, seoTitle: event.target.value })} /></label>
          <p className="admin-hint" id="pkg-seo-hint">Browser tab and search result title. Aim for about 60 characters (now {draft.seoTitle.trim().length}). Leave empty to use &ldquo;{draft.name.trim() || "Title"} | DesignKoolama&rdquo;.</p>
          <label>Meta description<textarea value={draft.metaDescription} maxLength={500} aria-describedby="pkg-meta-hint" onChange={(event) => setDraft({ ...draft, metaDescription: event.target.value })} /></label>
          <p className="admin-hint" id="pkg-meta-hint">Search result summary. Aim for about 160 characters (now {draft.metaDescription.trim().length}). Leave empty to use the Description.</p>
          <label>Slug (used in the page URL)<input value={draft.slug} required pattern="[a-z0-9]+(-[a-z0-9]+)*" onChange={(event) => setDraft({ ...draft, slug: slugify(event.target.value) })} /></label>
          <label>Order<input type="number" value={draft.displayOrder} onChange={(event) => setDraft({ ...draft, displayOrder: Number(event.target.value) })} /></label>
          <fieldset><legend>Card image</legend>
            <p className="admin-hint">Recommended 1600x1000 px (16:10), JPG or WebP, subject centred, minimum 1200x750.</p>
            {(() => {
              const card = media.find((item) => item.id === draft.cardMediaId);
              const uploadInput = <input className="sr-only" type="file" accept={imageTypes} disabled={uploading} onChange={(event) => { void uploadCard(event.target.files?.[0]); event.target.value = ""; }} />;
              return card ? <div className="admin-simple-banner">
                <Image src={imageUrl(card)} alt={draft.cardAltText || imageName(card)} width={640} height={400} unoptimized />
                <strong>{imageName(card)}</strong>
                <div>
                  <label className="admin-primary">{uploading ? "Uploading..." : "Change Image"}{uploadInput}</label>
                  <button type="button" onClick={() => setLibraryOpen((value) => !value)}>Select from Media Library</button>
                  <button type="button" onClick={() => { if (confirm("Remove this card image? The shared Media Library image will be preserved.")) setDraft({ ...draft, cardMediaId: "", cardAltText: "" }); }}>Remove Image</button>
                </div>
              </div> : <div className="admin-simple-media-empty">
                <ImageIcon />
                <p>{draft.cardMediaId ? "The selected image is no longer in the Media Library." : "No card image yet. The card shows the default artwork."}</p>
                <label className="admin-primary">{uploading ? "Uploading..." : "Add Card Image"}{uploadInput}</label>
                <button type="button" onClick={() => setLibraryOpen((value) => !value)}>Select from Media Library</button>
              </div>;
            })()}
            {draft.cardMediaId && <label>Image alt text<input value={draft.cardAltText} required maxLength={500} onChange={(event) => setDraft({ ...draft, cardAltText: event.target.value })} /><span className="admin-hint">Describes the image for screen readers. It is saved on the image in the Media Library.</span></label>}
            {libraryOpen && <section className="admin-simple-library" aria-label="Media Library">
              <div><h3>Select from Media Library</h3><button type="button" onClick={() => setLibraryOpen(false)} aria-label="Close Media Library"><X /></button></div>
              <div>{media.length === 0 ? <p>No images in the Media Library yet.</p> : media.map((asset) => <button type="button" key={asset.id} onClick={() => selectCard(asset)}><Image src={imageUrl(asset)} alt={String(asset.altText ?? imageName(asset))} width={160} height={110} unoptimized /><span>{imageName(asset)}</span></button>)}</div>
            </section>}
          </fieldset>
          <div className="admin-modal-actions"><button className="admin-primary" type="submit" disabled={busy}>{draft.id ? "Save Changes" : "Add Category"}</button><button type="button" onClick={() => setDraft(null)}>Cancel</button></div>
        </form>
      </aside>
    </div>}
  </div>;
}
