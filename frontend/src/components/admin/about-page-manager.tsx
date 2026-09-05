"use client";
import Image from "next/image";
import { ArrowDown, ArrowUp, Eye, Globe2, Plus, RefreshCw, Save, Trash2 } from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { adminApi, type CmsRecord } from "@/lib/admin-api";
import { approvedIconKeys, type IconKey } from "@/content/site-content";
import { ApprovedIcon } from "@/components/ui/approved-icon";
import { aboutCmsContent, type AboutCmsContent } from "@/content/about-cms";

type IconCard = { iconKey: IconKey; title: string; description: string };
type EditableContent = Omit<AboutCmsContent, "hero" | "badges">;
type Extra = Pick<AboutCmsContent, "hero" | "badges">;

const MAX_LIST_ITEMS = 8;
const initials = (name: string) => name.trim().split(/\s+/).filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "?";

function mergeContent(raw: unknown): { content: EditableContent; extra: Extra } {
  const value = (raw && typeof raw === "object" ? raw : {}) as Partial<AboutCmsContent>;
  const fallback = aboutCmsContent;
  return {
    content: {
      story: { ...fallback.story, ...value.story, facts: value.story?.facts?.length ? value.story.facts : fallback.story.facts },
      founder: { ...fallback.founder, ...value.founder },
      foundation: {
        ...fallback.foundation,
        ...value.foundation,
        mission: { ...fallback.foundation.mission, ...value.foundation?.mission },
        vision: { ...fallback.foundation.vision, ...value.foundation?.vision },
        values: value.foundation?.values?.length ? value.foundation.values : fallback.foundation.values,
      },
      location: { ...fallback.location, ...value.location },
      advantage: { ...fallback.advantage, ...value.advantage, items: value.advantage?.items?.length ? value.advantage.items : fallback.advantage.items },
    },
    extra: { hero: value.hero ?? fallback.hero, badges: value.badges ?? fallback.badges },
  };
}

function IconPickerField({ value, onChange }: { value: IconKey; onChange: (key: IconKey) => void }) {
  return (
    <div className="admin-icon-field">
      <select aria-label="Approved icon" value={value} onChange={(event) => onChange(event.target.value as IconKey)}>
        {approvedIconKeys.map((key) => <option key={key} value={key}>{key}</option>)}
      </select>
      <span className="admin-icon-preview-single"><ApprovedIcon iconKey={value} /></span>
    </div>
  );
}

function CardListEditor({
  label, items, withIcon, onChange,
}: {
  label: string;
  items: IconCard[];
  withIcon: boolean;
  onChange: (next: IconCard[]) => void;
}) {
  function update(index: number, patch: Partial<IconCard>) {
    onChange(items.map((item, position) => (position === index ? { ...item, ...patch } : item)));
  }
  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }
  function remove(index: number) {
    if (!confirm(`Remove "${items[index]!.title || "this item"}"?`)) return;
    onChange(items.filter((_, position) => position !== index));
  }
  function add() {
    if (items.length >= MAX_LIST_ITEMS) return;
    onChange([...items, { iconKey: "check", title: "", description: "" }]);
  }
  return (
    <fieldset className="admin-card-list-field">
      <legend>{label}</legend>
      {items.length === 0 ? <p>No items added yet.</p> : <ol className="admin-card-list">
        {items.map((item, index) => (
          <li key={index}>
            <div className="admin-card-list-item">
              {withIcon && <IconPickerField value={item.iconKey} onChange={(iconKey) => update(index, { iconKey })} />}
              <div className="admin-card-list-fields">
                <label>Title<input value={item.title} required maxLength={80} onChange={(event) => update(index, { title: event.target.value })} /></label>
                <label>Description<textarea value={item.description} required maxLength={400} onChange={(event) => update(index, { description: event.target.value })} /></label>
              </div>
              <div className="admin-feature-actions">
                <button type="button" disabled={index === 0} aria-label={`Move "${item.title}" earlier`} onClick={() => move(index, -1)}><ArrowUp /></button>
                <button type="button" disabled={index === items.length - 1} aria-label={`Move "${item.title}" later`} onClick={() => move(index, 1)}><ArrowDown /></button>
                <button type="button" aria-label={`Remove "${item.title}"`} onClick={() => remove(index)}><Trash2 /></button>
              </div>
            </div>
          </li>
        ))}
      </ol>}
      <button type="button" disabled={items.length >= MAX_LIST_ITEMS} onClick={add}><Plus /> Add item</button>
    </fieldset>
  );
}

