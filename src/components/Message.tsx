import { User, Bot, Copy, Check, RefreshCw, AlertCircle, RotateCcw, GitBranch } from 'lucide-react';
import { useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Message as MessageType } from '../types';
import { ToolCallCard } from './ToolCallCard';
import { useContextMenu, ContextMenuItem } from './ContextMenu';

interface MessageProps {
  message: MessageType;
  messageIndex?: number;
  onRetry?: (messageId: string, content: string) => void;
  onRegenerate?: (messageId: string) => void;
  onBranch?: (messageIndex: number) => void;
}

export function Message({ message, messageIndex, onRetry, onRegenerate, onBranch }: MessageProps) {
  const [copied, setCopied] = useState(false);
  const { showContextMenu } = useContextMenu();
  const isUser = message.role === 'user';
  const time = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const hasSelection = window.getSelection()?.toString().trim();
    const items: ContextMenuItem[] = [];

    // Copy selection (if any)
    if (hasSelection) {
      items.push({
        label: 'Copy Selection',
        shortcut: 'Ctrl+C',
        action: () => document.execCommand('copy'),
      });
      items.push({ divider: true });
    }

    // Copy message
    items.push({
      label: 'Copy Message',
      action: handleCopy,
    });

    // Regenerate (for assistant messages)
    if (!isUser && onRegenerate && !message.hasError) {
      items.push({
        label: 'Regenerate Response',
        action: () => onRegenerate(message.id),
      });
    }

    // Retry (for failed messages)
    if (message.hasError && onRetry) {
      items.push({
        label: 'Retry',
        action: () => onRetry(message.id, message.content),
      });
    }

    // Branch
    if (onBranch && messageIndex !== undefined) {
      items.push({ divider: true });
      items.push({
        label: 'Create Branch',
        action: () => onBranch(messageIndex),
      });
    }

    showContextMenu(e, items);
  }, [message, messageIndex, isUser, onRetry, onRegenerate, onBranch, handleCopy, showContextMenu]);

  return (
    <div 
      className={`flex gap-3 p-4 ${isUser ? 'bg-bg-secondary' : 'bg-bg-primary'}`}
      onContextMenu={handleContextMenu}
      data-context-menu
    >
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 flex items-center justify-center ${
          isUser ? 'bg-accent' : 'bg-purple-600'
        }`}
      >
        {isUser ? <User size={16} className="text-white" /> : <Bot size={16} className="text-white" />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm text-text-primary">
            {isUser ? 'You' : 'Copilot'}
          </span>
          <span className="text-xs text-text-secondary">{time}</span>
          {message.isStreaming && (
            <span className="text-xs text-accent animate-pulse">typing...</span>
          )}
        </div>

        <div className="text-sm text-text-primary">
          {message.content ? (
            isUser ? (
              <div className="whitespace-pre-wrap break-words">{message.content}</div>
            ) : (
              <MarkdownContent content={message.content} />
            )
          ) : message.isStreaming ? (
            <span className="text-text-secondary italic">Thinking...</span>
          ) : null}
        </div>

        {/* Message actions */}
        {message.content && !message.isStreaming && (
          <div className="mt-2 flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-2 py-1 text-xs text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors"
              title="Copy message"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-success" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
            {!isUser && onRegenerate && !message.hasError && (
              <button
                onClick={() => onRegenerate(message.id)}
                className="flex items-center gap-1 px-2 py-1 text-xs text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors"
                title="Regenerate response"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Regenerate</span>
              </button>
            )}
            {onBranch && messageIndex !== undefined && (
              <button
                onClick={() => onBranch(messageIndex)}
                className="flex items-center gap-1 px-2 py-1 text-xs text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors"
                title="Create branch from this message"
              >
                <GitBranch className="w-3 h-3" />
                <span>Branch</span>
              </button>
            )}
          </div>
        )}

        {/* Tool calls for agent mode */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mt-3 space-y-2">
            {message.toolCalls.map((toolCall) => (
              <ToolCallCard key={toolCall.id} toolCall={toolCall} />
            ))}
          </div>
        )}

        {/* Error indicator and retry button */}
        {message.hasError && (
          <div className="mt-3 flex items-start gap-2 p-2 bg-error/10 border border-error/30">
            <AlertCircle className="w-4 h-4 text-error flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="text-xs text-error font-medium mb-1">Message failed</div>
              {message.errorMessage && (
                <div className="text-xs text-error/80 mb-2">{message.errorMessage}</div>
              )}
              {message.retryCount !== undefined && message.retryCount > 0 && (
                <div className="text-xs text-error/70 mb-2">
                  Retry attempt {message.retryCount}
                </div>
              )}
              {onRetry && (
                <button
                  onClick={() => onRetry(message.id, message.content)}
                  className="flex items-center gap-1.5 px-2 py-1 text-xs bg-error/20 hover:bg-error/30 border border-error/40 text-error transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Retry</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface MarkdownContentProps {
  content: string;
}

function MarkdownContent({ content }: MarkdownContentProps) {
  return (
    <div className="markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            const codeString = String(children).replace(/\n$/, '');
            const isInline = !language && !String(children).includes('\n');

            return !isInline && language ? (
              <CodeBlock code={codeString} language={language} />
            ) : (
              <code className="inline-code" {...props}>
                {children}
              </code>
            );
          },
          p({ children }) {
            return <p className="mb-3 last:mb-0">{children}</p>;
          },
          ul({ children }) {
            return <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>;
          },
          li({ children }) {
            return <li className="text-text-primary">{children}</li>;
          },
          h1({ children }) {
            return <h1 className="text-xl font-bold mb-3 text-text-primary">{children}</h1>;
          },
          h2({ children }) {
            return <h2 className="text-lg font-bold mb-2 text-text-primary">{children}</h2>;
          },
          h3({ children }) {
            return <h3 className="text-base font-bold mb-2 text-text-primary">{children}</h3>;
          },
          blockquote({ children }) {
            return (
              <blockquote className="border-l-4 border-accent pl-4 my-3 text-text-secondary italic">
                {children}
              </blockquote>
            );
          },
          a({ href, children }) {
            return (
              <a href={href} className="text-accent hover:underline" target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            );
          },
          table({ children }) {
            return (
              <div className="overflow-x-auto my-3">
                <table className="border-collapse border border-border w-full">{children}</table>
              </div>
            );
          },
          th({ children }) {
            return (
              <th className="border border-border px-3 py-2 bg-bg-secondary text-left font-semibold">
                {children}
              </th>
            );
          },
          td({ children }) {
            return <td className="border border-border px-3 py-2">{children}</td>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

interface CodeBlockProps {
  code: string;
  language: string;
}

function CodeBlock({ code, language }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="code-block-wrapper my-3">
      <div className="flex items-center justify-between bg-[#1e1e1e] px-4 py-2 border-b border-[#333]">
        <span className="text-xs text-gray-400">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-400 hover:text-white hover:bg-[#2a2a2a] transition-colors"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check size={14} />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy size={14} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <SyntaxHighlighter
        language={language}
        style={vscDarkPlus}
        customStyle={{
          margin: 0,
          borderRadius: 0,
          fontSize: '13px',
          lineHeight: '1.5',
        }}
        codeTagProps={{
          style: {
            fontFamily: 'Consolas, Monaco, "Courier New", monospace',
          },
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}
