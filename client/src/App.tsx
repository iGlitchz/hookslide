import { useState, useCallback, useRef, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { HeroBanner } from "./components/HeroBanner";
import { InputForm } from "./components/InputForm";
import type { InputFormHandle } from "./components/InputForm";
import { LoadingSpinner } from "./components/LoadingSpinner";
import { LibraryView } from "./components/LibraryView";
import { FullscreenEditor } from "./components/FullscreenEditor";
import { AuthModal } from "./components/AuthModal";
import { PaywallModal } from "./components/PaywallModal";
import { useSubmissions } from "./hooks/useSubmissions";
import { useAuth } from "./hooks/useAuth";
import { useProfile } from "./hooks/useProfile";
import { SUBSCRIPTION_REQUIRED } from "./services/api";
import type { TextOverlay } from "./types";

export default function App() {
  const { session, user, loading: authLoading, signUp, signIn, signOut } = useAuth();
  const { subscriptionStatus, refetch: refetchProfile } = useProfile(user?.id);

  const { submissions, loading, error, submit, regenerate, updateOverlays, deleteSlideshow } =
    useSubmissions();

  const [editorState, setEditorState] = useState<{
    submissionId: string;
    slideshowId: string;
  } | null>(null);

  const [showPaywall, setShowPaywall] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const resultsRef = useRef<HTMLDivElement>(null);
  const inputFormRef = useRef<InputFormHandle>(null);

  // Handle Stripe redirect back to app
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has("session_id")) {
      setSuccessMessage("You're subscribed! Start generating slides.");
      refetchProfile();
      window.history.replaceState({}, "", window.location.pathname);
    } else if (params.has("upgrade_canceled")) {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [refetchProfile]);

  const handleAuth = useCallback(
    async (email: string, password: string, mode: "signin" | "signup") => {
      if (mode === "signup") return signUp(email, password);
      return signIn(email, password);
    },
    [signUp, signIn]
  );

  const handleSubmit = useCallback(
    async (imageFile: File, blurb: string) => {
      try {
        await submit(imageFile, blurb);
      } catch (err) {
        if (err instanceof Error && err.message === SUBSCRIPTION_REQUIRED) {
          setShowPaywall(true);
        }
        // other errors are already in state via useSubmissions
      }
    },
    [submit]
  );

  // Smooth scroll to results when loading starts
  useEffect(() => {
    if (loading && resultsRef.current) {
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);
    }
  }, [loading]);

  const handleCardClick = useCallback(
    (submissionId: string, slideshowId: string) => {
      setEditorState({ submissionId, slideshowId });
    },
    []
  );

  const handleDelete = useCallback(
    (submissionId: string, slideshowId: string) => {
      deleteSlideshow(submissionId, slideshowId);
    },
    [deleteSlideshow]
  );

  const handleRemix = useCallback(
    (imageUrl: string, blurb: string) => {
      inputFormRef.current?.remix(imageUrl, blurb);
    },
    []
  );

  const handleRegenerate = useCallback(
    async (...args: Parameters<typeof regenerate>) => {
      try {
        await regenerate(...args);
      } catch (err) {
        if (err instanceof Error && err.message === SUBSCRIPTION_REQUIRED) {
          setShowPaywall(true);
        }
      }
    },
    [regenerate]
  );

  const activeSubmission = editorState
    ? submissions.find((s) => s.id === editorState.submissionId)
    : null;
  const activeSlideshow = activeSubmission
    ? activeSubmission.slideshows.find((sw) => sw.id === editorState!.slideshowId)
    : null;

  // Show auth screen while loading or when not signed in
  if (authLoading) {
    return <LoadingSpinner />;
  }

  if (!session) {
    return <AuthModal onAuth={handleAuth} />;
  }

  return (
    <div className="app">
      {/* Top-right account controls */}
      <div className="account-bar">
        {subscriptionStatus !== "active" && (
          <button className="upgrade-btn" onClick={() => setShowPaywall(true)}>
            Upgrade to Pro
          </button>
        )}
        <button className="signout-btn" onClick={signOut}>
          Sign out
        </button>
      </div>

      {successMessage && (
        <div className="success-banner" onClick={() => setSuccessMessage(null)}>
          {successMessage}
        </div>
      )}

      <HeroBanner>
        <InputForm
          ref={inputFormRef}
          onSubmit={handleSubmit}
          loading={loading}
          hasSubmissions={submissions.length > 0}
        />
      </HeroBanner>

      <div className="results-section" ref={resultsRef}>
        {loading && <LoadingSpinner />}

        {error && (
          <div className="error-banner">
            <p>{error}</p>
          </div>
        )}

        <LibraryView
          submissions={submissions}
          onCardClick={handleCardClick}
          onRegenerate={handleRegenerate}
          onUpdateOverlays={updateOverlays}
          onDelete={handleDelete}
          onRemix={handleRemix}
        />
      </div>

      <AnimatePresence>
        {activeSlideshow && activeSubmission && editorState && (
          <FullscreenEditor
            key={editorState.slideshowId}
            slideshow={activeSlideshow}
            submissionId={editorState.submissionId}
            blurb={activeSubmission.brandBlurb}
            onClose={() => setEditorState(null)}
            onRegenerate={(slideIndex, imagePrompt) =>
              handleRegenerate(
                editorState.submissionId,
                editorState.slideshowId,
                slideIndex,
                imagePrompt,
                activeSubmission.brandBlurb
              )
            }
            onUpdateOverlays={(slideIndex, overlays: TextOverlay[]) =>
              updateOverlays(
                editorState.submissionId,
                editorState.slideshowId,
                slideIndex,
                overlays
              )
            }
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPaywall && (
          <PaywallModal
            onClose={() => setShowPaywall(false)}
            userEmail={user?.email}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
