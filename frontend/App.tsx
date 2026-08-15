import React, { useState, useEffect, useCallback } from 'react';
import { parseGithubUrl } from './utils.ts';
import { fetchReleases } from './services/githubService.ts';
import { RepoState } from './types.ts';
import { RepoCard } from './components/RepoCard.tsx';
import { RefreshCw, CheckCircle2, AlertCircle, Layers, ExternalLink } from 'lucide-react';

const GithubIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
  </svg>
);

const DEFAULT_URLS = [
  "https://github.com/2dust/v2rayNG",
  "https://github.com/Liafanx/MTProxyLЭ",
  "https://github.com/sleep3r/mtproto.zig",
  "https://github.com/Mekotofeuka/MTPROTO_FIX_By_MEKO",
  "https://github.com/cwash797-cmd/Panel-Naive-Mieru-by-RIXXX",
  "https://github.com/teleproxy/teleproxy",
  "https://github.com/KaringX/karing",
  "https://github.com/amnezia-vpn/amnezia-client",
  "https://github.com/lhear/SimpleXray",
  "https://github.com/9seconds/mtg",
  "https://github.com/telemt/telemt",
  "https://github.com/MHSanaei/3x-ui"
];

export default function App() {
  const [repos, setRepos] = useState<RepoState[]>([]);
  const [isGlobalRefreshing, setIsGlobalRefreshing] = useState(false);

  useEffect(() => {
    const initialStates: RepoState[] = DEFAULT_URLS.map((url, idx) => {
      const info = parseGithubUrl(url);
      return {
        id: info ? `${info.owner}/${info.name}` : `invalid-${idx}`,
        info: info || { url, owner: 'Unknown', name: 'Invalid URL', originalUrl: url },
        data: null,
        loading: false,
        error: info ? null : 'Invalid GitHub URL format',
        lastFetched: null
      };
    });

    setRepos(initialStates);
  }, []);

  const fetchRepoData = useCallback(async (owner: string, name: string) => {
    setRepos(current => 
      current.map(repo => 
        (repo.info.owner === owner && repo.info.name === name) 
          ? { ...repo, loading: true, error: null } 
          : repo
      )
    );

    try {
      const data = await fetchReleases(owner, name);
      setRepos(current => 
        current.map(repo => 
          (repo.info.owner === owner && repo.info.name === name) 
            ? { ...repo, data, loading: false, lastFetched: new Date() } 
            : repo
        )
      );
    } catch (error: any) {
      setRepos(current => 
        current.map(repo => 
          (repo.info.owner === owner && repo.info.name === name) 
            ? { ...repo, error: error.message, loading: false, lastFetched: new Date() } 
            : repo
        )
      );
    }
  }, []);

  useEffect(() => {
    if (repos.length > 0 && repos.some(r => r.lastFetched === null && !r.loading && !r.error && r.info.owner !== 'Unknown')) {
      repos.forEach(repo => {
        if (repo.info.owner !== 'Unknown' && repo.lastFetched === null && !repo.loading) {
          fetchRepoData(repo.info.owner, repo.info.name);
        }
      });
    }
  }, [repos, fetchRepoData]);

  const handleRefreshAll = async () => {
    setIsGlobalRefreshing(true);
    const promises = repos
      .filter(repo => repo.info.owner !== 'Unknown')
      .map(repo => fetchRepoData(repo.info.owner, repo.info.name));
    
    await Promise.allSettled(promises);
    setIsGlobalRefreshing(false);
  };

  const stats = {
    total: repos.length,
    loaded: repos.filter(r => r.data !== null && !r.error).length,
    errors: repos.filter(r => r.error !== null).length
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-3 sm:p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <GithubIcon className="w-8 h-8 text-blue-400 shrink-0" />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                GitHub Release Tracker
              </h1>
              <p className="text-gray-400 text-xs sm:text-sm mt-0.5">
                Real-time monitoring for latest stable releases and pre-releases
              </p>
            </div>
          </div>
          
          <button
            onClick={handleRefreshAll}
            disabled={isGlobalRefreshing}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 shadow-md hover:shadow-blue-600/20 w-full sm:w-auto"
          >
            <RefreshCw className={`w-4 h-4 ${isGlobalRefreshing ? 'animate-spin' : ''}`} />
            Refresh All
          </button>
        </header>

        <div className="flex items-center gap-4 sm:gap-6 px-3.5 py-2.5 bg-gray-900/60 border border-gray-800/80 rounded-xl text-xs sm:text-sm text-gray-400 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-1.5 shrink-0">
            <Layers className="w-4 h-4 text-gray-400" />
            <span>Total: <strong className="text-gray-200">{repos.length}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Fetched: <strong className="text-emerald-400">{repos.filter(r => r.data !== null && !r.error).length}</strong></span>
          </div>
          {repos.filter(r => r.error !== null).length > 0 && (
            <div className="flex items-center gap-1.5 shrink-0">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span>Errors: <strong className="text-red-400">{repos.filter(r => r.error !== null).length}</strong></span>
            </div>
          )}
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-xl overflow-hidden">
          <div className="px-4 py-3 sm:px-5 sm:py-4 border-b border-gray-800 bg-gray-900/50">
            <h2 className="text-xs sm:text-sm font-semibold text-gray-200 uppercase tracking-wider">Compact Summary Table</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[500px] sm:min-w-0">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-950/50 text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <th className="px-4 py-2.5 sm:px-5 sm:py-3">Repository</th>
                  <th className="px-4 py-2.5 sm:px-5 sm:py-3">Stable Version</th>
                  <th className="px-4 py-2.5 sm:px-5 sm:py-3">Pre-release</th>
                  <th className="px-4 py-2.5 sm:px-5 sm:py-3 hidden sm:table-cell">Status</th>
                  <th className="px-4 py-2.5 sm:px-5 sm:py-3 text-right hidden md:table-cell">Last Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50 text-xs sm:text-sm">
                {repos.map((repo) => (
                  <tr key={repo.id} className="hover:bg-gray-850/20 transition-colors">
                    <td className="px-4 py-2.5 sm:px-5 sm:py-3 font-medium max-w-[180px] sm:max-w-none truncate">
                      <a 
                        href={repo.info.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 flex items-center gap-1.5"
                      >
                        <span className="truncate">{repo.info.owner} / <span className="text-gray-200">{repo.info.name}</span></span>
                        <ExternalLink className="w-3 h-3 opacity-50 shrink-0" />
                      </a>
                    </td>
                    <td className="px-4 py-2.5 sm:px-5 sm:py-3">
                      {repo.loading ? (
                        <span className="text-xs text-gray-500 animate-pulse">Loading...</span>
                      ) : repo.data?.stable ? (
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[11px] sm:text-xs font-mono font-semibold truncate max-w-[100px] sm:max-w-none">
                            {repo.data.stable}
                          </span>
                          {repo.data.isVersionFile && (
                            <span className="text-[9px] bg-blue-950 text-blue-400 px-1 py-0.5 rounded border border-blue-900 shrink-0">
                              VERSION
                            </span>
                          )}
                          {repo.data.isTagFallback && !repo.data.isVersionFile && (
                            <span className="text-[9px] bg-gray-800 text-gray-400 px-1 py-0.5 rounded border border-gray-700 shrink-0">
                              Tag
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-600 italic">None</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 sm:px-5 sm:py-3">
                      {repo.loading ? (
                        <span className="text-xs text-gray-500 animate-pulse">Loading...</span>
                      ) : repo.data?.prerelease ? (
                        <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded text-[11px] sm:text-xs font-mono font-semibold truncate max-w-[100px] sm:max-w-none">
                          {repo.data.prerelease}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-600 italic">None</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 sm:px-5 sm:py-3 hidden sm:table-cell">
                      {repo.loading ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          Fetching
                        </span>
                      ) : repo.error ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-red-500/10 text-red-400 border border-red-500/20" title={repo.error}>
                          Error
                        </span>
                      ) : repo.data ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Success
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-gray-800 text-gray-400 border border-gray-700">
                          Idle
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 sm:px-5 sm:py-3 text-right text-[11px] text-gray-500 font-mono hidden md:table-cell">
                      {repo.lastFetched ? repo.lastFetched.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {repos.map((repo) => (
            <RepoCard 
              key={repo.id} 
              repo={repo} 
              onRefresh={fetchRepoData}
            />
          ))}
        </div>

        <footer className="pt-6 border-t border-gray-900 text-center text-[10px] sm:text-xs text-gray-500 space-y-1">
          <p>Version data retrieved directly via GitHub REST API with tag fallback and VERSION file support.</p>
        </footer>

      </div>
    </div>
  );
}
