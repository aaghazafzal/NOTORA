import { useState, useEffect, useRef } from "react";
import { Document, Page, pdfjs, Outline } from 'react-pdf';
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  Minimize, 
  Download, 
  Printer, 
  Moon, 
  Sun,
  BookOpen,
  FileText,
  Menu,
  List,
  LayoutGrid,
  UnfoldHorizontal,
  UnfoldVertical,
  RotateCcw
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";

pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

export default function RealBookReader({ book }: { book: any }) {
  const [numPages, setNumPages] = useState<number>();
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1);
  const [isTwoPage, setIsTwoPage] = useState<boolean>(false);
  const [invertColors, setInvertColors] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [rotation, setRotation] = useState<number>(0);
  
  const [isEditingZoom, setIsEditingZoom] = useState<boolean>(false);
  const [zoomInput, setZoomInput] = useState<string>("100");
  
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [sidebarTab, setSidebarTab] = useState<'thumbnails' | 'outline'>('outline');
  
  const [pageInput, setPageInput] = useState<string>("1");
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);

  const handleFitToWidth = () => {
    if (!viewerRef.current) return;
    const pageEl = viewerRef.current.querySelector('.react-pdf__Page') as HTMLElement;
    if (pageEl) {
      // Find original width by dividing current rendered width by current scale
      const currentWidth = pageEl.clientWidth;
      const originalWidth = currentWidth / scale;
      
      const padding = window.innerWidth < 768 ? 32 : 64; // Account for p-4 (16*2) or p-8 (32*2)
      // Account for scrollbar width approx 16px
      const targetWidth = viewerRef.current.clientWidth - padding - 16;
      
      let newScale = targetWidth / originalWidth;
      if (actualTwoPage) newScale = newScale / 2;
      
      setScale(Math.max(0.1, Math.min(5, newScale)));
      setZoomInput(Math.round(Math.max(0.1, Math.min(5, newScale)) * 100).toString());
    }
  };

  const handleFitToPage = () => {
    if (!viewerRef.current) return;
    const pageEl = viewerRef.current.querySelector('.react-pdf__Page') as HTMLElement;
    if (pageEl) {
      const currentHeight = pageEl.clientHeight;
      const originalHeight = currentHeight / scale;
      
      const padding = window.innerWidth < 768 ? 32 : 64;
      const targetHeight = viewerRef.current.clientHeight - padding;
      
      let newScale = targetHeight / originalHeight;
      setScale(Math.max(0.1, Math.min(5, newScale)));
      setZoomInput(Math.round(Math.max(0.1, Math.min(5, newScale)) * 100).toString());
    }
  };

  useEffect(() => {
    // Open sidebar by default on desktop
    if (window.innerWidth >= 1024) {
      setIsSidebarOpen(true);
    }
  }, []);

  const fileUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:9090'}/api/download/${book.id}?inline=true`;
  const downloadUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:9090'}/api/download/${book.id}`;

  useEffect(() => {
    setPageInput(pageNumber.toString());
  }, [pageNumber]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setPageNumber(1);
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const handlePrint = () => {
    const toastId = toast.loading("Preparing document for printing...");
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = fileUrl;
    document.body.appendChild(iframe);
    
    iframe.onload = () => {
      setTimeout(() => {
        toast.dismiss(toastId);
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (e) {
          toast.error("Failed to print document. Please try downloading instead.");
        }
        // Cleanup iframe after a delay to ensure print dialog opened
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 1000 * 60);
      }, 1000); // Give PDF renderer a moment to parse
    };
  };

  const handlePageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(pageInput, 10);
    if (!isNaN(parsed) && numPages && parsed >= 1 && parsed <= numPages) {
      setPageNumber(parsed);
    } else {
      setPageInput(pageNumber.toString());
    }
  };

  const pageAdvance = isTwoPage ? 2 : 1;
  const canGoPrev = pageNumber > 1;
  const canGoNext = numPages ? pageNumber + pageAdvance - 1 < numPages : false;

  const handlePrev = () => {
    setPageNumber(p => Math.max(1, p - pageAdvance));
  };

  const handleNext = () => {
    if (numPages) {
      setPageNumber(p => Math.min(numPages, p + pageAdvance));
    }
  };

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const actualTwoPage = !isMobile && isTwoPage;

  return (
    <TooltipProvider>
      <div 
        ref={containerRef} 
        className="flex h-dvh flex-col bg-[#0F0F16] text-white transition-colors duration-300"
      >
        {/* Top Toolbar */}
        <header className="flex h-14 flex-none items-center justify-between border-b border-white/10 px-2 sm:px-4 bg-[#1A1A24] shadow-md z-10">
          <div className="flex items-center gap-2 sm:gap-4 overflow-hidden">
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10 shrink-0" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              <Menu className="h-5 w-5" />
            </Button>
            {!isFullscreen && (
              <Button asChild variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10 shrink-0">
                <Link to="/book/$bookId" params={{ bookId: book.slug }}>
                  <X className="h-5 w-5" />
                </Link>
              </Button>
            )}
            <div className="min-w-0 hidden sm:block">
              <div className="truncate text-sm font-semibold">{book.title}</div>
              <div className="truncate text-xs text-white/50">{book.authorName}</div>
            </div>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Zoom Controls */}
            <div className="flex items-center bg-black/30 rounded-lg p-1 border border-white/10">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10" onClick={() => setScale(s => Math.max(0.1, s - 0.1))}>
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Zoom Out</TooltipContent>
              </Tooltip>
              {isEditingZoom ? (
                <Input
                  className="h-6 w-14 text-xs font-mono text-center p-0 bg-white/10 border-none focus-visible:ring-1 focus-visible:ring-primary mx-1"
                  autoFocus
                  value={zoomInput}
                  onChange={(e) => setZoomInput(e.target.value)}
                  onBlur={() => {
                    setIsEditingZoom(false);
                    const val = parseInt(zoomInput, 10);
                    if (!isNaN(val)) {
                      setScale(Math.min(5, Math.max(0.1, val / 100)));
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setIsEditingZoom(false);
                      const val = parseInt(zoomInput, 10);
                      if (!isNaN(val)) {
                        setScale(Math.min(5, Math.max(0.1, val / 100)));
                      }
                    } else if (e.key === "Escape") {
                      setIsEditingZoom(false);
                    }
                  }}
                />
              ) : (
                <span 
                  className="text-xs font-mono w-14 text-center select-none cursor-pointer hover:text-primary transition-colors"
                  onClick={() => {
                    setZoomInput(Math.round(scale * 100).toString());
                    setIsEditingZoom(true);
                  }}
                >
                  {Math.round(scale * 100)}%
                </span>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10" onClick={() => setScale(s => Math.min(5, s + 0.1))}>
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Zoom In</TooltipContent>
              </Tooltip>
            </div>

            {/* Fit Controls */}
            <div className="hidden sm:flex items-center bg-black/30 rounded-lg p-1 border border-white/10 ml-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10" onClick={handleFitToWidth}>
                    <UnfoldHorizontal className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Fit to Width</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10" onClick={handleFitToPage}>
                    <UnfoldVertical className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Fit to Page</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10" onClick={() => setRotation(r => (r - 90) % 360)}>
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Rotate Counter-Clockwise</TooltipContent>
              </Tooltip>
            </div>

            {/* View Modes */}
            <div className="hidden md:flex items-center bg-black/30 rounded-lg p-1 border border-white/10 ml-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={`h-8 w-8 ${!actualTwoPage ? 'bg-white/20' : 'hover:bg-white/10'}`} 
                    onClick={() => setIsTwoPage(false)}
                  >
                    <FileText className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Single Page View</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={`h-8 w-8 ${actualTwoPage ? 'bg-white/20' : 'hover:bg-white/10'}`} 
                    onClick={() => setIsTwoPage(true)}
                  >
                    <BookOpen className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Two Page View</TooltipContent>
              </Tooltip>
            </div>

            {/* Actions */}
            <div className="flex items-center bg-black/30 rounded-lg p-1 border border-white/10 ml-1 sm:ml-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10" onClick={() => setInvertColors(!invertColors)}>
                    {invertColors ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{invertColors ? "Light Mode PDF" : "Dark Mode PDF"}</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10" onClick={toggleFullscreen}>
                    {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{isFullscreen ? "Exit Fullscreen" : "Fullscreen"}</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10 hidden sm:inline-flex" onClick={handlePrint}>
                    <Printer className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Print</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10" asChild>
                    <a href={downloadUrl} download={`${book.title}.pdf`}>
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Download</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </header>

        {/* Main Area: Sidebar + Viewer */}
        <div className="flex-1 flex overflow-hidden relative">
          
          {/* Sidebar */}
          <div 
            className={`flex-none bg-[#12121A] border-r border-white/10 flex flex-col transition-all duration-300 z-40
              ${isSidebarOpen ? 'translate-x-0 w-64 lg:w-72 absolute lg:relative h-full' : '-translate-x-full w-0 absolute lg:relative h-full'}`}
          >
            {isSidebarOpen && (
              <>
                <div className="flex items-center justify-between p-2 border-b border-white/10">
                  <div className="flex gap-1 w-full">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className={`flex-1 flex gap-2 h-8 rounded-sm ${sidebarTab === 'outline' ? 'bg-white/10' : 'hover:bg-white/5 text-white/60'}`}
                      onClick={() => setSidebarTab('outline')}
                    >
                      <List className="h-4 w-4" /> <span className="text-xs">Outline</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className={`flex-1 flex gap-2 h-8 rounded-sm ${sidebarTab === 'thumbnails' ? 'bg-white/10' : 'hover:bg-white/5 text-white/60'}`}
                      onClick={() => setSidebarTab('thumbnails')}
                    >
                      <LayoutGrid className="h-4 w-4" /> <span className="text-xs">Pages</span>
                    </Button>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 lg:hidden ml-1 hover:bg-white/10 shrink-0" onClick={() => setIsSidebarOpen(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 outline-sidebar">
                  {numPages && (
                    <Document
                      file={fileUrl}
                      className="w-full"
                    >
                      {sidebarTab === 'outline' && (
                        <Outline 
                          className="text-sm text-white/80 space-y-2 [&_ul]:pl-4 [&_ul]:space-y-1 [&_li>a]:hover:text-primary [&_li>a]:transition-colors [&_li]:mt-1" 
                          onItemClick={({ pageNumber }) => { 
                            setPageNumber(Number(pageNumber)); 
                            if (isMobile) setIsSidebarOpen(false);
                          }} 
                        />
                      )}
                      {sidebarTab === 'thumbnails' && (
                        <div className="flex flex-col gap-4 items-center">
                          {Array.from(new Array(numPages), (el, index) => (
                            <div 
                              key={`thumb_${index + 1}`}
                              className={`cursor-pointer transition-all border-2 rounded overflow-hidden ${pageNumber === index + 1 ? 'border-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]' : 'border-transparent hover:border-white/20'}`}
                              onClick={() => {
                                setPageNumber(index + 1);
                                if (isMobile) setIsSidebarOpen(false);
                              }}
                            >
                              <Page
                                pageNumber={index + 1}
                                width={120}
                                renderTextLayer={false}
                                renderAnnotationLayer={false}
                                loading={<div className="w-[120px] h-[160px] bg-white/5 animate-pulse" />}
                              />
                              <div className="text-center text-xs mt-1 text-white/50">{index + 1}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </Document>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Main Viewer */}
          <div 
            ref={viewerRef}
            className="flex-1 overflow-auto bg-[#0a0a0f] flex justify-center p-4 lg:p-8 relative custom-scrollbar" 
            onClick={() => isMobile && isSidebarOpen && setIsSidebarOpen(false)}
          >
            <Document
              file={fileUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={(error) => console.error("PDF load error:", error)}
            loading={
              <div className="flex h-full items-center justify-center text-white/50 absolute inset-0">
                <div className="flex flex-col items-center gap-4">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent shadow-lg shadow-primary/20" />
                  <p className="font-medium animate-pulse">Initializing Premium Reader...</p>
                </div>
              </div>
            }
            error={
              <div className="flex flex-col h-full items-center justify-center text-red-400 absolute inset-0 gap-4">
                <FileText className="h-12 w-12 opacity-50" />
                <p className="font-semibold text-lg">Failed to load PDF.</p>
                <p className="text-sm opacity-70">The file might be corrupted or inaccessible.</p>
              </div>
            }
            className={`flex ${actualTwoPage ? 'flex-row gap-4 lg:gap-8 items-start justify-center' : 'flex-col items-center'} transition-all duration-300`}
          >
            {numPages && (
              <>
                <div 
                  className={`transition-all duration-300 ${invertColors ? 'invert hue-rotate-180' : ''}`}
                  style={{ filter: invertColors ? 'invert(1) hue-rotate(180deg) brightness(0.95) contrast(0.95)' : 'none' }}
                >
                  <Page 
                    pageNumber={pageNumber} 
                    scale={scale}
                    rotate={rotation}
                    className="shadow-2xl max-w-full rounded-md overflow-hidden bg-white"
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                    width={isMobile ? window.innerWidth - 32 : undefined}
                  />
                </div>
                
                {actualTwoPage && pageNumber + 1 <= numPages && (
                  <div 
                    className={`transition-all duration-300 hidden md:block ${invertColors ? 'invert hue-rotate-180' : ''}`}
                    style={{ filter: invertColors ? 'invert(1) hue-rotate(180deg) brightness(0.95) contrast(0.95)' : 'none' }}
                  >
                    <Page 
                      pageNumber={pageNumber + 1} 
                      scale={scale}
                      rotate={rotation}
                      className="shadow-2xl max-w-full rounded-md overflow-hidden bg-white"
                      renderTextLayer={true}
                      renderAnnotationLayer={true}
                    />
                  </div>
                )}
              </>
            )}
          </Document>
        </div>
      </div>

        {/* Bottom Navigation Toolbar */}
        {numPages && (
          <footer className="h-16 flex-none bg-[#1A1A24] border-t border-white/10 px-4 sm:px-8 flex items-center justify-between gap-4 z-10 shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
            <Button 
              variant="outline" 
              onClick={handlePrev} 
              disabled={!canGoPrev}
              className="bg-black/50 text-white border-white/20 hover:bg-white/10 hover:text-white shrink-0 hidden sm:flex"
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Prev
            </Button>
            <Button 
              variant="outline" 
              size="icon"
              onClick={handlePrev} 
              disabled={!canGoPrev}
              className="bg-black/50 text-white border-white/20 hover:bg-white/10 hover:text-white shrink-0 sm:hidden"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex-1 max-w-2xl flex items-center gap-4 mx-auto">
              <Slider
                value={[pageNumber]}
                max={numPages}
                min={1}
                step={pageAdvance}
                onValueChange={(val) => setPageNumber(val[0])}
                className="cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <form onSubmit={handlePageSubmit} className="flex items-center gap-2 bg-black/30 rounded-md border border-white/10 px-2 py-1">
                <Input 
                  className="w-12 h-7 bg-transparent border-none text-right px-1 font-mono text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
                  value={pageInput}
                  onChange={(e) => setPageInput(e.target.value)}
                  onBlur={() => setPageInput(pageNumber.toString())}
                />
                <span className="text-sm text-white/50 select-none">/ {numPages}</span>
              </form>

              <Button 
                variant="outline" 
                onClick={handleNext} 
                disabled={!canGoNext}
                className="bg-black/50 text-white border-white/20 hover:bg-white/10 hover:text-white shrink-0 hidden sm:flex ml-2"
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
              <Button 
                variant="outline" 
                size="icon"
                onClick={handleNext} 
                disabled={!canGoNext}
                className="bg-black/50 text-white border-white/20 hover:bg-white/10 hover:text-white shrink-0 sm:hidden ml-1"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </footer>
        )}
      </div>
    </TooltipProvider>
  );
}
