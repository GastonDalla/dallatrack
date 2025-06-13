import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

interface MarkdownProps {
  content: string;
  className?: string;
}

export function Markdown({ content, className }: MarkdownProps) {
  return (
    <div className={cn("prose prose-sm max-w-none dark:prose-invert overflow-hidden", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-xl font-bold mb-3 text-foreground break-words">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-semibold mb-2 text-foreground break-words">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-medium mb-2 text-foreground break-words">{children}</h3>
          ),
          p: ({ children }) => (
            <p className="mb-2 text-foreground leading-relaxed break-words overflow-wrap-anywhere">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside mb-2 space-y-1 text-foreground pl-2">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside mb-2 space-y-1 text-foreground pl-2">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="text-foreground break-words overflow-wrap-anywhere">{children}</li>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground break-words">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-foreground break-words">{children}</em>
          ),
          code: ({ children, className }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code className="bg-muted px-1 py-0.5 rounded text-sm font-mono text-foreground break-all overflow-wrap-anywhere">
                  {children}
                </code>
              );
            }
            return (
              <div className="bg-muted p-3 rounded-lg overflow-x-auto mb-2 max-w-full">
                <code className="text-sm font-mono text-foreground whitespace-pre-wrap break-words block">
                  {children}
                </code>
              </div>
            );
          },
          pre: ({ children }) => (
            <div className="bg-muted p-3 rounded-lg overflow-x-auto mb-2 max-w-full">
              <pre className="whitespace-pre-wrap break-words text-sm font-mono text-foreground">
                {children}
              </pre>
            </div>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground mb-2 break-words">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto mb-2 max-w-full">
              <table className="min-w-full border-collapse border border-border">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-border px-2 py-1 bg-muted font-semibold text-left text-foreground break-words">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-border px-2 py-1 text-foreground break-words overflow-wrap-anywhere">
              {children}
            </td>
          ),
          a: ({ children, href }) => (
            <a 
              href={href} 
              className="text-primary hover:underline break-all overflow-wrap-anywhere"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
} 