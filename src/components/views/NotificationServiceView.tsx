import React, { useEffect, useState } from 'react';
import {
  Bell,
  Mail,
  Smartphone,
  MessageSquare,
  Search,
  Clock,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Plus,
  Trash2,
  Send,
  Zap,
  Sliders,
  ShieldAlert,
  Server,
  Activity,
  Check,
  X,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Info,
  Calendar,
  Layers,
  Filter,
  CheckCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

type NotifTab = 'in-app' | 'preferences' | 'saved-alerts' | 'deadlines' | 'retry-strategy' | 'logs' | 'sandbox';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  urgent: boolean;
  isRead: boolean;
  category: string;
  createdAt?: string;
  link?: string;
}

interface NotificationPreferences {
  email: { enabled: boolean; address: string; verified: boolean };
  push: { enabled: boolean; deviceToken: string; browserPermissionGranted: boolean; platform: string };
  inApp: { enabled: boolean; soundEnabled: boolean; popupToastEnabled: boolean };
  frequency: string;
  quietHours: { enabled: boolean; start: string; end: string };
  categories: { savedSearchAlerts: boolean; deadlineReminders: boolean; examDateReminders: boolean; systemAnnouncements: boolean };
}

interface SavedSearchAlertRule {
  id: string;
  name: string;
  keywords: string;
  ministry: string;
  minSalary: number;
  degreeRequired: string;
  channels: string[];
  active: boolean;
  lastTriggeredAt: string;
  matchesCount: number;
}

interface NotificationLogItem {
  id: string;
  timestamp: string;
  channel: string;
  category: string;
  recipient: string;
  title: string;
  content: string;
  status: 'DELIVERED' | 'FAILED' | 'RETRYING' | 'QUEUED';
  attempts: number;
  maxAttempts: number;
  latencyMs: number;
  errorReason: string | null;
  retryBackoffMs: number;
}