function ReasonListEditor({ items, onChange }: { items: Array<{ title: string; description: string }>; onChange: (next: Array<{ title: string; description: string }>) => void }) {
  function update(index: number, patch: Partial<{ title: string; description: string }>) {
    onChange(items.map((item, position) => (position === index ? { ...item, ...patch } : item)));
  }
  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }
  function remove(index: number) {
    if (!confirm(`Remove "${items[index]!.title || "this reason"}"?`)) return;
    onChange(items.filter((_, position) => position !== index));
  }
  return (
    <fieldset className="admin-card-list-field">
      <legend>Reasons to work with us</legend>
      {items.length === 0 ? <p>No reasons added yet.</p> : <ol className="admin-card-list">
        {items.map((item, index) => (
          <li key={index}>
            <div className="admin-card-list-item">
              <div className="admin-card-list-fields">
                <label>Title<input value={item.title} required maxLength={100} onChange={(event) => update(index, { title: event.target.value })} /></label>
                <label>Description<textarea value={item.description} required maxLength={300} onChange={(event) => update(index, { description: event.target.value })} /></label>
              </div>
              <div className="admin-feature-actions">
                <button type="button" disabled={index === 0} aria-label={`Move "${item.title}" earlier`} onClick={() => move(index, -1)}><ArrowUp /></button>
                <button type="button" disabled={index === items.length - 1} aria-label={`Move "${item.title}" later`} onClick={() => move(index, 1)}><ArrowDown /></button>
                <button type="button" aria-label={`Remove "${item.title}"`} onClick={() => remove(index)}><Trash2 /></button>
              </div>
            </div>
          </li>
        ))}
      </ol>}
      <button type="button" disabled={items.length >= MAX_LIST_ITEMS} onClick={() => onChange([...items, { title: "", description: "" }])}><Plus /> Add reason</button>
    </fieldset>
  );
}

function ParagraphListEditor({ label, items, onChange }: { label: string; items: string[]; onChange: (next: string[]) => void }) {
  return (
    <fieldset className="admin-card-list-field">
      <legend>{label}</legend>
      {items.map((item, index) => (
        <div className="admin-paragraph-row" key={index}>
          <textarea value={item} required maxLength={1000} onChange={(event) => onChange(items.map((value, position) => (position === index ? event.target.value : value)))} />
          <button type="button" disabled={items.length <= 1} aria-label={`Remove paragraph ${index + 1}`} onClick={() => { if (items.length > 1) onChange(items.filter((_, position) => position !== index)); }}><Trash2 /></button>
        </div>
      ))}
      <button type="button" disabled={items.length >= 6} onClick={() => onChange([...items, ""])}><Plus /> Add paragraph</button>
    </fieldset>
  );
}

