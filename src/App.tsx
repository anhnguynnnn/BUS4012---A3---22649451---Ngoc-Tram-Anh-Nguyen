import { useEffect, useState } from "react";
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
import type { Album, AppPreferences, OnboardingAnswers, Page, UserAccount } from "./types";
import { clearMuseStorage, getFromStorage, saveToStorage, STORAGE_KEYS } from "./utils/storage";
import { defaultAppPreferences, defaultOnboarding } from "./utils/matchingLogic";

const defaultUser: UserAccount = { fullName: "MUSÉ User", email: "user@muse.app", password: "" };
const mergeOnboarding = (value: Partial<OnboardingAnswers>): OnboardingAnswers => ({ ...defaultOnboarding, ...value });
const mergeAppPreferences = (value: Partial<AppPreferences>): AppPreferences => ({ ...defaultAppPreferences, ...value });
const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

export default function App() {
  const [page, setPage] = useState<Page>("welcome");
  const [user, setUser] = useState<UserAccount>(() => getFromStorage(STORAGE_KEYS.user, defaultUser));
  const [loggedIn, setLoggedIn] = useState(() => getFromStorage(STORAGE_KEYS.loggedIn, false));
  const [onboarding, setOnboardingState] = useState<OnboardingAnswers>(() => mergeOnboarding(getFromStorage(STORAGE_KEYS.onboarding, defaultOnboarding)));
  const [savedPostIds, setSavedPostIds] = useState<string[]>(() => getFromStorage(STORAGE_KEYS.savedPosts, []));
  const [albums, setAlbums] = useState<Album[]>(() => getFromStorage(STORAGE_KEYS.albums, []));
  const [appPreferences, setAppPreferencesState] = useState<AppPreferences>(() => mergeAppPreferences(getFromStorage(STORAGE_KEYS.appPreferences, defaultAppPreferences)));
  const [activeAlbumId, setActiveAlbumId] = useState("");
  const [pendingSavePostId, setPendingSavePostId] = useState("");
  const [newAlbumName, setNewAlbumName] = useState("");
  const [entryPopupSeen, setEntryPopupSeen] = useState(() => getFromStorage(STORAGE_KEYS.entryPopupSeen, false));
  const [authModalOpen, setAuthModalOpen] = useState(() => !getFromStorage(STORAGE_KEYS.loggedIn, false) && !getFromStorage(STORAGE_KEYS.entryPopupSeen, false));
  const [authMode, setAuthMode] = useState<"entry" | "login" | "signup">(() => (!getFromStorage(STORAGE_KEYS.loggedIn, false) && !getFromStorage(STORAGE_KEYS.entryPopupSeen, false) ? "entry" : "login"));
  const [signUpSuccessOpen, setSignUpSuccessOpen] = useState(false);

  useEffect(() => saveToStorage(STORAGE_KEYS.user, user), [user]);
  useEffect(() => saveToStorage(STORAGE_KEYS.loggedIn, loggedIn), [loggedIn]);
  useEffect(() => saveToStorage(STORAGE_KEYS.onboarding, onboarding), [onboarding]);
  useEffect(() => saveToStorage(STORAGE_KEYS.savedPosts, savedPostIds), [savedPostIds]);
  useEffect(() => saveToStorage(STORAGE_KEYS.albums, albums), [albums]);
  useEffect(() => saveToStorage(STORAGE_KEYS.appPreferences, appPreferences), [appPreferences]);
  useEffect(() => saveToStorage(STORAGE_KEYS.entryPopupSeen, entryPopupSeen), [entryPopupSeen]);

  const closeAuthModal = () => {
    if (authMode === "entry") setEntryPopupSeen(true);
    setAuthModalOpen(false);
    setSignUpSuccessOpen(false);
  };

  const requestSavePost = (postId: string) => {
    if (!loggedIn) {
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
    if (loggedIn) return true;
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
    setPendingSavePostId("");
    setNewAlbumName("");
  };

  const savePostToNewAlbum = () => {
    if (!pendingSavePostId || !newAlbumName.trim()) return;
    const albumId = crypto.randomUUID();
    setSavedPostIds((current) => current.includes(pendingSavePostId) ? current : [...current, pendingSavePostId]);
    setAlbums((current) => [...current, { id: albumId, name: newAlbumName.trim(), postIds: [pendingSavePostId], createdAt: new Date().toISOString() }]);
    setPendingSavePostId("");
    setNewAlbumName("");
  };

  const closeSaveModal = () => { setPendingSavePostId(""); setNewAlbumName(""); };

  const login = (email: string, password: string) => {
    if (!isValidEmail(email)) return;
    setUser((current) => ({ ...current, email: email.trim(), password }));
    setLoggedIn(true);
    setEntryPopupSeen(true);
    setAuthModalOpen(false);
    setSignUpSuccessOpen(false);
    setPage("home");
  };

  const signUp = (nextUser: UserAccount) => {
    if (!isValidEmail(nextUser.email)) return;
    setUser({ ...nextUser, fullName: nextUser.fullName.trim(), email: nextUser.email.trim() });
    setLoggedIn(true);
    setEntryPopupSeen(true);
    setOnboardingState(defaultOnboarding);
    setSignUpSuccessOpen(false);
    setAuthModalOpen(false);
    setPage("onboarding-style");
  };

  const startBrowsingAfterSignUp = () => {
    setSignUpSuccessOpen(false);
    setAuthModalOpen(false);
    setPage("onboarding-style");
  };

  const completeOnboarding = () => {
    setOnboardingState({ ...onboarding, completed: true });
    setPage("home");
  };

  const logout = () => {
    setLoggedIn(false);
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
  const clearData = () => { clearMuseStorage(); setUser(defaultUser); setLoggedIn(false); setOnboardingState(defaultOnboarding); setSavedPostIds([]); setAlbums([]); setAppPreferencesState(defaultAppPreferences); setPage("welcome"); };

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
  const withModals = (content: React.ReactNode) => <>{content}{renderSaveModal()}<AuthModal isOpen={authModalOpen} initialMode={authMode} onClose={closeAuthModal} onLogin={login} onSignUp={signUp} signUpSuccess={signUpSuccessOpen} onStartBrowsing={startBrowsingAfterSignUp} /></>;

  if (page === "welcome" || page === "home") {
    return withModals(<WelcomePage onGetStarted={openSignUpModal} onExplore={() => undefined} onNavigate={setPage} isLoggedIn={loggedIn} onLoginClick={openLoginModal} savedPostIds={savedPostIds} onSave={requestSavePost} onboarding={onboarding} appPreferences={appPreferences} />);
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
    return withModals(<OnboardingDirectionPage onboarding={onboarding} setOnboarding={setOnboardingState} onFinish={completeOnboarding} onNavigate={setPage} />);
  }

  if (page === "library") {
    return withModals(<StyleLibraryPage currentPage={page} savedPostIds={savedPostIds} albums={albums} onNavigate={setPage} onSave={requestSavePost} onCreateAlbum={createAlbum} onOpenAlbum={openAlbum} onAddPostToAlbum={addPostToAlbum} onRemovePostFromAlbum={removePostFromAnyAlbum} onDeleteAlbum={deleteAlbum} isLoggedIn={loggedIn} onLoginClick={openLoginModal} />);
  }

  if (page === "album-detail") {
    return withModals(<AlbumDetailPage currentPage={page} album={albums.find((album) => album.id === activeAlbumId)} onNavigate={setPage} onSave={requestSavePost} onRemoveFromAlbum={removeFromAlbum} isLoggedIn={loggedIn} />);
  }

  if (page === "account") {
    if (!loggedIn) {
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
        isLoggedIn={loggedIn}
      />)
    );
  }

  if (page === "app-preferences") {
    return withModals(<AppPreferencePage currentPage={page} preferences={appPreferences} setPreferences={setAppPreferencesState} onNavigate={setPage} isLoggedIn={loggedIn} />);
  }

  if (page === "settings") {
    return withModals(<SettingsPage currentPage={page} onNavigate={setPage} onClearData={clearData} onLogout={logout} isLoggedIn={loggedIn} />);
  }

  if (page === "privacy") {
    return withModals(<PrivacyPage currentPage={page} onNavigate={setPage} isLoggedIn={loggedIn} />);
  }

  return withModals(<WelcomePage onGetStarted={openSignUpModal} onExplore={() => undefined} onNavigate={setPage} isLoggedIn={loggedIn} onLoginClick={openLoginModal} savedPostIds={savedPostIds} onSave={requestSavePost} onboarding={onboarding} appPreferences={appPreferences} />);
}
