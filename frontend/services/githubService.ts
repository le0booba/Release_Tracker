import { ReleaseData } from '../types.ts';

async function fetchWithRetry(url: string, retries = 2, delay = 800): Promise<Response> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
        }
      });
      
      if (response.status === 429 || (response.status >= 500 && response.status < 600)) {
        if (attempt < retries - 1) {
          await new Promise(res => setTimeout(res, delay * Math.pow(2, attempt)));
          continue;
        }
      }
      return response;
    } catch (err) {
      if (attempt < retries - 1) {
        await new Promise(res => setTimeout(res, delay * Math.pow(2, attempt)));
        continue;
      }
      throw err;
    }
  }
  throw new Error('Network request failed');
}

async function fetchVersionFile(owner: string, repo: string): Promise<{ version: string; date: string | null } | null> {
  const branches = ['main', 'master'];
  for (const branch of branches) {
    try {
      // Get file content and metadata from GitHub API
      const apiUrl = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/VERSION?ref=${branch}`;
      const apiRes = await fetchWithRetry(apiUrl);
      
      if (apiRes.ok) {
        const fileData: any = await apiRes.json();
        
        // Get the last commit date for this file
        const commitsUrl = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits?path=VERSION&sha=${branch}&per_page=1`;
        const commitsRes = await fetchWithRetry(commitsUrl);
        
        let fileDate = null;
        if (commitsRes.ok) {
          const commits: any = await commitsRes.json();
          if (Array.isArray(commits) && commits.length > 0) {
            fileDate = commits[0].commit?.committer?.date 
              ? new Date(commits[0].commit.committer.date).toLocaleDateString()
              : null;
          }
        }
        
        // Try to get content from raw URL as fallback
        const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/VERSION`;
        const rawRes = await fetch(rawUrl);
        if (rawRes.ok) {
          const text = await rawRes.text();
          if (text && text.trim()) {
            return { version: text.trim(), date: fileDate };
          }
        }
      }
    } catch (e) {
      // Ignore and try next branch
    }
  }
  return null;
}

export async function fetchReleases(owner: string, repo: string): Promise<ReleaseData> {
  const cleanOwner = owner.trim();
  const cleanRepo = repo.trim();
  
  // Specific check for cwash797-cmd/Panel-Naive-Mieru-by-RIXXX or any repo requesting VERSION file
  if (cleanOwner.toLowerCase() === 'cwash797-cmd' && cleanRepo.toLowerCase() === 'panel-naive-mieru-by-rixxx') {
    const versionData = await fetchVersionFile(cleanOwner, cleanRepo);
    if (versionData) {
      return {
        stable: versionData.version,
        stableUrl: `https://github.com/${cleanOwner}/${cleanRepo}/blob/main/VERSION`,
        stableDate: versionData.date,
        prerelease: null,
        prereleaseUrl: null,
        isVersionFile: true,
      };
    }
  }

  const releasesUrl = `https://api.github.com/repos/${encodeURIComponent(cleanOwner)}/${encodeURIComponent(cleanRepo)}/releases`;
  
  try {
    const response = await fetchWithRetry(releasesUrl);

    if (response.ok) {
      const releases: any = await response.json();

      if (Array.isArray(releases) && releases.length > 0) {
        const stableRelease = releases.find((r: any) => !r.prerelease && !r.draft);
        const preRelease = releases.find((r: any) => r.prerelease && !r.draft);

        return {
          stable: stableRelease ? stableRelease.tag_name : null,
          stableUrl: stableRelease ? stableRelease.html_url : null,
          stableDate: stableRelease?.published_at ? new Date(stableRelease.published_at).toLocaleDateString() : null,
          prerelease: preRelease ? preRelease.tag_name : null,
          prereleaseUrl: preRelease ? preRelease.html_url : null,
          prereleaseDate: preRelease?.published_at ? new Date(preRelease.published_at).toLocaleDateString() : null,
          isTagFallback: false,
        };
      }
    } else if (response.status === 403) {
      const rateLimitRemaining = response.headers.get('x-ratelimit-remaining');
      if (rateLimitRemaining === '0') {
        throw new Error('GitHub API rate limit reached. Retry in a few minutes.');
      }
    }

    // Fallback 1: Try to fetch VERSION file for any repository if releases are empty
    const versionData = await fetchVersionFile(cleanOwner, cleanRepo);
    if (versionData) {
      return {
        stable: versionData.version,
        stableUrl: `https://github.com/${cleanOwner}/${cleanRepo}`,
        stableDate: versionData.date,
        prerelease: null,
        prereleaseUrl: null,
        isVersionFile: true,
      };
    }

    // Fallback 2: Fetch git tags if no GitHub Releases or VERSION file were found
    const tagsUrl = `https://api.github.com/repos/${encodeURIComponent(cleanOwner)}/${encodeURIComponent(cleanRepo)}/tags?per_page=5`;
    const tagsResponse = await fetchWithRetry(tagsUrl);

    if (tagsResponse.ok) {
      const tags: any = await tagsResponse.json();
      if (Array.isArray(tags) && tags.length > 0) {
        const latestTag = tags[0];
        return {
          stable: latestTag.name,
          stableUrl: `https://github.com/${cleanOwner}/${cleanRepo}/releases/tag/${encodeURIComponent(latestTag.name)}`,
          prerelease: null,
          prereleaseUrl: null,
          isTagFallback: true,
        };
      }
    }

    if (!response.ok && response.status === 404) {
      throw new Error('Repository not found or private.');
    }

    return {
      stable: null,
      prerelease: null,
      stableUrl: null,
      prereleaseUrl: null,
    };

  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch release info');
  }
}