export function AboutPageManager() {
  const [pageId, setPageId] = useState("");
  const [pageStatus, setPageStatus] = useState("DRAFT");
  const [content, setContent] = useState<EditableContent | null>(null);
  const [extra, setExtra] = useState<Extra | null>(null);
  const [media, setMedia] = useState<CmsRecord[]>([]);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [pages, assets] = await Promise.all([adminApi.cmsList("pages", ""), adminApi.cmsList("media", "")]);
      setMedia(assets);
      let row = pages.find((item) => item.slug === "about");
      if (!row) row = await adminApi.cmsCreate("pages", { title: "About", slug: "about" });
      setPageId(row.id);
      setPageStatus(String(row.status ?? "DRAFT"));
      const sections = Array.isArray(row.sections) ? (row.sections as CmsRecord[]) : [];
      const section = sections.find((item) => item.key === "content");
      const { content: merged, extra: mergedExtra } = mergeContent(section?.content);
      setContent(merged);
      setExtra(mergedExtra);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The About Us page could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { void load(); }, [load]);

  function updateStory(patch: Partial<EditableContent["story"]>) { setContent((current) => current && { ...current, story: { ...current.story, ...patch } }); }
  function updateFounder(patch: Partial<EditableContent["founder"]>) { setContent((current) => current && { ...current, founder: { ...current.founder, ...patch } }); }
  function updateFoundation(patch: Partial<EditableContent["foundation"]>) { setContent((current) => current && { ...current, foundation: { ...current.foundation, ...patch } }); }
  function updateLocation(patch: Partial<EditableContent["location"]>) { setContent((current) => current && { ...current, location: { ...current.location, ...patch } }); }
  function updateAdvantage(patch: Partial<EditableContent["advantage"]>) { setContent((current) => current && { ...current, advantage: { ...current.advantage, ...patch } }); }

  async function uploadPhoto(file: File | undefined) {
    if (!file || !content) return;
    setUploading(true); setError("");
    try {
      const body = new FormData();
      body.set("file", file);
      body.set("altText", `${content.founder.name.trim() || "Founder"} portrait`);
      const asset = await adminApi.uploadMedia(body);
      setMedia((current) => [asset, ...current.filter((item) => item.id !== asset.id)]);
      updateFounder({ photoUrl: String(asset.secureUrl ?? asset.url ?? ""), photoAlt: String(asset.altText ?? "") });
      setSuccess("Founder photo uploaded. Select Save Draft to keep it.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The photo could not be uploaded.");
    } finally {
      setUploading(false);
    }
  }

  async function save(): Promise<boolean> {
    if (!content || !extra || !pageId) return false;
    setError("");
    try {
      const payload = { ...extra, ...content };
      await adminApi.cmsUpdate("pages", pageId, { sections: [{ key: "content", kind: "about", content: payload, isEnabled: true }] });
      setPageStatus("DRAFT");
      setSuccess("Changes saved as a draft. Publish to make them live.");
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Changes could not be saved.");
      return false;
    }
  }
  async function submit(event: FormEvent) { event.preventDefault(); setBusy(true); await save(); setBusy(false); }
  async function preview() {
    if (!(await save())) return;
    try {
      const result = await adminApi.previewContent("pages", pageId);
      window.open(result.path, "_blank", "noopener,noreferrer");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Preview could not be opened."); }
  }
  async function publish() {
    if (!(await save())) return;
    if (!confirm("Publish the About Us page to the public website?")) return;
    try {
      const result = await adminApi.publishContent("pages", pageId);
      setPageStatus("PUBLISHED");
      setSuccess(`Published successfully as version ${result.version}.`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Changes could not be published."); }
  }
  async function unpublish() {
    if (!confirm("Remove the About Us page from the public website?")) return;
    try {
      await adminApi.unpublishContent("pages", pageId);
      setPageStatus("DRAFT");
      setSuccess("The About Us page is no longer public.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "The page could not be unpublished."); }
  }

  if (loading || !content) return <div className="admin-cms admin-about-manager"><header className="admin-page-head"><p>Website content</p><h1>About Us page</h1></header><p role="status">Loading About Us page...</p></div>;

  return (
    <div className="admin-cms admin-about-manager">
      <header className="admin-page-head">
        <p>Website content</p>
        <h1>About Us page</h1>
        <span>Edit every block on the public About Us page. Status: {pageStatus === "PUBLISHED" ? "Published" : "Draft"}.</span>
      </header>
      <div className="admin-cms-toolbar">
        <button onClick={() => void load()} aria-label="Refresh"><RefreshCw /> Refresh</button>
      </div>
      {error && <p className="admin-error" role="alert">{error}</p>}
      {success && <p className="admin-success" role="status">{success}</p>}
      <form className="admin-form admin-about-form" onSubmit={submit}>
        <fieldset>
          <legend>Block 1 — Who We Are</legend>
          <label>Eyebrow<input value={content.story.eyebrow} required maxLength={60} onChange={(event) => updateStory({ eyebrow: event.target.value })} /></label>
          <label>Heading<input value={content.story.title} required maxLength={150} onChange={(event) => updateStory({ title: event.target.value })} /></label>
          <ParagraphListEditor label="Body paragraphs" items={content.story.paragraphs} onChange={(paragraphs) => updateStory({ paragraphs })} />
          <CardListEditor label="Stat cards" items={content.story.facts} withIcon onChange={(facts) => updateStory({ facts })} />
        </fieldset>

        <fieldset>
          <legend>Block 2 — Founder&apos;s Message</legend>
          <label>Eyebrow<input value={content.founder.eyebrow} required maxLength={60} onChange={(event) => updateFounder({ eyebrow: event.target.value })} /></label>
          <div className="admin-founder-photo">
            {content.founder.photoUrl ? (
              <div className="admin-simple-banner">
                <Image src={content.founder.photoUrl} alt={content.founder.photoAlt || content.founder.name} width={160} height={160} unoptimized />
                <div>
                  <label className="admin-primary">{uploading ? "Uploading..." : "Change Photo"}<input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp,image/avif" disabled={uploading} onChange={(event) => { void uploadPhoto(event.target.files?.[0]); event.target.value = ""; }} /></label>
                  <button type="button" onClick={() => { if (confirm("Remove the founder photo? The page will fall back to the initials badge.")) updateFounder({ photoUrl: "", photoAlt: "" }); }}>Remove Photo</button>
                </div>
              </div>
            ) : (
              <div className="admin-simple-media-empty">
                <div className="admin-founder-initials-preview">{initials(content.founder.name)}</div>
                <p>No founder photo uploaded yet — the initials badge above is shown on the public site instead.</p>
                <label className="admin-primary">{uploading ? "Uploading..." : "Upload Photo"}<input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp,image/avif" disabled={uploading} onChange={(event) => { void uploadPhoto(event.target.files?.[0]); event.target.value = ""; }} /></label>
                <button type="button" onClick={() => setLibraryOpen((value) => !value)}>Select from Media Library</button>
              </div>
            )}
            {libraryOpen && <section className="admin-simple-library" aria-label="Media Library">
              <div><h3>Select from Media Library</h3><button type="button" onClick={() => setLibraryOpen(false)} aria-label="Close Media Library">×</button></div>
              <div>{media.map((asset) => <button type="button" key={asset.id} onClick={() => { updateFounder({ photoUrl: String(asset.secureUrl ?? asset.url ?? ""), photoAlt: String(asset.altText ?? "") }); setLibraryOpen(false); }}><Image src={String(asset.secureUrl ?? asset.url)} alt={String(asset.altText ?? asset.title ?? "")} width={160} height={110} unoptimized /><span>{String(asset.title ?? asset.altText ?? "Untitled image")}</span></button>)}</div>
            </section>}
          </div>
          <label>Founder name<input value={content.founder.name} required maxLength={150} onChange={(event) => updateFounder({ name: event.target.value })} /></label>
          <label>Founder title<input value={content.founder.role} required maxLength={150} placeholder="e.g. Founder & Creative Designer" onChange={(event) => updateFounder({ role: event.target.value })} /></label>
          <label>Tagline<input value={content.founder.caption} required maxLength={250} onChange={(event) => updateFounder({ caption: event.target.value })} /></label>
          <label>Message heading<input value={content.founder.messageHeading} required maxLength={150} onChange={(event) => updateFounder({ messageHeading: event.target.value })} /></label>
          <ParagraphListEditor label="Message body" items={content.founder.messageParagraphs} onChange={(messageParagraphs) => updateFounder({ messageParagraphs })} />
          <div className="admin-form-row">
            <label>Signature name<input value={content.founder.signatureName} required maxLength={150} onChange={(event) => updateFounder({ signatureName: event.target.value })} /></label>
            <label>Signature title<input value={content.founder.signatureTitle} required maxLength={150} onChange={(event) => updateFounder({ signatureTitle: event.target.value })} /></label>
          </div>
        </fieldset>

        <fieldset>
          <legend>Block 3 — Mission, Vision &amp; Core Values</legend>
          <label>Eyebrow<input value={content.foundation.eyebrow} required maxLength={60} onChange={(event) => updateFoundation({ eyebrow: event.target.value })} /></label>
          <label>Heading<input value={content.foundation.title} required maxLength={150} onChange={(event) => updateFoundation({ title: event.target.value })} /></label>
          <div className="admin-form-row">
            <fieldset className="admin-card-list-field">
              <legend>Mission card</legend>
              <IconPickerField value={content.foundation.mission.iconKey} onChange={(iconKey) => updateFoundation({ mission: { ...content.foundation.mission, iconKey } })} />
              <label>Title<input value={content.foundation.mission.title} required maxLength={80} onChange={(event) => updateFoundation({ mission: { ...content.foundation.mission, title: event.target.value } })} /></label>
              <label>Description<textarea value={content.foundation.mission.description} required maxLength={400} onChange={(event) => updateFoundation({ mission: { ...content.foundation.mission, description: event.target.value } })} /></label>
            </fieldset>
            <fieldset className="admin-card-list-field">
              <legend>Vision card</legend>
              <IconPickerField value={content.foundation.vision.iconKey} onChange={(iconKey) => updateFoundation({ vision: { ...content.foundation.vision, iconKey } })} />
              <label>Title<input value={content.foundation.vision.title} required maxLength={80} onChange={(event) => updateFoundation({ vision: { ...content.foundation.vision, title: event.target.value } })} /></label>
              <label>Description<textarea value={content.foundation.vision.description} required maxLength={400} onChange={(event) => updateFoundation({ vision: { ...content.foundation.vision, description: event.target.value } })} /></label>
            </fieldset>
          </div>
          <label>Core Values label<input value={content.foundation.valuesLabel} required maxLength={60} onChange={(event) => updateFoundation({ valuesLabel: event.target.value })} /></label>
          <CardListEditor label="Core Values" items={content.foundation.values} withIcon onChange={(values) => updateFoundation({ values })} />
        </fieldset>

        <fieldset>
          <legend>Block 4 — Find Us &amp; Get In Touch</legend>
          <label>Eyebrow<input value={content.location.eyebrow} required maxLength={60} onChange={(event) => updateLocation({ eyebrow: event.target.value })} /></label>
          <label>Heading<input value={content.location.title} required maxLength={150} onChange={(event) => updateLocation({ title: event.target.value })} /></label>
          <label>Office address<textarea value={content.location.address} required maxLength={500} onChange={(event) => updateLocation({ address: event.target.value })} /></label>
          <div className="admin-form-row">
            <label>Email address<input type="email" value={content.location.email} required maxLength={200} onChange={(event) => updateLocation({ email: event.target.value })} /></label>
            <label>Phone number<input value={content.location.phone} required maxLength={60} onChange={(event) => updateLocation({ phone: event.target.value })} /></label>
          </div>
          <label>Operating hours<input value={content.location.hours} required maxLength={200} onChange={(event) => updateLocation({ hours: event.target.value })} /></label>
        </fieldset>

        <fieldset>
          <legend>Block 5 — Why Work With Us?</legend>
          <label>Eyebrow<input value={content.advantage.eyebrow} required maxLength={60} onChange={(event) => updateAdvantage({ eyebrow: event.target.value })} /></label>
          <label>Heading<input value={content.advantage.title} required maxLength={150} onChange={(event) => updateAdvantage({ title: event.target.value })} /></label>
          <ReasonListEditor items={content.advantage.items} onChange={(items) => updateAdvantage({ items })} />
          <div className="admin-form-row">
            <label>Button label<input value={content.advantage.buttonLabel} required maxLength={60} onChange={(event) => updateAdvantage({ buttonLabel: event.target.value })} /></label>
            <label>Button link<input value={content.advantage.buttonHref} required maxLength={300} placeholder="/get-a-quote" onChange={(event) => updateAdvantage({ buttonHref: event.target.value })} /></label>
          </div>
        </fieldset>

        <div className="admin-category-actions">
          <button className="admin-primary" type="submit" disabled={busy}><Save /> Save Draft</button>
          <button type="button" onClick={() => void preview()}><Eye /> Preview</button>
          <button className="admin-primary" type="button" onClick={() => void publish()}><Globe2 /> Publish Changes</button>
          {pageStatus === "PUBLISHED" && <button type="button" onClick={() => void unpublish()}>Unpublish</button>}
        </div>
      </form>
    </div>
  );
}
