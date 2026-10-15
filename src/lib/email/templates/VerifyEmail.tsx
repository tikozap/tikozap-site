// src/lib/email/templates/VerifyEmail.tsx

type Props = {
  name: string;
  verifyUrl: string;
};

export default function VerifyEmail({
  name,
  verifyUrl,
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
          Verify your email address to activate your
          TikoZap account.
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
              Verify your email
            </h1>

            <p
              style={{
                margin: '0 0 16px',
                fontSize: 16,
                lineHeight: 1.6,
                color: '#374151',
              }}
            >
              Hi {name || 'there'},
            </p>

            <p
              style={{
                margin: '0 0 24px',
                fontSize: 16,
                lineHeight: 1.6,
                color: '#374151',
              }}
            >
              Thanks for creating your TikoZap account.
              Please verify your email address to activate
              your account and begin your 14-day Pro trial.
            </p>

            <a
              href={verifyUrl}
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
              Verify email
            </a>

            <p
              style={{
                margin: '24px 0 8px',
                fontSize: 14,
                lineHeight: 1.6,
                color: '#6b7280',
              }}
            >
              This verification link expires in 24 hours
              and can only be used once.
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
              {verifyUrl}
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
              If you did not create a TikoZap account, you
              can safely ignore this email.
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