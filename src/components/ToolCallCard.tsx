import { FileText, FileEdit, Terminal, Search, Brain, CheckCircle, XCircle, Loader2, Clock } from 'lucide-react';
import { ToolCall } from '../types';

interface ToolCallCardProps {
  toolCall: ToolCall;
}

export function ToolCallCard({ toolCall }: ToolCallCardProps) {
  const getIcon = () => {
    const iconProps = { size: 16, className: 'flex-shrink-0' };
    switch (toolCall.type) {
      case 'file_read': return <FileText {...iconProps} />;
      case 'file_write': return <FileEdit {...iconProps} />;
      case 'file_edit': return <FileEdit {...iconProps} />;
      case 'terminal': return <Terminal {...iconProps} />;
      case 'search': return <Search {...iconProps} />;
      case 'thinking': return <Brain {...iconProps} />;
      default: return null;
    }
  };

  const getStatusIcon = () => {
    const iconProps = { size: 14 };
    switch (toolCall.status) {
      case 'pending': return <Clock {...iconProps} className="text-text-secondary" />;
      case 'running': return <Loader2 {...iconProps} className="text-accent animate-spin" />;
      case 'success': return <CheckCircle {...iconProps} className="text-success" />;
      case 'error': return <XCircle {...iconProps} className="text-error" />;
    }
  };

  const getStatusColor = () => {
    switch (toolCall.status) {
      case 'pending': return 'border-border bg-bg-secondary';
      case 'running': return 'border-accent/30 bg-accent/5';
      case 'success': return 'border-success/30 bg-success/5';
      case 'error': return 'border-error/30 bg-error/5';
    }
  };

  const getStatusText = () => {
    switch (toolCall.status) {
      case 'pending': return 'Queued';
      case 'running': return 'Running';
      case 'success': return 'Complete';
      case 'error': return 'Failed';
    }
  };

  return (
    <div className={`flex items-start gap-3 p-3 border ${getStatusColor()} transition-colors`}>
      <div className="flex items-center justify-center w-8 h-8 bg-bg-tertiary">
        {getIcon()}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-text-primary">{toolCall.description}</span>
          {getStatusIcon()}
        </div>
        
        {toolCall.details && (
          <div className="text-xs text-text-secondary font-mono mt-1 break-all">
            {toolCall.details}
          </div>
        )}
        
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-text-secondary">{getStatusText()}</span>
          <span className="text-xs text-text-secondary">•</span>
          <span className="text-xs text-text-secondary">
            {new Date(toolCall.timestamp).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit',
              second: '2-digit'
            })}
          </span>
        </div>
      </div>
    </div>
  );
}
