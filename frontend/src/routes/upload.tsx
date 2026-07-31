import { useState, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Upload as UploadIcon, FileText, Check, ChevronRight, Image as ImageIcon, Loader2, Plus, Edit2, Book as BookIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { ALL_GENRES } from "@/data/books";
import { useAuthStore } from "@/store/useAuthStore";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BookCard } from "@/components/BookCard";
import { Badge } from "@/components/ui/badge";
import { coverStyle } from "@/lib/cover";

export const Route = createFileRoute("/upload")({
  head: () => ({
    meta: [
      { title: "Creator Dashboard — LumenPages" },
      { name: "description", content: "Manage your uploads and publish new books." },
    ],
  }),
  component: UploadPage,
});

function UploadPage() {
  const [view, setView] = useState<"dashboard" | "wizard">("dashboard");
  const [step, setStep] = useState(0);
  const [bookFile, setBookFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [genre, setGenre] = useState(ALL_GENRES[0]);
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  
  const [uploading, setUploading] = useState(0);
  const [processing, setProcessing] = useState(false);
  
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, loading } = useAuthStore();

  useEffect(() => {
    if (!loading && !user) {
      toast.error("You must be logged in to access the Creator Dashboard.");
      navigate({ to: "/auth/sign-in" });
    }
  }, [user, loading, navigate]);

  const { data: userBooks = [], isLoading: loadingBooks } = useQuery({
    queryKey: ['user-books', user?.uid],
    queryFn: async () => {
      const res = await fetch(`http://localhost:9090/api/books?uploaderId=${user?.uid}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      if (!data || !Array.isArray(data.books)) {
        return [];
      }
      return data.books.map((b: any) => ({
        id: b._id,
        slug: b._id,
        title: b.title,
        authorName: b.author,
        coverUrl: b.coverUrl,
        genre: b.genre || "Other",
        rating: b.rating || 4.8,
        ratingCount: b.ratingCount || Math.floor(Math.random() * 500) + 50,
      }));
    },
    enabled: !!user?.uid,
  });

  const steps = ["Book File", "Cover Image", "Metadata", "Review"];

  const resetWizard = () => {
    setStep(0);
    setBookFile(null);
    setCoverFile(null);
    setTitle("");
    setAuthor("");
    setGenre(ALL_GENRES[0]);
    setDescription("");
    setTags("");
    setUploading(0);
    setProcessing(false);
  };

  const startUpload = async () => {
    if (!bookFile || !coverFile || !user) return;

    setStep(4);
    setUploading(0);
    setProcessing(false);
    
    try {
      const formData = new FormData();
      formData.append("book", bookFile);
      formData.append("cover", coverFile);
      formData.append("title", title);
      formData.append("author", author);
      formData.append("genre", genre);
      formData.append("description", description);
      formData.append("tags", tags);
      
      const idToken = await user.getIdToken();
      const uploadId = Math.random().toString(36).substring(7);
      
      let telegramProgressActive = false;
      const eventSource = new EventSource(`http://localhost:9090/api/upload/progress?uploadId=${uploadId}`);
      eventSource.onmessage = (e) => {
        const data = JSON.parse(e.data);
        if (data.status === 'uploading_telegram') {
          telegramProgressActive = true;
          setUploading(Math.round(50 + (data.progress / 2)));
          setProcessing(false);
        } else if (data.status === 'done' || data.status === 'error') {
          eventSource.close();
        }
      };
      
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `http://localhost:9090/api/upload?uploadId=${uploadId}`, true);
      xhr.setRequestHeader("Authorization", `Bearer ${idToken}`);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && !telegramProgressActive) {
          const percentComplete = (event.loaded / event.total) * 100;
          setUploading(Math.round(percentComplete / 2));
          if (percentComplete >= 100) {
            setProcessing(true);
          }
        }
      };

      xhr.onload = () => {
        eventSource.close();
        if (xhr.status === 200) {
          toast.success("Book successfully published!");
          queryClient.invalidateQueries({ queryKey: ['user-books', user.uid] });
          queryClient.invalidateQueries({ queryKey: ['home-books'] });
          resetWizard();
          setView("dashboard");
        } else {
          try {
            const err = JSON.parse(xhr.responseText);
            toast.error(err.error || "Upload failed. Please try again.");
          } catch {
            toast.error("Upload failed. Please try again.");
          }
          setStep(3);
        }
      };

      xhr.onerror = () => {
        eventSource.close();
        toast.error("Network error occurred during upload.");
        setStep(3);
      };

      xhr.send(formData);
    } catch (error: any) {
      toast.error(error.message || "An error occurred during upload.");
      setStep(3);
    }
  };

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>;
  }

  if (view === "dashboard") {
    return (
      <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 sm:py-10 space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-black sm:text-4xl">Creator Dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">Manage your published books and upload new ones.</p>
          </div>
          <Button onClick={() => setView("wizard")} size="lg" className="rounded-full neon-glow shrink-0 shadow-lg">
            <Plus className="w-5 h-5 mr-2" />
            Upload New Book
          </Button>
        </div>

        <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 min-h-[400px]">
          {loadingBooks ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
              <p>Loading your library...</p>
            </div>
          ) : userBooks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-center max-w-sm mx-auto">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                <BookIcon className="w-10 h-10 text-primary" />
              </div>
              <h3 className="font-display text-xl font-bold mb-2">No uploads yet</h3>
              <p className="text-muted-foreground text-sm mb-6">You haven't published any books to the community yet. Start sharing your knowledge today!</p>
              <Button onClick={() => setView("wizard")} variant="secondary" className="rounded-full">
                Publish your first book
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                Your Published Books <Badge variant="secondary" className="ml-2">{userBooks.length}</Badge>
              </h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {userBooks.map((b: any) => (
                  <BookCard key={b.id} book={b} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // WIZARD VIEW
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-black sm:text-4xl">
            Upload a book
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Share your knowledge with the LumenPages community.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => { resetWizard(); setView("dashboard"); }} className="rounded-full text-muted-foreground">
          Cancel
        </Button>
      </div>

      <ol className="mt-4 flex flex-wrap items-center gap-2 text-sm">
        {steps.map((s, i) => (
          <li key={s} className="flex items-center gap-2">
            <span
              className={`grid h-7 w-7 place-items-center rounded-full text-xs font-semibold transition-colors ${
                step > i
                  ? "bg-primary text-primary-foreground"
                  : step === i 
                  ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {step > i ? <Check className="h-4 w-4" /> : i + 1}
            </span>
            <span className={step >= i ? "font-medium" : "text-muted-foreground"}>
              {s}
            </span>
            {i < steps.length - 1 && (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </li>
        ))}
      </ol>

      <div className="mt-8 rounded-3xl border border-border bg-card p-6 sm:p-10 shadow-2xl relative overflow-hidden transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
        
        {step === 0 && (
          <div className="relative z-10 animate-in fade-in zoom-in-95 duration-300">
            <h2 className="font-display text-2xl font-bold mb-6">Select Book File</h2>
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-primary/40 bg-background/50 p-12 text-center transition-all hover:bg-accent/30 hover:border-primary group">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <UploadIcon className="h-8 w-8 text-primary" />
              </div>
              <span className="font-display text-xl font-semibold">
                Drop your EPUB or PDF here
              </span>
              <span className="mt-2 text-sm text-muted-foreground">
                Maximum file size: 300 MB
              </span>
              <input
                type="file"
                accept=".pdf,.epub"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    const file = e.target.files[0];
                    if (file.size > 300 * 1024 * 1024) {
                      toast.error("File is too large. Maximum size is 300 MB.");
                      return;
                    }
                    setBookFile(file);
                  }
                }}
              />
            </label>
            {bookFile && (
              <div className="mt-6 flex items-center gap-4 rounded-2xl border border-primary/30 bg-primary/5 p-4 shadow-sm animate-in slide-in-from-bottom-2">
                <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center shrink-0">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate font-bold text-sm sm:text-base">{bookFile.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{(bookFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setBookFile(null)} className="text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-full">Remove</Button>
              </div>
            )}
            <div className="mt-10 flex justify-end">
              <Button onClick={() => setStep(1)} disabled={!bookFile} className="rounded-full neon-glow px-10 h-12 text-md font-semibold">
                Continue to Cover
              </Button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="relative z-10 animate-in slide-in-from-right-8 duration-300">
            <h2 className="font-display text-2xl font-bold mb-6">Upload Cover Image</h2>
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-primary/40 bg-background/50 p-12 text-center transition-all hover:bg-accent/30 hover:border-primary group">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <ImageIcon className="h-8 w-8 text-primary" />
              </div>
              <span className="font-display text-xl font-semibold">
                Drop high-res cover image
              </span>
              <span className="mt-2 text-sm text-muted-foreground">
                JPG, PNG, WEBP (Recommended 2:3 aspect ratio)
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    setCoverFile(e.target.files[0]);
                  }
                }}
              />
            </label>
            {coverFile && (
              <div className="mt-6 flex flex-col items-center gap-4 rounded-2xl border border-primary/30 bg-primary/5 p-6 shadow-sm animate-in slide-in-from-bottom-2">
                <img 
                  src={URL.createObjectURL(coverFile)} 
                  alt="Cover preview" 
                  className="w-40 rounded-xl shadow-xl border border-border" 
                />
                <div className="text-center">
                  <p className="truncate font-bold text-sm max-w-[200px]">{coverFile.name}</p>
                  <Button variant="link" size="sm" onClick={() => setCoverFile(null)} className="text-red-500 h-auto p-0 mt-1">Remove Cover</Button>
                </div>
              </div>
            )}
            <div className="mt-10 flex justify-between">
              <Button variant="outline" onClick={() => setStep(0)} className="rounded-full px-8 h-12 font-semibold">Back</Button>
              <Button onClick={() => setStep(2)} disabled={!coverFile} className="rounded-full neon-glow px-10 h-12 text-md font-semibold">
                Continue to Details
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="relative z-10 space-y-5 animate-in slide-in-from-right-8 duration-300">
            <h2 className="font-display text-2xl font-bold mb-6">Book Details</h2>
            <div className="grid sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="t" className="font-semibold">Title *</Label>
                <Input id="t" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} className="h-12 rounded-xl bg-background" placeholder="e.g. The Great Gatsby" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="a" className="font-semibold">Author *</Label>
                <Input id="a" value={author} onChange={(e) => setAuthor(e.target.value)} maxLength={120} className="h-12 rounded-xl bg-background" placeholder="e.g. F. Scott Fitzgerald" />
              </div>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="g" className="font-semibold">Genre</Label>
                <select
                  id="g"
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="flex h-12 w-full items-center justify-between rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  {ALL_GENRES.map((g) => (
                    <option key={g}>{g}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tags" className="font-semibold">Tags (comma separated)</Label>
                <Input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} maxLength={100} className="h-12 rounded-xl bg-background" placeholder="classic, romance, 1920s" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="d" className="font-semibold">Description</Label>
              <Textarea
                id="d"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                maxLength={1000}
                className="rounded-xl bg-background resize-none"
                placeholder="A brief summary of the book..."
              />
            </div>

            <div className="mt-10 flex justify-between pt-4 border-t border-border/50">
              <Button variant="outline" onClick={() => setStep(1)} className="rounded-full px-8 h-12 font-semibold">Back</Button>
              <Button onClick={() => setStep(3)} disabled={!title.trim() || !author.trim()} className="rounded-full neon-glow px-10 h-12 text-md font-semibold">
                Review & Publish
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="relative z-10 animate-in slide-in-from-right-8 duration-300">
            <h2 className="font-display text-2xl font-bold mb-6">Review & Publish</h2>
            
            <div className="grid sm:grid-cols-[1fr_2fr] gap-6 sm:gap-8 bg-background/50 rounded-2xl p-6 border border-border">
              
              {/* Cover Summary */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Cover Image</h3>
                  <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-primary/20 hover:text-primary" onClick={() => setStep(1)}>
                    <Edit2 className="w-3 h-3" />
                  </Button>
                </div>
                {coverFile && (
                  <div className="aspect-[2/3] w-full max-w-[160px] mx-auto sm:mx-0 overflow-hidden rounded-xl shadow-lg border border-border">
                    <img src={URL.createObjectURL(coverFile)} alt="Cover" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              {/* Details & File Summary */}
              <div className="space-y-6">
                <div className="space-y-2 border-b border-border/50 pb-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Book Details</h3>
                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-primary/20 hover:text-primary" onClick={() => setStep(2)}>
                      <Edit2 className="w-3 h-3" />
                    </Button>
                  </div>
                  <h4 className="font-display text-2xl font-bold">{title}</h4>
                  <p className="text-lg text-foreground/80">by {author}</p>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="secondary">{genre}</Badge>
                    {tags.split(',').map(t => t.trim()).filter(Boolean).map(t => (
                      <Badge key={t} variant="outline">{t}</Badge>
                    ))}
                  </div>
                  {description && <p className="text-sm text-muted-foreground line-clamp-3 mt-2">{description}</p>}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Book File</h3>
                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-primary/20 hover:text-primary" onClick={() => setStep(0)}>
                      <Edit2 className="w-3 h-3" />
                    </Button>
                  </div>
                  {bookFile && (
                    <div className="flex items-center gap-3 bg-card border border-border rounded-xl p-3">
                      <FileText className="w-5 h-5 text-primary" />
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium">{bookFile.name}</p>
                        <p className="text-xs text-muted-foreground">{(bookFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-10 flex justify-between pt-4 border-t border-border/50">
              <Button variant="outline" onClick={() => setStep(2)} className="rounded-full px-8 h-12 font-semibold">Back</Button>
              <Button onClick={startUpload} className="rounded-full neon-glow px-10 h-12 text-md font-bold">
                Publish to Library
              </Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="relative z-10 py-12 flex flex-col items-center justify-center text-center animate-in fade-in duration-500">
            <div className="relative w-32 h-32 mb-8">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/30" />
                <circle 
                  cx="50" 
                  cy="50" 
                  r="45" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="8" 
                  strokeDasharray="283"
                  strokeDashoffset={283 - (283 * uploading) / 100}
                  className="text-primary transition-all duration-300 ease-out" 
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="font-display text-2xl font-bold">{uploading}%</span>
              </div>
            </div>
            
            <h2 className="font-display text-2xl font-bold mb-2">
              {processing ? "Processing on server..." : "Uploading to LumenPages..."}
            </h2>
            <p className="text-muted-foreground max-w-sm">
              {processing 
                ? "Your book is safely on our servers and is being securely forwarded to the library storage."
                : "Please don't close this tab while the upload is in progress. This reflects real network upload speed."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
