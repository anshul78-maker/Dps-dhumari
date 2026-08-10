// Small fetch helper that attaches the login token.
const API = {
  token() { return localStorage.getItem("erp_token"); },
  role()  { return localStorage.getItem("erp_role"); },
  name()  { return localStorage.getItem("erp_name"); },
  setSession(t, name, role) {
    localStorage.setItem("erp_token", t);
    localStorage.setItem("erp_name", name);
    localStorage.setItem("erp_role", role);
  },
  clear() {
    localStorage.removeItem("erp_token");
    localStorage.removeItem("erp_name");
    localStorage.removeItem("erp_role");
  },
  async request(method, url, body) {
    const headers = { "Content-Type": "application/json" };
    const t = this.token();
    if (t) headers.Authorization = "Bearer " + t;
    const res = await fetch(url, {
      method, headers,
      body: body ? JSON.stringify(body) : undefined
    });
    if (res.status === 401) {
      this.clear();
      if (!location.pathname.endsWith("login.html")) location.href = "/login.html";
      throw new Error("Not signed in");
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Something went wrong");
    return data;
  },
  get(url) { return this.request("GET", url); },
  post(url, body) { return this.request("POST", url, body); },

  // Fetch a protected PDF (token in the header, never the URL) and open it in
  // a new tab via a temporary blob URL.
  async openFile(url) {
    const headers = {};
    const t = this.token();
    if (t) headers.Authorization = "Bearer " + t;
    const res = await fetch(url, { headers });
    if (res.status === 401) { this.clear(); location.href = "/login.html"; throw new Error("Not signed in"); }
    if (!res.ok) {
      let msg = "Could not open the file";
      try { msg = (await res.json()).error || msg; } catch {}
      throw new Error(msg);
    }
    const blobUrl = URL.createObjectURL(await res.blob());
    window.open(blobUrl, "_blank");
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
  }
};
