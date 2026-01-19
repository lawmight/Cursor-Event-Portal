export default function AdminLoginPage() {
  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#0a0a0a", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: "24px", color: "white", marginBottom: "32px" }}>Admin Access</h1>
        <a
          href="/admin/calgary-jan-2026/admin2026"
          style={{ display: "inline-block", padding: "16px 32px", backgroundColor: "white", color: "black", borderRadius: "16px", fontWeight: "500", textDecoration: "none" }}
        >
          Enter Admin Dashboard
        </a>
      </div>
    </main>
  );
}
