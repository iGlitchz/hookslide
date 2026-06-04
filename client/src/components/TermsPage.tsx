interface TermsPageProps {
  onHome: () => void;
}

export function TermsPage({ onHome }: TermsPageProps) {
  return (
    <div className="legal-page">
      <button className="legal-home-btn" onClick={onHome}>
        ← Home
      </button>
      <div className="legal-content">
        <h1>Hook→Slide Terms of Service</h1>
        <p className="legal-effective">Effective Date: June 2, 2026</p>
        <p>
          These Terms of Service govern your use of the Hook→Slide web application, developed and
          owned by Carlos Ocasio Milanes. By accessing Hook→Slide, you agree to be bound by these
          terms.
        </p>

        <h2>1. User Responsibilities</h2>
        <ul>
          <li>You must be at least 13 years old to operate this service.</li>
          <li>
            You are responsible for ensuring that your TikTok account remains in good standing.
          </li>
          <li>
            You agree not to use the service to generate content that violates TikTok's community
            guidelines.
          </li>
        </ul>

        <h2>2. Intellectual Property &amp; Copyright</h2>
        <p>We believe in empowering creators. Therefore, the copyright structure is as follows:</p>
        <ol>
          <li>
            <strong>User Ownership:</strong> You retain 100% full copyright ownership of all the
            slideshows and content generated through Hook→Slide.
          </li>
          <li>
            <strong>No Licensing Claims:</strong> Hook→Slide does not claim any licensing rights,
            royalties, or distribution rights over the media you create.
          </li>
        </ol>

        <h2>3. Payments and Subscriptions</h2>
        <p>
          All financial transactions are securely processed through Stripe. Hook→Slide does not
          store your credit card information. Disputes and refunds are handled in accordance with
          Stripe's standard terms.
        </p>

        <h2>4. Limitation of Liability</h2>
        <p>
          Hook→Slide and Carlos Ocasio Milanes shall not be held liable for any indirect,
          incidental, or consequential damages resulting from the use or inability to use the
          service, including any actions taken by TikTok regarding your account.
        </p>
      </div>
    </div>
  );
}
