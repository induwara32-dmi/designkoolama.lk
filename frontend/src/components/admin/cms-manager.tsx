"use client";
import { AnimatePresence, motion } from "framer-motion";
import {
  Archive,
  Eye,
  Globe2,
  History,
  Plus,
  RefreshCw,
  Save,
  Search,
  X,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { adminApi, type CmsRecord, type ContentRevision } from "@/lib/admin-api";
import {approvedIconKeys} from "@/content/site-content";
import {ApprovedIcon} from "@/components/ui/approved-icon";

type Field = {
  key: string;
  label: string;
  kind?: "text" | "textarea" | "number" | "boolean" | "json" | "media" | "media-multiple" | "icon";
  required?: boolean;
};
type Config = {
  resource: string;
  title: string;
  description: string;
  fields: Field[];
  readonly?: boolean;
  submissions?: boolean;
  archive?: boolean;
  publishable?: boolean;
};
const common = [
  { key: "name", label: "Name", required: true },
  { key: "slug", label: "Slug", required: true },
  { key: "displayOrder", label: "Display order", kind: "number" as const },
];
export const cmsConfigs: Record<string, Config> = {
  content: {
    resource: "pages",
    title: "Website content",
    description: "Manage page copy and structured sections.",
    fields: [
      { key: "title", label: "Title", required: true },
      { key: "slug", label: "Slug", required: true },
      { key: "sections", label: "Sections (JSON)", kind: "json" },
      { key: "seo", label: "SEO metadata", kind: "json" },
    ],
    archive: true,
    publishable: true,
  },
  services: {
    resource: "services",
    title: "Services",
    description: "Manage public service offerings.",
    fields: [
      ...common,
      { key: "summary", label: "Summary", kind: "textarea", required: true },
      { key: "content", label: "Content (JSON)", kind: "json" },
      { key: "seo", label: "SEO metadata", kind: "json" },
    ],
    archive: true,
    publishable: true,
  },
  "portfolio-categories": {
    resource: "portfolio-categories",
    title: "Portfolio categories",
    description: "Organize portfolio projects.",
    fields: [...common, { key: "isActive", label: "Active", kind: "boolean" }],
    archive: true,
  },
  portfolio: {
    resource: "portfolio",
    title: "Portfolio",
    description: "Manage project case studies and their content.",
    fields: [
      { key: "title", label: "Title", required: true },
      { key: "slug", label: "Slug", required: true },
      { key: "categoryId", label: "Category ID", required: true },
      { key: "serviceId", label: "Service ID" },
      { key: "clientName", label: "Client name" },
      { key: "summary", label: "Summary", kind: "textarea", required: true },
      { key: "displayOrder", label: "Display order", kind: "number" },
      { key: "content", label: "Content (JSON)", kind: "json" },
      { key: "mediaIds", label: "Project images", kind: "media-multiple" },
      { key: "seo", label: "SEO metadata", kind: "json" },
    ],
    archive: true,
    publishable: true,
  },
  "package-categories": {
    resource: "package-categories",
    title: "Package categories",
    description: "Organize package tiers.",
    fields: [
      ...common,
      { key: "headline", label: "Headline" },
      { key: "description", label: "Description", kind: "textarea" },
      { key: "content", label: "Content (JSON)", kind: "json" },
      { key: "isActive", label: "Active", kind: "boolean" },
    ],
    archive: true,
  },
  packages: {
    resource: "packages",
    title: "Packages",
    description: "Manage pricing packages and feature lists.",
    fields: [
      { key: "name", label: "Name", required: true },
      { key: "slug", label: "Slug", required: true },
      { key: "categoryId", label: "Category ID", required: true },
      { key: "subtitle", label: "Subtitle" },
      { key: "description", label: "Description", kind: "textarea" },
      { key: "priceLabel", label: "Price label" },
      { key: "currency", label: "Currency" },
      { key: "displayOrder", label: "Display order", kind: "number" },
      { key: "isActive", label: "Active", kind: "boolean" },
      { key: "isPopular", label: "Popular", kind: "boolean" },
      { key: "features", label: "Features (JSON array)", kind: "json" },
    ],
    archive: true,
    publishable: true,
  },
  testimonials: {
    resource: "testimonials",
    title: "Testimonials",
    description: "Manage client testimonials.",
    fields: [
      { key: "clientName", label: "Client name", required: true },
      { key: "clientRole", label: "Role" },
      { key: "company", label: "Company" },
      { key: "quote", label: "Quote", kind: "textarea", required: true },
      { key: "rating", label: "Rating", kind: "number" },
      { key: "displayOrder", label: "Display order", kind: "number" },
      { key: "avatarId", label: "Avatar image", kind: "media" },
    ],
    archive: true,
    publishable: true,
  },
  media: {
    resource: "media",
    title: "Media library",
    description: "Register HTTPS media assets with accessible metadata.",
    fields: [
      { key: "providerId", label: "Provider ID", required: true },
      { key: "url", label: "HTTPS URL", required: true },
      { key: "title", label: "Title", required: true },
      { key: "altText", label: "Alternative text", required: true },
      { key: "caption", label: "Caption" },
      { key: "folder", label: "Folder" },
      { key: "mimeType", label: "MIME type", required: true },
      {
        key: "bytes",
        label: "File size (bytes)",
        kind: "number",
        required: true,
      },
      { key: "kind", label: "Kind" },
    ],
    archive: true,
  },
  settings: {
    resource: "settings",
    title: "Website settings",
    description: "Manage structured site settings.",
    fields: [
      { key: "key", label: "Key", required: true },
      { key: "value", label: "Value (JSON)", kind: "json", required: true },
      { key: "isPublic", label: "Public", kind: "boolean" },
    ],
  },
  quotes: {
    resource: "quotes",
    title: "Quote requests",
    description: "Review and triage quote enquiries.",
    fields: [],
    readonly: true,
    submissions: true,
  },
  messages: {
    resource: "contacts",
    title: "Contact messages",
    description: "Review and triage contact messages.",
    fields: [],
    readonly: true,
    submissions: true,
  },
  activity: {
    resource: "activity",
    title: "Activity log",
    description: "Review security and content-management actions.",
    fields: [],
    readonly: true,
  },
};
const labelOf = (row: CmsRecord) =>
  String(
    row.title ??
      row.name ??
      row.clientName ??
      row.fullName ??
      row.key ??
      row.action ??
      row.id,
  );
const valueFor = (row: CmsRecord, key: string, kind?: Field["kind"]) => {
  const value = row[key];
  if (kind === "json")
    return JSON.stringify(value ?? (key === "features" ? [] : {}), null, 2);
  if (kind === "boolean") return Boolean(value);
  return value == null ? "" : String(value);
};
export function CmsManager({ module }: { module: string }) {
  const config = cmsConfigs[module]!;
  const [rows, setRows] = useState<CmsRecord[]>([]),
    [selected, setSelected] = useState<CmsRecord | null>(null),
    [search, setSearch] = useState(""),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [success, setSuccess] = useState("");
  const [revisions, setRevisions] = useState<ContentRevision[]>([]);
  const [media, setMedia] = useState<CmsRecord[]>([]);
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setRows(await adminApi.cmsList(config.resource, search));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load records");
    } finally {
      setLoading(false);
    }
  }, [config.resource, search]);
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(()=>{if(config.fields.some(field=>field.kind==="media"||field.kind==="media-multiple"))void adminApi.cmsList("media","").then(setMedia).catch(()=>setMedia([]))},[config.fields]);
  const defaults = useMemo(
    () =>
      Object.fromEntries(
        config.fields.map((field) => [
          field.key,
          field.kind === "boolean"
            ? false
            : field.kind === "number"
              ? 0
              : field.kind === "json"
                ? field.key === "features"
                  ? "[]"
                  : "{}"
                : field.key === "status"
                  ? "DRAFT"
                  : field.key === "kind"
                    ? "IMAGE"
                    : "",
        ]),
      ),
    [config.fields],
  );
  function openNew() {
    setSelected({ id: "", ...defaults });
    setError("");
    setSuccess("");
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const data = Object.fromEntries(
        config.fields.map((field) => {
          const raw = form.get(field.key);
          if (field.kind === "boolean") return [field.key, raw === "on"];
          if (field.kind === "number") return [field.key, Number(raw)];
          if(field.kind==="media-multiple")return[field.key,form.getAll(field.key).map(String).filter(Boolean)];
          if (field.kind === "json") {
            try {
              return [field.key, JSON.parse(String(raw))];
            } catch {
              throw new Error(`${field.label} must contain valid JSON`);
            }
          }
          return [field.key, String(raw ?? "")];
        }),
      );
      const saved = selected.id
        ? await adminApi.cmsUpdate(config.resource, selected.id, data)
        : await adminApi.cmsCreate(config.resource, data);
      setSelected(saved);
      setSuccess("Changes saved and recorded in the activity log.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save");
    }
  }
  async function archive() {
    if (!selected?.id || !confirm("Archive this record?")) return;
    try {
      await adminApi.cmsArchive(config.resource, selected.id);
      setSelected(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to archive");
    }
  }
  async function preview() {
    if (!selected?.id) return;
    try {
      const result = await adminApi.previewContent(
        config.resource,
        selected.id,
      );
      window.open(result.path, "_blank", "noopener,noreferrer");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to create preview");
    }
  }
  async function publish() {
    if (
      !selected?.id ||
      !confirm("Publish the current draft to the public website?")
    )
      return;
    try {
      const result = await adminApi.publishContent(
        config.resource,
        selected.id,
      );
      setSuccess(`Version ${result.version} is now live.`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to publish");
    }
  }
  async function unpublish() {
    if (
      !selected?.id ||
      !confirm("Remove this content from the public website?")
    )
      return;
    try {
      await adminApi.unpublishContent(config.resource, selected.id);
      setSuccess("Content is no longer public.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to unpublish");
    }
  }
  async function loadRevisions() {
    if (!selected?.id) return;
    try {
      setRevisions(await adminApi.revisions(config.resource, selected.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load revision history");
    }
  }
  async function status(id: string, next: string) {
    try {
      await adminApi.submissionStatus(
        config.resource as "quotes" | "contacts",
        id,
        next,
      );
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to update status");
    }
  }
  return (
    <div className="admin-cms">
      <header className="admin-page-head">
        <p>Draft and publishing workflow</p>
        <h1>{config.title}</h1>
        <span>{config.description}</span>
      </header>
      <div className="admin-cms-toolbar">
        <label>
          <Search />
          <span className="sr-only">Search {config.title}</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search records"
          />
        </label>
        <button onClick={() => void load()} aria-label="Refresh">
          <RefreshCw />
        </button>
        {!config.readonly && (
          <button className="admin-primary" onClick={openNew}>
            <Plus />
            Add record
          </button>
        )}
      </div>
      {error && (
        <p className="admin-error" role="alert">
          {error}
        </p>
      )}
      <div className="admin-cms-grid">
        <section
          className="admin-cms-list"
          aria-label={`${config.title} records`}
        >
          {loading ? (
            <p role="status">Loading records…</p>
          ) : rows.length === 0 ? (
            <p>No records found.</p>
          ) : (
            rows.map((row) => (
              <article key={row.id}>
                <button
                  onClick={() => !config.readonly && setSelected(row)}
                  disabled={config.readonly}
                >
                  <strong>{labelOf(row)}</strong>
                  <span>
                    {String(row.status ?? row.slug ?? row.entityType ?? "")}
                  </span>
                </button>
                {config.submissions && (
                  <select
                    aria-label={`Status for ${labelOf(row)}`}
                    value={String(row.status)}
                    onChange={(e) => void status(row.id, e.target.value)}
                  >
                    {["NEW", "IN_PROGRESS", "REPLIED", "CLOSED", "SPAM"].map(
                      (item) => (
                        <option key={item}>{item}</option>
                      ),
                    )}
                  </select>
                )}
                <details>
                  <summary>Details</summary>
                  <pre>{JSON.stringify(row, null, 2)}</pre>
                </details>
              </article>
            ))
          )}
        </section>
        <AnimatePresence>
          {selected && !config.readonly && (
            <motion.aside
              className="admin-cms-editor"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="admin-panel-title">
                <h2>{selected.id ? "Edit record" : "Add record"}</h2>
                <button
                  onClick={() => setSelected(null)}
                  aria-label="Close editor"
                >
                  <X />
                </button>
              </div>
              <form className="admin-form" onSubmit={submit}>
                {config.resource==="pages"&&<label>Approved icon key<select aria-label="Approved icon key reference" defaultValue="flame">{approvedIconKeys.map(key=><option key={key}>{key}</option>)}</select><span className="admin-icon-preview">{approvedIconKeys.map(key=><span title={key} key={key}><ApprovedIcon iconKey={key}/></span>)}</span></label>}
                {config.fields.map((field) => (
                  <label
                    key={`${selected.id}-${field.key}`}
                    className={field.kind === "boolean" ? "admin-check" : ""}
                  >
                    {field.kind === "boolean" ? (
                      <>
                        <input
                          name={field.key}
                          type="checkbox"
                          defaultChecked={Boolean(
                            valueFor(selected, field.key, field.kind),
                          )}
                        />
                        {field.label}
                      </>
                    ) : (
                      <>
                        {field.label}
                        {field.kind==="media"||field.kind==="media-multiple"?<select name={field.key} multiple={field.kind==="media-multiple"} defaultValue={field.kind==="media-multiple"?(Array.isArray(selected.media)?selected.media.map(item=>String((item as {mediaId?:unknown}).mediaId??"")):[]):String(valueFor(selected,field.key,field.kind))}><option value="">No media selected</option>{media.map(item=><option value={item.id} key={item.id}>{String(item.title??item.altText??item.id)}</option>)}</select>:field.kind==="icon"?<><select name={field.key} defaultValue={String(valueFor(selected,field.key,field.kind))}>{approvedIconKeys.map(key=><option key={key}>{key}</option>)}</select><span className="admin-icon-preview" aria-label="Approved icon preview">{approvedIconKeys.map(key=><span title={key} key={key}><ApprovedIcon iconKey={key}/></span>)}</span></>:field.kind === "textarea" || field.kind === "json" ? (
                          <textarea
                            name={field.key}
                            defaultValue={String(
                              valueFor(selected, field.key, field.kind),
                            )}
                            required={field.required}
                          />
                        ) : (
                          <input
                            name={field.key}
                            type={field.kind === "number" ? "number" : "text"}
                            defaultValue={String(
                              valueFor(selected, field.key, field.kind),
                            )}
                            required={field.required}
                          />
                        )}
                      </>
                    )}
                  </label>
                ))}
                {success && (
                  <p className="admin-success" role="status">
                    {success}
                  </p>
                )}
                <button className="admin-primary" type="submit">
                  <Save />
                  Save draft
                </button>
                {config.publishable && selected.id && (
                  <div className="admin-publishing-actions" aria-label="Publishing actions">
                    <button type="button" onClick={() => void preview()}>
                      <Eye /> Preview draft
                    </button>
                    <button type="button" className="admin-primary" onClick={() => void publish()}>
                      <Globe2 /> Publish
                    </button>
                    <button type="button" onClick={() => void unpublish()}>
                      Unpublish
                    </button>
                    <button type="button" onClick={() => void loadRevisions()}>
                      <History /> History
                    </button>
                  </div>
                )}
                {revisions.length > 0 && <ol className="admin-revision-list" aria-label="Publication history">{revisions.map(item=><li key={item.id}><strong>Version {item.version}</strong><span>{item.publishedAt ? new Date(item.publishedAt).toLocaleString() : "Draft"}</span></li>)}</ol>}
                {config.archive && selected.id && (
                  <button
                    type="button"
                    className="admin-danger"
                    onClick={() => void archive()}
                  >
                    <Archive />
                    Archive record
                  </button>
                )}
              </form>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
