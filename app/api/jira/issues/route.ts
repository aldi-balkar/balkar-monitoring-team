import { fetchIssues } from "@/lib/jira";

export async function GET() {
  try {
    return Response.json({ issues: await fetchIssues() });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Gagal mengambil data Jira" }, { status: 502 });
  }
}
