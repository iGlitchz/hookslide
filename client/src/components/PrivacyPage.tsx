interface PrivacyPageProps {
  onHome: () => void;
}

export function PrivacyPage({ onHome }: PrivacyPageProps) {
  return (
    <div className="legal-page">
      <button className="legal-home-btn" onClick={onHome}>
        ← Home
      </button>
      <div className="legal-content">
        <h1>Hook→Slide Privacy Policy</h1>
        <p className="legal-effective">Effective Date: June 2, 2026</p>
        <p>
          Hook→Slide is committed to protecting your privacy. This policy explains how your
          information is processed when you use our services to generate slideshows and integrate
          with the TikTok API.
        </p>

        <h2>1. Data Collection and Processing</h2>
        <p>
          We operate on a minimal-data model. We do not retain your content or authentication
          tokens beyond your active session.
        </p>
        <table className="legal-table">
          <thead>
            <tr>
              <th>Data Category</th>
              <th>Purpose of Processing</th>
              <th>Third-Party Services</th>
              <th>Retention Period</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Payment Information</td>
              <td>Processing subscription or service fees</td>
              <td>Stripe</td>
              <td>Not held on Hook→Slide servers</td>
            </tr>
            <tr>
              <td>Generative Prompts</td>
              <td>Creating AI-generated slideshows</td>
              <td>Runware API, OpenRouter</td>
              <td>Active session only</td>
            </tr>
            <tr>
              <td>Account Authentication</td>
              <td>Direct posting and account linking</td>
              <td>TikTok API</td>
              <td>Active session only</td>
            </tr>
          </tbody>
        </table>

        <h2>2. Third-Party AI Integrations</h2>
        <p>
          Hook→Slide utilizes external APIs, specifically Runware API and OpenRouter, to generate
          your content. No personal identifying information is transmitted to these third parties.
          Only the structural prompts required to generate your slideshows are processed.
        </p>

        <h2>3. Children's Privacy</h2>
        <p>
          In compliance with our integration guidelines, Hook→Slide enforces the same age
          restrictions as TikTok. You must be at least 13 years of age to use this application.
        </p>

        <h2>4. Contact Information</h2>
        <p>For privacy inquiries or support requests, contact us at:</p>
        <div className="legal-contact">
          <p>
            <strong>Email:</strong>{" "}
            <a href="mailto:cocasiomi@gmail.com">cocasiomi@gmail.com</a>
          </p>
          <p>
            <strong>Subject format:</strong> Privacy Inquiry - [Your Subject]
          </p>
          <p>
            <strong>Include:</strong> Inquiry Type (Data Deletion / Clarification / TikTok API
            Revocation) and a description of your request.
          </p>
        </div>
      </div>
    </div>
  );
}
