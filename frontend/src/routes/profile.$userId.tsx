import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookCard } from "@/components/BookCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { UserPlus, Loader2, BookOpen, Clock, Edit3, Settings, Camera } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";
import { ImageCropperModal } from "@/components/ui/image-cropper";

export const Route = createFileRoute("/profile/$userId")({
  head: () => ({
    meta: [
      { title: "Profile — Notora" },
      { name: "description", content: "Reader profile on Notora." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { userId } = Route.useParams();
  const navigate = useNavigate();
  const { user: currentUser, loading: isAuthLoading } = useAuthStore();
  const [following, setFollowing] = useState(false);

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editPhoto, setEditPhoto] = useState<File | null>(null);
  const [editPreview, setEditPreview] = useState("");
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropperSrc, setCropperSrc] = useState("");
  const [saving, setSaving] = useState(false);

  // Determine which user to show
  const isMe = userId === "me" || (currentUser && currentUser.uid === userId);
  const profileId = userId === "me" ? currentUser?.uid : userId;

  useEffect(() => {
    if (!isAuthLoading && userId === "me" && !currentUser) {
      navigate({ to: "/auth/sign-in" });
    }
  }, [userId, currentUser, isAuthLoading, navigate]);

  // Fetch Mongo User Data (for bio, custom photo, etc.)
  const { data: dbUser, refetch: refetchUser, isLoading: isDbLoading, error: dbError } = useQuery({
    queryKey: ["db-user", profileId],
    queryFn: async () => {
      if (!profileId) return null;
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:9090"}/api/users/${profileId}`,
      );
      if (!res.ok) throw new Error("User not found");
      return res.json();
    },
    enabled: !!profileId,
    retry: false
  });

  // Setup initial edit state
  useEffect(() => {
    if (isEditing) {
      setEditName(dbUser?.name || currentUser?.displayName || "");
      setEditBio(dbUser?.bio || "");
      setEditPreview(dbUser?.photoUrl || currentUser?.photoURL || "");
      setEditPhoto(null);
    }
  }, [isEditing, dbUser, currentUser]);

  // Fetch real uploaded books from backend
  const { data: uploadedBooks = [], isLoading: isBooksLoading } = useQuery({
    queryKey: ["user-books", profileId],
    queryFn: async () => {
      if (!profileId) return [];
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:9090"}/api/books/user/${profileId}`,
      );
      if (!res.ok) throw new Error("Failed to fetch user books");
      const data = await res.json();
      return data.map((b: any) => ({
        id: b._id,
        slug: b._id,
        title: b.title,
        authorName: b.author,
        coverUrl: b.coverUrl,
        genre: b.genre || "Other",
        tags: b.tags || [],
        rating: b.rating || 4.8,
        ratingCount: b.ratingCount || Math.floor(Math.random() * 500) + 50,
        language: b.language || "English",
      }));
    },
    enabled: !!profileId,
  });

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setSaving(true);

    try {
      const formData = new FormData();
      formData.append("name", editName);
      formData.append("bio", editBio);
      if (editPhoto) {
        formData.append("photo", editPhoto);
      } else if (!editPreview) {
        formData.append("removePhoto", "true");
      }

      const token = await currentUser.getIdToken();
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:9090"}/api/users/profile`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      if (!res.ok) throw new Error("Failed to update profile");

      const data = await res.json();

      // SYNC WITH FIREBASE AUTH SO IT PERSISTS ACROSS LOGOUT/LOGIN
      const { updateProfile } = await import("firebase/auth");
      const updateData: any = {
        displayName: data.user.name || currentUser.displayName,
      };
      if (!editPreview && !editPhoto) {
        updateData.photoURL = "";
      } else {
        updateData.photoURL = data.user.photoUrl || currentUser.photoURL;
      }
      await updateProfile(currentUser, updateData);

      // Force update the Zustand store to trigger TopBar re-render immediately
      useAuthStore.getState().setUser(Object.assign({}, currentUser));

      await refetchUser();
      setIsEditing(false);
      toast.success("Profile updated successfully!");
    } catch (err) {
      toast.error("Error updating profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCropperSrc(URL.createObjectURL(file));
      setCropperOpen(true);
      e.target.value = "";
    }
  };

  const handleCropComplete = (croppedFile: File) => {
    setEditPhoto(croppedFile);
    setEditPreview(URL.createObjectURL(croppedFile));
  };

  if (isAuthLoading || (isDbLoading && profileId)) {
    return (
      <div className="flex min-h-[70vh] justify-center items-center">
        <Loader2 className="animate-spin text-primary w-10 h-10" />
      </div>
    );
  }

  if (!profileId || (dbError && !isMe)) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
          <UserPlus className="w-10 h-10 text-muted-foreground" />
        </div>
        <h1 className="font-display text-3xl font-bold">User not found</h1>
        <p className="mt-2 text-muted-foreground">This profile is private or does not exist.</p>
        <Button asChild className="mt-6 rounded-full px-8">
          <Link to="/">Return to Explore</Link>
        </Button>
      </div>
    );
  }

  const displayPhoto = dbUser?.photoUrl || (isMe ? currentUser?.photoURL : null);
  const displayName = dbUser?.name || (isMe ? currentUser?.displayName : "Lumen Reader");
  const displayBio =
    dbUser?.bio ||
    "Avid reader, curator of fine literature, and active contributor to the Notora community. Always looking for the next great story.";
  const displayFollowers = dbUser?.followers || 142;
  const displayFollowing = dbUser?.following || 89;

  const baseNameForHandle = isMe && currentUser?.email ? currentUser.email.split("@")[0] : (displayName ? displayName.toLowerCase().replace(/\s+/g, '') : "reader");
  const generatedHandle = `@${baseNameForHandle}`;
  const initials = displayName ? displayName.slice(0, 1).toUpperCase() : "R";

  return (
    <div className="animate-in fade-in duration-500 pb-20">
      {/* 1. HERO BANNER - FULL WIDTH */}
      <div className="h-48 md:h-64 w-full bg-gradient-to-tr from-primary/80 via-primary/40 to-secondary/30 relative overflow-hidden">
        {/* Decorative elements in banner */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-10 w-60 h-60 bg-primary/20 rounded-full blur-3xl" />
      </div>

      {/* CENTER CONTENT CONTAINER */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 md:px-8">
        {/* 2. PROFILE HEADER SECTION */}
        <div className="flex justify-between items-end -mt-12 md:-mt-16 mb-4 relative z-10">
          <Avatar className="h-24 w-24 md:h-32 md:w-32 ring-4 ring-background shadow-xl">
            <AvatarImage src={displayPhoto || undefined} className="object-cover" />
            <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-3xl md:text-5xl text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex gap-2">
            {isMe ? (
              <Dialog open={isEditing} onOpenChange={setIsEditing}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="rounded-full shadow-sm">
                    <Settings className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] rounded-3xl">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-display font-bold">
                      Edit Profile
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleUpdate} className="space-y-6 mt-4">
                    <div className="flex flex-col items-center gap-4">
                      <Label htmlFor="photo" className="relative cursor-pointer group">
                        <Avatar className="h-24 w-24 ring-2 ring-primary/20 transition-all group-hover:opacity-80 group-hover:ring-primary/50">
                          <AvatarImage src={editPreview || undefined} className="object-cover" />
                          <AvatarFallback className="bg-muted text-3xl text-muted-foreground">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-full">
                          <Camera className="w-6 h-6 text-white" />
                        </div>
                        <input
                          id="photo"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handlePhotoSelect}
                        />
                      </Label>
                      {editPreview ? (
                        <button
                          type="button"
                          onClick={() => {
                            setEditPhoto(null);
                            setEditPreview("");
                          }}
                          className="text-xs text-destructive hover:underline font-medium"
                        >
                          Click to remove photo
                        </button>
                      ) : (
                        <p className="text-xs text-muted-foreground">Click to add photo</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="name">Display Name</Label>
                      <Input
                        id="name"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="rounded-xl"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        value={editBio}
                        onChange={(e) => setEditBio(e.target.value)}
                        className="rounded-xl resize-none h-24"
                        placeholder="Tell the community about yourself..."
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setIsEditing(false)}
                        className="rounded-full"
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={saving} className="rounded-full neon-glow">
                        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                        Save Changes
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            ) : (
              <Button
                className="rounded-full shadow-sm px-6"
                variant={following ? "outline" : "default"}
                onClick={() => setFollowing((v) => !v)}
              >
                {following ? "Following" : "Follow"}
              </Button>
            )}
          </div>
        </div>

        {/* 3. PROFILE DETAILS */}
        <div className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-black">{displayName}</h1>
          <p className="text-muted-foreground font-medium flex items-center gap-2 mt-1">
            {generatedHandle}
            <Badge
              variant="secondary"
              className="text-[10px] uppercase tracking-widest bg-primary/10 text-primary"
            >
              Creator
            </Badge>
          </p>
          <p className="mt-4 text-foreground/90 max-w-2xl leading-relaxed whitespace-pre-wrap">
            {displayBio}
          </p>

          <div className="mt-6 flex gap-6 text-sm">
            <div className="flex flex-col">
              <span className="font-display text-2xl font-bold">{displayFollowers}</span>
              <span className="text-muted-foreground font-medium">Followers</span>
            </div>
            <div className="flex flex-col">
              <span className="font-display text-2xl font-bold">{displayFollowing}</span>
              <span className="text-muted-foreground font-medium">Following</span>
            </div>
            <div className="flex flex-col">
              <span className="font-display text-2xl font-bold">{uploadedBooks.length}</span>
              <span className="text-muted-foreground font-medium">Published</span>
            </div>
          </div>
        </div>

        {/* 4. TABS INTERFACE */}
        <Tabs defaultValue="uploads" className="w-full">
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-auto p-0 mb-8 overflow-x-auto flex-nowrap hide-scrollbar">
            <TabsTrigger
              value="uploads"
              className="rounded-none border-b-2 border-transparent px-6 py-4 font-medium data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground text-muted-foreground"
            >
              Uploads ({uploadedBooks.length})
            </TabsTrigger>
            <TabsTrigger
              value="reading"
              className="rounded-none border-b-2 border-transparent px-6 py-4 font-medium data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground text-muted-foreground"
            >
              Reading List
            </TabsTrigger>
            <TabsTrigger
              value="reviews"
              className="rounded-none border-b-2 border-transparent px-6 py-4 font-medium data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground text-muted-foreground"
            >
              Reviews
            </TabsTrigger>
          </TabsList>

          {/* UPLOADS TAB */}
          <TabsContent
            value="uploads"
            className="outline-none animate-in fade-in slide-in-from-bottom-2 duration-500"
          >
            {isBooksLoading ? (
              <div className="flex justify-center items-center h-48">
                <Loader2 className="animate-spin text-primary w-8 h-8" />
              </div>
            ) : uploadedBooks.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center bg-card border border-border rounded-3xl border-dashed">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <BookOpen className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-display text-xl font-bold mb-2">No uploads yet</h3>
                <p className="text-muted-foreground mb-6 max-w-sm">
                  Share your favorite books with the community to build your library.
                </p>
                {isMe && (
                  <Button asChild className="rounded-full">
                    <Link to="/upload">Publish a Book</Link>
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                {uploadedBooks.map((b: any) => (
                  <div key={b.id} className="flex w-full justify-center">
                    <BookCard book={b} size="md" />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* READING LIST TAB (MOCKED) */}
          <TabsContent
            value="reading"
            className="outline-none animate-in fade-in slide-in-from-bottom-2 duration-500"
          >
            <div className="flex flex-col items-center justify-center p-12 text-center bg-card/50 border border-border rounded-3xl">
              <div className="w-16 h-16 bg-secondary/20 rounded-full flex items-center justify-center mb-4">
                <Clock className="w-8 h-8 text-secondary-foreground/60" />
              </div>
              <h3 className="font-display text-xl font-bold mb-2">Reading List is empty</h3>
              <p className="text-muted-foreground mb-6 max-w-sm">
                Books you save for later will appear here.
              </p>
              <Button asChild variant="outline" className="rounded-full">
                <Link to="/browse">Explore Library</Link>
              </Button>
            </div>
          </TabsContent>

          {/* REVIEWS TAB (MOCKED) */}
          <TabsContent
            value="reviews"
            className="outline-none animate-in fade-in slide-in-from-bottom-2 duration-500"
          >
            <div className="flex flex-col items-center justify-center p-12 text-center bg-card/50 border border-border rounded-3xl">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Edit3 className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-display text-xl font-bold mb-2">No reviews yet</h3>
              <p className="text-muted-foreground mb-6 max-w-sm">
                Share your thoughts on the books you've read. Your reviews help others find their
                next great read.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <ImageCropperModal
        isOpen={cropperOpen}
        onClose={() => setCropperOpen(false)}
        imageSrc={cropperSrc}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
}
