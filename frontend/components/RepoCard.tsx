import React from 'react';
import { AlertCircle, Clock, ExternalLink, Tag, RefreshCw, Calendar } from 'lucide-react';
import { RepoState } from '../types.ts';

const GithubIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
  </svg>
);

interface RepoCardProps {
  repo: RepoState;
  onRefresh: (owner: string, name: string) => void;
}

export const RepoCard: React.FC<RepoCardProps> = ({ repo, onRefresh }) => {
  const { id, info, data, loading, error, lastFetched } = repo;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow-lg hover:border-gray-700 transition-colors duration-200 group">
      <div>
        <div className="flex justify-between items-start mb-3 sm:mb-4 gap-2">
          <div className="flex items-center space-x-2.5 min-w-0 pr-1">
            <div className="p-2 bg-gray-800 rounded-lg shrink-0">
              <GithubIcon className="w-5 h-5 text-gray-300" />
            </div>
            <div className="min-w-0">
              <a 
                href={info.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm sm:text-base font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
                title={info.originalUrl}
              >
                <span className="truncate block">
                  {info.owner} / <span className="text-gray-100">{info.name}</span>
                </span>
                <ExternalLink className="w-3.5 h-3.5 opacity-50 shrink-0" />
              </a>
            </div>
          </div>

          <div className="flex items-center space-x-1 shrink-0">
            <button 
              onClick={() => onRefresh(info.owner, info.name)}
              disabled={loading}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition-colors disabled:opacity-50 min-w-[36px] min-h-[36px] flex items-center justify-center"
              title="Refresh repository"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="py-1">
          {loading && !data && !error ? (
            <div className="flex flex-col space-y-2.5 animate-pulse">
              <div className="h-10 bg-gray-800 rounded-md w-full"></div>
              <div className="h-10 bg-gray-800 rounded-md w-full"></div>
            </div>
          ) : error ? (
            <div className="flex items-start space-x-2 text-red-400 bg-red-400/10 p-3 rounded-md border border-red-400/20 text-xs sm:text-sm">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="break-words">{error}</span>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2.5 sm:p-3 bg-gray-850 rounded-lg border border-gray-800/60 gap-2">
                <div className="flex items-center space-x-1.5 text-gray-300 min-w-0">
                  <Tag className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-xs sm:text-sm font-medium">Stable</span>
                  {data?.isVersionFile && (
                    <span className="text-[9px] sm:text-[10px] bg-blue-950 text-blue-400 px-1.5 py-0.5 rounded border border-blue-900 shrink-0" title="Version fetched from VERSION file in the repository">
                      VERSION
                    </span>
                  )}
                  {data?.isTagFallback && !data?.isVersionFile && (
                    <span className="text-[9px] sm:text-[10px] bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded border border-gray-700 shrink-0" title="No formal GitHub Release; showing latest git tag">
                      Tag
                    </span>
                  )}
                </div>
                {data?.stable ? (
                  <div className="flex items-center space-x-1.5 min-w-0">
                    {data.stableDate && (
                      <div className="flex items-center space-x-1 shrink-0">
                        <Calendar className="w-3 h-3 text-gray-500" />
                        <span className="text-[10px] sm:text-xs text-gray-500 truncate">
                          {data.stableDate}
                        </span>
                      </div>
                    )}
                    <a 
                      href={data.stableUrl || info.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-xs sm:text-sm font-mono font-semibold hover:bg-emerald-500/20 transition-colors truncate max-w-[120px] sm:max-w-[180px]"
                    >
                      {data.stable}
                    </a>
                  </div>
                ) : (
                  <span className="text-xs text-gray-500 italic">None</span>
                )}
              </div>

              <div className="flex items-center justify-between p-2.5 sm:p-3 bg-gray-850 rounded-lg border border-gray-800/60 gap-2">
                <div className="flex items-center space-x-1.5 text-gray-300 min-w-0">
                  <Tag className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="text-xs sm:text-sm font-medium">Pre-release</span>
                </div>
                {data?.prerelease ? (
                  <div className="flex items-center space-x-1.5 min-w-0">
                    {data.prereleaseDate && (
                      <div className="flex items-center space-x-1 shrink-0">
                        <Calendar className="w-3 h-3 text-gray-500" />
                        <span className="text-[10px] sm:text-xs text-gray-500 truncate">
                          {data.prereleaseDate}
                        </span>
                      </div>
                    )}
                    <a 
                      href={data.prereleaseUrl || info.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded text-xs sm:text-sm font-mono font-semibold hover:bg-amber-500/20 transition-colors truncate max-w-[120px] sm:max-w-[180px]"
                    >
                      {data.prerelease}
                    </a>
                  </div>
                ) : (
                  <span className="text-xs text-gray-500 italic">None</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-gray-800/80 flex items-center justify-between text-[11px] sm:text-xs text-gray-500">
        <div className="flex items-center">
          <Clock className="w-3.5 h-3.5 mr-1" />
          {lastFetched ? (
            <span>Updated {lastFetched.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          ) : (
            <span>Not updated</span>
          )}
        </div>
      </div>
    </div>
  );
};
