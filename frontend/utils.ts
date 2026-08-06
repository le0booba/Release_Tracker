import { RepoInfo } from './types.ts';

// Parses GitHub repository URLs and strips extraneous invalid trailing characters
export function parseGithubUrl(url: string): RepoInfo | null {
  try {
    const cleanUrl = url.trim();
    const match = cleanUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/i);
    if (match) {
      const owner = decodeURIComponent(match[1]).replace(/[^a-zA-Z0-9_\-\.]/g, '');
      // Remove trailing non-alphanumeric/dot/dash/underscore characters often caused by keyboard typos
      const name = decodeURIComponent(match[2]).replace(/[^a-zA-Z0-9_\-\.].*$/, '');

      if (!owner || !name) return null;

      return {
        originalUrl: cleanUrl,
        url: `https://github.com/${owner}/${name}`,
        owner,
        name,
      };
    }
    return null;
  } catch (e) {
    return null;
  }
}
