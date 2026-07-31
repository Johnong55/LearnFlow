import { getAccessToken, setAccessToken } from "@/lib/api/auth-session";

describe("browser auth session", () => {
  afterEach(() => setAccessToken(null));

  it("keeps the access token through a page reload", () => {
    setAccessToken("access-token");
    expect(getAccessToken()).toBe("access-token");
    expect(window.localStorage.getItem("accessToken")).toBeNull();
    expect(window.sessionStorage.getItem("skillpilot.access-token")).toBe(
      "access-token",
    );
  });

  it("removes the persisted token when the session is cleared", () => {
    setAccessToken("access-token");
    setAccessToken(null);
    expect(getAccessToken()).toBeNull();
    expect(window.sessionStorage.getItem("skillpilot.access-token")).toBeNull();
  });
});
