"use client";

import Image from "next/image";
import { Eye, Globe2, ImageIcon, Plus, RefreshCw, Save, X } from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { adminApi, type CmsRecord } from "@/lib/admin-api";
import { approvedIconKeys } from "@/content/site-content";

type GalleryItem = { mediaId: string; altText: string; caption: string };
type Draft = {
  id: string;
  name: string;
  slug: string;
  cardTitle: string;
  description: string;
  shortDescription: string;
  overview: string;
  iconKey: string;
  cardMediaId: string;
  bannerMediaId: string;
  bannerAltText: string;
  bannerCaption: string;
  galleryImages: GalleryItem[];
  displayOrder: number;
  isActive: boolean;
  status?: string;
};

const emptyDraft = (): Draft => ({
  id: "", name: "", slug: "", cardTitle: "", description: "",
  shortDescription: "", overview: "", iconKey: "image", cardMediaId: "",
  bannerMediaId: "", bannerAltText: "", bannerCaption: "",
  galleryImages: [], displayOrder: 0, isActive: true,
});
const slugify = (value: string) => value.toLowerCase().trim().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const mediaId = (value: unknown) => String((value as { id?: unknown } | null)?.id ?? "");
const imageUrl = (asset: CmsRecord | undefined) => String(asset?.secureUrl ?? asset?.url ?? "");
const imageName = (asset: CmsRecord | undefined) => String(asset?.title ?? asset?.altText ?? "Uploaded image");

function toDraft(row: CmsRecord): Draft {
  return {
    id: row.id,
    name: String(row.name ?? ""), slug: String(row.slug ?? ""),
    cardTitle: String(row.cardTitle ?? row.name ?? ""),
    description: String(row.description ?? ""),
    shortDescription: String(row.shortDescription ?? ""), overview: String(row.overview ?? ""),
    iconKey: String(row.iconKey ?? "image"),
    cardMediaId: String(row.cardMediaId ?? mediaId(row.cardMedia)),
    bannerMediaId: String(row.bannerMediaId ?? mediaId(row.bannerMedia)),
    bannerAltText: String(row.bannerAltText ?? ""), bannerCaption: String(row.bannerCaption ?? ""),
    galleryImages: Array.isArray(row.galleryImages) ? row.galleryImages.map((raw) => {
      const item = raw as { mediaId?: unknown; altText?: unknown; caption?: unknown; media?: { id?: unknown; altText?: unknown; caption?: unknown } };
      return { mediaId: String(item.mediaId ?? item.media?.id ?? ""), altText: String(item.altText ?? item.media?.altText ?? ""), caption: String(item.caption ?? item.media?.caption ?? "") };
    }).filter((item) => item.mediaId) : [],
    displayOrder: Number(row.displayOrder ?? 0), isActive: row.isActive !== false,
    status: String(row.status ?? "DRAFT"),
  };
}

