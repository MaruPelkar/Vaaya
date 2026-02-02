'use client';

import { Tab3Data } from '@/lib/types';
import { SignalBadge } from './signal-badge';

interface Tab3UsersProps {
  data: Tab3Data;
}

export function Tab3Users({ data }: Tab3UsersProps) {
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-purple-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-700">{data.users?.length || 0}</div>
          <div className="text-sm text-purple-600">Users Found</div>
        </div>
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-700">{data.companies_using?.length || 0}</div>
          <div className="text-sm text-blue-600">Companies</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-700">{data.total_signals_found || 0}</div>
          <div className="text-sm text-green-600">Signals</div>
        </div>
      </div>

      {/* Users List */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Discovered Users</h3>
        {data.users?.length > 0 ? (
          <div className="space-y-4">
            {data.users.map((user) => (
              <div key={user.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-semibold text-lg">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{user.name}</div>
                      {user.title && <div className="text-sm text-gray-600">{user.title}</div>}
                      {user.company && <div className="text-sm text-gray-500">{user.company}</div>}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Confidence</div>
                    <div className={`text-lg font-bold ${
                      user.confidence_score > 0.8 ? 'text-green-600' :
                      user.confidence_score > 0.6 ? 'text-yellow-600' :
                      'text-gray-600'
                    }`}>
                      {Math.round(user.confidence_score * 100)}%
                    </div>
                  </div>
                </div>

                {/* Signals */}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="text-xs text-gray-500 mb-2">Signals:</div>
                  <div className="flex flex-wrap gap-2">
                    {user.signals.map((signal, i) => (
                      <SignalBadge key={i} signal={signal} />
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-3 flex gap-2">
                  {user.linkedin_url && (
                    <a
                      href={user.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200"
                    >
                      LinkedIn
                    </a>
                  )}
                  {user.email && (
                    <a
                      href={`mailto:${user.email}`}
                      className="text-sm px-3 py-1 bg-green-100 text-green-700 rounded-full hover:bg-green-200"
                    >
                      Email
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400">No users discovered yet</p>
        )}
      </div>

      {/* Companies Using */}
      {data.companies_using?.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Companies Using This Product</h3>
          <div className="flex flex-wrap gap-2">
            {data.companies_using.map((company, i) => (
              <span key={i} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                {company}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
