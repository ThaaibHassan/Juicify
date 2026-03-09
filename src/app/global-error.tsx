"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui", padding: "2rem", maxWidth: "32rem", margin: "0 auto" }}>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 600 }}>Something went wrong</h1>
        <p style={{ color: "#666", fontSize: "0.875rem", marginTop: "0.5rem" }}>
          {error.message || "An unexpected error occurred."}
        </p>
        <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.75rem" }}>
          <button
            type="button"
            onClick={reset}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "0.375rem",
              background: "#000",
              color: "#fff",
              border: "none",
              cursor: "pointer",
              fontSize: "0.875rem",
            }}
          >
            Try again
          </button>
          <a
            href="/"
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "0.375rem",
              border: "1px solid #ccc",
              color: "inherit",
              textDecoration: "none",
              fontSize: "0.875rem",
            }}
          >
            Go home
          </a>
        </div>
      </body>
    </html>
  );
}
