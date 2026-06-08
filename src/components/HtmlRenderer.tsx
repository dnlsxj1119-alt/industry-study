import React from 'react';
import { cn } from '../lib/utils';
import { TextWithLinks } from './TextWithLinks';

interface HtmlRendererProps {
  content: string;
  className?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
}

export function HtmlRenderer({ content, className, prefix, suffix }: HtmlRendererProps) {
  // 간단한 휴리스틱: HTML 태그(예: <p>, <h1> 등)가 포함되어 있으면 HTML로 렌더링하고,
  // 없으면 일반 텍스트로 간주하여 줄바꿈을 유지합니다.
  const isHtml = /<[a-z][\s\S]*>/i.test(content);

  if (isHtml) {
    return (
      <div 
        className={cn("prose prose-sm sm:prose-base max-w-none prose-a:text-primary-600 prose-a:no-underline hover:prose-a:underline", className)}
      >
        {prefix}
        <div dangerouslySetInnerHTML={{ __html: content }} />
        {suffix}
      </div>
    );
  }

  return (
    <div className={cn("whitespace-pre-wrap leading-relaxed", className)}>
      {prefix}
      <TextWithLinks text={content} />
      {suffix}
    </div>
  );
}
