import "server-only";

export type JiraIssue = {
  key: string;
  summary: string;
  status: string;
  statusCategory: string;
  assignee: string | null;
  assigneeId: string | null;
  updated: string;
  created: string;
  resolved: string | null;
  url: string;
};

type RawIssue = {
  key: string;
  fields: {
    summary: string;
    status: { name: string; statusCategory: { key: string } };
    assignee: { displayName: string; accountId: string } | null;
    updated: string;
    created: string;
    resolutiondate: string | null;
  };
};

function config() {
  const baseUrl = process.env.JIRA_BASE_URL?.replace(/\/+$/, "");
  const email = process.env.JIRA_EMAIL;
  const token = process.env.JIRA_API_TOKEN;
  if (!baseUrl || !email || !token) throw new Error("JIRA_BASE_URL, JIRA_EMAIL, dan JIRA_API_TOKEN belum diisi di .env.local");
  const auth = "Basic " + Buffer.from(`${email}:${token}`).toString("base64");
  return { baseUrl, auth };
}

export async function fetchIssues(): Promise<JiraIssue[]> {
  const { baseUrl, auth } = config();
  const jql = process.env.JIRA_JQL || "statusCategory != Done ORDER BY updated DESC";
  const res = await fetch(`${baseUrl}/rest/api/3/search/jql`, {
    method: "POST",
    headers: { Authorization: auth, Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ jql, maxResults: 100, fields: ["summary", "status", "assignee", "updated", "created", "resolutiondate"] }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Jira ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = (await res.json()) as { issues: RawIssue[] };
  return data.issues.map((i) => ({
    key: i.key,
    summary: i.fields.summary,
    status: i.fields.status.name,
    statusCategory: i.fields.status.statusCategory.key,
    assignee: i.fields.assignee?.displayName ?? null,
    assigneeId: i.fields.assignee?.accountId ?? null,
    updated: i.fields.updated,
    created: i.fields.created,
    resolved: i.fields.resolutiondate,
    url: `${baseUrl}/browse/${i.key}`,
  }));
}
