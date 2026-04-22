export default function TzTestPage() {
  const key = "tz_438abbf4ec1a5120e229586fa8d123af"; // <-- paste your tz_ key

  return (
    <html>
      <body>
        <h1>TikoZap Widget Test</h1>

        <script
          async
          src="/widget.js"
          data-tikozap-key={key}
          data-tikozap-api-base="http://localhost:3000"
        />
      </body>
    </html>
  );
}