export function PortfolioCategoryManager() {
  const [rows, setRows] = useState<CmsRecord[]>([]);
  const [media, setMedia] = useState<CmsRecord[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [libraryFor, setLibraryFor] = useState<"card" | "banner" | "gallery" | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [categories, assets] = await Promise.all([adminApi.cmsList("portfolio-categories", ""), adminApi.cmsList("media", "")]);
      setRows(categories); setMedia(assets);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Portfolio categories could not be loaded."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const banner = useMemo(() => media.find((item) => item.id === draft?.bannerMediaId), [draft?.bannerMediaId, media]);
  function update<K extends keyof Draft>(key: K, value: Draft[K]) { setDraft((current) => current ? { ...current, [key]: value } : current); }
  function open(row: CmsRecord) { setDraft(toDraft(row)); setError(""); setSuccess(""); setLibraryFor(null); }

  async function remove(row: CmsRecord) {
    if (!confirm(`Remove the "${String(row.name)}" portfolio category?`)) return;
    setError(""); setSuccess("");
    try {
      const result = await adminApi.cmsArchive("portfolio-categories", row.id);
      if (!result?.archived) throw new Error("The server did not confirm the removal.");
      setRows((current) => current.filter((item) => item.id !== row.id));
      if (draft?.id === row.id) setDraft(null);
      setSuccess(`Removed "${String(row.name)}".`);
    } catch (cause) {
      // The backend blocks removal (409) while portfolio projects still belong to this category.
      setError(cause instanceof Error ? cause.message : `"${String(row.name)}" could not be removed. Please try again.`);
    }
  }

  async function upload(file: File, altText: string) {
    const body = new FormData(); body.set("file", file); body.set("altText", altText);
    const asset = await adminApi.uploadMedia(body);
    setMedia((current) => [asset, ...current.filter((item) => item.id !== asset.id)]);
    return asset;
  }
  async function uploadBanner(file: File | undefined) {
    if (!file || !draft) return;
    setUploading(true); setError("");
    try {
      const alt = `${draft.name.trim() || "Portfolio category"} banner`;
      const asset = await upload(file, alt);
      setDraft((current) => current ? { ...current, bannerMediaId: asset.id, bannerAltText: alt, bannerCaption: "" } : current);
      setSuccess("Banner uploaded. Select Save Changes to keep it in this draft.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "The banner could not be uploaded. Your changes are still here."); }
    finally { setUploading(false); }
  }
  async function uploadCard(file: File | undefined) {
    if (!file || !draft) return;
    setUploading(true); setError("");
    try {
      const alt = `${draft.name.trim() || "Portfolio category"} portfolio card image`;
      const asset = await upload(file, alt);
      setDraft((current) => current ? { ...current, cardMediaId: asset.id } : current);
      setSuccess("Card image uploaded. Select Save Changes to keep it in this draft.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "The card image could not be uploaded. Your changes are still here."); }
    finally { setUploading(false); }
  }
  async function uploadGallery(files: File[]) {
    if (!files.length || !draft) return;
    setUploading(true); setError("");
    try {
      const added: GalleryItem[] = [];
      for (const file of files) {
        const clean = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
        const alt = `${draft.name.trim() || "Portfolio category"} - ${clean || "gallery image"}`;
        const asset = await upload(file, alt);
        added.push({ mediaId: asset.id, altText: alt, caption: "" });
      }
      setDraft((current) => current ? { ...current, galleryImages: [...current.galleryImages, ...added.filter((item) => !current.galleryImages.some((old) => old.mediaId === item.mediaId))] } : current);
      setSuccess(`${added.length} gallery image${added.length === 1 ? "" : "s"} uploaded. Select Save Changes to keep the draft.`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Gallery images could not be uploaded. Existing changes are still here."); }
    finally { setUploading(false); }
  }
  function payload(value: Draft) {
    return {
      name: value.name.trim(), slug: value.slug.trim() || slugify(value.name),
      cardTitle: value.cardTitle.trim() || value.name.trim(),
      description: value.description.trim() || value.shortDescription.trim(),
      shortDescription: value.shortDescription.trim(), overview: value.overview.trim(),
      iconKey: value.iconKey, cardMediaId: value.cardMediaId,
      bannerMediaId: value.bannerMediaId, bannerAltText: value.bannerMediaId ? (value.bannerAltText.trim() || `${value.name.trim()} banner`) : "",
      bannerCaption: value.bannerMediaId ? value.bannerCaption.trim() : "",
      galleryImages: value.galleryImages, displayOrder: value.displayOrder, isActive: value.isActive,
    };
  }
  async function save(): Promise<CmsRecord | null> {
    if (!draft) return null;
    setError("");
    try {
      const saved = draft.id ? await adminApi.cmsUpdate("portfolio-categories", draft.id, payload(draft)) : await adminApi.cmsCreate("portfolio-categories", payload(draft));
      setDraft(toDraft(saved)); setSuccess("Changes saved as a draft. Published content has not changed."); await load(); return saved;
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Changes could not be saved."); return null; }
  }
  async function submit(event: FormEvent) { event.preventDefault(); await save(); }
  async function preview() { const saved = await save(); if (!saved) return; try { const result = await adminApi.previewContent("portfolio-categories", saved.id); window.open(result.path, "_blank", "noopener,noreferrer"); } catch (cause) { setError(cause instanceof Error ? cause.message : "Preview could not be opened."); } }
  async function publish() { const saved = await save(); if (!saved || !confirm("Publish these category changes to the public website?")) return; try { const result = await adminApi.publishContent("portfolio-categories", saved.id); setSuccess(`Published successfully as version ${result.version}.`); await load(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Changes could not be published."); } }

  return <div className="admin-cms admin-category-manager">
    <header className="admin-page-head"><p>Portfolio content</p><h1>Portfolio categories</h1><span>Manage category text, banner images, and galleries without technical fields.</span></header>
    <div className="admin-cms-toolbar"><button onClick={() => void load()} aria-label="Refresh categories"><RefreshCw /> Refresh</button><button className="admin-primary" onClick={() => setDraft(emptyDraft())}><Plus /> Add Category</button></div>
    {error && <p className="admin-error" role="alert">{error}</p>}{success && <p className="admin-success" role="status">{success}</p>}
    <div className="admin-category-layout">
      <section className="admin-category-list" aria-label="Portfolio category records">
        {loading ? <p role="status">Loading categories...</p> : rows.map((row) => <article key={row.id}><div><strong>{String(row.name)}</strong><span>Status: {String(row.status ?? "Draft").toLowerCase().replace(/^./, (value) => value.toUpperCase())}</span></div><div className="admin-category-list-actions"><button type="button" onClick={() => open(row)}>Manage</button><button type="button" className="admin-danger-action" onClick={() => void remove(row)} aria-label={`Remove ${String(row.name)}`}>Remove</button></div></article>)}
      </section>
      {draft && <aside className="admin-category-editor" aria-label={`${draft.id ? "Manage" : "Add"} portfolio category`}>
        <div className="admin-panel-title"><div><p>{draft.status === "PUBLISHED" ? "Published category" : "Category draft"}</p><h2>{draft.id ? draft.name : "Add Category"}</h2></div><button type="button" onClick={() => setDraft(null)} aria-label="Close category editor"><X /></button></div>
        <form className="admin-form" onSubmit={submit}>
          <fieldset><legend>Category Content</legend>
            <label>Category name<input value={draft.name} required onChange={(event) => { const oldAuto = !draft.slug || draft.slug === slugify(draft.name); update("name", event.target.value); if (oldAuto) update("slug", slugify(event.target.value)); }} /></label>
            <label>Short description<textarea value={draft.shortDescription} required onChange={(event) => update("shortDescription", event.target.value)} /></label>
            <label>Overview<textarea value={draft.overview} required onChange={(event) => update("overview", event.target.value)} /></label>
          </fieldset>
          <fieldset><legend>Card Image</legend>
            {(() => { const card = media.find((item) => item.id === draft.cardMediaId); return card ? <div className="admin-simple-banner"><Image src={imageUrl(card)} alt={String(card.altText ?? `${draft.name} portfolio card image`)} width={640} height={320} unoptimized /><strong>{imageName(card)}</strong><div><label className="admin-primary">{uploading ? "Uploading..." : "Change Image"}<input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp,image/avif" disabled={uploading} onChange={(event) => { void uploadCard(event.target.files?.[0]); event.target.value = ""; }} /></label><button type="button" onClick={() => { if (confirm("Remove this card image? The shared Media Library image will be preserved.")) update("cardMediaId", ""); }}>Remove Image</button></div></div> : <div className="admin-simple-media-empty"><ImageIcon /><p>No card image added yet.</p><label className="admin-primary">{uploading ? "Uploading..." : "Add Card Image"}<input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp,image/avif" disabled={uploading} onChange={(event) => { void uploadCard(event.target.files?.[0]); event.target.value = ""; }} /></label><button type="button" onClick={() => setLibraryFor(libraryFor === "card" ? null : "card")}>Select from Media Library</button></div>; })()}
          </fieldset>
          <fieldset><legend>Banner Image</legend>
            {!banner ? <div className="admin-simple-media-empty"><ImageIcon /><p>No banner image added yet.</p><label className="admin-primary">{uploading ? "Uploading..." : "Add Banner Image"}<input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp,image/avif" disabled={uploading} onChange={(event) => { void uploadBanner(event.target.files?.[0]); event.target.value = ""; }} /></label><button type="button" onClick={() => setLibraryFor(libraryFor === "banner" ? null : "banner")}>Select from Media Library</button></div> : <div className="admin-simple-banner"><Image src={imageUrl(banner)} alt={draft.bannerAltText || imageName(banner)} width={640} height={320} unoptimized /><strong>{imageName(banner)}</strong><div><label className="admin-primary">{uploading ? "Uploading..." : "Change Banner"}<input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp,image/avif" disabled={uploading} onChange={(event) => { void uploadBanner(event.target.files?.[0]); event.target.value = ""; }} /></label><button type="button" onClick={() => { if (confirm("Remove this banner from the category? The shared Media Library image will be preserved.")) setDraft((current) => current ? { ...current, bannerMediaId: "", bannerAltText: "", bannerCaption: "" } : current); }}>Remove Banner</button></div></div>}
            <details><summary>Advanced image details</summary><label>Alternative text<input value={draft.bannerAltText} maxLength={500} onChange={(event) => update("bannerAltText", event.target.value)} /></label><label>Caption (optional)<textarea value={draft.bannerCaption} maxLength={1000} onChange={(event) => update("bannerCaption", event.target.value)} /></label></details>
          </fieldset>
          <fieldset><legend>Gallery Images</legend>
            <label className="admin-primary admin-file-action">{uploading ? "Uploading..." : "Add Gallery Images"}<input className="sr-only" type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif" disabled={uploading} onChange={(event) => { void uploadGallery(Array.from(event.target.files ?? [])); event.target.value = ""; }} /></label>
            <button type="button" onClick={() => setLibraryFor(libraryFor === "gallery" ? null : "gallery")}>Select from Media Library</button>
            {draft.galleryImages.length === 0 ? <div className="admin-simple-media-empty"><ImageIcon /><p>No gallery images added yet.</p></div> : <ol className="admin-simple-gallery">{draft.galleryImages.map((item, index) => { const asset = media.find((entry) => entry.id === item.mediaId); return <li key={`${item.mediaId}-${index}`}>{asset && <Image src={imageUrl(asset)} alt={item.altText || imageName(asset)} width={240} height={160} unoptimized />}<strong>{imageName(asset)}</strong><button type="button" onClick={() => { if (confirm("Remove this image from this gallery? The shared Media Library image will be preserved.")) update("galleryImages", draft.galleryImages.filter((_, position) => position !== index)); }}>Remove</button><details><summary>Advanced image details</summary><label>Alternative text<input value={item.altText} maxLength={500} onChange={(event) => update("galleryImages", draft.galleryImages.map((entry, position) => position === index ? { ...entry, altText: event.target.value } : entry))} /></label><label>Caption (optional)<input value={item.caption} maxLength={1000} onChange={(event) => update("galleryImages", draft.galleryImages.map((entry, position) => position === index ? { ...entry, caption: event.target.value } : entry))} /></label><div className="admin-order-actions"><button type="button" disabled={index === 0} onClick={() => { const next = [...draft.galleryImages]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; update("galleryImages", next); }}>Move earlier</button><button type="button" disabled={index === draft.galleryImages.length - 1} onClick={() => { const next = [...draft.galleryImages]; [next[index + 1], next[index]] = [next[index], next[index + 1]]; update("galleryImages", next); }}>Move later</button></div></details></li>; })}</ol>}
          </fieldset>
          {libraryFor && <section className="admin-simple-library" aria-label="Media Library"><div><h3>Select from Media Library</h3><button type="button" onClick={() => setLibraryFor(null)} aria-label="Close Media Library"><X /></button></div><div>{media.map((asset) => <button type="button" key={asset.id} onClick={() => { if (libraryFor === "card") setDraft((current) => current ? { ...current, cardMediaId: asset.id } : current); else if (libraryFor === "banner") setDraft((current) => current ? { ...current, bannerMediaId: asset.id, bannerAltText: String(asset.altText ?? `${current.name} banner`), bannerCaption: String(asset.caption ?? "") } : current); else setDraft((current) => current && !current.galleryImages.some((item) => item.mediaId === asset.id) ? { ...current, galleryImages: [...current.galleryImages, { mediaId: asset.id, altText: String(asset.altText ?? `${current.name} gallery image`), caption: String(asset.caption ?? "") }] } : current); setLibraryFor(null); }}><Image src={imageUrl(asset)} alt={String(asset.altText ?? imageName(asset))} width={160} height={110} unoptimized /><span>{imageName(asset)}</span></button>)}</div></section>}
          <details className="admin-advanced-settings"><summary>Advanced Settings</summary><label>Page URL<input value={draft.slug} required onChange={(event) => update("slug", slugify(event.target.value))} /></label><label>Category card title<input value={draft.cardTitle} onChange={(event) => update("cardTitle", event.target.value)} /></label><label>Category card description<textarea value={draft.description} onChange={(event) => update("description", event.target.value)} /></label><label>Approved icon<select value={draft.iconKey} onChange={(event) => update("iconKey", event.target.value)}>{approvedIconKeys.map((key) => <option key={key} value={key}>{key}</option>)}</select></label><label>Display order<input type="number" value={draft.displayOrder} onChange={(event) => update("displayOrder", Number(event.target.value))} /></label><label className="admin-check"><input type="checkbox" checked={draft.isActive} onChange={(event) => update("isActive", event.target.checked)} />Visible</label></details>
          <div className="admin-category-actions"><button className="admin-primary" type="submit"><Save /> Save Changes</button><button type="button" onClick={() => void preview()}><Eye /> Preview</button><button className="admin-primary" type="button" onClick={() => void publish()}><Globe2 /> Publish Changes</button><button type="button" onClick={() => setDraft(null)}>Cancel</button></div>
        </form>
      </aside>}
    </div>
  </div>;
}
