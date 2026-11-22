"use client";

import React, { useState, useEffect } from "react";
import {
  CreditCard,
  QrCode,
  Building2,
  Upload,
  Save,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  Eye,
  Info,
} from "lucide-react";

interface PaymentSettingsEditorProps {
  onNotify?: (msg: string) => void;
}

const UPI_REGEX = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const ACCOUNT_NO_REGEX = /^\d{9,18}$/;

export function PaymentSettingsEditor({ onNotify }: PaymentSettingsEditorProps) {
  const [form, setForm] = useState({
    upiId: "",
    payeeName: "",
    bankName: "",
    accountName: "",
    accountNumber: "",
    ifsc: "",
    branch: "",
    useDynamicQr: true,
    paymentNote: "Please complete payment via UPI or IMPS/NEFT and enter your UTR / Transaction Reference Number below.",
    qrImageUrl: "",
    qrImageFileId: "",
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingQr, setIsUploadingQr] = useState(false);
  const [isDecodingQr, setIsDecodingQr] = useState(false);
  const [detectedQrUpiId, setDetectedQrUpiId] = useState<string | null>(null);
  const [previewTab, setPreviewTab] = useState<"UPI" | "BANK">("UPI");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [autoFilledNote, setAutoFilledNote] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/admin/payment-settings")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          const d = json.data;
          setForm({
            upiId: d.upiId || "",
            payeeName: d.payeeName || "",
            bankName: d.bankName || "",
            accountName: d.accountName || "",
            accountNumber: d.accountNumber || "",
            ifsc: d.ifsc || "",
            branch: d.branch || "",
            useDynamicQr: d.useDynamicQr !== undefined ? d.useDynamicQr : true,
            paymentNote: d.paymentNote || "",
            qrImageUrl: d.qrImageUrl || "",
            qrImageFileId: d.qrImageFileId || "",
          });
        }
      })
      .catch((err) => console.error("[PaymentSettings fetch error]:", err))
      .finally(() => setIsLoading(false));
  }, []);

  // Check mismatch whenever upiId or detectedQrUpiId changes
  const isMismatch = Boolean(
    detectedQrUpiId &&
    form.upiId &&
    detectedQrUpiId.toLowerCase().trim() !== form.upiId.toLowerCase().trim()
  );

  const validateForm = () => {
    const errs: Record<string, string> = {};

    if (form.useDynamicQr) {
      if (!form.upiId.trim()) errs.upiId = "UPI ID is required when Dynamic QR is enabled.";
      if (!form.payeeName.trim()) errs.payeeName = "Payee name is required when Dynamic QR is enabled.";
    }

    if (form.upiId && !UPI_REGEX.test(form.upiId.trim())) {
      errs.upiId = "Invalid UPI ID. Format: name@bank (e.g. business@icici)";
    }

    if (form.ifsc && !IFSC_REGEX.test(form.ifsc.trim().toUpperCase())) {
      errs.ifsc = "Invalid IFSC format. Expected 4 letters, 0, then 6 alphanumeric characters (e.g. ABCD0123456)";
    }

    if (form.accountNumber && !ACCOUNT_NO_REGEX.test(form.accountNumber.trim())) {
      errs.accountNumber = "Account number must contain only 9 to 18 numeric digits.";
    }

    const hasAnyBank = Boolean(form.bankName.trim() || form.accountName.trim() || form.accountNumber.trim() || form.ifsc.trim());
    if (hasAnyBank) {
      if (!form.bankName.trim()) errs.bankName = "Bank name is required.";
      if (!form.accountName.trim()) errs.accountName = "Account holder name is required.";
      if (!form.accountNumber.trim()) errs.accountNumber = "Account number is required.";
      if (!form.ifsc.trim()) errs.ifsc = "IFSC code is required.";
    }

    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      setSaveError(Object.values(errs)[0]);
      return false;
    }
    return true;
  };

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingQr(true);
    setIsDecodingQr(true);
    setDetectedQrUpiId(null);
    setAutoFilledNote(null);
    setSaveError(null);

    try {
      // Direct raw upload to dedicated endpoint (no canvas compression)
      const fd = new FormData();
      fd.append("file", file);

      const uploadRes = await fetch("/api/admin/payment-settings/qr-upload", {
        method: "POST",
        body: fd,
      });
      const uploadJson = await uploadRes.json();

      if (!uploadRes.ok || !uploadJson.success) {
        throw new Error(uploadJson.error || "Failed to upload QR image.");
      }

      setForm((prev) => {
        const shouldAutoFill = !prev.upiId && Boolean(uploadJson.decodedUpiId);
        if (shouldAutoFill) {
          setAutoFilledNote(`Auto-detected from QR: ${uploadJson.decodedUpiId}`);
        }
        return {
          ...prev,
          qrImageUrl: uploadJson.url,
          qrImageFileId: uploadJson.id,
          upiId: shouldAutoFill ? uploadJson.decodedUpiId : prev.upiId,
        };
      });

      if (uploadJson.decodedUpiId) {
        setDetectedQrUpiId(uploadJson.decodedUpiId);
        onNotify?.(`QR code decoded: detected UPI ID ${uploadJson.decodedUpiId}`);
      } else {
        onNotify?.("QR uploaded successfully. Original uncompressed image stored in DB.");
      }
    } catch (err: any) {
      console.error("[QR upload error]:", err);
      setSaveError(err.message);
      onNotify?.(`Upload error: ${err.message}`);
    } finally {
      setIsUploadingQr(false);
      setIsDecodingQr(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSavedSuccess(false);
    setSaveError(null);

    try {
      const res = await fetch("/api/admin/payment-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          ifsc: form.ifsc ? form.ifsc.trim().toUpperCase() : null,
          upiId: form.upiId ? form.upiId.trim() : null,
          accountNumber: form.accountNumber ? form.accountNumber.trim() : null,
          accountName: form.accountName ? form.accountName.trim() : null,
          bankName: form.bankName ? form.bankName.trim() : null,
          payeeName: form.payeeName ? form.payeeName.trim() : null,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        if (json.errors) {
          setErrors(json.errors);
        }
        const errorMsg = json.error || "Failed to update payment settings.";
        setSaveError(errorMsg);
        onNotify?.(errorMsg);
        return;
      }

      setErrors({});
      setSavedSuccess(true);
      onNotify?.("Payment settings saved successfully!");
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err: any) {
      console.error("[Save payment settings error]:", err);
      setSaveError(err.message);
      onNotify?.(`Error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        <span>Loading payment settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-heading font-black text-slate-900 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-unitech-red" />
            Payment Settings
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Configure direct UPI, dynamic QR code generation, and official bank transfer details for customer checkout.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 disabled:opacity-50 transition-all shadow-xs cursor-pointer self-start sm:self-auto"
        >
          {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{isSaving ? "Saving..." : "Save Settings"}</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Payment configuration saved successfully! Storefront checkout has been updated.</span>
        </div>
      )}

      {saveError && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{saveError}</span>
          </div>
          <button
            type="button"
            onClick={() => setSaveError(null)}
            className="text-red-500 hover:text-red-700 font-bold px-2 py-0.5 rounded"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Grid: Form Left, Preview Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form Fields (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* UPI Settings */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">UPI & QR Configuration</h3>
              </div>
              <span className="text-[11px] font-mono font-medium text-slate-400">Step 1</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">UPI ID (VPA)</label>
                <input
                  type="text"
                  placeholder="e.g. company@icici"
                  value={form.upiId}
                  onChange={(e) => setForm({ ...form, upiId: e.target.value })}
                  className={`w-full px-3.5 py-2 text-xs rounded-xl border font-mono transition-all outline-none ${
                    errors.upiId ? "border-red-300 focus:border-red-500 bg-red-50/30" : "border-slate-200 focus:border-slate-400"
                  }`}
                />
                {autoFilledNote && <p className="text-[11px] text-emerald-600 font-medium mt-1">✓ {autoFilledNote}</p>}
                {errors.upiId && <p className="text-[11px] text-red-600 mt-1">{errors.upiId}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Payee / Business Name</label>
                <input
                  type="text"
                  placeholder="e.g. Unitech CCTV Systems"
                  value={form.payeeName}
                  onChange={(e) => setForm({ ...form, payeeName: e.target.value })}
                  className={`w-full px-3.5 py-2 text-xs rounded-xl border transition-all outline-none ${
                    errors.payeeName ? "border-red-300 focus:border-red-500 bg-red-50/30" : "border-slate-200 focus:border-slate-400"
                  }`}
                />
                {errors.payeeName && <p className="text-[11px] text-red-600 mt-1">{errors.payeeName}</p>}
              </div>
            </div>

            {/* Dynamic QR Toggle */}
            <div className="pt-2">
              <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.useDynamicQr}
                  onChange={(e) => setForm({ ...form, useDynamicQr: e.target.checked })}
                  className="w-4 h-4 rounded text-slate-900 focus:ring-0"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Use Dynamic QR Generation (Recommended)</span>
                  <span className="text-[11px] text-slate-500 block">
                    Automatically encodes the exact server-calculated order total and order number directly into customer QR code.
                  </span>
                </div>
              </label>
            </div>

            {/* QR Image Upload */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Static QR Image Upload (Fallback or Primary)
              </label>
              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl border border-slate-200 cursor-pointer transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isUploadingQr ? "Uploading..." : "Upload QR Image"}</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleQrUpload}
                    className="hidden"
                    disabled={isUploadingQr}
                  />
                </label>
                {form.qrImageUrl && (
                  <span className="text-[11px] text-slate-500 font-mono truncate max-w-[200px]">
                    {form.qrImageUrl}
                  </span>
                )}
              </div>
              {errors.qrImageFileId && <p className="text-[11px] text-red-600 mt-1">{errors.qrImageFileId}</p>}
              <p className="text-[11px] text-slate-400 mt-1">
                Accepted: PNG or JPG. Original uncompressed image stored directly in DB; verified via server-side QR decoder.
              </p>
            </div>

            {/* QR Decode Feedback & Mismatch Warning */}
            {detectedQrUpiId && (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">QR Decoded UPI ID:</span>
                  <span className="font-mono font-bold text-slate-900">{detectedQrUpiId}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Entered UPI ID:</span>
                  <span className="font-mono font-bold text-slate-900">{form.upiId || "(none entered)"}</span>
                </div>

                {isMismatch && (
                  <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-300 text-amber-800 flex items-start gap-2 mt-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-[11px]">
                      <strong className="block font-bold">UPI ID Mismatch Detected:</strong>
                      The QR code contains <code className="bg-amber-100 px-1 py-0.5 rounded">{detectedQrUpiId}</code>, but you entered <code className="bg-amber-100 px-1 py-0.5 rounded">{form.upiId}</code>. Please align them to ensure payments reach your account.
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bank Transfer Settings */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Direct Bank Transfer (NEFT / RTGS / IMPS)</h3>
              </div>
              <span className="text-[11px] font-mono font-medium text-slate-400">Step 2</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Beneficiary Account Name</label>
                <input
                  type="text"
                  placeholder="e.g. UNITECH CCTV SYSTEMS"
                  value={form.accountName}
                  onChange={(e) => setForm({ ...form, accountName: e.target.value })}
                  className={`w-full px-3.5 py-2 text-xs rounded-xl border transition-all outline-none ${
                    errors.accountName ? "border-red-300 focus:border-red-500 bg-red-50/30" : "border-slate-200 focus:border-slate-400"
                  }`}
                />
                {errors.accountName && <p className="text-[11px] text-red-600 mt-1">{errors.accountName}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Bank Name</label>
                <input
                  type="text"
                  placeholder="e.g. HDFC Bank"
                  value={form.bankName}
                  onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                  className={`w-full px-3.5 py-2 text-xs rounded-xl border transition-all outline-none ${
                    errors.bankName ? "border-red-300 focus:border-red-500 bg-red-50/30" : "border-slate-200 focus:border-slate-400"
                  }`}
                />
                {errors.bankName && <p className="text-[11px] text-red-600 mt-1">{errors.bankName}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Account Number (9–18 digits)</label>
                <input
                  type="text"
                  placeholder="e.g. 123456789012"
                  value={form.accountNumber}
                  onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                  className={`w-full px-3.5 py-2 text-xs rounded-xl border font-mono transition-all outline-none ${
                    errors.accountNumber ? "border-red-300 focus:border-red-500 bg-red-50/30" : "border-slate-200 focus:border-slate-400"
                  }`}
                />
                {errors.accountNumber && <p className="text-[11px] text-red-600 mt-1">{errors.accountNumber}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">IFSC Code (11 alphanumeric)</label>
                <input
                  type="text"
                  placeholder="e.g. ABCD0123456"
                  value={form.ifsc}
                  onChange={(e) => setForm({ ...form, ifsc: e.target.value.toUpperCase() })}
                  className={`w-full px-3.5 py-2 text-xs rounded-xl border font-mono uppercase transition-all outline-none ${
                    errors.ifsc ? "border-red-300 focus:border-red-500 bg-red-50/30" : "border-slate-200 focus:border-slate-400"
                  }`}
                />
                {errors.ifsc && <p className="text-[11px] text-red-600 mt-1">{errors.ifsc}</p>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Branch Name / Location</label>
              <input
                type="text"
                placeholder="e.g. Industrial Area, Ghaziabad"
                value={form.branch}
                onChange={(e) => setForm({ ...form, branch: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:border-slate-400 transition-all outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Customer Payment Instructions / Note</label>
              <textarea
                rows={3}
                placeholder="Instructions displayed to customers during checkout payment step..."
                value={form.paymentNote}
                onChange={(e) => setForm({ ...form, paymentNote: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:border-slate-400 transition-all outline-none"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Live Customer Preview (5 cols) */}
        <div className="lg:col-span-5 sticky top-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-slate-500" />
              Storefront Customer Live Preview
            </span>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-bold">
              Real-Time
            </span>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
            <div className="pb-3 border-b border-slate-100">
              <span className="text-[10px] font-mono font-bold text-slate-400 block">Step 2 of 2</span>
              <h4 className="font-heading font-black text-lg text-slate-900">Direct UPI & Bank Transfer</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {form.paymentNote || "Transfer to Unitech official account and submit your UTR reference number below."}
              </p>
            </div>

            {/* Mode Selector Tabs */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPreviewTab("UPI")}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  previewTab === "UPI"
                    ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                    : "bg-slate-50 text-slate-700 border-slate-200"
                }`}
              >
                <div className="font-bold text-[11px] flex items-center gap-1">
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Instant UPI / QR</span>
                </div>
                <div className="text-[9px] opacity-70">GPay, PhonePe, Paytm</div>
              </button>

              <button
                type="button"
                onClick={() => setPreviewTab("BANK")}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  previewTab === "BANK"
                    ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                    : "bg-slate-50 text-slate-700 border-slate-200"
                }`}
              >
                <div className="font-bold text-[11px] flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>NEFT / RTGS</span>
                </div>
                <div className="text-[9px] opacity-70">NetBanking Account</div>
              </button>
            </div>

            {/* UPI Preview */}
            {previewTab === "UPI" && (
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-3">
                <div className="w-36 h-36 mx-auto bg-white rounded-xl border-2 border-dashed border-slate-300 p-2 flex flex-col items-center justify-center shadow-2xs">
                  {form.qrImageUrl ? (
                    <img src={form.qrImageUrl} alt="QR Code Preview" className="w-full h-full object-contain" />
                  ) : (
                    <>
                      <QrCode className="w-20 h-20 text-slate-800" />
                      <span className="text-[9px] font-mono font-bold text-slate-500 mt-1 truncate max-w-[120px]">
                        {form.upiId || "upi@bank"}
                      </span>
                    </>
                  )}
                </div>

                <div className="flex items-center justify-center gap-2">
                  <span className="text-[11px] font-mono font-bold text-slate-800 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                    UPI ID: {form.upiId || "Not Configured"}
                  </span>
                </div>

                <div className="font-heading font-black text-sm text-slate-900">
                  Scan to Pay <span className="text-emerald-700">[Order Total]</span>
                </div>
              </div>
            )}

            {/* Bank Preview */}
            {previewTab === "BANK" && (
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2.5">
                <div className="font-bold text-slate-900 text-xs border-b border-slate-200 pb-1.5">
                  Official Corporate Bank Account:
                </div>
                <div className="space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Beneficiary:</span>
                    <span className="font-bold text-slate-900">{form.accountName || "—"}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Account No:</span>
                    <span className="font-bold text-slate-900">{form.accountNumber || "—"}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Bank & IFSC:</span>
                    <span className="font-bold text-slate-900">
                      {form.bankName || "—"} · {form.ifsc || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Branch:</span>
                    <span className="font-bold text-slate-900">{form.branch || "—"}</span>
                  </div>
                </div>
              </div>
            )}

            {/* UTR Input Mockup */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <label className="block text-[11px] font-bold text-slate-700">UTR / Transaction Reference</label>
              <input
                type="text"
                disabled
                placeholder="e.g. 432109876543 (customer inputs after payment)"
                className="w-full px-3 py-2 text-[11px] rounded-xl border border-slate-200 bg-slate-50 text-slate-400 font-mono"
              />
              <button
                type="button"
                disabled
                className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold opacity-80"
              >
                Place Verified Order
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