export const NotificationServiceView: React.FC = () => {
  const { role } = useAuth();
  const [activeTab, setActiveTab] = useState<NotifTab>('in-app');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // In-App Notifications State
  const [inAppNotifications, setInAppNotifications] = useState<NotificationItem[]>([]);
  const [loadingInApp, setLoadingInApp] = useState(false);
  const [inAppFilter, setInAppFilter] = useState<'ALL' | 'UNREAD'>('ALL');

  // Preferences State
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [loadingPrefs, setLoadingPrefs] = useState(false);

  // Saved Search Alerts State
  const [searchAlerts, setSearchAlerts] = useState<SavedSearchAlertRule[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [isAddAlertModalOpen, setIsAddAlertModalOpen] = useState(false);
  const [newAlertForm, setNewAlertForm] = useState({
    name: '',
    keywords: '',
    ministry: 'กระทรวงมหาดไทย',
    minSalary: 15000,
    degreeRequired: 'ปริญญาตรี',
    channels: ['EMAIL', 'IN_APP'],
  });

  // Deadline Reminders State
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<any[]>([]);
  const [loadingDeadlines, setLoadingDeadlines] = useState(false);

  // Notification Logs State
  const [logs, setLogs] = useState<NotificationLogItem[]>([]);
  const [logStats, setLogStats] = useState<any | null>(null);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logChannelFilter, setLogChannelFilter] = useState('ALL');
  const [logStatusFilter, setLogStatusFilter] = useState('ALL');

  // Sandbox Test Dispatch Form State
  const [testForm, setTestForm] = useState({
    channels: ['EMAIL', 'PUSH', 'IN_APP'],
    category: 'SAVED_SEARCH_ALERT',
    title: 'ประกาศสอบคัดเลือกนักวิชาการคอมพิวเตอร์ 2026',
    content: 'กรมสรรพากร ประกาศรับสมัครสอบแข่งขันเพื่อบรรจุบุคคลเข้ารับราชการ 25 อัตรา',
    recipientEmail: 'kunnapatara@gmail.com',
  });
  const [sendingTest, setSendingTest] = useState(false);
  const [testPreviewModal, setTestPreviewModal] = useState<any | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetching methods
  const fetchInAppNotifications = async () => {
    setLoadingInApp(true);
    try {
      const res = await fetch('/api/user/notifications');
      const data = await res.json();
      if (data.success) setInAppNotifications(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingInApp(false);
    }
  };

  const fetchPreferences = async () => {
    setLoadingPrefs(true);
    try {
      const res = await fetch('/api/notifications/preferences');
      const data = await res.json();
      if (data.success) setPrefs(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPrefs(false);
    }
  };

  const fetchSavedSearchAlerts = async () => {
    setLoadingAlerts(true);
    try {
      const res = await fetch('/api/notifications/saved-search-alerts');
      const data = await res.json();
      if (data.success) setSearchAlerts(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAlerts(false);
    }
  };

  const fetchDeadlines = async () => {
    setLoadingDeadlines(true);
    try {
      const res = await fetch('/api/notifications/deadline-reminders');
      const data = await res.json();
      if (data.success) setUpcomingDeadlines(data.upcomingDeadlines);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDeadlines(false);
    }
  };

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const query = new URLSearchParams({ channel: logChannelFilter, status: logStatusFilter }).toString();
      const res = await fetch(`/api/notifications/logs?${query}`);
      const data = await res.json();
      if (data.success) {
        setLogs(data.data);
        setLogStats(data.stats);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchInAppNotifications();
    fetchPreferences();
    fetchSavedSearchAlerts();
    fetchDeadlines();
    fetchLogs();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [logChannelFilter, logStatusFilter]);

  // Action handlers

  // In-App Mark Read
  const handleMarkRead = async (id: string) => {
    try {
      const res = await fetch(`/api/user/notifications/${id}/read`, { method: 'PATCH' });
      const data = await res.json();
      if (data.success) {
        setInAppNotifications(data.data);
        showToast('อัปเดตสถานะการอ่านเรียบร้อยแล้ว');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Preferences Update
  const handleSavePreferences = async () => {
    if (!prefs) return;
    try {
      const res = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setPrefs(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Web Push Registration Simulation
  const handleRegisterPushToken = async () => {
    try {
      const res = await fetch('/api/notifications/push/register-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: 'Web Chrome Desktop Browser',
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        fetchPreferences();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Saved Search Alerts actions
  const handleToggleAlertActive = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/saved-search-alerts/${id}/toggle`, { method: 'PATCH' });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        fetchSavedSearchAlerts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateAlertRule = async () => {
    if (!newAlertForm.name || !newAlertForm.keywords) {
      alert('กรุณากรอกชื่อเงื่อนไขและคำค้นหา');
      return;
    }
    try {
      const res = await fetch('/api/notifications/saved-search-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAlertForm),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setIsAddAlertModalOpen(false);
        setNewAlertForm({
          name: '',
          keywords: '',
          ministry: 'กระทรวงมหาดไทย',
          minSalary: 15000,
          degreeRequired: 'ปริญญาตรี',
          channels: ['EMAIL', 'IN_APP'],
        });
        fetchSavedSearchAlerts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAlertRule = async (id: string) => {
    if (!confirm('ยืนยันลบเงื่อนไขการแจ้งเตือนนี้?')) return;
    try {
      const res = await fetch(`/api/notifications/saved-search-alerts/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        fetchSavedSearchAlerts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTriggerAlertMatch = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/saved-search-alerts/${id}/trigger`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        fetchSavedSearchAlerts();
        fetchInAppNotifications();
        fetchLogs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Deadline Reminders Scan Trigger
  const handleTriggerDeadlineScan = async () => {
    try {
      const res = await fetch('/api/notifications/deadline-reminders/trigger-check', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        fetchInAppNotifications();
        fetchLogs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Retry Strategy Actions
  const handleRetryFailedLog = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/logs/${id}/retry`, { method: 'POST' });
      const data = await res.json();
      showToast(data.message);
      fetchLogs();
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearFailedLogs = async () => {
    try {
      const res = await fetch('/api/notifications/logs/failed/clear', { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        fetchLogs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Sandbox Test Dispatch Submit
  const handleSendTestDispatch = async () => {
    setSendingTest(true);
    try {
      const res = await fetch('/api/notifications/test-dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testForm),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setTestPreviewModal({
          title: testForm.title,
          content: testForm.content,
          channels: testForm.channels,
          dispatchedLogs: data.dispatchedLogs,
        });
        fetchInAppNotifications();
        fetchLogs();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSendingTest(false);
    }
  };

  // Filtered In-App items
  const filteredInApp = inAppNotifications.filter((item) => {
    if (inAppFilter === 'UNREAD') return !item.isRead;
    return true;
  });

  const unreadCount = inAppNotifications.filter((i) => !i.isRead).length;
  const failedLogs = logs.filter((l) => l.status === 'FAILED');

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-blue-500/40 flex items-center gap-3 animate-bounce">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-slate-900 rounded-3xl p-6 lg:p-8 text-white border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-bold mb-3">
              <Zap className="w-4 h-4 text-blue-400 animate-pulse" />
              VERIIGO Multi-Channel Notification Engine (Sprint 12)
            </div>
            <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
              ศูนย์การส่งข่าวสารและแจ้งเตือนอัตโนมัติ
            </h1>
            <p className="text-xs lg:text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
              รองรับ Email Delivery, Web Push Notifications, In-App Center, การแจ้งเตือนตามคำค้น (Saved Search Alerts), แจ้งเตือนวันสอบล่วงหน้า, Exponential Backoff Retry Strategy, และ Audit Logs
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('sandbox')}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              ทดสอบส่งการแจ้งเตือน (Sandbox)
            </button>
            <button
              onClick={() => {
                fetchInAppNotifications();
                fetchPreferences();
                fetchSavedSearchAlerts();
                fetchDeadlines();
                fetchLogs();
              }}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all"
              title="รีเฟรชข้อมูลทั้งหมด"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mt-8 overflow-x-auto pb-1 pt-2 border-t border-slate-800/80">
          {[
            { id: 'in-app', label: 'In-App Notifications', icon: Bell, badge: unreadCount, badgeColor: 'bg-blue-500' },
            { id: 'preferences', label: 'Channels & Settings', icon: Sliders, badge: null },
            { id: 'saved-alerts', label: 'Saved Search Alerts', icon: Search, badge: searchAlerts.length },
            { id: 'deadlines', label: 'Deadline Reminders', icon: Clock, badge: upcomingDeadlines.length },
            { id: 'retry-strategy', label: 'Retry Strategy', icon: AlertTriangle, badge: failedLogs.length, badgeColor: 'bg-rose-500' },
            { id: 'logs', label: 'Audit Logs', icon: Activity, badge: logStats?.totalDispatched || logs.length },
            { id: 'sandbox', label: 'Test Dispatch Sandbox', icon: Send, badge: 'Live' },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as NotifTab)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-slate-700/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge !== null && tab.badge > 0 && (
                  <span
                    className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-black ${
                      tab.badgeColor ? `${tab.badgeColor} text-white` : isActive ? 'bg-white/20 text-white' : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: IN-APP NOTIFICATION CENTER */}
      {activeTab === 'in-app' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Bell className="w-4 h-4 text-blue-600" />
                กล่องข้อความแจ้งเตือนภายในระบบ (In-App Notification Center)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                ข้อความแจ้งเตือนผลการสอบ, ตำแหน่งงานใหม่ตรงสเปก, และกำหนดการวันหมดเขตสมัครสอบ
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
                <button
                  onClick={() => setInAppFilter('ALL')}
                  className={`px-3 py-1 rounded-lg transition-all ${inAppFilter === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                >
                  ทั้งหมด ({inAppNotifications.length})
                </button>
                <button
                  onClick={() => setInAppFilter('UNREAD')}
                  className={`px-3 py-1 rounded-lg transition-all ${inAppFilter === 'UNREAD' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                >
                  ยังไม่ได้อ่าน ({unreadCount})
                </button>
              </div>

              <button
                onClick={() => handleMarkRead('all')}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                อ่านทั้งหมด
              </button>
            </div>
          </div>

          {filteredInApp.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 mx-auto flex items-center justify-center">
                <Bell className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-800">ไม่มีการแจ้งเตือนในขณะนี้</p>
              <p className="text-xs text-slate-500">ท่านได้อ่านข้อความทั้งหมดในกล่องแจ้งเตือนแล้ว</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredInApp.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    !item.isRead
                      ? 'bg-blue-50/40 border-blue-200/80 shadow-sm'
                      : 'bg-white border-slate-200/70 opacity-80'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${!item.isRead ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-slate-900">{item.title}</span>
                        {!item.isRead && (
                          <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" title="ข้อความใหม่" />
                        )}
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                          {item.category || 'SYSTEM'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">{item.message}</p>
                      <p className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1 font-medium">
                        <Clock className="w-3 h-3" /> {item.time}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {!item.isRead && (
                      <button
                        onClick={() => handleMarkRead(item.id)}
                        className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5 text-blue-600" /> ทำเป็นอ่านแล้ว
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CHANNELS & PREFERENCES */}
      {activeTab === 'preferences' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          {/* Channel Setup Panel */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-600" />
                ตั้งค่าช่องทางรับข่าวสาร (Notification Delivery Channels)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                จัดการช่องทางการส่งข้อความ Email, Web Push, และ In-App Messages
              </p>
            </div>

            {/* Email Channel */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">การแจ้งเตือนทางอีเมล (Email Notifications)</h4>
                    <p className="text-xs text-slate-500">ส่งไปยังอีเมลที่ลงทะเบียน: {prefs?.email?.address || 'kunnapatara@gmail.com'}</p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prefs?.email?.enabled ?? true}
                    onChange={(e) =>
                      setPrefs((prev) =>
                        prev
                          ? { ...prev, email: { ...prev.email, enabled: e.target.checked } }
                          : null
                      )
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>

            {/* Web Push Channel */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Web Push Notifications (เบราว์เซอร์)</h4>
                    <p className="text-xs text-slate-500">
                       Token: {prefs?.push?.deviceToken?.slice(0, 20)}... ({prefs?.push?.platform})
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prefs?.push?.enabled ?? true}
                    onChange={(e) =>
                      setPrefs((prev) =>
                        prev
                          ? { ...prev, push: { ...prev.push, enabled: e.target.checked } }
                          : null
                      )
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-200/60 text-xs">
                <span className="text-slate-600 font-medium">สิทธิ์การรับแจ้งเตือนเบราว์เซอร์: {prefs?.push?.browserPermissionGranted ? 'GRANTED (อนุญาตแล้ว)' : 'PENDING'}</span>
                <button
                  onClick={handleRegisterPushToken}
                  className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition-all"
                >
                  ลงทะเบียน Web Push Token ใหม่
                </button>
              </div>
            </div>

            {/* In-App Sound & Popup */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">เสียงแจ้งเตือนและ Toast Popup</h4>
                    <p className="text-xs text-slate-500">แสดงการ์ดป๊อปอัปและเสียงเมื่อมีข่าวสารด่วน</p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prefs?.inApp?.enabled ?? true}
                    onChange={(e) =>
                      setPrefs((prev) =>
                        prev
                          ? { ...prev, inApp: { ...prev.inApp, enabled: e.target.checked } }
                          : null
                      )
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={handleSavePreferences}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                บันทึกการตั้งค่า
              </button>
            </div>
          </div>

          {/* Delivery Schedule & Quiet Hours */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-600" />
                รอบการส่งและเวลาห้ามรบกวน (Schedule & Quiet Hours)
              </h3>
            </div>

            {/* Frequency selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">ความถี่ในการส่งข่าวสาร (Frequency)</label>
              <select
                value={prefs?.frequency || 'REALTIME'}
                onChange={(e) =>
                  setPrefs((prev) => (prev ? { ...prev, frequency: e.target.value } : null))
                }
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
              >
                <option value="REALTIME">⚡ Realtime (ส่งทันทีเมื่อพบประกาศใหม่)</option>
                <option value="DAILY_DIGEST">📅 Daily Digest (สรุปรายวัน เวลา 18:00 น.)</option>
                <option value="WEEKLY_DIGEST">🗓️ Weekly Digest (สรุปรายสัปดาห์ ทุกวันจันทร์)</option>
              </select>
            </div>

            {/* Quiet Hours */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">โหมดห้ามรบกวนยามวิกาล (Quiet Hours)</span>
                <input
                  type="checkbox"
                  checked={prefs?.quietHours?.enabled ?? true}
                  onChange={(e) =>
                    setPrefs((prev) =>
                      prev
                        ? { ...prev, quietHours: { ...prev.quietHours, enabled: e.target.checked } }
                        : null
                    )
                  }
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 font-semibold block mb-1">เริ่มปิดเสียง</span>
                  <input
                    type="time"
                    value={prefs?.quietHours?.start || '22:00'}
                    onChange={(e) =>
                      setPrefs((prev) =>
                        prev
                          ? { ...prev, quietHours: { ...prev.quietHours, start: e.target.value } }
                          : null
                      )
                    }
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block mb-1">สิ้นสุดโหมด</span>
                  <input
                    type="time"
                    value={prefs?.quietHours?.end || '07:00'}
                    onChange={(e) =>
                      setPrefs((prev) =>
                        prev
                          ? { ...prev, quietHours: { ...prev.quietHours, end: e.target.value } }
                          : null
                      )
                    }
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SAVED SEARCH ALERTS */}
      {activeTab === 'saved-alerts' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Search className="w-4 h-4 text-blue-600" />
                เงื่อนไขการแจ้งเตือนงานตรงสเปก (Saved Search Alerts)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                กำหนดคีย์เวิร์ด, หน่วยงาน, และอัตราเงินเดือน เพื่อให้ระบบสแกนส่งข่าวสารอัตโนมัติ
              </p>
            </div>

            <button
              onClick={() => setIsAddAlertModalOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              สร้างเงื่อนไขใหม่
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {searchAlerts.map((rule) => (
              <div
                key={rule.id}
                className={`p-5 rounded-2xl border space-y-3 transition-all ${
                  rule.active ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-50 border-slate-200 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200">
                      {rule.ministry}
                    </span>
                    <h4 className="text-sm font-black text-slate-900 mt-1">{rule.name}</h4>
                  </div>

                  <button
                    onClick={() => handleToggleAlertActive(rule.id)}
                    className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                      rule.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {rule.active ? '🟢 เปิด' : '⚪ ปิด'}
                  </button>
                </div>

                <div className="space-y-1 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 font-medium">
                  <p>🔑 <strong>คำค้น:</strong> "{rule.keywords || 'ทั้งหมด'}"</p>
                  <p>💰 <strong>เงินเดือนขั้นต่ำ:</strong> {(rule.minSalary ?? 0).toLocaleString()} บาท</p>
                  <p>🎓 <strong>วุฒิการศึกษา:</strong> {rule.degreeRequired || 'ทุกวุฒิ'}</p>
                  <p>📡 <strong>ช่องทาง:</strong> {Array.isArray(rule.channels) ? rule.channels.join(', ') : 'EMAIL'}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                  <span className="text-slate-400">สแกนพบล่าสุด: {rule.matchesCount} รายการ</span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleTriggerAlertMatch(rule.id)}
                      className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg transition-all flex items-center gap-1"
                      title="สแกนค้นหางานตรงสเปกและส่งการแจ้งเตือนทันที"
                    >
                      <Zap className="w-3 h-3 text-blue-600" /> สแกนส่งทันที
                    </button>
                    <button
                      onClick={() => handleDeleteAlertRule(rule.id)}
                      className="p-1 hover:bg-rose-50 text-rose-600 rounded-lg transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: DEADLINE REMINDERS */}
      {activeTab === 'deadlines' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                กำหนดการวันปิดรับสมัครและเตือนวันสอบ (Deadline & Exam Lead Time)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                ระบบเฝ้าระวังกำหนดวันสอบและวันปิดรับสมัครล่วงหน้า 7 วัน, 3 วัน, และ 1 วัน
              </p>
            </div>

            <button
              onClick={handleTriggerDeadlineScan}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              <Zap className="w-4 h-4" /> สแกนส่งเตือนวันปิดรับสมัคร
            </button>
          </div>

          <div className="space-y-3">
            {upcomingDeadlines.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 flex items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-200">
                      เหลืออีก {item.daysRemaining} วัน
                    </span>
                    <span className="text-xs font-bold text-slate-500">{item.agencyName}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mt-1">{item.title}</h4>
                  <p className="text-xs text-slate-500">วันปิดรับสมัคร: {new Date(item.deadline).toLocaleDateString('th-TH')}</p>
                </div>

                <div className="text-right">
                  <span className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-xs inline-block">
                    สแกนอัตโนมัติแล้ว
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: RETRY STRATEGY & FAILED DISPATCHES */}
      {activeTab === 'retry-strategy' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                กลไกการลองใหม่เมื่อส่งไม่สำเร็จ (Exponential Backoff Retry Strategy)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                ติดตามรายการข้อความที่ส่งขัดข้อง (SMTP Timeout, Expired Token) พร้อมระบบทบทวนการส่งอัตโนมัติ
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleClearFailedLogs}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5 text-slate-500" /> ล้างประวัติขัดข้อง
              </button>
            </div>
          </div>

          {failedLogs.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-800">ไม่มีรายการส่งขัดข้องในขณะนี้</p>
              <p className="text-xs text-slate-500">ทุกข้อความการแจ้งเตือนถูกส่งถึงผู้รับสำเร็จ 100%</p>
            </div>
          ) : (
            <div className="space-y-3">
              {failedLogs.map((item) => (
                <div key={item.id} className="p-4 rounded-2xl border border-rose-200 bg-rose-50/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-100 text-rose-700 border border-rose-200">
                        {item.channel}
                      </span>
                      <span className="text-xs font-bold text-slate-500">{item.recipient}</span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                    <p className="text-xs text-rose-700 font-medium">สาเหตุ: {item.errorReason}</p>
                    <p className="text-[11px] text-slate-400 font-mono">
                      พยายามแล้ว: {item.attempts}/{item.maxAttempts} ครั้ง • Delay Backoff: {item.retryBackoffMs}ms
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRetryFailedLog(item.id)}
                      className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> ลองส่งอีกครั้ง (Retry)
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: NOTIFICATION AUDIT LOGS */}
      {activeTab === 'logs' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 animate-fadeIn">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-600" />
                ประวัติการส่งและบันทึกข้อความ (Notification Audit Trail Logs)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                ตรวจสอบประวัติ Latency, Delivery Success Rate %, และผู้รับข้อความรายช่องทาง
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={logChannelFilter}
                onChange={(e) => setLogChannelFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              >
                <option value="ALL">ทุกช่องทาง (ALL Channels)</option>
                <option value="EMAIL">EMAIL</option>
                <option value="PUSH">PUSH</option>
                <option value="IN_APP">IN_APP</option>
              </select>

              <select
                value={logStatusFilter}
                onChange={(e) => setLogStatusFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              >
                <option value="ALL">ทุกสถานะ (ALL Status)</option>
                <option value="DELIVERED">DELIVERED</option>
                <option value="FAILED">FAILED</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
              <p className="text-xs font-bold text-slate-500">อัตราส่งสำเร็จ (Success Rate)</p>
              <p className="text-xl font-black text-emerald-600 mt-1">{logStats?.successRatePercent || 100}%</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
              <p className="text-xs font-bold text-slate-500">จำนวนที่ส่งออกทั้งหมด</p>
              <p className="text-xl font-black text-slate-900 mt-1">{logStats?.totalDispatched || 0} รายการ</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
              <p className="text-xs font-bold text-slate-500">ส่งขัดข้อง (Failed Count)</p>
              <p className="text-xl font-black text-rose-600 mt-1">{logStats?.failedCount || 0} รายการ</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <th className="p-3">Log ID / Timestamp</th>
                  <th className="p-3">ช่องทาง</th>
                  <th className="p-3">ผู้รับ</th>
                  <th className="p-3">หัวข้อข้อความ</th>
                  <th className="p-3">สถานะ</th>
                  <th className="p-3">Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80">
                    <td className="p-3 font-mono font-bold text-slate-800">
                      <div>{log.id}</div>
                      <div className="text-[10px] text-slate-400 font-sans">{new Date(log.timestamp).toLocaleString('th-TH')}</div>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-black rounded text-[10px]">
                        {log.channel}
                      </span>
                    </td>
                    <td className="p-3 font-medium text-slate-800">{log.recipient}</td>
                    <td className="p-3 max-w-xs truncate font-medium">{log.title}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          log.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="p-3 font-mono">{log.latencyMs} ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 7: TEST DISPATCH SANDBOX */}
      {activeTab === 'sandbox' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 animate-fadeIn">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Send className="w-4 h-4 text-blue-600" />
              ศูนย์ทดสอบการส่งการแจ้งเตือนสด (Test Dispatch Sandbox)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              ทดลองส่งการแจ้งเตือนไปยัง Email, Web Push, และ In-App Inbox เพื่อดูพรีวิวแบบ Real-time
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form controls */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">เลือกช่องทางรับข้อความ (Target Channels)</label>
                <div className="flex items-center gap-4 text-xs font-bold">
                  {['EMAIL', 'PUSH', 'IN_APP'].map((ch) => (
                    <label key={ch} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={testForm.channels.includes(ch)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setTestForm((prev) => ({ ...prev, channels: [...prev.channels, ch] }));
                          } else {
                            setTestForm((prev) => ({ ...prev, channels: prev.channels.filter((c) => c !== ch) }));
                          }
                        }}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span>{ch}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">หัวข้อข้อความ (Subject / Title)</label>
                <input
                  type="text"
                  value={testForm.title}
                  onChange={(e) => setTestForm((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">เนื้อหาการแจ้งเตือน (Content)</label>
                <textarea
                  rows={3}
                  value={testForm.content}
                  onChange={(e) => setTestForm((prev) => ({ ...prev, content: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">อีเมลผู้รับทดสอบ (Recipient Email)</label>
                <input
                  type="email"
                  value={testForm.recipientEmail}
                  onChange={(e) => setTestForm((prev) => ({ ...prev, recipientEmail: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                />
              </div>

              <button
                onClick={handleSendTestDispatch}
                disabled={sendingTest}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
              >
                <Send className={`w-4 h-4 ${sendingTest ? 'animate-spin' : ''}`} />
                {sendingTest ? 'กำลังประมวลผลการส่ง...' : 'ส่งการแจ้งเตือนทดสอบทันที'}
              </button>
            </div>

            {/* Live Interactive Preview Card */}
            <div className="bg-slate-900 rounded-2xl p-5 text-white space-y-4 border border-slate-800">
              <h4 className="text-xs font-bold text-slate-400 flex items-center gap-1.5 border-b border-slate-800 pb-2">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                ตัวอย่างการแสดงผล (Live Template Preview)
              </h4>

              {/* Email Template Preview */}
              <div className="bg-white text-slate-900 rounded-xl p-4 space-y-2 text-xs shadow-inner">
                <div className="border-b border-slate-100 pb-2 flex justify-between">
                  <span className="font-bold text-slate-500">VERIIGO Official Email Notice</span>
                  <span className="text-[10px] text-slate-400">To: {testForm.recipientEmail}</span>
                </div>
                <h5 className="font-black text-sm text-blue-700">{testForm.title}</h5>
                <p className="text-slate-600 leading-relaxed">{testForm.content}</p>
                <div className="pt-2">
                  <span className="px-3 py-1 bg-blue-600 text-white rounded-lg text-[10px] font-bold inline-block">
                    ดูรายละเอียดและสมัครสอบ
                  </span>
                </div>
              </div>

              {/* Push Banner Preview */}
              <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-3 text-xs flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                  V
                </div>
                <div>
                  <h6 className="font-bold text-white">{testForm.title}</h6>
                  <p className="text-[11px] text-slate-300 line-clamp-1">{testForm.content}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add Saved Search Alert Rule */}
      {isAddAlertModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">สร้างเงื่อนไขการแจ้งเตือนใหม่</h3>
              <button onClick={() => setIsAddAlertModalOpen(false)} className="p-1 hover:bg-slate-100 rounded-full">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">ชื่อเงื่อนไข / หมวดหมู่</label>
                <input
                  type="text"
                  placeholder="เช่น งานข้าราชการนักจัดการทั่วไป"
                  value={newAlertForm.name}
                  onChange={(e) => setNewAlertForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">คำค้นหาหลัก (Keywords)</label>
                <input
                  type="text"
                  placeholder="เช่น นักวิชาการเงิน, วิศวกร"
                  value={newAlertForm.keywords}
                  onChange={(e) => setNewAlertForm((prev) => ({ ...prev, keywords: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">กระทรวง / หน่วยงานที่สนใจ</label>
                <input
                  type="text"
                  placeholder="กระทรวงมหาดไทย, ทุกกระทรวง"
                  value={newAlertForm.ministry}
                  onChange={(e) => setNewAlertForm((prev) => ({ ...prev, ministry: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">อัตราเงินเดือนขั้นต่ำ (บาท)</label>
                <input
                  type="number"
                  value={newAlertForm.minSalary}
                  onChange={(e) => setNewAlertForm((prev) => ({ ...prev, minSalary: Number(e.target.value) }))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setIsAddAlertModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleCreateAlertRule}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md"
              >
                สร้างเงื่อนไข
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
