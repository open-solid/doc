import { useEffect } from 'react';
import { useDocs } from '../../hooks/useDocs';
import { useNavigation } from '../../hooks/useNavigation';
import { MarkdownRenderer } from './MarkdownRenderer';
import { Spinner } from '../Spinner';

export function DocsPage() {
  const { view } = useNavigation();
  const { content, loadingContent, fetchContent } = useDocs();

  const path = view.type === 'doc' ? view.path : '';
  const anchor = view.type === 'doc' ? view.anchor : undefined;

  useEffect(() => {
    if (path) {
      fetchContent(path);
    }
  }, [path, fetchContent]);

  useEffect(() => {
    if (!loadingContent && content && anchor) {
      requestAnimationFrame(() => {
        document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth' });
      });
    }
  }, [loadingContent, content, anchor]);

  if (loadingContent) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner />
      </div>
    );
  }

  if (!content) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-sm text-slate-500">Document not found.</p>
      </div>
    );
  }

  return <MarkdownRenderer content={content} />;
}
