import { useEffect, useState } from 'react';
import { Vote, Calendar, CheckCircle2, ArrowRight, Trophy, Bell, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getElectionPositions, getStudentElections } from '../services/election';
import type { Election, ElectionPosition } from '../types';

export function StudentDashboard() {
  const { user, logout } = useAuth();
  const [elections, setElections] = useState<Election[]>([]);
  const [selectedElectionId, setSelectedElectionId] = useState<string | null>(null);
  const [positions, setPositions] = useState<ElectionPosition[]>([]);
  const [loadingElections, setLoadingElections] = useState(false);
  const [loadingPositions, setLoadingPositions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedElection = elections.find((election) => election.id === selectedElectionId);

  useEffect(() => {
    async function loadElections() {
      setLoadingElections(true);
      setError(null);

      try {
        const visibleElections = await getStudentElections();
        setElections(visibleElections);
        setSelectedElectionId((prev) => prev || visibleElections[0]?.id || null);
      } catch (err) {
        setError('Unable to load elections. Please refresh the page.');
      } finally {
        setLoadingElections(false);
      }
    }

    loadElections();
  }, []);

  useEffect(() => {
    async function loadPositions() {
      if (!selectedElectionId) {
        setPositions([]);
        return;
      }

      setLoadingPositions(true);
      setError(null);

      try {
        const electionPositions = await getElectionPositions(selectedElectionId);
        setPositions(electionPositions);
      } catch (err) {
        setError('Unable to load slot positions for the selected election.');
      } finally {
        setLoadingPositions(false);
      }
    }

    loadPositions();
  }, [selectedElectionId]);

  const getScopeLabel = (election: Election) => {
    if (election.category === 'university') return 'General election';
    if (election.category === 'faculty') return 'Faculty-level election';
    return 'Department-level election';
  };

  const formatDate = (dateString?: string) =>
    dateString ? new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD';

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-md">
                <Vote className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-bold text-gray-900">HTU E-VOTING SYSTEM Student Portal</p>
                <p className="text-sm text-gray-500">Welcome, {user?.full_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="relative p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                <Bell className="w-6 h-6" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <button
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Student Dashboard</h1>
          <p className="text-gray-600">View upcoming elections and cast your vote</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">Verified</p>
                <p className="text-sm text-gray-500">Account Status</p>
              </div>
            </div>
            <p className="text-sm text-gray-600">Your account is fully verified and ready to vote.</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">3</p>
                <p className="text-sm text-gray-500">Upcoming Elections</p>
              </div>
            </div>
            <p className="text-sm text-gray-600">You have 3 elections scheduled for the coming weeks.</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Trophy className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">1</p>
                <p className="text-sm text-gray-500">Votes Cast</p>
              </div>
            </div>
            <p className="text-sm text-gray-600">You have participated in 1 previous election.</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Available Elections</h2>
                <p className="text-gray-600">Elections you are eligible to vote in.</p>
              </div>
              <div className="w-full sm:w-80">
                <select
                  value={selectedElectionId ?? ""}
                  onChange={(event) => setSelectedElectionId(event.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <option value="">Select an election</option>
                  {elections.map((election) => (
                    <option key={election.id} value={election.id}>
                      {election.title} • {election.category}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="p-6">
            {error && (
              <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700 mb-6">
                {error}
              </div>
            )}
            {loadingElections ? (
              <p className="text-gray-600">Loading elections...</p>
            ) : elections.length === 0 ? (
              <p className="text-gray-600">No elections are available for your department or faculty yet.</p>
            ) : (
              <div className="grid gap-4">
                {elections.map((election) => {
                  const active = selectedElectionId === election.id;
                  return (
                    <button
                      key={election.id}
                      type="button"
                      onClick={() => setSelectedElectionId(election.id)}
                      className={`w-full rounded-2xl border p-4 text-left transition ${
                        active ? 'border-blue-600 bg-blue-50 shadow-sm' : 'border-gray-200 bg-white hover:border-blue-300'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                        <div>
                          <p className="text-sm font-medium text-blue-700 uppercase tracking-[0.18em]">
                            {getScopeLabel(election)}
                          </p>
                          <h3 className="text-lg font-semibold text-gray-900 mt-2">{election.title}</h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {formatDate(election.voting_start)} — {formatDate(election.voting_end)}
                          </p>
                        </div>
                        <span className="inline-flex items-center justify-center rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
                          {election.status.replace('_', ' ')}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">Slots for {selectedElection?.title ?? 'Selected Election'}</h2>
            <p className="text-gray-600">These are the available positions for the election you selected.</p>
          </div>
          {selectedElectionId ? (
            loadingPositions ? (
              <p className="text-gray-600">Loading slots...</p>
            ) : positions.length === 0 ? (
              <p className="text-gray-600">No slot positions are available for this election.</p>
            ) : (
              <div className="grid gap-4">
                {positions.map((position) => (
                  <div key={position.id} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-lg font-semibold text-gray-900">{position.position_name}</p>
                        <p className="text-sm text-gray-500">{position.description ?? 'No position description available.'}</p>
                      </div>
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
                        {position.number_of_winners} winner{position.number_of_winners === 1 ? '' : 's'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <p className="text-gray-600">Select an election to view the available slots.</p>
          )}
        </div>

        <div className="bg-blue-600 rounded-2xl p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <h2 className="text-xl font-bold text-white mb-2">Ready to Vote?</h2>
              <p className="text-blue-100">View candidates, read manifestos, and make your voice heard.</p>
            </div>
            <button className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-gray-100 text-blue-600 rounded-xl font-semibold transition-colors">
              <span>Browse Elections</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
