import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Switch } from '../../components/ui/Switch';
import { useToast } from '../../components/ui/ToastContext';
import { 
  Settings, 
  CreditCard, 
  MessageSquare, 
  Database, 
  Save, 
  RefreshCw, 
  ShieldAlert, 
  Server,
  Activity
} from 'lucide-react';

export default function PlatformSettings() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'general' | 'payments' | 'whatsapp' | 'system'>('general');
  const [isSaving, setIsSaving] = useState(false);

  // Tab 1: General
  const [appName, setAppName] = useState('StudyFlow');
  const [supportEmail, setSupportEmail] = useState('support@studyflow.in');
  const [supportPhone, setSupportPhone] = useState('+91 98765 43210');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [allowedDomains, setAllowedDomains] = useState('studyflow.in, localhost');

  // Tab 2: Razorpay Payments
  const [razorpayKeyId, setRazorpayKeyId] = useState('rzp_test_T9hh97PsK4bGuG');
  const [razorpayKeySecret, setRazorpayKeySecret] = useState('aL02SqOqMzSQP7XwCZm9fnfo');
  const [webhookSecret, setWebhookSecret] = useState('whsec_studyflow_secret_key');
  const [currency, setCurrency] = useState('INR');

  // Tab 3: WhatsApp Integration
  const [whatsappProvider, setWhatsappProvider] = useState('meta_cloud');
  const [whatsappPhoneId, setWhatsappPhoneId] = useState('109283748293029');
  const [whatsappToken, setWhatsappToken] = useState('EAAOxB2...');
  const [enableAutoNotices, setEnableAutoNotices] = useState(true);

  // Tab 4: System
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isClearingCache, setIsClearingCache] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    // Simulate API saving
    setTimeout(() => {
      setIsSaving(false);
      showToast('Platform settings saved successfully!', 'success');
    }, 800);
  };

  const handleBackup = () => {
    setIsBackingUp(true);
    setTimeout(() => {
      setIsBackingUp(false);
      showToast('Database backup completed! Backup file: studyflow_backup_20260712.sql', 'success');
    }, 2000);
  };

  const handleClearCache = () => {
    setIsClearingCache(true);
    setTimeout(() => {
      setIsClearingCache(false);
      showToast('Server redis/memory cache cleared!', 'success');
    }, 1200);
  };

  const tabStyle = (tabId: typeof activeTab) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1.25rem',
    border: 'none',
    background: 'none',
    borderBottom: activeTab === tabId ? '3px solid #3b82f6' : '3px solid transparent',
    color: activeTab === tabId ? '#1e3a8a' : '#64748b',
    fontWeight: activeTab === tabId ? 700 : 600,
    fontSize: '0.95rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
  });

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ margin: 0, color: '#0f172a', fontSize: '1.5rem', fontWeight: 700 }}>Platform Settings</h2>
        <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.95rem' }}>
          Configure global platform attributes, payment credentials, notifications, and system tasks.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ 
        display: 'flex', 
        borderBottom: '1px solid #e2e8f0', 
        marginBottom: '2rem',
        overflowX: 'auto',
        whiteSpace: 'nowrap'
      }}>
        <button style={tabStyle('general')} onClick={() => setActiveTab('general')}>
          <Settings size={18} /> General Settings
        </button>
        <button style={tabStyle('payments')} onClick={() => setActiveTab('payments')}>
          <CreditCard size={18} /> Payment Gateway
        </button>
        <button style={tabStyle('whatsapp')} onClick={() => setActiveTab('whatsapp')}>
          <MessageSquare size={18} /> WhatsApp Config
        </button>
        <button style={tabStyle('system')} onClick={() => setActiveTab('system')}>
          <Database size={18} /> System & Backup
        </button>
      </div>

      {/* Card Content Container */}
      <div style={{ 
        background: 'white', 
        borderRadius: '12px', 
        padding: '2rem', 
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.025)',
        border: '1px solid #e2e8f0'
      }}>
        
        {/* GENERAL SETTINGS */}
        {activeTab === 'general' && (
          <form onSubmit={handleSave}>
            <h3 style={{ margin: '0 0 1.5rem 0', color: '#1e293b', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              General Platform Settings
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              <Input
                label="Application Name"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                placeholder="e.g. StudyFlow"
                required
              />
              <Input
                label="Allowed Domains (Comma separated)"
                value={allowedDomains}
                onChange={(e) => setAllowedDomains(e.target.value)}
                placeholder="e.g. studyflow.in, localhost"
                required
              />
              <Input
                label="Support Email Address"
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                placeholder="support@studyflow.in"
                required
              />
              <Input
                label="Support Phone Number"
                value={supportPhone}
                onChange={(e) => setSupportPhone(e.target.value)}
                placeholder="+91 99999 88888"
                required
              />
            </div>

            <div style={{ 
              background: '#fffbeb', 
              border: '1px solid #fef3c7', 
              borderRadius: '8px', 
              padding: '1.25rem', 
              marginBottom: '2rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '1rem'
            }}>
              <ShieldAlert style={{ color: '#d97706', flexShrink: 0, marginTop: '2px' }} size={20} />
              <div>
                <h4 style={{ margin: '0 0 0.25rem 0', color: '#92400e', fontSize: '0.95rem', fontWeight: 600 }}>Maintenance Mode</h4>
                <p style={{ margin: '0 0 1rem 0', color: '#b45309', fontSize: '0.85rem', lineHeight: 1.4 }}>
                  Activating maintenance mode will display a "Service Temporarily Offline" page to all library owners and student interfaces. Only Super Admins will be able to access the dashboard.
                </p>
                <Switch
                  checked={maintenanceMode}
                  onChange={setMaintenanceMode}
                  label={maintenanceMode ? "Maintenance Mode: ACTIVE" : "Maintenance Mode: INACTIVE"}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button type="submit" variant="primary" disabled={isSaving} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Save size={18} /> {isSaving ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </form>
        )}

        {/* PAYMENT GATEWAY */}
        {activeTab === 'payments' && (
          <form onSubmit={handleSave}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                Razorpay API Configuration
              </h3>
              <span style={{ 
                background: '#dbeafe', 
                color: '#1e40af', 
                fontSize: '0.75rem', 
                padding: '4px 8px', 
                borderRadius: '4px',
                fontWeight: 600 
              }}>
                Payment Gateway: Razorpay
              </span>
            </div>

            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Enter the Razorpay API credentials to handle SaaS billing subscriptions for Library Owners. Make sure webhook logs point to the backend verify endpoints.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <Input
                label="Razorpay Key ID"
                value={razorpayKeyId}
                onChange={(e) => setRazorpayKeyId(e.target.value)}
                placeholder="rzp_test_..."
                required
              />
              <Input
                label="Razorpay Key Secret"
                type="password"
                value={razorpayKeySecret}
                onChange={(e) => setRazorpayKeySecret(e.target.value)}
                placeholder="••••••••••••••••"
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              <Input
                label="Webhook Secret Signature"
                type="password"
                value={webhookSecret}
                onChange={(e) => setWebhookSecret(e.target.value)}
                placeholder="whsec_..."
              />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 600, marginBottom: '0.5rem' }}>SaaS Billing Currency</label>
                <select 
                  value={currency} 
                  onChange={(e) => setCurrency(e.target.value)}
                  style={{
                    padding: '0.625rem',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: 'white',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                >
                  <option value="INR">INR (₹) - Indian Rupee</option>
                  <option value="USD">USD ($) - US Dollar</option>
                  <option value="EUR">EUR (€) - Euro</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button type="submit" variant="primary" disabled={isSaving} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Save size={18} /> {isSaving ? 'Saving...' : 'Save Keys'}
              </Button>
            </div>
          </form>
        )}

        {/* WHATSAPP CONFIG */}
        {activeTab === 'whatsapp' && (
          <form onSubmit={handleSave}>
            <h3 style={{ margin: '0 0 1.5rem 0', color: '#1e293b', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              WhatsApp API Gateway
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 600, marginBottom: '0.5rem' }}>API Provider</label>
                <select 
                  value={whatsappProvider} 
                  onChange={(e) => setWhatsappProvider(e.target.value)}
                  style={{
                    padding: '0.625rem',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: 'white',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                >
                  <option value="meta_cloud">Meta Cloud API (Official)</option>
                  <option value="twilio">Twilio WhatsApp Business API</option>
                  <option value="ultra_msg">UltraMsg (Custom Gateway)</option>
                </select>
              </div>
              <Input
                label="WhatsApp Business Phone ID"
                value={whatsappPhoneId}
                onChange={(e) => setWhatsappPhoneId(e.target.value)}
                placeholder="e.g. 109283748293029"
                required
              />
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <Input
                label="Bearer Access Token"
                type="password"
                value={whatsappToken}
                onChange={(e) => setWhatsappToken(e.target.value)}
                placeholder="EAAOxB2..."
                required
              />
            </div>

            <div style={{ 
              background: '#f8fafc', 
              border: '1px solid #e2e8f0', 
              borderRadius: '8px', 
              padding: '1.25rem', 
              marginBottom: '2rem' 
            }}>
              <Switch
                checked={enableAutoNotices}
                onChange={setEnableAutoNotices}
                label="Enable Auto-Broadcast of Notices to Students"
              />
              <p style={{ margin: '0.5rem 0 0 2.75rem', color: '#64748b', fontSize: '0.8rem', lineHeight: 1.4 }}>
                When enabled, notices posted in individual workspaces will automatically be dispatched to the respective students via WhatsApp.
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button type="submit" variant="primary" disabled={isSaving} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Save size={18} /> {isSaving ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </form>
        )}

        {/* SYSTEM & BACKUP */}
        {activeTab === 'system' && (
          <div>
            <h3 style={{ margin: '0 0 1.5rem 0', color: '#1e293b', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              System Health & Diagnostics
            </h3>

            {/* Performance Indicators */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
              gap: '1.5rem', 
              marginBottom: '2rem' 
            }}>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Server style={{ color: '#3b82f6' }} size={24} />
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>SERVER TYPE</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>NodeJS Express/TS</div>
                </div>
              </div>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Database style={{ color: '#10b981' }} size={24} />
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>DATABASE</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>PostgreSQL (Sequelize)</div>
                </div>
              </div>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Activity style={{ color: '#8b5cf6' }} size={24} />
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>API VERSION</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>v1.0.4-production</div>
                </div>
              </div>
            </div>

            {/* System Actions */}
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem' }}>
              <h4 style={{ margin: '0 0 1rem 0', color: '#1e293b', fontSize: '1rem' }}>Administrative Tasks</h4>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                {/* Backup Button */}
                <div style={{ 
                  flex: '1 1 300px', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '8px', 
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  background: '#fafafa'
                }}>
                  <div>
                    <h5 style={{ margin: '0 0 0.5rem 0', color: '#0f172a', fontSize: '0.95rem', fontWeight: 600 }}>Full Database Backup</h5>
                    <p style={{ margin: '0 0 1.25rem 0', color: '#64748b', fontSize: '0.8rem', lineHeight: 1.4 }}>
                      Create a compressed SQL snapshot of the entire StudyFlow database schema, including all workspace metrics, seat plans, and credentials.
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={handleBackup} 
                    disabled={isBackingUp}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                  >
                    <RefreshCw className={isBackingUp ? 'animate-spin' : ''} size={16} style={{ animation: isBackingUp ? 'spin 1s linear infinite' : undefined }} />
                    {isBackingUp ? 'Backing Up...' : 'Trigger SQL Backup'}
                  </Button>
                </div>

                {/* Clear Cache Button */}
                <div style={{ 
                  flex: '1 1 300px', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '8px', 
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  background: '#fafafa'
                }}>
                  <div>
                    <h5 style={{ margin: '0 0 0.5rem 0', color: '#0f172a', fontSize: '0.95rem', fontWeight: 600 }}>Flush Memory Cache</h5>
                    <p style={{ margin: '0 0 1.25rem 0', color: '#64748b', fontSize: '0.8rem', lineHeight: 1.4 }}>
                      Clears session stores, transient authorization tokens, and temporary data caches. Highly recommended after performing backend migrations.
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={handleClearCache} 
                    disabled={isClearingCache}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', borderColor: '#ef4444', color: '#ef4444' }}
                  >
                    <RefreshCw className={isClearingCache ? 'animate-spin' : ''} size={16} style={{ animation: isClearingCache ? 'spin 1s linear infinite' : undefined }} />
                    {isClearingCache ? 'Clearing Cache...' : 'Flush Cache'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Custom Spinner Animation Style */}
            <style dangerouslySetInnerHTML={{
              __html: `
                @keyframes spin {
                  from { transform: rotate(0deg); }
                  to { transform: rotate(360deg); }
                }
              `
            }} />
          </div>
        )}

      </div>
    </div>
  );
}
