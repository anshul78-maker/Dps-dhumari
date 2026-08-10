// Shared "Notice board" page. Students read; teachers and the accountant
// can also post and remove notices. Loaded for every role.
const Notices = {
  async render() {
    setTitle("Notices", "Announcements from the school");
    view().innerHTML = `<div class="empty">Loading…</div>`;

    let d;
    try { d = await API.get("/api/notices"); }
    catch (e) { view().innerHTML = `<div class="card"><div class="empty">${esc(e.message)}</div></div>`; return; }

    const canPost = d.role === "teacher" || d.role === "accountant";
    view().innerHTML = "";

    if (canPost) view().appendChild(this.composer());
    view().appendChild(this.list(d.notices, canPost));
  },

  composer() {
    const card = el("div", "card");
    card.style.marginBottom = "18px";
    card.innerHTML = `
      <h2>Post a notice</h2>
      <div class="inline-form">
        <div class="fg" style="flex:1"><label>Title</label>
          <input id="ntTitle" maxlength="120" placeholder="e.g. Sports day rescheduled" style="width:100%"></div>
        <div class="fg"><label>Audience</label>
          <select id="ntAudience">
            <option value="all">Whole school</option>
            <option value="Class 8-A">Class 8-A</option>
          </select></div>
      </div>
      <div class="inline-form">
        <div class="fg" style="flex:1"><label>Message</label>
          <textarea id="ntBody" rows="2" placeholder="Write the announcement…" style="width:100%;resize:vertical"></textarea></div>
        <button id="ntPost" class="btn btn-primary btn-sm">Post notice</button>
      </div>`;

    card.querySelector("#ntPost").addEventListener("click", async () => {
      const title = card.querySelector("#ntTitle").value.trim();
      const body = card.querySelector("#ntBody").value.trim();
      const audience = card.querySelector("#ntAudience").value;
      if (!title || !body) return toast("Add a title and a message");
      try {
        await API.post("/api/notices", { title, body, audience });
        toast("Notice posted — everyone can see it now");
        this.render();
      } catch (e) { toast(e.message); }
    });
    return card;
  },

  list(notices, canManage) {
    const card = el("div", "card");
    card.appendChild(el("h2", null, "Notice board"));
    if (!notices.length) {
      card.appendChild(el("div", "empty", "No notices yet."));
      return card;
    }
    notices.forEach(n => {
      const item = el("div", "notice");
      const when = this.when(n.created_at);
      const scope = n.audience && n.audience !== "all"
        ? `<span class="notice-tag">${esc(n.audience)}</span>`
        : `<span class="notice-tag all">Whole school</span>`;
      item.innerHTML = `
        <div class="notice-head">
          <div class="notice-title">${esc(n.title)} ${scope}</div>
          ${canManage ? `<button class="notice-del" title="Remove" data-del="${n.id}">✕</button>` : ""}
        </div>
        <div class="notice-body">${esc(n.body)}</div>
        <div class="notice-meta">${esc(n.author_name)}${when ? " · " + when : ""}</div>`;
      const del = item.querySelector("[data-del]");
      if (del) del.addEventListener("click", async () => {
        try {
          await API.request("DELETE", "/api/notices/" + del.dataset.del);
          item.remove();
          toast("Notice removed");
        } catch (e) { toast(e.message); }
      });
      card.appendChild(item);
    });
    return card;
  },

  // "2026-02-06 09:12:00" (UTC from SQLite) -> friendly local date.
  when(s) {
    if (!s) return "";
    const d = new Date(s.replace(" ", "T") + "Z");
    if (isNaN(d)) return "";
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  }
};
