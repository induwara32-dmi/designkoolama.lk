"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { adminApi } from "@/lib/admin-api";

type RecentQuote = { id: string; serviceRequired: string; status: string; createdAt: string };
type RecentContact = { id: string; subject: string; status: string; createdAt: string };
type DashboardData = { counts: Record<string, number>; recentQuotes: RecentQuote[]; recentContacts: RecentContact[] };
type RecentItem = { id: string; label: string; status: string; createdAt: string };

export function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    adminApi
      .dashboard()
      .then((value) => setData(value as DashboardData))
      .catch((e) => setError(e instanceof Error ? e.message : "Unable to load dashboard"));
  }, []);
  if (error) return <p className="admin-error" role="alert">{error}</p>;
  if (!data) return <p role="status">Loading dashboard…</p>;
  return (
    <>
      <div className="admin-page-head">
        <p>Workspace overview</p>
        <h1>Dashboard</h1>
      </div>
      <div className="admin-stats">
        {Object.entries(data.counts).map(([key, value]) => (
          <article key={key}>
            <span>{key.replace(/([A-Z])/g, " $1")}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </div>
      <div className="admin-panels">
        <Recent
          title="Recent quote requests"
          basePath="/admin/quotes"
          items={data.recentQuotes.map((item) => ({ id: item.id, label: item.serviceRequired, status: item.status, createdAt: item.createdAt }))}
        />
        <Recent
          title="Recent contact requests"
          basePath="/admin/messages"
          items={data.recentContacts.map((item) => ({ id: item.id, label: item.subject, status: item.status, createdAt: item.createdAt }))}
        />
      </div>
    </>
  );
}

function Recent({ title, basePath, items }: { title: string; basePath: string; items: RecentItem[] }) {
  return (
    <section className="admin-panel">
      <h2>{title}</h2>
      {items.length ? (
        <ul>
          {items.map((item) => {
            const isNew = item.status === "NEW";
            return (
              <li key={item.id}>
                <div className="admin-recent-info">
                  <strong>{item.label}</strong>
                  <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                </div>
                <Link
                  href={`${basePath}?highlight=${item.id}`}
                  className={isNew ? "admin-badge-new" : "admin-badge-viewed"}
                >
                  {isNew ? "View" : item.status.charAt(0) + item.status.slice(1).toLowerCase().replace("_", " ")}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="admin-hint">No recent submissions.</p>
      )}
    </section>
  );
}
