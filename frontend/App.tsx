import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { parseGithubUrl } from './utils.ts';
import { fetchReleases } from './services/githubService.ts';
import { RepoState } from './types.ts';
import { RepoCard } from './components/RepoCard.tsx';
import { RefreshCw, Plus, Search, CheckCircle2, AlertCircle, Layers } from 'lucide-react';

const GithubIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
  </svg>
);

// All requested repositories from both prompts
const DEFAULT_URLS = [
  "https://github.com/2dust/v2rayNG",
  "https://github.com/Liafanx/MTProxyLЭ", // Automatically cleaned to MTProxyL
  "https://github.com/sleep3r/mtproto.zig",
  "https://github.com/Mekotofeuka/MTPROTO_FIX_By_MEKO",
  "https://github.com/cwash797-cmd/Panel-Naive-Mieru-by-RIXXX",
  "https://github.com/teleproxy/teleproxy",
  "https://github.com/KaringX/karing",
  "https://github.com/amnezia-vpn/amnezia-client",
  "https://github.com/lhear/SimpleXray",
  "https://github.com/9seconds/mtg",
  "https://github.com/telemt/telemt"
];

const LOCAL_STORAGE_KEY = 'tracked_github_repo_urls';

export default function App() {
  const [repos, setRepos] = useState<RepoState[]>([]);
  const [newUrlInput, setNewUrlInput] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isGlobalRefreshing, setIsGlobalRefreshing] = useState(false);

  // Load repository list from localStorage or fallback to default list
  useEffect(() => {
    let savedUrls: string[] = DEFAULT_URLS;
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          savedUrls = parsed;
        }
      }
    } catch (e) {
      console.error("Error reading localStorage", e);
    }

    const initialStates: RepoState[] = savedUrls.map((url, idx) => {
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

  // Save current URLs to localStorage
  const persistRepos = (currentRepos: RepoState[]) => {
    const urlsToSave = currentRepos.map(r => r.info.originalUrl);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(urlsToSave));
    } catch (e) {
      console.error("Error saving to localStorage", e);
    }
  };

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

  // Initial fetch on mount
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

  const handleAddRepo = (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);

    if (!newUrlInput.trim()) return;

    const info = parseGithubUrl(newUrlInput);
    if (!info) {
      setAddError('Please enter a valid GitHub repository link (e.g., https://github.com/owner/repo)');
      return;
    }

    const id = `${info.owner}/${info.name}`;
    if (repos.some(r => r.id === id)) {
      setAddError('This repository is already in your tracking list.');
      return;
    }

    const newRepoState: RepoState = {
      id,
      info,
      data: null,
      loading: false,
      error: null,
      lastFetched: null
    };

    const updatedRepos = [newRepoState, ...repos];
    setRepos(updatedRepos);
    persistRepos(updatedRepos);
    setNewUrlInput('');
    fetchRepoData(info.owner, info.name);
  };

  const handleRemoveRepo = (id: string) => {
    const updatedRepos = repos.filter(r => r.id !== id);
    setRepos(updatedRepos);
    persistRepos(updatedRepos);
  };

  const filteredRepos = useMemo(() => {
    if (!searchQuery.trim()) return repos;
    const query = searchQuery.toLowerCase();
    return repos.filter(r => 
      r.info.owner.toLowerCase().includes(query) || 
      r.info.name.toLowerCase().includes(query)
    );
  }, [repos, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = repos.length;
    const loaded = repos.filter(r => r.data !== null && !r.error).length;
    const errors = repos.filter(r => r.error !== null).length;
    return { total, loaded, errors };
  }, [repos]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 sm:p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-gray-800">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3 text-white">
              <GithubIcon className="w-8 h-8 text-blue-400" />
              GitHub Release Tracker
            </h1>
            <p className="text-gray-400 mt-1 text-sm sm:text-base">
              Real-time monitoring for latest stable releases and pre-releases
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefreshAll}
              disabled={isGlobalRefreshing}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 shadow-md hover:shadow-blue-600/20"
            >
              <RefreshCw className={`w-4 h-4 ${isGlobalRefreshing ? 'animate-spin' : ''}`} />
              Refresh All
            </button>
          </div>
        </header>

        {/* Add Repository & Filter Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Add Repository Input Form */}
          <form onSubmit={handleAddRepo} className="lg:col-span-2">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-grow">
                <input
                  type="text"
                  placeholder="Paste GitHub URL (e.g. https://github.com/owner/repository)"
                  value={newUrlInput}
                  onChange={(e) => {
                    setNewUrlInput(e.target.value);
                    if (addError) setAddError(null);
                  }}
                  className="w-full bg-gray-900 border border-gray-800 focus:border-blue-500 text-gray-100 placeholder-gray-500 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                />
              </div>
              <button
                type="submit"
                className="flex items-center justify-center gap-1.5 px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-lg text-sm transition-colors shrink-0 border border-gray-700"
              >
                <Plus className="w-4 h-4" />
                Add Repo
              </button>
            </div>
            {addError && (
              <p className="text-red-400 text-xs mt-2 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {addError}
              </p>
            )}
          </form>

          {/* Search Filter */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-500" />
            <input
              type="text"
              placeholder="Search repositories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-900 border border-gray-800 focus:border-gray-700 text-gray-100 placeholder-gray-500 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Status Dashboard Summary Bar */}
        <div className="flex items-center gap-6 px-4 py-3 bg-gray-900/60 border border-gray-800/80 rounded-xl text-xs sm:text-sm text-gray-400 overflow-x-auto">
          <div className="flex items-center gap-2 shrink-0">
            <Layers className="w-4 h-4 text-gray-400" />
            <span>Total Tracked: <strong className="text-gray-200">{stats.total}</strong></span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Successfully Fetched: <strong className="text-emerald-400">{stats.loaded}</strong></span>
          </div>
          {stats.errors > 0 && (
            <div className="flex items-center gap-2 shrink-0">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span>Errors: <strong className="text-red-400">{stats.errors}</strong></span>
            </div>
          )}
        </div>

        {/* Repositories Cards Grid */}
        {filteredRepos.length === 0 ? (
          <div className="text-center py-16 bg-gray-900/40 rounded-xl border border-gray-800">
            <p className="text-gray-400 font-medium">No repositories found matching your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredRepos.map((repo) => (
              <RepoCard 
                key={repo.id} 
                repo={repo} 
                onRefresh={fetchRepoData}
                onRemove={handleRemoveRepo}
              />
            ))}
          </div>
        )}

        {/* Footer info */}
        <footer className="pt-8 border-t border-gray-900 text-center text-xs text-gray-500 space-y-1">
          <p>Version data retrieved directly via GitHub REST API with tag fallback support.</p>
        </footer>

      </div>
    </div>
  );
}
