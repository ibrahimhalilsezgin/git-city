import { CommitInfo, RepoMetadata } from './types';
import { DEMO_REPOS } from './mockData';

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('git_city_pat');
}

export function setStoredToken(token: string) {
  if (typeof window === 'undefined') return;
  if (!token) {
    localStorage.removeItem('git_city_pat');
  } else {
    localStorage.setItem('git_city_pat', token.trim());
  }
}

function getHeaders(token?: string): HeadersInit {
  const headers: HeadersInit = {
    Accept: 'application/vnd.github+json',
  };
  const activeToken = token || getStoredToken();
  if (activeToken) {
    headers.Authorization = `Bearer ${activeToken}`;
  }
  return headers;
}

export async function fetchRepoMetadata(
  owner: string,
  repo: string,
  token?: string
): Promise<RepoMetadata> {
  const key = `${owner.toLowerCase()}/${repo.toLowerCase()}`;
  if (DEMO_REPOS[key]) {
    return DEMO_REPOS[key].metadata;
  }

  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: getHeaders(token),
  });

  if (res.status === 403 || res.status === 429) {
    throw new Error('RATE_LIMIT');
  }

  if (!res.ok) {
    throw new Error(`Repo not found: ${res.statusText}`);
  }

  const data = await res.json();
  return {
    owner: data.owner.login,
    repo: data.name,
    description: data.description || 'No description available',
    stars: data.stargazers_count,
    forks: data.forks_count,
    defaultBranch: data.default_branch,
    language: data.language || 'Code',
  };
}

export async function fetchRepoCommits(
  owner: string,
  repo: string,
  limit = 25,
  token?: string
): Promise<CommitInfo[]> {
  const key = `${owner.toLowerCase()}/${repo.toLowerCase()}`;
  if (DEMO_REPOS[key]) {
    return DEMO_REPOS[key].commits.slice(0, limit);
  }

  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/commits?per_page=${limit}`,
    {
      headers: getHeaders(token),
    }
  );

  if (res.status === 403 || res.status === 429) {
    throw new Error('RATE_LIMIT');
  }

  if (!res.ok) {
    throw new Error(`Failed to fetch commits: ${res.statusText}`);
  }

  const commitsData = await res.json();

  // GitHub /commits list doesn't include detailed files array per commit.
  // Fetch detailed commit files concurrently (capped batch)
  const detailedCommits: CommitInfo[] = await Promise.all(
    commitsData.map(async (c: any) => {
      try {
        const detailRes = await fetch(c.url, { headers: getHeaders(token) });
        if (detailRes.ok) {
          const detailData = await detailRes.json();
          return {
            sha: c.sha,
            shortSha: c.sha.substring(0, 7),
            author: {
              name: c.commit.author.name || 'Developer',
              avatarUrl: c.author?.avatar_url,
            },
            date: c.commit.author.date,
            message: c.commit.message.split('\n')[0],
            filesChanged: (detailData.files || []).map((f: any) => ({
              filename: f.filename,
              status: f.status as any,
              additions: f.additions || 0,
              deletions: f.deletions || 0,
              changes: f.changes || (f.additions || 0) + (f.deletions || 0),
            })),
          };
        }
      } catch {
        // fallback
      }

      return {
        sha: c.sha,
        shortSha: c.sha.substring(0, 7),
        author: {
          name: c.commit.author.name || 'Developer',
          avatarUrl: c.author?.avatar_url,
        },
        date: c.commit.author.date,
        message: c.commit.message.split('\n')[0],
        filesChanged: [],
      };
    })
  );

  return detailedCommits.reverse(); // chronological order (oldest to newest)
}
