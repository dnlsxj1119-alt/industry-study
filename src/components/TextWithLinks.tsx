import React from 'react';

interface TextWithLinksProps {
  text: string;
  className?: string;
}

export function TextWithLinks({ text, className = '' }: TextWithLinksProps) {
  // URL matching regex (http, https)
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  
  const parts = text.split(urlRegex);

  return (
    <p className={`whitespace-pre-wrap break-words ${className}`}>
      {parts.map((part, index) => {
        if (part.match(urlRegex)) {
          return (
            <a
              key={index}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()} // Prevent card clicks if inside a card
              className="text-primary-600 hover:text-primary-800 hover:underline break-all"
            >
              {part}
            </a>
          );
        }
        return <React.Fragment key={index}>{part}</React.Fragment>;
      })}
    </p>
  );
}
