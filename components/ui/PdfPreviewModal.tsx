"use client";

import React, { useState } from "react";
import {
  X,
  Download,
  ExternalLink,
  FileText,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Printer,
} from "lucide-react";

interface PdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  fileUrl: string;
  version?: string;
  fileSize?: string;
  format?: string;
}

export function PdfPreviewModal({
  isOpen,
  onClose,
  title,
  fileUrl,
  version = "v2026.1",
  fileSize = "PDF",
  format = "PDF",
}: PdfPreviewModalProps) {
  const [isLoading, setIsLoading] = useState(true);

  if (!isOpen) return null;

  const downloadUrl = fileUrl.startsWith("data:") || fileUrl.startsWith("blob:")
    ? fileUrl
    : fileUrl.includes("?")
    ? `${fileUrl}&download=1`
    : `${fileUrl}?download=1`;

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = `${title.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Top Header Bar */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3 min-w-0 pr-4">
            <div className="w-9 h-9 rounded-xl bg-unitech-red/20 border border-unitech-red/30 flex items-center justify-center shrink-0 text-unitech-red">
              <FileText className="w-5 h-5 text-red-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-heading font-black text-sm sm:text-base text-white truncate max-w-md">
                  {title}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30">
                  {format}
                </span>
                {version && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                    {version}
                  </span>
                )}
                {fileSize && (
                  <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                    · {fileSize}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 truncate mt-0.5 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Verified Unitech OEM Factory Document · Sahibabad Site 2 Plant</span>
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleDownload}
              className="px-3.5 py-1.5 rounded-xl bg-unitech-red hover:bg-unitech-darkred text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm shadow-unitech-red/25 cursor-pointer"
              title="Download file to computer"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download PDF</span>
            </button>

            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1 border border-slate-700 cursor-pointer"
              title="Open full page in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Full Tab</span>
            </a>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PDF Viewer Body */}
        <div className="flex-1 bg-slate-100 relative overflow-hidden flex flex-col">
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 text-slate-500 z-10 gap-3">
              <RefreshCw className="w-7 h-7 animate-spin text-unitech-red" />
              <span className="text-xs font-semibold">Loading Technical Document Preview...</span>
            </div>
          )}

          <iframe
            src={`${fileUrl}#toolbar=1&navpanes=0`}
            className="w-full flex-1 border-0"
            title={title}
            onLoad={() => setIsLoading(false)}
          />

          {/* Fallback bar if browser PDF viewer blocked */}
          <div className="px-4 py-2 bg-slate-200/80 border-t border-slate-300 flex items-center justify-between text-xs text-slate-600 shrink-0">
            <span>
              If preview does not display inside your browser, use the direct actions:
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={handleDownload}
                className="font-bold text-unitech-red hover:underline flex items-center gap-1"
              >
                <Download className="w-3 h-3" /> Direct Download
              </button>
              <span>·</span>
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-slate-900 hover:underline flex items-center gap-1"
              >
                <ExternalLink className="w-3 h-3" /> Open in New Window
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Footer Ribbon */}
        <div className="px-5 py-2.5 bg-white border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 shrink-0 font-medium">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Direct OEM Specification · ISO 9001:2015 & BIS Approved Equipment</span>
          </div>
          <div className="text-slate-400 hidden sm:block">
            Unitech Security Systems Pvt. Ltd. (UP, India)
          </div>
        </div>
      </div>
    </div>
  );
}

