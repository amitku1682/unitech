"use client";

import React, { useState, useEffect } from "react";
import {
  Mail,
  Server,
  Lock,
  Send,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Plus,
  X,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Bell,
  Check,
} from "lucide-react";
import { EmailSettings, EmailLogEntry } from "@/lib/types";

interface EmailSettingsEditorProps {
  onNotify?: (msg: string) => void;
}

export function EmailSettingsEditor({ onNotify }: EmailSettingsEditorProps) {
  const [settings, setSettings] = useState<EmailSettings>({
    id: 1,
    isEnabled: false,
    smtpHost: "",
    smtpPort: 587,
    smtpSecure: false,
    smtpUser: "",
    hasPassword: false,
    senderEmail: "sales@unitechcctv.com",
    senderName: "Unitech CCTV Sales",
    adminNotificationEmails: [],
    notifyOnOrderReceived: true,
    notifyOnPaymentConfirmed: true,
    notifyOnPaymentRejected: true,
    notifyAdminOnOrder: true,
    notifyAdminOnEnquiry: true,
  });

  const [passwordInput, setPasswordInput] = useState<string>("");
  const [isChangingPassword, setIsChangingPassword] = useState<boolean>(false);
  const [newAdminEmail, setNewAdminEmail] = useState<string>("");

  const [logs, setLogs] = useState<EmailLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isKeyMissing, setIsKeyMissing] = useState<boolean>(false);

  // Test email state
  const [testRecipient, setTestRecipient] = useState<string>("");
  const [isSendingTest, setIsSendingTest] = useState<boolean>(false);
  const [testStatus, setTestStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/admin/email-settings", { cache: "no-store" });
      const json = await res.json();
      if (json.hasEncryptionKey === false) {
        setIsKeyMissing(true);
      } else {
        setIsKeyMissing(false);
      }
      if (json.success && json.data) {
        setSettings(json.data);
        if (!json.data.hasPassword) {
          setIsChangingPassword(true);
        }
      }
      if (json.logs && Array.isArray(json.logs)) {
        setLogs(json.logs);
      }
    } catch (err: any) {
      setSaveError("Failed to load email settings from server.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    setSavedSuccess(false);

    try {
      const payload: any = {
        isEnabled: settings.isEnabled,
        smtpHost: settings.smtpHost.trim(),
        smtpPort: Number(settings.smtpPort),
        smtpSecure: Boolean(settings.smtpSecure),
        smtpUser: settings.smtpUser.trim(),
        senderEmail: settings.senderEmail.trim(),
        senderName: settings.senderName.trim(),
        adminNotificationEmails: settings.adminNotificationEmails,
        notifyOnOrderReceived: settings.notifyOnOrderReceived,
        notifyOnPaymentConfirmed: settings.notifyOnPaymentConfirmed,
        notifyOnPaymentRejected: settings.notifyOnPaymentRejected,
        notifyAdminOnOrder: settings.notifyAdminOnOrder,
        notifyAdminOnEnquiry: settings.notifyAdminOnEnquiry,
      };

      if (isChangingPassword && passwordInput.trim().length > 0) {
        payload.smtpPassword = passwordInput.trim();
      }

      const res = await fetch("/api/admin/email-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to update email settings.");
      }

      setSettings(json.data);
      setPasswordInput("");
      setIsChangingPassword(false);
      setSavedSuccess(true);
      if (onNotify) onNotify("Email settings saved successfully.");
      setTimeout(() => setSavedSuccess(false), 4000);

      // Refresh logs
      loadData();
    } catch (err: any) {
      setSaveError(err.message || "Failed to save settings.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddAdminEmail = () => {
    const email = newAdminEmail.trim();
    if (!email) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      alert("Please enter a valid email address.");
      return;
    }
    if (settings.adminNotificationEmails.includes(email)) {
      setNewAdminEmail("");
      return;
    }
    setSettings({
      ...settings,
      adminNotificationEmails: [...settings.adminNotificationEmails, email],
    });
    setNewAdminEmail("");
  };

  const handleRemoveAdminEmail = (emailToRemove: string) => {
    setSettings({
      ...settings,
      adminNotificationEmails: settings.adminNotificationEmails.filter((e) => e !== emailToRemove),
    });
  };

  const handleSendTestEmail = async () => {
    const target = testRecipient.trim();
    if (!target || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(target)) {
      setTestStatus({ type: "error", message: "Please provide a valid recipient email address for testing." });
      return;
    }

    setIsSendingTest(true);
    setTestStatus(null);

    try {
      const res = await fetch("/api/admin/email-settings/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientEmail: target }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Test dispatch failed.");
      }
      setTestStatus({
        type: "success",
        message: json.message || `Test email sent successfully to ${target}!`,
      });
      loadData();
    } catch (err: any) {
      setTestStatus({
        type: "error",
        message: err.message || "Failed to send test email.",
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center text-slate-500 font-mono flex items-center justify-center gap-2">
        <RefreshCw className="w-4 h-4 animate-spin text-unitech-red" />
        <span>Loading outbound email configuration...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-slate-900 text-white rounded-2xl shadow-sm border border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Mail className="w-6 h-6 text-unitech-red" />
            <h2 className="text-xl font-black font-heading tracking-tight">Outbound SMTP Email Notifications</h2>
          </div>
          <p className="text-xs text-slate-400">
            Configure SMTP credentials for automated customer order receipts, payment confirmations, and admin sales alerts.
          </p>
          <p className="text-[11px] text-amber-400/90 font-medium">
            ℹ️ These settings are also used for admin password reset emails — keep them configured.
          </p>
        </div>

        {/* Master Active Status Pill */}
        <div className="flex items-center gap-3">
          <label className="flex items-center cursor-pointer select-none gap-3 bg-slate-800/80 px-4 py-2.5 rounded-xl border border-slate-700">
            <span className="text-xs font-bold text-slate-300">
              {settings.isEnabled ? "SYSTEM ACTIVE" : "SYSTEM DISABLED"}
            </span>
            <input
              type="checkbox"
              checked={settings.isEnabled}
              onChange={(e) => setSettings({ ...settings, isEnabled: e.target.checked })}
              className="w-5 h-5 accent-unitech-red rounded cursor-pointer"
            />
          </label>
        </div>
      </div>

      {/* Status Notice */}
      <div
        className={`p-4 rounded-xl border flex items-center gap-3 text-xs font-medium ${
          settings.isEnabled
            ? "bg-emerald-50 border-emerald-200 text-emerald-800"
            : "bg-slate-100 border-slate-200 text-slate-600"
        }`}
      >
        {settings.isEnabled ? (
          <>
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <strong>Email notifications are ACTIVE.</strong> Order receipts, payment confirmations, and sales desk alerts will be sent automatically via your configured SMTP server.
            </div>
          </>
        ) : (
          <>
            <ShieldAlert className="w-5 h-5 text-slate-400 shrink-0" />
            <div>
              <strong>Email notifications are currently DISABLED.</strong> Orders, UTR submissions, and enquiries will still be accepted normally, but no emails will be sent.
            </div>
          </>
        )}
      </div>

      {isKeyMissing && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Email is disabled: SETTINGS_ENCRYPTION_KEY is not set on the server.</span>
        </div>
      )}

      {saveError && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-medium flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Email settings saved successfully!</span>
        </div>
      )}

      {/* SMTP Server Configuration Form */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
          <Server className="w-5 h-5 text-slate-700" />
          <h3 className="font-heading font-extrabold text-slate-900 text-base">SMTP Server Connection</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-bold text-slate-700">SMTP Host / Server Address</label>
            <input
              type="text"
              value={settings.smtpHost}
              onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })}
              placeholder="e.g. smtp.gmail.com, smtp.zoho.in, email-smtp.us-east-1.amazonaws.com"
              className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-unitech-red/20 focus:border-unitech-red"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Port</label>
            <input
              type="number"
              value={settings.smtpPort}
              onChange={(e) => setSettings({ ...settings, smtpPort: parseInt(e.target.value) || 587 })}
              placeholder="587"
              className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-unitech-red/20 focus:border-unitech-red"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Encryption Security</label>
            <select
              value={settings.smtpSecure ? "ssl" : "starttls"}
              onChange={(e) => setSettings({ ...settings, smtpSecure: e.target.value === "ssl" })}
              className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-unitech-red/20 focus:border-unitech-red"
            >
              <option value="starttls">STARTTLS (Port 587 / 25)</option>
              <option value="ssl">SSL / TLS (Port 465)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">SMTP Username / User</label>
            <input
              type="text"
              value={settings.smtpUser}
              onChange={(e) => setSettings({ ...settings, smtpUser: e.target.value })}
              placeholder="e.g. notifications@unitechcctv.com"
              className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-unitech-red/20 focus:border-unitech-red"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>SMTP Password</span>
              {settings.hasPassword && !isChangingPassword && (
                <button
                  type="button"
                  onClick={() => setIsChangingPassword(true)}
                  className="text-[10px] font-bold text-unitech-red hover:underline"
                >
                  Change Password
                </button>
              )}
            </label>

            {settings.hasPassword && !isChangingPassword ? (
              <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-100 rounded-xl border border-slate-300 text-xs text-slate-500 font-mono">
                <span>••••••••••••••••</span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Saved & Encrypted
                </span>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder={settings.hasPassword ? "Enter new SMTP password" : "Enter SMTP password"}
                  className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-unitech-red/20 focus:border-unitech-red"
                />
                {settings.hasPassword && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsChangingPassword(false);
                      setPasswordInput("");
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500 hover:text-slate-800"
                  >
                    Cancel
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Sender Email Address (From)</label>
            <input
              type="email"
              value={settings.senderEmail}
              onChange={(e) => setSettings({ ...settings, senderEmail: e.target.value })}
              placeholder="sales@unitechcctv.com"
              className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-unitech-red/20 focus:border-unitech-red"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Sender Display Name</label>
            <input
              type="text"
              value={settings.senderName}
              onChange={(e) => setSettings({ ...settings, senderName: e.target.value })}
              placeholder="Unitech CCTV Sales"
              className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-unitech-red/20 focus:border-unitech-red"
            />
          </div>
        </div>
      </div>

      {/* Admin Notification Recipients */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Bell className="w-5 h-5 text-slate-700" />
          <h3 className="font-heading font-extrabold text-slate-900 text-base">Admin Alert Recipients</h3>
        </div>
        <p className="text-xs text-slate-500">
          These email addresses will receive alerts whenever a new order is placed or a customer submits a storefront enquiry form.
        </p>

        <div className="flex flex-wrap gap-2 pt-1">
          {settings.adminNotificationEmails.map((email, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg border border-slate-200 transition-colors"
            >
              <span>{email}</span>
              <button
                type="button"
                onClick={() => handleRemoveAdminEmail(email)}
                className="text-slate-400 hover:text-red-600 transition-colors"
                title="Remove recipient"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}

          {settings.adminNotificationEmails.length === 0 && (
            <div className="text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
              No admin alert recipients configured. Add at least one address below to receive new order and lead alerts.
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <input
            type="email"
            value={newAdminEmail}
            onChange={(e) => setNewAdminEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddAdminEmail();
              }
            }}
            placeholder="admin@unitechcctv.com or salesdesk@unitechcctv.com"
            className="flex-1 max-w-md px-3.5 py-2 bg-slate-50 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-unitech-red/20 focus:border-unitech-red"
          />
          <button
            type="button"
            onClick={handleAddAdminEmail}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Recipient</span>
          </button>
        </div>
      </div>

      {/* Trigger Event Toggles */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="font-heading font-extrabold text-slate-900 text-base pb-3 border-b border-slate-100">
          Automated Notification Triggers
        </h3>

        <div className="space-y-3">
          <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100/70 border border-slate-200 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={settings.notifyOnOrderReceived}
              onChange={(e) => setSettings({ ...settings, notifyOnOrderReceived: e.target.checked })}
              className="w-4 h-4 mt-0.5 accent-unitech-red cursor-pointer"
            />
            <div className="text-xs">
              <span className="font-bold text-slate-900">Customer: Order Placed & Payment Submitted</span>
              <p className="text-slate-500 mt-0.5">
                Sends an instant branded order receipt with item breakdown, GST, total amount, and UTR reference to customer email.
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100/70 border border-slate-200 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={settings.notifyOnPaymentConfirmed}
              onChange={(e) => setSettings({ ...settings, notifyOnPaymentConfirmed: e.target.checked })}
              className="w-4 h-4 mt-0.5 accent-unitech-red cursor-pointer"
            />
            <div className="text-xs">
              <span className="font-bold text-slate-900">Customer: Payment Confirmed by Admin</span>
              <p className="text-slate-500 mt-0.5">
                Notifies customer that their UTR has been reconciled and hardware order is processing for warehouse dispatch.
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100/70 border border-slate-200 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={settings.notifyOnPaymentRejected}
              onChange={(e) => setSettings({ ...settings, notifyOnPaymentRejected: e.target.checked })}
              className="w-4 h-4 mt-0.5 accent-unitech-red cursor-pointer"
            />
            <div className="text-xs">
              <span className="font-bold text-slate-900">Customer: Payment Verification Failed</span>
              <p className="text-slate-500 mt-0.5">
                Alerts customer if the submitted UTR could not be verified by accounts desk with instructions to contact support.
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100/70 border border-slate-200 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={settings.notifyAdminOnOrder}
              onChange={(e) => setSettings({ ...settings, notifyAdminOnOrder: e.target.checked })}
              className="w-4 h-4 mt-0.5 accent-unitech-red cursor-pointer"
            />
            <div className="text-xs">
              <span className="font-bold text-slate-900">Admin Desk: New Order Alert</span>
              <p className="text-slate-500 mt-0.5">
                Dispatches a notification to all Admin Alert Recipients with customer details, item totals, and UTR for verification.
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100/70 border border-slate-200 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={settings.notifyAdminOnEnquiry}
              onChange={(e) => setSettings({ ...settings, notifyAdminOnEnquiry: e.target.checked })}
              className="w-4 h-4 mt-0.5 accent-unitech-red cursor-pointer"
            />
            <div className="text-xs">
              <span className="font-bold text-slate-900">Admin Desk: New Lead / Enquiry Alert</span>
              <p className="text-slate-500 mt-0.5">
                Sends an instant email alert when a visitor or dealer submits an inquiry on the Contact or Dealer Hub pages.
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-3 bg-unitech-red hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              <span>Save Email Configuration</span>
            </>
          )}
        </button>
      </div>

      {/* Test Email Section */}
      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
          <Send className="w-4 h-4 text-unitech-red" />
          <h3 className="font-heading font-extrabold text-slate-900 text-sm">Send Test Email</h3>
        </div>
        <p className="text-xs text-slate-600">
          Verify that your SMTP connection, credentials, and firewall settings are properly configured by sending a test message.
        </p>

        <div className="flex flex-col sm:flex-row gap-2 max-w-xl">
          <input
            type="email"
            value={testRecipient}
            onChange={(e) => setTestRecipient(e.target.value)}
            placeholder="recipient@example.com"
            className="flex-1 px-3.5 py-2.5 bg-white rounded-xl border border-slate-300 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-unitech-red/20 focus:border-unitech-red"
          />
          <button
            type="button"
            onClick={handleSendTestEmail}
            disabled={isSendingTest}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {isSendingTest ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Sending Test...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Dispatch Test Email</span>
              </>
            )}
          </button>
        </div>

        {testStatus && (
          <div
            className={`p-3 rounded-xl border text-xs font-medium ${
              testStatus.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            {testStatus.message}
          </div>
        )}
      </div>

      {/* Recent Email Logs Table */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-600" />
            <h3 className="font-heading font-extrabold text-slate-900 text-sm">Recent Email Dispatch Logs</h3>
          </div>
          <button
            type="button"
            onClick={loadData}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Logs</span>
          </button>
        </div>

        {logs.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 font-mono">
            No email dispatch logs recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 font-bold">Timestamp</th>
                  <th className="py-2.5 font-bold">Recipient</th>
                  <th className="py-2.5 font-bold">Subject</th>
                  <th className="py-2.5 font-bold">Template</th>
                  <th className="py-2.5 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 text-slate-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        day: "2-digit",
                        month: "short",
                      })}
                    </td>
                    <td className="py-2.5 text-slate-800 font-bold max-w-[150px] truncate" title={log.toEmail}>
                      {log.toEmail}
                    </td>
                    <td className="py-2.5 text-slate-600 max-w-[200px] truncate" title={log.subject}>
                      {log.subject}
                    </td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] text-slate-700">
                        {log.templateType}
                      </span>
                    </td>
                    <td className="py-2.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          log.status === "sent"
                            ? "bg-emerald-100 text-emerald-800"
                            : log.status === "disabled"
                            ? "bg-slate-100 text-slate-600"
                            : "bg-red-100 text-red-800"
                        }`}
                        title={log.errorMessage || undefined}
                      >
                        {log.status}
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
