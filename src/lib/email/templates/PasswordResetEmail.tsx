// src/lib/email/templates/PasswordResetEmail.tsx

type Props = {
  resetUrl: string;
};

export default function PasswordResetEmail({
  resetUrl,
}: Props) {
  return (
    <html>
      <body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: '#f8fafc',
          fontFamily:
            'Arial, Helvetica, sans-serif',
          color: '#111827',
        }}
      >
        <div
          style={{
            display: 'none',
            maxHeight: 0,
            overflow: 'hidden',
            opacity: 0,
          }}
        >
          Reset your TikoZap password.
        </div>

        <div
          style={{
            width: '100%',
            padding: '40px 16px',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              maxWidth: 560,
              margin: '0 auto',
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: 16,
              padding: '32px',
              boxSizing: 'border-box',
            }}
          >
            <div
              style={{
                marginBottom: 24,
                fontSize: 20,
                fontWeight: 800,
                letterSpacing: '-0.02em',
              }}
            >
              TikoZap
            </div>

            <h1
              style={{
                margin: '0 0 16px',
                fontSize: 26,
                lineHeight: 1.25,
              }}
            >
              Reset your password
            </h1>

            <p
              style={{
                margin: '0 0 16px',
                fontSize: 16,
                lineHeight: 1.6,
                color: '#374151',
              }}
            >
              We received a request to reset the password
              for your TikoZap account.
            </p>

            <p
              style={{
                margin: '0 0 24px',
                fontSize: 16,
                lineHeight: 1.6,
                color: '#374151',
              }}
            >
              Use the button below to choose a new password.
            </p>

            <a
              href={resetUrl}
              style={{
                display: 'inline-block',
                padding: '12px 20px',
                borderRadius: 10,
                backgroundColor: '#2563eb',
                color: '#ffffff',
                fontSize: 15,
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              Reset password
            </a>

            <p
              style={{
                margin: '24px 0 8px',
                fontSize: 14,
                lineHeight: 1.6,
                color: '#6b7280',
              }}
            >
              This reset link expires in 1 hour and can
              only be used once.
            </p>

            <p
              style={{
                margin: '0 0 8px',
                fontSize: 14,
                lineHeight: 1.6,
                color: '#6b7280',
              }}
            >
              If the button does not work, copy and paste
              this address into your browser:
            </p>

            <p
              style={{
                margin: 0,
                fontSize: 13,
                lineHeight: 1.5,
                color: '#2563eb',
                wordBreak: 'break-all',
              }}
            >
              {resetUrl}
            </p>

            <div
              style={{
                marginTop: 28,
                paddingTop: 20,
                borderTop: '1px solid #e5e7eb',
                fontSize: 13,
                lineHeight: 1.6,
                color: '#6b7280',
              }}
            >
              If you did not request a password reset, you
              can safely ignore this email. Your password
              will remain unchanged.
              <br />
              <br />
              — The TikoZap Team
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}