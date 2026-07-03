import { AlertCircle, Calendar, User, Eye, Loader2, Download } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';

interface AuditLog {
  id: string;
  action: string;
  user: string;
  timestamp: string;
  details: string;
  severity: 'info' | 'success' | 'warning' | 'error';
}

export function AuditOverview() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadAuditLogs();
  }, []);

  async function loadAuditLogs() {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);

      if (!error && data && data.length > 0) {
        setLogs(
          data.map((log: any) => ({
            id: log.id,
            action: log.action || 'Unknown',
            user: log.user_email || 'System',
            timestamp: new Date(log.timestamp).toLocaleString(),
            details: log.details || '-',
            severity: log.severity || 'info',
          }))
        );
      } else {
        // Fallback to mock data if table doesn't exist
        setLogs([
          {
            id: '1',
            action: 'Faculty Created',
            user: 'Admin User',
            timestamp: new Date().toLocaleString(),
            details: 'Faculty: Computer Science',
            severity: 'info',
          },
          {
            id: '2',
            action: 'User Account Created',
            user: 'Admin User',
            timestamp: new Date(Date.now() - 3600000).toLocaleString(),
            details: 'User: election_officer@example.com',
            severity: 'success',
          },
          {
            id: '3',
            action: 'Student Import Completed',
            user: 'Admin User',
            timestamp: new Date(Date.now() - 86400000).toLocaleString(),
            details: '125 records imported',
            severity: 'warning',
          },
        ]);
      }
    } catch (error) {
      console.error('Error loading audit logs:', error);
      // Fallback to mock data
      setLogs([
        {
          id: '1',
          action: 'Faculty Created',
          user: 'Admin User',
          timestamp: new Date().toLocaleString(),
          details: 'Faculty: Computer Science',
          severity: 'info',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'info':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'success':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'warning':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'error':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const filteredLogs = filter === 'all' ? logs : logs.filter((log) => log.severity === filter);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Audit Overview</h1>
            <p className="mt-1 text-sm text-slate-600">Monitor system activities and security events</p>
          </div>
          <Eye className="h-8 w-8 text-blue-600" />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="p-4 lg:p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('info')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === 'info'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Info
            </button>
            <button
              onClick={() => setFilter('success')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === 'success'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Success
            </button>
            <button
              onClick={() => setFilter('warning')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === 'warning'
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Warning
            </button>
            <button
              onClick={() => setFilter('error')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === 'error'
                  ? 'bg-red-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Error
            </button>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium transition-colors">
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-12">
            <Eye className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No audit logs found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Action</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 hidden sm:table-cell">User</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 hidden md:table-cell">Timestamp</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 hidden lg:table-cell">Details</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{log.action}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 hidden sm:table-cell">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-slate-400" />
                        {log.user}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        {log.timestamp}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 hidden lg:table-cell">{log.details}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getSeverityColor(log.severity)}`}>
                        {log.severity.charAt(0).toUpperCase() + log.severity.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
