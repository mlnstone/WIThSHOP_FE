
export function decodeJwt(token) {
    try {
      const [, payload] = token.split(".");
      return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    } catch {
      return null;
    }
  }