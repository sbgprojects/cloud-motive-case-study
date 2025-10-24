// src/components/PDFViewer.tsx
import { useState, useRef, useImperativeHandle, forwardRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set up the worker for PDF.js
const pdfjsWorker = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

interface PDFViewerProps {
  file: string | File | null;
  className?: string;
}

export interface PDFViewerHandle {
  highlightText: (text: string) => void;
}

const PDFViewer = forwardRef<PDFViewerHandle, PDFViewerProps>(({ 
  file, 
  className = '' 
}, ref) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [scale, setScale] = useState<number>(1.0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Expose the highlightText method via ref
  useImperativeHandle(ref, () => ({
    highlightText: (text: string) => {
      if (!containerRef.current || !text) return { found: false };

      // Remove previous highlights
      const highlights = containerRef.current.querySelectorAll<HTMLElement>('.highlighted-text');
      highlights.forEach((highlight: HTMLElement) => {
        highlight.classList.remove('highlighted-text', 'bg-yellow-300');
      });

      // Search through all text layers
      const textLayers = containerRef.current.querySelectorAll('.react-pdf__Page__textContent');
      let firstMatch: HTMLElement | null = null;
      const searchText = text.toLowerCase();
      let found = false;

      textLayers.forEach((layer: Element) => {
        const walker = document.createTreeWalker(
          layer,
          NodeFilter.SHOW_TEXT,
          { acceptNode: () => NodeFilter.FILTER_ACCEPT }
        );

        let node: Node | null;
        while ((node = walker.nextNode())) {
          if (node.nodeValue && node.nodeValue.toLowerCase().includes(searchText)) {
            found = true;
            const parent = node.parentNode as HTMLElement;
            if (parent && !parent.classList.contains('highlighted-text')) {
              // Highlight the text
              parent.classList.add('highlighted-text', 'bg-yellow-300');
              
              // Save the first match for scrolling
              if (!firstMatch) {
                firstMatch = parent;
              }
            }
          }
        }
      });

      // Scroll to the first match if found
      if (firstMatch) {
        firstMatch.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }

      return { found };
    }
  }));

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
  };

  const zoomIn = () => setScale(prev => Math.min(prev + 0.1, 2.0));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.1, 0.5));

  return (
    <div className={`pdf-viewer ${className}`}>
      <div className="flex justify-between items-center mb-4 sticky top-0 bg-white dark:bg-gray-900 z-10 p-2 px-4 border-b dark:border-gray-700">
        <div className="text-sm text-gray-600 dark:text-gray-300">
          {numPages} {numPages === 1 ? 'page' : 'pages'}
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={zoomOut} 
            className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="Zoom out"
            title="Zoom out"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <span className="px-2 py-1.5 text-sm">{Math.round(scale * 100)}%</span>
          <button 
            onClick={zoomIn} 
            className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="Zoom in"
            title="Zoom in"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
        </div>
      </div>

      <div 
        ref={containerRef} 
        className="pdf-container overflow-y-auto"
        style={{ height: 'calc(100vh - 128px)' }}
      >
        <Document
          file={file}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="flex items-center justify-center h-64">
              <div className="animate-pulse">Loading PDF...</div>
            </div>
          }
          error={
            <div className="flex items-center justify-center h-64 text-red-500 p-4 text-center">
              Failed to load PDF. Please check the file and try again.
            </div>
          }
        >
          {Array.from({ length: numPages }, (_, index) => (
            <div key={`page_${index + 1}`} className="mb-4">
              <Page
                pageNumber={index + 1}
                scale={scale}
                width={800}
                renderTextLayer={true}
                renderAnnotationLayer={true}
                loading={
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-pulse">Loading page {index + 1}...</div>
                  </div>
                }
              />
            </div>
          ))}
        </Document>
      </div>
    </div>
  );
});

PDFViewer.displayName = 'PDFViewer';

export default PDFViewer;
