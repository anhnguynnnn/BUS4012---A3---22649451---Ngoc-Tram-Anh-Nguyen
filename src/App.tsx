import { useCallback, useEffect, useState } from "react";
import AccountPage from "./pages/AccountPage";
import AlbumDetailPage from "./pages/AlbumDetailPage";
import AppPreferencePage from "./pages/AppPreferencePage";
import AuthModal from "./components/AuthModal";
import Button from "./components/Button";
import Input from "./components/Input";
import OnboardingBodyPage from "./pages/OnboardingBodyPage";
import OnboardingDirectionPage from "./pages/OnboardingDirectionPage";
import OnboardingFitPage from "./pages/OnboardingFitPage";
import OnboardingStylePage from "./pages/OnboardingStylePage";
import PrivacyPage from "./pages/PrivacyPage";
import SettingsPage from "./pages/SettingsPage";
import StyleLibraryPage from "./pages/StyleLibraryPage";
import WelcomePage from "./pages/WelcomePage";
import type { Album, AppPreferences, OnboardingAnswers, Page, Post } from "./types";
import { clearMuseStorage, getFromStorage, saveToStorage, setActiveUserId, STORAGE_KEYS } from "./utils/storage";
import { getPosts as fetchPosts, getProfile as fetchProfile, getStoredAccessToken, trackInteraction, updateProfile, getRecommendations as fetchRecommendations } from "./lib/backendApi";
import { backendPostToFrontendPost } from "./utils/matchingLogic";
import { defaultAppPreferences, defaultOnboarding } from "./utils/matchingLogic";
import { AuthProvider } from "./contexts/AuthContext";
import { useAuth } from "./hooks/useAuth";

const mergeOnboarding = (value: Partial<OnboardingAnswers>): OnboardingAnswers => ({ ...defaultOnboarding, ...value });
const mergeAppPreferences = (value: Partial<AppPreferences>): AppPreferences => ({ ...defaultAppPreferences, ...value });

/**
 * Inner app component that uses the AuthContext.
 * Wrapped by AuthProvider in the default export below.
 */
