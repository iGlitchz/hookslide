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
import { AccountsDashboardModal } from "./components/AccountsDashboardModal";
import { PublishPostModal } from "./components/PublishPostModal";
import { TermsPage } from "./components/TermsPage";
import { PrivacyPage } from "./components/PrivacyPage";
import { useSubmissions } from "./hooks/useSubmissions";
import { useAuth } from "./hooks/useAuth";
import { useProfile } from "./hooks/useProfile";
import { SUBSCRIPTION_REQUIRED } from "./services/api";
import type { PublishPlatform, Slideshow, TextOverlay } from "./types";

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
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [authSource, setAuthSource] = useState<"default" | "tiktok">("default");
  const [showAccountsDashboard, setShowAccountsDashboard] = useState(false);
  const [publishTarget, setPublishTarget] = useState<{
    slideshow: Slideshow;
    platform: PublishPlatform;
  } | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [page, setPage] = useState<"home" | "terms" | "privacy">("home");

  const resultsRef = useRef<HTMLDivElement>(null);
  const inputFormRef = useRef<InputFormHandle>(null);

  // Handle Stripe redirect back to app
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has("session_id")) {
      setSuccessMessage("You're subscribed! Start generating slides.");
      window.history.replaceState({}, "", window.location.pathname);
      // Webhook may not have fired yet — poll until status flips to active (max ~10s)
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        await refetchProfile();
        if (attempts >= 5) clearInterval(poll);
      }, 2000);
      return () => clearInterval(poll);
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
    async (...args: Parameters<typeof submit>) => {
      if (!session) {
        setAuthMode("signin");
        setAuthSource("default");
        setShowAuth(true);
        return;
      }
      try {
        await submit(...args);
      } catch (err) {
        if (err instanceof Error && err.message === SUBSCRIPTION_REQUIRED) {
          setShowPaywall(true);
        }
        // other errors are already in state via useSubmissions
      }
    },
    [submit, session]
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
      if (!session) {
        setAuthMode("signin");
        setAuthSource("default");
        setShowAuth(true);
        return;
      }
      try {
        await regenerate(...args);
      } catch (err) {
        if (err instanceof Error && err.message === SUBSCRIPTION_REQUIRED) {
          setShowPaywall(true);
        }
      }
    },
    [regenerate, session]
  );

  const activeSubmission = editorState
    ? submissions.find((s) => s.id === editorState.submissionId)
    : null;
  const activeSlideshow = activeSubmission
    ? activeSubmission.slideshows.find((sw) => sw.id === editorState!.slideshowId)
    : null;

  if (authLoading) {
    return <LoadingSpinner />;
  }

  if (page === "terms") return <TermsPage onHome={() => setPage("home")} />;
  if (page === "privacy") return <PrivacyPage onHome={() => setPage("home")} />;

  return (
    <div className="app">
      {/* Top-left legal nav tabs */}
      <div className="legal-nav">
        <button className="legal-nav-btn" onClick={() => setPage("terms")}>Terms</button>
        <button className="legal-nav-btn" onClick={() => setPage("privacy")}>Privacy</button>
      </div>

      {/* Top-right account controls */}
      <div className="account-bar">
        {session ? (
          <>
            <button className="signout-btn" onClick={() => setShowAccountsDashboard(true)}>
              Accounts
            </button>
            {subscriptionStatus !== "active" && (
              <button className="upgrade-btn" onClick={() => setShowPaywall(true)}>
                Upgrade to Pro
              </button>
            )}
            <button className="signout-btn" onClick={signOut}>
              Sign out
            </button>
          </>
        ) : (
          <button
            className="signout-btn"
            onClick={() => {
              setAuthMode("signin");
              setAuthSource("default");
              setShowAuth(true);
            }}
          >
            Sign in
          </button>
        )}
        <div className="tiktok-login-wrap" data-tooltip="Create an account to post to TikTok">
          <button
            className="signout-btn tiktok-login-btn"
            type="button"
            aria-label="Sign up with TikTok"
            onClick={() => {
              setAuthMode("signup");
              setAuthSource("tiktok");
              setShowAuth(true);
            }}
          >
            Sign up with TikTok
          </button>
        </div>
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
          onDelete={handleDelete}
          onRemix={handleRemix}
          onPostTikTok={(submissionId, slideshowId) => {
            const submission = submissions.find((item) => item.id === submissionId);
            const slideshow = submission?.slideshows.find((item) => item.id === slideshowId);
            if (slideshow) setPublishTarget({ slideshow, platform: "tiktok" });
          }}
          onPostInstagram={(submissionId, slideshowId) => {
            const submission = submissions.find((item) => item.id === submissionId);
            const slideshow = submission?.slideshows.find((item) => item.id === slideshowId);
            if (slideshow) setPublishTarget({ slideshow, platform: "instagram" });
          }}
          onSchedulePost={(submissionId, slideshowId) => {
            const submission = submissions.find((item) => item.id === submissionId);
            const slideshow = submission?.slideshows.find((item) => item.id === slideshowId);
            if (slideshow) setPublishTarget({ slideshow, platform: "schedule" });
          }}
        />
      </div>

      <AnimatePresence>
        {activeSlideshow && activeSubmission && editorState && (
          <FullscreenEditor
            key={editorState.slideshowId}
            slideshow={activeSlideshow}
            submissionId={editorState.submissionId}
            blurb={activeSubmission.brandBlurb}
            postFormat={activeSubmission.postFormat || "carousel"}
            onClose={() => setEditorState(null)}
            onRegenerate={(slideIndex, imagePrompt) =>
              handleRegenerate(
                editorState.submissionId,
                editorState.slideshowId,
                slideIndex,
                imagePrompt,
                activeSubmission.brandBlurb,
                activeSubmission.postFormat || "carousel",
                activeSubmission.productImageUrl
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
        {showAuth && (
          <AuthModal
            onAuth={handleAuth}
            onClose={() => setShowAuth(false)}
            initialMode={authMode}
            source={authSource}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAccountsDashboard && (
          <AccountsDashboardModal onClose={() => setShowAccountsDashboard(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {publishTarget && (
          <PublishPostModal
            slideshow={publishTarget.slideshow}
            platform={publishTarget.platform}
            onClose={() => setPublishTarget(null)}
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
