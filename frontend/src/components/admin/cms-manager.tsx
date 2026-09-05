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
  ArrowUp,
  ArrowDown,
  ImageIcon,
  X,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  adminApi,
  type CmsRecord,
  type ContentRevision,
} from "@/lib/admin-api";
import { approvedIconKeys } from "@/content/site-content";
import { ApprovedIcon } from "@/components/ui/approved-icon";
import Image from "next/image";
import { PortfolioCategoryManager } from "@/components/admin/portfolio-category-manager";
import { TestimonialManager } from "@/components/admin/testimonial-manager";
import { PackageCategoryManager } from "@/components/admin/package-category-manager";
import { PackageManager } from "@/components/admin/package-manager";
import { AboutPageManager } from "@/components/admin/about-page-manager";
import { HomeStatsManager } from "@/components/admin/home-stats-manager";

type Field = {
  key: string;
  label: string;
  kind?:
    | "text"
    | "textarea"
    | "number"
    | "boolean"
    | "json"
    | "media"
    | "media-card"
    | "media-multiple"
    | "category-gallery"
    | "icon"
    | "portfolio-category"
    | "service";
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
    description: "Manage category cards, banners, descriptions, and gallery images.",
    fields: [
      { key: "name", label: "Category name", required: true },
      { key: "slug", label: "Slug", required: true },
      { key: "cardTitle", label: "Category card title", required: true },
      {
        key: "description",
        label: "Category card description",
        kind: "textarea",
        required: true,
      },
      { key: "shortDescription", label: "Category short description", kind: "textarea", required: true },
      { key: "overview", label: "Category overview", kind: "textarea", required: true },
      { key: "iconKey", label: "Approved icon", kind: "icon" },
      {
        key: "cardMediaId",
        label: "Category card artwork",
        kind: "media-card",
      },
      { key: "bannerMediaId", label: "Category banner image", kind: "media-card" },
      {key:"bannerAltText",label:"Banner alternative text"},
      {key:"bannerCaption",label:"Banner caption (optional)",kind:"textarea"},
      { key: "galleryImages", label: "Gallery Images", kind: "category-gallery" },
      { key: "displayOrder", label: "Display order", kind: "number" },
      { key: "isActive", label: "Visible", kind: "boolean" },
    ],
    archive: true,
    publishable: true,
  },
  portfolio: {
    resource: "portfolio",
    title: "Legacy portfolio image groups",
    description: "Preserved legacy records. Manage new public galleries through Portfolio categories.",
    fields: [
      { key: "title", label: "Title", required: true },
      { key: "slug", label: "Slug", required: true },
      {
        key: "categoryId",
        label: "Category",
        kind: "portfolio-category",
        required: true,
      },
      {
        key: "serviceId",
        label: "Related service (optional)",
        kind: "service",
      },
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
const availableSlug = (
  title: string,
  rows: CmsRecord[],
  currentId: unknown,
) => {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  if (!base) return "";
  const used = new Set(
    rows
      .filter((row) => row.id !== currentId)
      .map((row) => String(row.slug ?? "")),
  );
  let candidate = base;
  let suffix = 2;
  while (used.has(candidate)) candidate = `${base}-${suffix++}`;
  return candidate;
};
function GenericCmsManager({ module }: { module: string }) {
  const config = cmsConfigs[module]!;
  const [rows, setRows] = useState<CmsRecord[]>([]),
    [selected, setSelected] = useState<CmsRecord | null>(null),
    [search, setSearch] = useState(""),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [success, setSuccess] = useState("");
  const [revisions, setRevisions] = useState<ContentRevision[]>([]);
  const [media, setMedia] = useState<CmsRecord[]>([]);
  const [portfolioCategories, setPortfolioCategories] = useState<CmsRecord[]>(
      [],
    ),
    [services, setServices] = useState<CmsRecord[]>([]),
    [selectedMediaIds, setSelectedMediaIds] = useState<string[]>([]),
    [categoryMediaIds, setCategoryMediaIds] = useState<Record<string,string>>({}),
    [categoryGalleryItems,setCategoryGalleryItems]=useState<Array<{mediaId:string;altText:string;caption:string}>>([]),
    [categoryUploadField, setCategoryUploadField] = useState("cardMediaId");
  const [uploadOpen, setUploadOpen] = useState(false),
    [uploading, setUploading] = useState(false),
    [uploadFile, setUploadFile] = useState<File | null>(null),
    [uploadPreview, setUploadPreview] = useState("");
  const [inlineUploadOpen, setInlineUploadOpen] = useState(false),
    [inlineUploadFile, setInlineUploadFile] = useState<File | null>(null),
    [inlineAlt, setInlineAlt] = useState(""),
    [inlineCaption, setInlineCaption] = useState("");
  useEffect(() => {
    if (!uploadFile) {
      setUploadPreview("");
      return;
    }
    const url = URL.createObjectURL(uploadFile);
    setUploadPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [uploadFile]);
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
  // Deep-linked from the Dashboard's "Recent quote requests" / "Recent contact
  // requests" panels (?highlight=<id>): open that row's existing Details disclosure
  // and, the first time it's opened, mark it viewed the same way an admin opening it
  // manually here would (see the <details onToggle> below).
  const searchParams = useSearchParams();
  const highlightId = searchParams.get("highlight");
  const detailsRefs = useRef<Record<string, HTMLDetailsElement | null>>({});
  const highlightHandled = useRef<string | null>(null);
  const markViewed = useCallback(
    (id: string) => {
      void adminApi
        .submissionStatus(config.resource as "quotes" | "contacts", id, "IN_PROGRESS")
        .then((updated) =>
          setRows((current) =>
            current.map((row) => (row.id === id ? updated : row)),
          ),
        )
        .catch(() => undefined);
    },
    [config.resource],
  );
  useEffect(() => {
    if (!highlightId || loading || !config.submissions) return;
    if (highlightHandled.current === highlightId) return;
    const element = detailsRefs.current[highlightId];
    if (!element) return;
    highlightHandled.current = highlightId;
    element.open = true;
    element.scrollIntoView({ behavior: "smooth", block: "center" });
    const row = rows.find((item) => item.id === highlightId);
    if (row && row.status === "NEW") markViewed(highlightId);
  }, [highlightId, loading, rows, config.submissions, markViewed]);
  useEffect(() => {
    if (
      config.fields.some(
        (field) =>
          field.kind === "media" ||
          field.kind === "media-card" ||
          field.kind === "category-gallery" ||
          field.kind === "media-multiple",
      )
    )
      void adminApi
        .cmsList("media", "")
        .then(setMedia)
        .catch(() => setMedia([]));
  }, [config.fields]);
  useEffect(() => {
    if (config.resource !== "portfolio") return;
    void Promise.all([
      adminApi.cmsList("portfolio-categories", ""),
      adminApi.cmsList("services", ""),
    ])
      .then(([categories, serviceRows]) => {
        setPortfolioCategories(
          categories.filter((row) => row.isActive !== false),
        );
        setServices(serviceRows);
      })
      .catch(() =>
        setError("Portfolio categories and services could not be loaded."),
      );
  }, [config.resource]);
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
                  ? []
                  : {}
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
    setSelectedMediaIds([]);
    setCategoryMediaIds({});
    setCategoryGalleryItems([]);
    setInlineUploadOpen(false);
    setError("");
    setSuccess("");
  }
  function openRecord(row: CmsRecord) {
    setSelected(row);
    setSelectedMediaIds(
      Array.isArray(row.media)
        ? row.media
            .map((item) =>
              String(
                (item as { mediaId?: unknown; media?: { id?: unknown } })
                  .mediaId ??
                  (item as { media?: { id?: unknown } }).media?.id ??
                  "",
              ),
            )
            .filter(Boolean)
        : [],
    );
    setCategoryMediaIds({
      cardMediaId:String(row.cardMediaId ?? (row.cardMedia as {id?:unknown}|undefined)?.id ?? ""),
      bannerMediaId:String(row.bannerMediaId ?? (row.bannerMedia as {id?:unknown}|undefined)?.id ?? ""),
    });
    setCategoryGalleryItems(Array.isArray(row.galleryImages)?row.galleryImages.map(item=>{const entry=item as {mediaId?:unknown;altText?:unknown;caption?:unknown;media?:{id?:unknown;altText?:unknown;caption?:unknown}};return {mediaId:String(entry.mediaId??entry.media?.id??""),altText:String(entry.altText??entry.media?.altText??""),caption:String(entry.caption??entry.media?.caption??"")}}).filter(item=>item.mediaId):[]);
    setInlineUploadOpen(false);
    setError("");
    setSuccess("");
  }
  async function uploadImage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    const element = event.currentTarget,
      form = new FormData(element),
      file = form.get("file");
    if (!(file instanceof File) || !file.size) {
      setError("Choose an image file");
      return;
    }
    setUploading(true);
    try {
      const asset = await adminApi.uploadMedia(form);
      setRows((current) => [
        asset,
        ...current.filter((item) => item.id !== asset.id),
      ]);
      setMedia((current) => [
        asset,
        ...current.filter((item) => item.id !== asset.id),
      ]);
      setUploadOpen(false);
      setUploadFile(null);
      element.reset();
      setSuccess("Image uploaded and added to the Media Library.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Image upload failed");
    } finally {
      setUploading(false);
    }
  }
  async function uploadPortfolioImage() {
    setError("");
    setSuccess("");
    if (!inlineUploadFile) {
      setError("Choose an image file to upload.");
      return;
    }
    if (!inlineAlt.trim()) {
      setError("Alternative text is required for the image.");
      return;
    }
    const form = new FormData();
    form.set("file", inlineUploadFile);
    form.set("altText", inlineAlt.trim());
    if (inlineCaption.trim()) form.set("caption", inlineCaption.trim());
    setUploading(true);
    try {
      const asset = await adminApi.uploadMedia(form);
      setMedia((current) => [
        asset,
        ...current.filter((item) => item.id !== asset.id),
      ]);
      if (config.resource === "portfolio-categories")
        setCategoryMediaIds(current=>({...current,[categoryUploadField]:asset.id}));
      else
        setSelectedMediaIds((current) =>
          current.includes(asset.id) ? current : [...current, asset.id],
        );
      setInlineUploadOpen(false);
      setInlineUploadFile(null);
      setInlineAlt("");
      setInlineCaption("");
      setSuccess(
        "Image uploaded and selected. Save the draft when you are ready.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Image upload failed");
    } finally {
      setUploading(false);
    }
  }
  async function uploadCategoryGalleryFiles(files:File[]) {
    if(!files.length)return;
    setUploading(true);setError("");
    try{
      for(const file of files){const form=new FormData();form.set("file",file);form.set("altText",file.name.replace(/\.[^.]+$/,"").replace(/[-_]+/g," "));const asset=await adminApi.uploadMedia(form);setMedia(current=>[asset,...current.filter(item=>item.id!==asset.id)]);setCategoryGalleryItems(current=>current.some(item=>item.mediaId===asset.id)?current:[...current,{mediaId:asset.id,altText:String(asset.altText??asset.title??"Image"),caption:String(asset.caption??"")}]);}
      setSuccess("Gallery images uploaded and added. Save the draft when ready.");
    }catch(e){setError(e instanceof Error?e.message:"Gallery upload failed")}finally{setUploading(false)}
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
          if (field.kind === "media-multiple")
            return [field.key, selectedMediaIds];
          if (field.kind === "media-card") return [field.key, categoryMediaIds[field.key] ?? ""];
          if(field.kind==="category-gallery")return [field.key,categoryGalleryItems];
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
      setError(
        e instanceof Error ? e.message : "Unable to load revision history",
      );
    }
  }
  async function status(id: string, next: string) {
    try {
      const updated = await adminApi.submissionStatus(
        config.resource as "quotes" | "contacts",
        id,
        next,
      );
      // Patch in place rather than reloading the whole list: a full reload
      // briefly unmounts every row (see the loading-state branch below), which
      // would collapse any <details> the admin -- or the highlight effect above
      // -- had just opened.
      setRows((current) =>
        current.map((row) => (row.id === id ? updated : row)),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to update status");
    }
  }
  function selectMedia(id: string) {
    setSelectedMediaIds((current) =>
      current.includes(id) ? current : [...current, id],
    );
  }
  function removeMedia(id: string) {
    setSelectedMediaIds((current) => current.filter((item) => item !== id));
  }
  function moveMedia(id: string, direction: -1 | 1) {
    setSelectedMediaIds((current) => {
      const index = current.indexOf(id),
        target = index + direction;
      if (index < 0 || target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }
  function makeCover(id: string) {
    setSelectedMediaIds((current) => [
      id,
      ...current.filter((item) => item !== id),
    ]);
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
        {config.resource === "media" && (
          <button
            className="admin-primary"
            onClick={() => setUploadOpen((value) => !value)}
          >
            {uploadOpen ? <X /> : <Plus />}
            {uploadOpen ? "Cancel upload" : "Upload Image"}
          </button>
        )}
        {!config.readonly && (
          <button className="admin-primary" onClick={openNew}>
            <Plus />
            {config.resource === "media"
              ? "Register URL"
              : config.resource === "portfolio-categories"
                ? "Add Category"
                : config.resource === "portfolio"
                  ? "Add Portfolio Project"
                  : "Add record"}
          </button>
        )}
      </div>
      {config.resource === "media" && uploadOpen && (
        <form className="admin-upload" onSubmit={uploadImage}>
          <div className="admin-upload-drop">
            <input
              id="media-upload-file"
              name="file"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              required
              onChange={(event) =>
                setUploadFile(event.target.files?.[0] ?? null)
              }
            />
            <label htmlFor="media-upload-file">
              <strong>Choose an image from your computer</strong>
              <span>
                JPEG, PNG, WebP or AVIF. Maximum size is configured by the
                administrator.
              </span>
            </label>
            {uploadPreview && (
              <Image
                src={uploadPreview}
                alt="Selected image preview"
                width={192}
                height={144}
                unoptimized
              />
            )}
          </div>
          <label>
            Alternative text
            <input
              name="altText"
              required
              maxLength={500}
              aria-describedby="media-alt-help"
            />
            <span id="media-alt-help">
              Describe the meaningful content of the image for people using
              screen readers.
            </span>
          </label>
          <label>
            Caption (optional)
            <textarea name="caption" maxLength={1000} />
          </label>
          <div className="admin-upload-actions">
            <button
              className="admin-primary"
              disabled={uploading}
              type="submit"
            >
              {uploading ? "Uploading…" : "Upload Image"}
            </button>
            <button
              type="button"
              disabled={uploading}
              onClick={() => {
                setUploadOpen(false);
                setUploadFile(null);
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
      {error && (
        <p className="admin-error" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="admin-success" role="status">
          {success}
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
                  onClick={() => !config.readonly && openRecord(row)}
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
                <details
                  ref={(element) => {
                    detailsRefs.current[row.id] = element;
                  }}
                  onToggle={(event) => {
                    if (
                      config.submissions &&
                      event.currentTarget.open &&
                      row.status === "NEW"
                    )
                      markViewed(row.id);
                  }}
                >
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
                <h2>
                  {selected.id
                    ? "Edit record"
                    : config.resource === "portfolio-categories"
                      ? "Add Category"
                      : config.resource === "portfolio"
                        ? "Add Portfolio Project"
                        : "Add record"}
                </h2>
                <button
                  onClick={() => setSelected(null)}
                  aria-label="Close editor"
                >
                  <X />
                </button>
              </div>
              <form className="admin-form" onSubmit={submit}>
                {config.resource === "pages" && (
                  <label>
                    Approved icon key
                    <select
                      aria-label="Approved icon key reference"
                      defaultValue="flame"
                    >
                      {approvedIconKeys.map((key) => (
                        <option key={key}>{key}</option>
                      ))}
                    </select>
                    <span className="admin-icon-preview">
                      {approvedIconKeys.map((key) => (
                        <span title={key} key={key}>
                          <ApprovedIcon iconKey={key} />
                        </span>
                      ))}
                    </span>
                  </label>
                )}
                {config.fields.map((field) => {
                  const FieldContainer =
                    field.kind === "media-multiple" ||
                    field.kind === "media-card"
                      ? "div"
                      : "label";
                  return (
                    <FieldContainer
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
                          {field.kind === "portfolio-category" ? (
                            <select
                              name={field.key}
                              defaultValue={String(
                                valueFor(selected, field.key, field.kind),
                              )}
                              required={field.required}
                              onInvalid={() =>
                                setError(
                                  "Select a portfolio category before saving.",
                                )
                              }
                              onChange={() => setError("")}
                            >
                              <option value="">Select a category</option>
                              {portfolioCategories.map((item) => (
                                <option value={item.id} key={item.id}>
                                  {String(item.name)}
                                </option>
                              ))}
                            </select>
                          ) : field.kind === "service" ? (
                            <select
                              name={field.key}
                              defaultValue={String(
                                valueFor(selected, field.key, field.kind),
                              )}
                            >
                              <option value="">No related service</option>
                              {services.map((item) => (
                                <option value={item.id} key={item.id}>
                                  {String(item.name)}
                                </option>
                              ))}
                            </select>
                          ) : field.kind === "media-card" ? (
                            <div className="admin-media-picker">
                              <select
                                aria-label={field.label}
                                value={categoryMediaIds[field.key] ?? ""}
                                onChange={(event) =>
                                  setCategoryMediaIds(current=>({...current,[field.key]:event.target.value}))
                                }
                              >
                                <option value="">
                                  Use approved icon artwork
                                </option>
                                {media.map((item) => (
                                  <option value={item.id} key={item.id}>
                                    {String(
                                      item.title ?? item.altText ?? item.id,
                                    )}
                                  </option>
                                ))}
                              </select>
                              {categoryMediaIds[field.key] &&
                                (() => {
                                  const item = media.find(
                                    (row) => row.id === categoryMediaIds[field.key],
                                  );
                                  return item ? (
                                    <><Image src={String(item.secureUrl ?? item.url)} alt={String(item.altText ?? item.title)} width={180} height={120} unoptimized/><strong>{String(item.title??item.altText??"Selected image")}</strong></>
                                  ) : null;
                                })()}
                              {field.key==="bannerMediaId"&&categoryMediaIds[field.key]&&<button type="button" onClick={(event)=>{if(confirm("Remove the banner from this category? The Media Library asset will be preserved.")){setCategoryMediaIds(current=>({...current,bannerMediaId:""}));for(const name of ["bannerAltText","bannerCaption"]){const control=event.currentTarget.form?.elements.namedItem(name);if(control instanceof HTMLInputElement||control instanceof HTMLTextAreaElement)control.value=""}}}}>Remove Banner</button>}
                              <button
                                type="button"
                                className="admin-primary"
                                onClick={() => {setCategoryUploadField(field.key);setInlineUploadOpen((value) => categoryUploadField===field.key?!value:true)}}
                              >
                                {inlineUploadOpen
                                  ? "Cancel upload"
                                  : field.key==="bannerMediaId"?(categoryMediaIds[field.key]?"Replace Banner":"Upload Banner"):"Upload Image"}
                              </button>
                              {inlineUploadOpen && categoryUploadField===field.key && (
                                <div className="admin-inline-upload">
                                  <label>
                                    Choose category artwork
                                    <input
                                      type="file"
                                      accept="image/jpeg,image/png,image/webp,image/avif"
                                      onChange={(event) =>
                                        setInlineUploadFile(
                                          event.target.files?.[0] ?? null,
                                        )
                                      }
                                    />
                                  </label>
                                  <label>
                                    Alternative text
                                    <input
                                      value={inlineAlt}
                                      onChange={(event) =>
                                        setInlineAlt(event.target.value)
                                      }
                                      required
                                      maxLength={500}
                                    />
                                  </label>
                                  <label>
                                    Caption (optional)
                                    <textarea
                                      value={inlineCaption}
                                      onChange={(event) =>
                                        setInlineCaption(event.target.value)
                                      }
                                      maxLength={1000}
                                    />
                                  </label>
                                  <button
                                    type="button"
                                    className="admin-primary"
                                    disabled={uploading}
                                    onClick={() => void uploadPortfolioImage()}
                                  >
                                    {uploading
                                      ? "Uploading…"
                                      : "Upload and select artwork"}
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : field.kind === "category-gallery" ? (
                            <div className="admin-media-picker">
                              <div className="admin-media-picker-head"><div><strong>Gallery Images</strong><span>Upload or select images to build this category gallery.</span></div><label className="admin-primary">Add Gallery Images<input className="sr-only" type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif" disabled={uploading} onChange={(event)=>void uploadCategoryGalleryFiles(Array.from(event.target.files??[]))}/></label></div>
                              {categoryGalleryItems.length===0?<div className="admin-media-empty"><ImageIcon/><strong>No gallery images added yet</strong><span>Upload or select images to build this category gallery.</span></div>:<ol className="admin-selected-media" aria-label="Category gallery images">{categoryGalleryItems.map((entry,index)=>{const item=media.find(row=>row.id===entry.mediaId);return <li key={`${entry.mediaId}-${index}`}>{item&&<Image src={String(item.secureUrl??item.url)} alt={entry.altText||String(item.altText??item.title)} width={96} height={64} unoptimized/>}<span><strong>Gallery image {index+1}</strong><label>Alt text<input value={entry.altText} required onChange={event=>setCategoryGalleryItems(current=>current.map((value,position)=>position===index?{...value,altText:event.target.value}:value))}/></label><label>Caption (optional)<input value={entry.caption} onChange={event=>setCategoryGalleryItems(current=>current.map((value,position)=>position===index?{...value,caption:event.target.value}:value))}/></label><label>Replace Image<select aria-label={`Replace gallery image ${index+1}`} value={entry.mediaId} onChange={event=>setCategoryGalleryItems(current=>current.map((value,position)=>position===index?{...value,mediaId:event.target.value}:value))}>{media.map(asset=><option key={asset.id} value={asset.id}>{String(asset.title??asset.altText??asset.id)}</option>)}</select></label></span><div><button type="button" aria-label={`Move gallery image ${index+1} up`} disabled={index===0} onClick={()=>setCategoryGalleryItems(current=>{const next=[...current];[next[index-1],next[index]]=[next[index],next[index-1]];return next})}><ArrowUp/> Move Up</button><button type="button" aria-label={`Move gallery image ${index+1} down`} disabled={index===categoryGalleryItems.length-1} onClick={()=>setCategoryGalleryItems(current=>{const next=[...current];[next[index+1],next[index]]=[next[index],next[index+1]];return next})}><ArrowDown/> Move Down</button><button type="button" onClick={()=>{if(confirm("Remove this image from the category gallery? The Media Library asset will be preserved."))setCategoryGalleryItems(current=>current.filter((_,position)=>position!==index))}}>Remove from Gallery</button></div></li>})}</ol>}
                              {media.length>0&&<div className="admin-media-library" aria-label="Media Library gallery choices">{media.map(item=>{const added=categoryGalleryItems.some(entry=>entry.mediaId===item.id),url=String(item.secureUrl??item.url??"");return <article key={item.id}>{url?<Image src={url} alt={String(item.altText??item.title)} width={180} height={120} unoptimized/>:null}<strong>{String(item.title??item.altText)}</strong><button type="button" disabled={added} onClick={()=>setCategoryGalleryItems(current=>[...current,{mediaId:item.id,altText:String(item.altText??item.title??"Image"),caption:String(item.caption??"")}])}>{added?"Added":"Add to Gallery"}</button></article>})}</div>}
                            </div>
                          ) : field.kind === "media-multiple" ? (
                            <div className="admin-media-picker">
                              <div className="admin-media-picker-head">
                                <div>
                                  <strong>Project image library</strong>
                                  <span>
                                    The first selected image is the public
                                    cover. Add and reorder gallery images below.
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  className="admin-primary"
                                  onClick={() =>
                                    setInlineUploadOpen((value) => !value)
                                  }
                                >
                                  <Plus />
                                  {inlineUploadOpen
                                    ? "Cancel upload"
                                    : "Upload Image"}
                                </button>
                              </div>
                              {inlineUploadOpen && (
                                <div className="admin-inline-upload">
                                  <label>
                                    Choose project image
                                    <input
                                      type="file"
                                      accept="image/jpeg,image/png,image/webp,image/avif"
                                      required
                                      onChange={(event) =>
                                        setInlineUploadFile(
                                          event.target.files?.[0] ?? null,
                                        )
                                      }
                                    />
                                  </label>
                                  {inlineUploadFile && (
                                    <Image
                                      src={URL.createObjectURL(
                                        inlineUploadFile,
                                      )}
                                      alt="New project image preview"
                                      width={180}
                                      height={120}
                                      unoptimized
                                      onLoad={(event) =>
                                        URL.revokeObjectURL(
                                          event.currentTarget.src,
                                        )
                                      }
                                    />
                                  )}
                                  <label>
                                    Alternative text
                                    <input
                                      value={inlineAlt}
                                      onChange={(event) =>
                                        setInlineAlt(event.target.value)
                                      }
                                      required
                                      maxLength={500}
                                    />
                                  </label>
                                  <label>
                                    Caption (optional)
                                    <textarea
                                      value={inlineCaption}
                                      onChange={(event) =>
                                        setInlineCaption(event.target.value)
                                      }
                                      maxLength={1000}
                                    />
                                  </label>
                                  <button
                                    type="button"
                                    className="admin-primary"
                                    disabled={uploading}
                                    onClick={() => void uploadPortfolioImage()}
                                  >
                                    {uploading
                                      ? "Uploadingâ€¦"
                                      : "Upload and select image"}
                                  </button>
                                </div>
                              )}
                              {media.length === 0 ? (
                                <div className="admin-media-empty">
                                  <ImageIcon />
                                  <strong>No images uploaded yet</strong>
                                  <span>
                                    Upload the first image without leaving this
                                    project.
                                  </span>
                                  <button
                                    type="button"
                                    className="admin-primary"
                                    onClick={() => setInlineUploadOpen(true)}
                                  >
                                    Upload Image
                                  </button>
                                </div>
                              ) : (
                                <div
                                  className="admin-media-library"
                                  aria-label="Available project images"
                                >
                                  {media.map((item) => {
                                    const selectedIndex =
                                        selectedMediaIds.indexOf(item.id),
                                      isSelected = selectedIndex >= 0,
                                      url = String(
                                        item.secureUrl ?? item.url ?? "",
                                      );
                                    return (
                                      <article
                                        key={item.id}
                                        className={
                                          isSelected ? "is-selected" : ""
                                        }
                                      >
                                        {url && (
                                          <Image
                                            src={url}
                                            alt={String(
                                              item.altText ??
                                                item.title ??
                                                "Media preview",
                                            )}
                                            width={180}
                                            height={120}
                                            unoptimized
                                          />
                                        )}
                                        <strong>
                                          {String(
                                            item.title ?? "Untitled image",
                                          )}
                                        </strong>
                                        <span>
                                          {String(
                                            item.altText ??
                                              "No alternative text",
                                          )}
                                        </span>
                                        {isSelected ? (
                                          <button
                                            type="button"
                                            onClick={() => removeMedia(item.id)}
                                          >
                                            Remove from project
                                          </button>
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={() => selectMedia(item.id)}
                                          >
                                            Select image
                                          </button>
                                        )}
                                      </article>
                                    );
                                  })}
                                </div>
                              )}
                              {selectedMediaIds.length > 0 && (
                                <ol
                                  className="admin-selected-media"
                                  aria-label="Selected project images"
                                >
                                  {selectedMediaIds.map((id, index) => {
                                    const item = media.find(
                                      (row) => row.id === id,
                                    );
                                    if (!item) return null;
                                    return (
                                      <li key={id}>
                                        <Image
                                          src={String(
                                            item.secureUrl ?? item.url,
                                          )}
                                          alt={String(
                                            item.altText ?? item.title,
                                          )}
                                          width={96}
                                          height={64}
                                          unoptimized
                                        />
                                        <span>
                                          <strong>
                                            {index === 0
                                              ? "Cover image"
                                              : `Gallery image ${index}`}
                                          </strong>
                                          {String(item.title ?? item.altText)}
                                        </span>
                                        <div>
                                          <button
                                            type="button"
                                            disabled={index === 0}
                                            onClick={() => makeCover(id)}
                                          >
                                            Set as cover
                                          </button>
                                          <button
                                            type="button"
                                            aria-label={`Move ${String(item.title)} up`}
                                            disabled={index === 0}
                                            onClick={() => moveMedia(id, -1)}
                                          >
                                            <ArrowUp />
                                          </button>
                                          <button
                                            type="button"
                                            aria-label={`Move ${String(item.title)} down`}
                                            disabled={
                                              index ===
                                              selectedMediaIds.length - 1
                                            }
                                            onClick={() => moveMedia(id, 1)}
                                          >
                                            <ArrowDown />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => removeMedia(id)}
                                          >
                                            Remove
                                          </button>
                                        </div>
                                      </li>
                                    );
                                  })}
                                </ol>
                              )}
                            </div>
                          ) : field.kind === "media" ? (
                            <select
                              name={field.key}
                              defaultValue={String(
                                valueFor(selected, field.key, field.kind),
                              )}
                            >
                              <option value="">No media selected</option>
                              {media.map((item) => (
                                <option value={item.id} key={item.id}>
                                  {String(
                                    item.title ?? item.altText ?? item.id,
                                  )}
                                </option>
                              ))}
                            </select>
                          ) : field.kind === "icon" ? (
                            <>
                              <select
                                name={field.key}
                                defaultValue={String(
                                  valueFor(selected, field.key, field.kind),
                                )}
                              >
                                {approvedIconKeys.map((key) => (
                                  <option key={key}>{key}</option>
                                ))}
                              </select>
                              <span
                                className="admin-icon-preview"
                                aria-label="Approved icon preview"
                              >
                                {approvedIconKeys.map((key) => (
                                  <span title={key} key={key}>
                                    <ApprovedIcon iconKey={key} />
                                  </span>
                                ))}
                              </span>
                            </>
                          ) : field.kind === "textarea" ||
                            field.kind === "json" ? (
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
                              onBlur={(event) => {
                                if (!(
                                  (config.resource === "portfolio-categories" &&
                                    field.key === "name") ||
                                  (config.resource === "portfolio" &&
                                    field.key === "title")
                                ))
                                  return;
                                const slugInput =
                                  event.currentTarget.form?.elements.namedItem(
                                    "slug",
                                  );
                                if (
                                  slugInput instanceof HTMLInputElement &&
                                  !slugInput.value
                                )
                                  slugInput.value = availableSlug(
                                    event.currentTarget.value,
                                    rows,
                                    selected.id,
                                  );
                              }}
                            />
                          )}
                        </>
                      )}
                    </FieldContainer>
                  );
                })}
                <button className="admin-primary" type="submit">
                  <Save />
                  Save draft
                </button>
                {config.publishable && selected.id && (
                  <div
                    className="admin-publishing-actions"
                    aria-label="Publishing actions"
                  >
                    <button type="button" onClick={() => void preview()}>
                      <Eye /> Preview draft
                    </button>
                    <button
                      type="button"
                      className="admin-primary"
                      onClick={() => void publish()}
                    >
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
                {revisions.length > 0 && (
                  <ol
                    className="admin-revision-list"
                    aria-label="Publication history"
                  >
                    {revisions.map((item) => (
                      <li key={item.id}>
                        <strong>Version {item.version}</strong>
                        <span>
                          {item.publishedAt
                            ? new Date(item.publishedAt).toLocaleString()
                            : "Draft"}
                        </span>
                      </li>
                    ))}
                  </ol>
                )}
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

export function CmsManager({ module }: { module: string }) {
  return module === "portfolio-categories" ? (
    <PortfolioCategoryManager />
  ) : module === "testimonials" ? (
    <TestimonialManager />
  ) : module === "package-categories" ? (
    <PackageCategoryManager />
  ) : module === "packages" ? (
    <PackageManager />
  ) : module === "about-page" ? (
    <AboutPageManager />
  ) : module === "home-stats" ? (
    <HomeStatsManager />
  ) : (
    <GenericCmsManager module={module} />
  );
}
