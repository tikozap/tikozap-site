// src/lib/email/templates/TestEmail.tsx

type Props = {
  name: string;
};

export default function TestEmail({ name }: Props) {
  return (
    <html>
      <body
        style={{
          fontFamily: 'Arial, sans-serif',
          padding: '32px',
          lineHeight: 1.6,
        }}
      >
        <h2>🎉 Hello, {name}!</h2>

        <p>
          Congratulations! This is the first email sent by TikoZap.
        </p>

        <p>
          If you're reading this, the email system is working correctly.
        </p>

        <hr />

        <p style={{ color: '#666' }}>
          — The TikoZap Team
        </p>
      </body>
    </html>
  );
}