import { X, Github } from 'lucide-react';

interface AboutDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AboutDialog({ isOpen, onClose }: AboutDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      {/* Dialog */}
      <div className="relative w-80 bg-bg-primary border border-border shadow-2xl overflow-hidden">
        {/* Header accent bar */}
        <div className="h-1 bg-accent" />
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 text-text-secondary hover:text-text-primary transition-colors"
        >
          <X size={16} />
        </button>

        {/* Content */}
        <div className="px-6 py-8">
          {/* App Title with Icon */}
          <div className="flex items-center gap-4 mb-6">
            {/* App Icon */}
            <div className="w-16 h-16 bg-accent flex items-center justify-center flex-shrink-0">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="w-9 h-9 text-white"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                />
              </svg>
            </div>
            {/* App Name */}
            <div>
              <h1 className="text-base font-medium text-text-primary">
                Remote Pilot for GitHub Copilot
              </h1>
            </div>
          </div>

          {/* Info grid */}
          <div className="space-y-3 text-xs">
            <div className="flex justify-between">
              <span className="text-text-secondary">Version</span>
              <span className="text-text-primary font-mono">0.0.1</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Build</span>
              <span className="text-text-primary font-mono">Tauri + React</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">License</span>
              <span className="text-text-primary">MIT</span>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-border my-6" />

          {/* Footer */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-text-secondary">
              © 2025 William Sawyerr. All rights reserved.
            </p>
            <a
              href="https://github.com/Yuxi-Labs/github-copilot-remote-pilot-desktop"
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors"
              title="View on GitHub"
            >
              <Github size={16} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
