

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