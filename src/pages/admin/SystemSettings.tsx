import { Settings as SettingsIcon, Save, AlertCircle, Lock, Bell, Eye, Loader2, CheckCircle2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';

interface SystemSettingsData {
  emailNotifications: boolean;
  twoFactor: boolean;
  sessionTimeout: string;
  maintenanceMode: boolean;
  dataBackupSchedule: string;
}

export function SystemSettings() {
  const [settings, setSettings] = useState<SystemSettingsData>({
    emailNotifications: true,
    twoFactor: false,
    sessionTimeout: '30',
    maintenanceMode: false,
    dataBackupSchedule: 'daily',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .single();

      if (!error && data) {
        setSettings({
          emailNotifications: data.email_notifications ?? true,
          twoFactor: data.two_factor ?? false,
          sessionTimeout: String(data.session_timeout ?? '30'),
          maintenanceMode: data.maintenance_mode ?? false,
          dataBackupSchedule: data.data_backup_schedule ?? 'daily',
        });
      } else {
        // Load from localStorage if DB table doesn't exist
        const saved = localStorage.getItem('system_settings');
        if (saved) {
          setSettings(JSON.parse(saved));
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      // Load from localStorage as fallback
      const saved = localStorage.getItem('system_settings');
      if (saved) {
        setSettings(JSON.parse(saved));
      }
    }
  }

  async function saveSettings() {
    setIsSaving(true);
    setSaveMessage(null);
    try {
      // Try to save to database
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          email_notifications: settings.emailNotifications,
          two_factor: settings.twoFactor,
          session_timeout: parseInt(settings.sessionTimeout),
          maintenance_mode: settings.maintenanceMode,
          data_backup_schedule: settings.dataBackupSchedule,
        });

      if (!error) {
        setSaveMessage({ type: 'success', text: 'Settings saved successfully!' });
      } else {
        // Save to localStorage as fallback
        localStorage.setItem('system_settings', JSON.stringify(settings));
        setSaveMessage({ type: 'success', text: 'Settings saved locally!' });
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      // Save to localStorage as fallback
      localStorage.setItem('system_settings', JSON.stringify(settings));
      setSaveMessage({ type: 'success', text: 'Settings saved locally!' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(null), 3000);
    }
  }

  const handleToggle = (key: keyof SystemSettingsData) => {
    setSettings((s) => ({ ...s, [key]: !s[key as keyof SystemSettingsData] }));
  };

  const handleChange = (key: keyof SystemSettingsData, value: string) => {
    setSettings((s) => ({ ...s, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">System Settings</h1>
            <p className="mt-1 text-sm text-slate-600">Configure system-wide preferences and security options</p>
          </div>
          <SettingsIcon className="h-8 w-8 text-blue-600" />
        </div>
      </div>

      {saveMessage && (
        <div
          className={`rounded-2xl border p-4 flex items-center gap-3 ${
            saveMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          {saveMessage.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
          )}
          <span className="font-medium">{saveMessage.text}</span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 mb-4">
            <Bell className="h-5 w-5 text-blue-600" />
            Notifications
          </h2>
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.emailNotifications}
                onChange={() => handleToggle('emailNotifications')}
                className="h-5 w-5 rounded border-slate-300 text-blue-600"
              />
              <span className="text-sm font-medium text-slate-900">Email notifications enabled</span>
            </label>
            <p className="text-sm text-slate-500 ml-8">Receive email alerts for critical system events</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 mb-4">
            <Lock className="h-5 w-5 text-purple-600" />
            Security
          </h2>
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.twoFactor}
                onChange={() => handleToggle('twoFactor')}
                className="h-5 w-5 rounded border-slate-300 text-purple-600"
              />
              <span className="text-sm font-medium text-slate-900">Two-factor authentication</span>
            </label>
            <p className="text-sm text-slate-500 ml-8">Enhance admin account security</p>

            <div className="mt-4 pt-4 border-t border-slate-200">
              <label className="block text-sm font-medium text-slate-900 mb-2">Session timeout (minutes)</label>
              <input
                type="number"
                value={settings.sessionTimeout}
                onChange={(e) => handleChange('sessionTimeout', e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-purple-200 outline-none"
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 mb-4">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            Maintenance
          </h2>
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={() => handleToggle('maintenanceMode')}
                className="h-5 w-5 rounded border-slate-300 text-amber-600"
              />
              <span className="text-sm font-medium text-slate-900">Maintenance mode</span>
            </label>
            <p className="text-sm text-slate-500 ml-8">Disable user access during maintenance</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 mb-4">
            <Eye className="h-5 w-5 text-emerald-600" />
            Data Management
          </h2>
          <div className="space-y-4">
            <label className="block text-sm font-medium text-slate-900 mb-2">Backup schedule</label>
            <select
              value={settings.dataBackupSchedule}
              onChange={(e) => handleChange('dataBackupSchedule', e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-200 outline-none"
            >
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={saveSettings}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-semibold transition-colors shadow-md"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-5 w-5" />
              Save Settings
            </>
          )}
        </button>
      </div>
    </div>
  );
}
