// Wraps the native fetch so that any expired-token response
// (401 + {"error": "TOKEN_EXPIRED"}) automatically logs the user out
// and redirects to login — no matter which component made the call.

const originalFetch = window.fetch;

window.fetch = async (...args) => {
  const response = await originalFetch(...args);

  if (response.status === 401) {
    try {
      const cloned = response.clone();
      const data = await cloned.json();
      if (data?.error === "TOKEN_EXPIRED") {
        localStorage.removeItem("token");
        if (!window.location.pathname.startsWith("/login")) {
          window.location.href = "/login?sessionExpired=true";
        }
      }
    } catch {
      // response body wasn't JSON, or didn't match — ignore, let the
      // original caller handle it normally
    }
  }

  return response;
};