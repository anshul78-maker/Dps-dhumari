const StudentApp = {
  pages: [
    { label: "Dashboard",    render: () => StudentApp.dashboard() },
    { label: "Assignments",  render: () => StudentApp.assignments() },
    { label: "Report Card",  render: () => StudentApp.docs("report_card") },
    { label: "Certificates", render: () => StudentApp.docs("tc") },
    { label: "Notices",      render: () => Notices.render() },
    { label: "Fees",         render: () => StudentApp.fees() }
  ],

  async dashboard() {
    setTitle("Dashboard", "Your marks and progress");
    view().innerHTML = `<div class="empty">Loading…</div>`;
    let d;
    try { d = await API.get("/api/student/dashboard"); }
    catch (e) { view().innerHTML = `<div class="empty">${e.message}</div>`; return; }

    setTitle("Hi, " + d.name.split(" ")[0], `${d.className} · Roll ${d.roll}`);

    const chip = (n) => n > 0
      ? `<span class="stat-chip up">▲ ${n}% since first exam</span>`
      : n < 0 ? `<span class="stat-chip down">▼ ${Math.abs(n)}%</span>`
              : `<span class="stat-chip flat">no change</span>`;

    const subjects = d.subjects.map(s => `
      <div class="subrow"><span>${esc(s.subject)}</span><strong>${s.score}%</strong></div>
      <div class="bar"><span style="width:${s.score}%"></span></div>`).join("");

    const overallChange = d.trend.length ? d.trend[d.trend.length - 1][1] - d.trend[0][1] : 0;

    view().innerHTML = `
      <div class="grid cols-3" style="margin-bottom:18px">
        <div class="card stat">
          <span class="stat-label">Overall average</span>
          <span class="stat-num">${d.overall}%</span>
          ${chip(overallChange)}
        </div>
        <div class="card stat">
          <span class="stat-label">Attendance</span>
          <span class="stat-num">${d.attendance}%</span>
          <span class="stat-chip flat">this term</span>
        </div>
        <div class="card stat">
          <span class="stat-label">Class rank</span>
          <span class="stat-num">${d.rank.position || "–"}<span style="font-size:16px;color:var(--ink-soft)"> / ${d.rank.total}</span></span>
          <span class="stat-chip flat">by latest average</span>
        </div>
      </div>

      <div class="grid cols-2" style="margin-bottom:18px">
        <div class="card">
          <h2>Marks growth</h2>
          ${d.trend.length ? lineChart(d.trend) : `<div class="empty">No exams yet</div>`}
        </div>
        <div class="card">
          <h2>Attendance this term</h2>
          <div class="ring-wrap">${ring(d.attendance, "present")}</div>
        </div>
      </div>

      <div class="card">
        <h2>Subjects (latest)</h2>
        ${subjects || `<div class="empty">No subjects yet</div>`}
      </div>`;
  },

  async assignments() {
    setTitle("Assignments", "Upload your work as a PDF to submit it");
    view().innerHTML = `<div class="empty">Loading…</div>`;
    let d;
    try { d = await API.get("/api/student/assignments"); }
    catch (e) { view().innerHTML = `<div class="empty">${e.message}</div>`; return; }

    if (!d.assignments.length) { view().innerHTML = `<div class="card"><div class="empty">No assignments right now.</div></div>`; return; }

    const wrap = el("div", "card");
    wrap.appendChild(el("h2", null, "Your class assignments"));
    d.assignments.forEach(a => wrap.appendChild(this.assignmentRow(a)));
    view().innerHTML = "";
    view().appendChild(wrap);
  },

  // One assignment row with its upload / view controls.
  assignmentRow(a) {
    const row = el("div", "doc-row" + (a.submission_id ? " done" : ""));
    const status = a.submission_id
      ? `<span class="badge badge-paid">Submitted</span>
         <span class="check-meta">${esc(a.original_name || "your PDF")}${a.uploaded_at ? " · " + niceDate(a.uploaded_at) : ""}</span>`
      : `<span class="badge badge-due">Not submitted</span>`;
    row.innerHTML = `
      <div style="flex:1">
        <div class="check-title">${esc(a.title)} <span style="color:var(--ink-soft);font-weight:500">· ${esc(a.subject)}</span></div>
        <div class="check-meta">${esc(a.details || "")} ${a.due_date ? "· due " + esc(a.due_date) : ""}</div>
        <div class="doc-status">${status}</div>
      </div>
      <div class="doc-actions">
        ${a.submission_id ? `<button class="btn btn-ghost btn-sm" data-view>View</button>` : ""}
        <label class="btn ${a.submission_id ? "btn-ghost" : "btn-primary"} btn-sm">
          ${a.submission_id ? "Replace" : "Upload PDF"}
          <input type="file" accept="application/pdf,.pdf" hidden>
        </label>
      </div>`;

    const viewBtn = row.querySelector("[data-view]");
    if (viewBtn) viewBtn.addEventListener("click", async () => {
      try { await API.openFile(`/api/files/submission/${a.submission_id}`); }
      catch (e) { toast(e.message); }
    });

    const input = row.querySelector("input[type=file]");
    input.addEventListener("change", async () => {
      const file = input.files[0];
      const err = validatePdf(file);
      if (err) { toast(err); input.value = ""; return; }
      const label = input.parentElement;
      const original = label.childNodes[0].nodeValue;
      label.childNodes[0].nodeValue = "Uploading… ";
      try {
        const dataUrl = await readFileAsDataUrl(file);
        await API.post(`/api/student/assignments/${a.id}/submit`, { file: dataUrl, name: file.name });
        toast("Submitted — your teacher can see it now");
        this.assignments();
      } catch (e) {
        toast(e.message);
        label.childNodes[0].nodeValue = original;
        input.value = "";
      }
    });
    return row;
  },

  // Report cards ("report_card") or certificates ("tc") issued to me.
  async docs(type) {
    const isTc = type === "tc";
    setTitle(isTc ? "Certificates" : "Report Card",
      isTc ? "Transfer certificates issued to you" : "Report cards shared by your teachers");
    view().innerHTML = `<div class="empty">Loading…</div>`;
    let d;
    try { d = await API.get("/api/student/documents"); }
    catch (e) { view().innerHTML = `<div class="empty">${e.message}</div>`; return; }

    const docs = d.documents.filter(x => x.type === type);
    const card = el("div", "card");
    card.appendChild(el("h2", null, isTc ? "Your certificates" : "Your report cards"));
    if (!docs.length) {
      card.appendChild(el("div", "empty",
        isTc ? "No certificates yet." : "No report cards yet. Your teacher will share them here."));
    } else {
      docs.forEach(doc => card.appendChild(this.docRow(doc)));
    }
    view().innerHTML = "";
    view().appendChild(card);
  },

  docRow(doc) {
    const row = el("div", "doc-row");
    row.innerHTML = `
      <div style="flex:1">
        <div class="check-title">${esc(doc.title)}</div>
        <div class="check-meta">From ${esc(doc.uploaded_by_name)}${doc.created_at ? " · " + niceDate(doc.created_at) : ""}${doc.size ? " · " + fileSize(doc.size) : ""}</div>
      </div>
      <div class="doc-actions">
        <button class="btn btn-primary btn-sm" data-view>View PDF</button>
      </div>`;
    row.querySelector("[data-view]").addEventListener("click", async () => {
      try { await API.openFile(`/api/files/document/${doc.id}`); }
      catch (e) { toast(e.message); }
    });
    return row;
  },

  async fees() {
    setTitle("Fees", "What you owe and what's paid");
    view().innerHTML = `<div class="empty">Loading…</div>`;
    let d;
    try { d = await API.get("/api/student/fees"); }
    catch (e) { view().innerHTML = `<div class="empty">${e.message}</div>`; return; }

    const rows = d.fees.map(f => `
      <tr>
        <td>${esc(f.title)}</td>
        <td>${esc(f.period || "")}</td>
        <td>₹${f.amount.toLocaleString("en-IN")}</td>
        <td><span class="badge ${f.status === "paid" ? "badge-paid" : "badge-due"}">${esc(f.status)}</span></td>
      </tr>`).join("");

    view().innerHTML = `
      <div class="grid cols-3" style="margin-bottom:18px">
        <div class="card stat">
          <span class="stat-label">Total due</span>
          <span class="stat-num">₹${d.totalDue.toLocaleString("en-IN")}</span>
          <span class="stat-chip ${d.totalDue ? "down" : "up"}">${d.totalDue ? "payment pending" : "all clear"}</span>
        </div>
      </div>
      <div class="card">
        <h2>Fee history</h2>
        <table class="table">
          <thead><tr><th>Item</th><th>Period</th><th>Amount</th><th>Status</th></tr></thead>
          <tbody>${rows || `<tr><td colspan="4" class="empty">No fees on record.</td></tr>`}</tbody>
        </table>
        <p class="check-meta" style="margin-top:12px">To pay, contact the accountant — they update the status here.</p>
      </div>`;
  }
};