function AppContent() {
  // Auth state is managed by AuthContext (Supabase Auth via backend proxy).
  const { user, isAuthenticated, signOut } = useAuth();

  const [page, setPage] = useState<Page>("welcome");
  const [onboarding, setOnboardingState] = useState<OnboardingAnswers>(() => mergeOnboarding(getFromStorage(STORAGE_KEYS.onboarding, defaultOnboarding)));
  const [savedPostIds, setSavedPostIds] = useState<string[]>(() => getFromStorage(STORAGE_KEYS.savedPosts, []));
  const [albums, setAlbums] = useState<Album[]>(() => getFromStorage(STORAGE_KEYS.albums, []));
  const [appPreferences, setAppPreferencesState] = useState<AppPreferences>(() => mergeAppPreferences(getFromStorage(STORAGE_KEYS.appPreferences, defaultAppPreferences)));
  const [activeAlbumId, setActiveAlbumId] = useState("");
  const [pendingSavePostId, setPendingSavePostId] = useState("");
  const [newAlbumName, setNewAlbumName] = useState("");
  const [entryPopupSeen, setEntryPopupSeen] = useState(() => getFromStorage(STORAGE_KEYS.entryPopupSeen, false));
  const [authModalOpen, setAuthModalOpen] = useState(() => !isAuthenticated && !getFromStorage(STORAGE_KEYS.entryPopupSeen, false));
  const [authMode, setAuthMode] = useState<"entry" | "login" | "signup">(() => (!isAuthenticated && !getFromStorage(STORAGE_KEYS.entryPopupSeen, false) ? "entry" : "login"));
  const [signUpSuccessOpen, setSignUpSuccessOpen] = useState(false);
  const [supabasePosts, setSupabasePosts] = useState<Post[]>([]);
  const [, setPostsLoading] = useState(true);
  const [backendDown, setBackendDown] = useState(false);

  // Check backend health on mount and show banner if unreachable.
  const checkBackendHealth = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const res = await fetch("/health", { signal: controller.signal });
      clearTimeout(timeoutId);
      setBackendDown(!res.ok);
    } catch {
      setBackendDown(true);
    }
  }, []);

  useEffect(() => {
    checkBackendHealth();
  }, [checkBackendHealth]);

  // Fetch posts from Supabase on mount.
  // When authenticated, prefer the /recommendations endpoint which returns
  // posts scored by the backend recommendation engine (onboarding + behaviour).
  // Fall back to raw /posts if recommendations fail or user is not authenticated.
  useEffect(() => {
    let cancelled = false;
    const token = getStoredAccessToken();

    const loadPosts = async () => {
      try {
        if (token) {
          // Authenticated: try recommendations first for personalised scoring.
          try {
            const recs = await fetchRecommendations(token);
            if (cancelled) return;
            const mapped = recs.map((rec) => backendPostToFrontendPost(rec.post));
            setSupabasePosts(mapped);
            return;
          } catch {
            // Recommendations failed — fall through to raw posts.
          }
        }
        // Unauthenticated or recommendations failed.
        const postsData = await fetchPosts(token || undefined);
        if (cancelled) return;
        setSupabasePosts(postsData.map(backendPostToFrontendPost));
      } catch {
        // Silently fail — pages will show empty state.
      } finally {
        if (!cancelled) setPostsLoading(false);
      }
    };

    loadPosts();
    return () => { cancelled = true; };
  }, []);

  // Persist onboarding and preference data to localStorage.
  useEffect(() => saveToStorage(STORAGE_KEYS.onboarding, onboarding), [onboarding]);
  useEffect(() => saveToStorage(STORAGE_KEYS.savedPosts, savedPostIds), [savedPostIds]);
  useEffect(() => saveToStorage(STORAGE_KEYS.albums, albums), [albums]);
  useEffect(() => saveToStorage(STORAGE_KEYS.appPreferences, appPreferences), [appPreferences]);
  useEffect(() => saveToStorage(STORAGE_KEYS.entryPopupSeen, entryPopupSeen), [entryPopupSeen]);

  // When the authenticated user changes, scope localStorage keys to that user
  // and reload their data. This prevents data leaking between accounts.
  useEffect(() => {
    setActiveUserId(user?.id ?? null);

    if (user?.id) {
      // User logged in — load their scoped data from localStorage.
      setOnboardingState(mergeOnboarding(getFromStorage(STORAGE_KEYS.onboarding, defaultOnboarding)));
      setSavedPostIds(getFromStorage(STORAGE_KEYS.savedPosts, []));
      setAlbums(getFromStorage(STORAGE_KEYS.albums, []));
      setAppPreferencesState(mergeAppPreferences(getFromStorage(STORAGE_KEYS.appPreferences, defaultAppPreferences)));
    } else {
      // User logged out — reset to empty defaults.
      setOnboardingState(defaultOnboarding);
      setSavedPostIds([]);
      setAlbums([]);
      setAppPreferencesState(defaultAppPreferences);
    }
  }, [user?.id]);

  // Load profile from Supabase on login to sync onboarding preferences.
  useEffect(() => {
    if (!user?.id) return;
    const token = getStoredAccessToken();
    if (!token) return;

    let cancelled = false;

    fetchProfile(token)
      .then((profile) => {
        if (cancelled || !profile) return;

        // Merge Supabase profile data into onboarding state if it exists.
        if (profile.onboarding_completed) {
          const dbOnboarding: Partial<OnboardingAnswers> = {
            completed: true,
            styleAttraction: profile.style_attraction || [],
            fitPreferences: profile.fit_preferences || [],
            stylingDirection: profile.styling_direction || [],
          };
          if (profile.size_range.length > 0) dbOnboarding.sizeRange = profile.size_range;
          if (profile.height_range) dbOnboarding.heightRange = profile.height_range;

          setOnboardingState((prev) => {
            const merged = { ...prev, ...dbOnboarding };
            saveToStorage(STORAGE_KEYS.onboarding, merged);
            return merged;
          });
        }
      })
      .catch(() => {
        // Silently fail — localStorage data remains the source of truth offline.
      });

    return () => { cancelled = true; };
  }, [user?.id]);

  // Persist onboarding to Supabase when it changes (debounced).
  useEffect(() => {
    if (!user?.id || !onboarding.completed) return;
    const token = getStoredAccessToken();
    if (!token) return;

    const timeout = setTimeout(() => {
      updateProfile(token, {
        onboarding_completed: true,
        style_attraction: onboarding.styleAttraction,
        size_range: onboarding.sizeRange,
        height_range: onboarding.heightRange,
        fit_preferences: onboarding.fitPreferences,
        styling_direction: onboarding.stylingDirection,
      }).catch(() => {
        // Silently fail — localStorage is still up to date.
      });
    }, 1000);

    return () => clearTimeout(timeout);
  }, [user?.id, onboarding.completed, onboarding.styleAttraction, onboarding.fitPreferences, onboarding.stylingDirection, onboarding.sizeRange, onboarding.heightRange]);

  // When auth state changes (login/logout), close the modal and redirect.
  useEffect(() => {
    if (isAuthenticated) {
      setAuthModalOpen(false);
      setEntryPopupSeen(true);
    }
  }, [isAuthenticated]);

  const closeAuthModal = () => {
    if (authMode === "entry") setEntryPopupSeen(true);
    setAuthModalOpen(false);
    setSignUpSuccessOpen(false);
  };

  const requestSavePost = (postId: string) => {
    if (!isAuthenticated) {
      setAuthMode("login");
      setAuthModalOpen(true);
      return;
    }
    if (savedPostIds.includes(postId)) {
      setSavedPostIds((current) => current.filter((id) => id !== postId));
      return;
    }

    setPendingSavePostId(postId);
  };

  const savePostOnly = () => {
    if (!pendingSavePostId) return;
    setSavedPostIds((current) => current.includes(pendingSavePostId) ? current : [...current, pendingSavePostId]);
    // Track save interaction in Supabase.
    const token = getStoredAccessToken();
    if (token) trackInteraction(token, pendingSavePostId, "save").catch(() => {});
    setPendingSavePostId("");
    setNewAlbumName("");
  };

  const addPostToAlbum = (albumId: string, postId: string) => setAlbums((current) => current.map((album) => ({
    ...album,
    postIds: album.id === albumId
      ? Array.from(new Set([...album.postIds, postId]))
      : album.postIds.filter((id) => id !== postId),
  })));

  const removePostFromAnyAlbum = (postId: string) => setAlbums((current) => current.map((album) => ({ ...album, postIds: album.postIds.filter((id) => id !== postId) })));

  const requireAuth = () => {
    if (isAuthenticated) return true;
    setAuthMode("login");
    setAuthModalOpen(true);
    return false;
  };

  const deleteAlbum = (albumId: string) => {
    if (confirm("Are you sure you want to delete this album?")) {
      setAlbums((current) => current.filter((album) => album.id !== albumId));
      if (activeAlbumId === albumId) {
        setActiveAlbumId("");
        setPage("library");
      }
    }
  };

  const savePostToAlbum = (albumId: string) => {
    if (!pendingSavePostId) return;
    setSavedPostIds((current) => current.includes(pendingSavePostId) ? current : [...current, pendingSavePostId]);
    addPostToAlbum(albumId, pendingSavePostId);
    // Track save + album_add interactions in Supabase.
    const token = getStoredAccessToken();
    if (token) {
      trackInteraction(token, pendingSavePostId, "save").catch(() => {});
      trackInteraction(token, pendingSavePostId, "album_add").catch(() => {});
    }
    setPendingSavePostId("");
    setNewAlbumName("");
  };

  const savePostToNewAlbum = () => {
    if (!pendingSavePostId || !newAlbumName.trim()) return;
    const albumId = crypto.randomUUID();
    setSavedPostIds((current) => current.includes(pendingSavePostId) ? current : [...current, pendingSavePostId]);
    setAlbums((current) => [...current, { id: albumId, name: newAlbumName.trim(), postIds: [pendingSavePostId], createdAt: new Date().toISOString() }]);
    // Track save + album_add interactions in Supabase.
    const token = getStoredAccessToken();
    if (token) {
      trackInteraction(token, pendingSavePostId, "save").catch(() => {});
      trackInteraction(token, pendingSavePostId, "album_add").catch(() => {});
    }
    setPendingSavePostId("");
    setNewAlbumName("");
  };

  const closeSaveModal = () => { setPendingSavePostId(""); setNewAlbumName(""); };

  // Logout uses AuthContext to clear Supabase session and local tokens.
  const logout = async () => {
    await signOut();
    setEntryPopupSeen(false);
    setAuthMode("entry");
    setAuthModalOpen(true);
    setPage("home");
  };

  const createAlbum = (name: string) => {
    if (!requireAuth()) return;
    setAlbums((current) => [...current, { id: crypto.randomUUID(), name, postIds: [], createdAt: new Date().toISOString() }]);
  };
  const openAlbum = (albumId: string) => { setActiveAlbumId(albumId); setPage("album-detail"); };
  const removeFromAlbum = (postId: string) => setAlbums((current) => current.map((album) => album.id === activeAlbumId ? { ...album, postIds: album.postIds.filter((id) => id !== postId) } : album));
  const clearData = () => { clearMuseStorage(); setOnboardingState(defaultOnboarding); setSavedPostIds([]); setAlbums([]); setAppPreferencesState(defaultAppPreferences); setPage("welcome"); };

  const renderSaveModal = () => pendingSavePostId ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl border border-neutral-200 bg-white p-6 shadow-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-400">Saved look</p>
        <h2 className="mt-3 text-2xl font-semibold">Save this look to which album?</h2>
        <p className="mt-2 text-sm leading-6 text-neutral-500">Choose an existing album, create a new album, or save it without adding it to an album.</p>
        <div className="mt-6 space-y-3">
          {albums.map((album) => <Button key={album.id} variant="secondary" onClick={() => savePostToAlbum(album.id)}>{album.name}</Button>)}
          {albums.length === 0 && <p className="rounded-2xl bg-neutral-50 p-4 text-sm text-neutral-500">No albums yet. Create a new album below.</p>}
        </div>
        <div className="mt-6 rounded-3xl border border-neutral-200 bg-neutral-50 p-4">
          <h3 className="font-semibold">New album</h3>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <Input value={newAlbumName} onChange={(event) => setNewAlbumName(event.target.value)} placeholder="Album name" />
            <Button className="sm:w-auto" onClick={savePostToNewAlbum}>Create & Save</Button>
          </div>
        </div>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <Button variant="secondary" onClick={savePostOnly}>Save without album</Button>
          <Button variant="ghost" onClick={closeSaveModal}>Cancel</Button>
        </div>
      </div>
    </div>
  ) : null;

  const openLoginModal = () => { setAuthMode("login"); setAuthModalOpen(true); };
  const openSignUpModal = () => { setAuthMode("signup"); setAuthModalOpen(true); };
  const withModals = (content: React.ReactNode) => <>{backendDown && (
    <div className="fixed top-0 left-0 right-0 z-[60] bg-red-600 px-6 py-3 text-center text-sm font-medium text-white shadow-lg">
      <span className="mr-2">⚠️</span>
      Cannot connect to the MUSÉ server. Please ensure the backend is running on port 8000.
      <button onClick={checkBackendHealth} className="ml-3 underline hover:text-red-100">Retry</button>
    </div>
  )}{content}{renderSaveModal()}<AuthModal isOpen={authModalOpen} initialMode={authMode} onClose={closeAuthModal} signUpSuccess={signUpSuccessOpen} onStartBrowsing={() => { setSignUpSuccessOpen(false); setAuthModalOpen(false); setPage("onboarding-style"); }} /></>;

  if (page === "welcome" || page === "home") {
    return withModals(<WelcomePage onGetStarted={openSignUpModal} onExplore={() => undefined} onNavigate={setPage} isLoggedIn={isAuthenticated} onLoginClick={openLoginModal} savedPostIds={savedPostIds} onSave={requestSavePost} onboarding={onboarding} appPreferences={appPreferences} posts={supabasePosts} />);
  }

  if (page === "onboarding-style") {
    return withModals(<OnboardingStylePage onboarding={onboarding} setOnboarding={setOnboardingState} onNext={() => setPage("onboarding-body")} onNavigate={setPage} />);
  }

  if (page === "onboarding-body") {
    return withModals(<OnboardingBodyPage onboarding={onboarding} setOnboarding={setOnboardingState} onNext={() => setPage("onboarding-fit")} onNavigate={setPage} />);
  }

  if (page === "onboarding-fit") {
    return withModals(<OnboardingFitPage onboarding={onboarding} setOnboarding={setOnboardingState} onNext={() => setPage("onboarding-direction")} onNavigate={setPage} />);
  }

  if (page === "onboarding-direction") {
    return withModals(<OnboardingDirectionPage onboarding={onboarding} setOnboarding={setOnboardingState} onFinish={() => { setOnboardingState({ ...onboarding, completed: true }); setPage("home"); }} onNavigate={setPage} />);
  }

  if (page === "library") {
    return withModals(<StyleLibraryPage currentPage={page} savedPostIds={savedPostIds} albums={albums} onNavigate={setPage} onSave={requestSavePost} onCreateAlbum={createAlbum} onOpenAlbum={openAlbum} onAddPostToAlbum={addPostToAlbum} onRemovePostFromAlbum={removePostFromAnyAlbum} onDeleteAlbum={deleteAlbum} isLoggedIn={isAuthenticated} onLoginClick={openLoginModal} posts={supabasePosts} />);
  }

  if (page === "album-detail") {
    return withModals(<AlbumDetailPage currentPage={page} album={albums.find((album) => album.id === activeAlbumId)} onNavigate={setPage} onSave={requestSavePost} onRemoveFromAlbum={removeFromAlbum} isLoggedIn={isAuthenticated} posts={supabasePosts} />);
  }

  if (page === "account") {
    if (!isAuthenticated) {
      setPage("home");
      setAuthModalOpen(true);
      return null;
    }
    return (
      withModals(<AccountPage
        currentPage={page}
        user={user}
        onboarding={onboarding}
        onNavigate={setPage}
        onEditPreferences={() => setPage("onboarding-style")}
        onLogout={logout}
        isLoggedIn={isAuthenticated}
      />)
    );
  }

  if (page === "app-preferences") {
    return withModals(<AppPreferencePage currentPage={page} preferences={appPreferences} setPreferences={setAppPreferencesState} onNavigate={setPage} isLoggedIn={isAuthenticated} />);
  }

  if (page === "settings") {
    return withModals(<SettingsPage currentPage={page} onNavigate={setPage} onClearData={clearData} onLogout={logout} isLoggedIn={isAuthenticated} />);
  }

  if (page === "privacy") {
    return withModals(<PrivacyPage currentPage={page} onNavigate={setPage} isLoggedIn={isAuthenticated} />);
  }

  return withModals(<WelcomePage onGetStarted={openSignUpModal} onExplore={() => undefined} onNavigate={setPage} isLoggedIn={isAuthenticated} onLoginClick={openLoginModal} savedPostIds={savedPostIds} onSave={requestSavePost} onboarding={onboarding} appPreferences={appPreferences} />);
}

/**
 * Root App component.
 * Wraps the entire application with AuthProvider so all components
 * can access Supabase auth state via useAuth().
 */
export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}