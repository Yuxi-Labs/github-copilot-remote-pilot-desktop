import { X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { version as reactVersion } from 'react';
import { getVersion, getTauriVersion } from '@tauri-apps/api/app';

interface AboutDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AboutDialog({ isOpen, onClose }: AboutDialogProps) {
  const [appVersion, setAppVersion] = useState<string>('...');
  const [tauriVersion, setTauriVersion] = useState<string>('...');

  useEffect(() => {
    if (isOpen) {
      getVersion().then(setAppVersion);
      getTauriVersion().then(setTauriVersion);
    }
  }, [isOpen]);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      {/* Dialog */}
      <div className="relative w-[420px] bg-bg-secondary shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text-secondary hover:text-text-primary transition-colors"
        >
          <X size={18} />
        </button>

        {/* Header: Icon + Title + Description */}
        <div className="flex items-start gap-4 px-6 pt-6 pb-5">
          {/* App Icon - squared */}
          <div className="w-[72px] h-[72px] bg-bg-tertiary border border-border flex items-center justify-center flex-shrink-0">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="w-10 h-10 text-text-primary"
            >
              <path
                strokeLinecap="square"
                strokeLinejoin="miter"
                d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
              />
            </svg>
          </div>

          {/* Title + Description */}
          <div className="pt-1 flex-1">
            <h1 className="text-xl font-bold text-text-primary leading-tight">
              Remote Pilot<br />
              for GitHub Copilot
            </h1>
            <p className="text-sm text-text-secondary mt-1 leading-snug">
              Desktop client for GitHub Copilot Controller
            </p>
          </div>
        </div>

        {/* Version Table */}
        <div className="mx-6 mb-5 border border-border bg-bg-primary">
          <div className="flex justify-between px-4 py-2.5">
            <span className="text-sm text-text-primary">Application</span>
            <span className="text-sm text-text-secondary">{appVersion}</span>
          </div>
          <div className="flex justify-between px-4 py-2.5">
            <span className="text-sm text-text-primary">React</span>
            <span className="text-sm text-text-secondary">{reactVersion}</span>
          </div>
          <div className="flex justify-between px-4 py-2.5">
            <span className="text-sm text-text-primary">Tauri</span>
            <span className="text-sm text-text-secondary">{tauriVersion}</span>
          </div>
        </div>

        {/* Footer: Copyright + Close button */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between">
          <p className="text-xs text-text-secondary">
            © 2025 William Sawyerr
            <span className="mx-2">—</span>
            <span>All rights reserved</span>
          </p>

          <button
            onClick={onClose}
            className="px-6 py-1.5 bg-bg-tertiary border border-border text-sm text-text-primary hover:bg-bg-hover transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
