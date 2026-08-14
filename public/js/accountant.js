const AccountantApp = {
  pages: [
    { label: "Fees overview",  render: () => AccountantApp.overview() },
    { label: "Students",       render: () => AccountantApp.students() },
    { label: "Add fee",        render: () => AccountantApp.addFee() },
    { label: "Transfer Cert.", render: () => AccountantApp.tc() },
    { label: "Notices",        render: () => Notices.render() }
  ],

  // Full student roster as a clean, searchable, multi-column table.
  async students() {
    setTitle("Students", "Every student on record, by class");
    view().innerHTML = `<div class="empty">Loading…</div>`;
    let d;
    try { d = await API.get("/api/accountant/students"); }
    catch (e) { view().innerHTML = `<div class="empty">${e.message}</div>`; return; }

    const all = d.students;
    const classNames = [...new Set(all.map(s => s.class_name))];
    const classOpts = `<option value="">All classes (${all.length})</option>` +
      classNames.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join("");

    view().innerHTML = `
      <div class="card">
        <div class="roster-bar">
          <div class="roster-search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>
            </svg>
            <input id="rSearch" type="search" placeholder="Search name, roll, guardian or phone…">
          </div>
          <select id="rClass" class="roster-select">${classOpts}</select>
          <span class="roster-count" id="rCount"></span>
        </div>
        <div class="roster-scroll">
          <table class="table roster-table">
            <thead><tr>
              <th style="width:64px">Roll</th>
              <th>Name</th>
              <th>Class</th>
              <th>Gender</th>
              <th>Guardian</th>
              <th>Phone</th>
            </tr></thead>
            <tbody id="rBody"></tbody>
          </table>
        </div>
      </div>`;

    const body = document.getElementById("rBody");
    const count = document.getElementById("rCount");
    const search = document.getElementById("rSearch");
    const clsSel = document.getElementById("rClass");

    const draw = () => {
      const q = search.value.trim().toLowerCase();
      const cls = clsSel.value;
      const rows = all.filter(s =>
        (!cls || s.class_name === cls) &&
        (!q || [s.name, s.roll, s.guardian_name, s.phone, s.admission_no]
          .some(v => String(v ?? "").toLowerCase().includes(q))));
      count.textContent = `${rows.length} student${rows.length === 1 ? "" : "s"}`;
      body.innerHTML = rows.length ? rows.map(s => `
        <tr>
          <td class="roster-roll">${esc(s.roll ?? "—")}</td>
          <td class="roster-name">${esc(s.name)}</td>
          <td><span class="pill">${esc(s.class_name)}</span></td>
          <td>${esc(s.gender || "—")}</td>
          <td>${esc(s.guardian_name || "—")}</td>
          <td>${s.phone ? esc(s.phone) : `<span class="check-meta">—</span>`}</td>
        </tr>`).join("")
        : `<tr><td colspan="6" class="empty">No students match your search.</td></tr>`;
    };
    draw();
    search.addEventListener("input", draw);
    clsSel.addEventListener("change", draw);
  },

  async overview() {
    setTitle("Fees overview", "Dues and payments across all students");
    view().innerHTML = `<div class="empty">Loading…</div>`;
    let d;
    try { d = await API.get("/api/accountant/overview"); }
    catch (e) { view().innerHTML = `<div class="empty">${e.message}</div>`; return; }

    const rows = d.fees.map(f => `
      <tr>
        <td>${esc(f.student_name)}<div class="check-meta">${esc(f.class_name)} · Roll ${esc(f.roll)}</div></td>
        <td>${esc(f.title)}<div class="check-meta">${esc(f.period || "")}</div></td>
        <td>₹${f.amount.toLocaleString("en-IN")}</td>
        <td><span class="badge ${f.status === "paid" ? "badge-paid" : "badge-due"}">${esc(f.status)}</span></td>
        <td>${f.status === "due"
          ? `<button class="btn btn-teal btn-sm" data-paid="${f.id}">Mark paid</button>`
          : `<span class="check-meta">—</span>`}</td>
      </tr>`).join("");

    view().innerHTML = `
      <div class="grid cols-3" style="margin-bottom:18px">
        <div class="card stat">
          <span class="stat-label">Total collected</span>
          <span class="stat-num">₹${d.totalPaid.toLocaleString("en-IN")}</span>
          <span class="stat-chip up">paid</span>
        </div>
        <div class="card stat">
          <span class="stat-label">Total outstanding</span>
          <span class="stat-num">₹${d.totalDue.toLocaleString("en-IN")}</span>
          <span class="stat-chip ${d.totalDue ? "down" : "up"}">${d.totalDue ? "due" : "all clear"}</span>
        </div>
        <div class="card stat">
          <span class="stat-label">Students</span>
          <span class="stat-num">${d.students.length}</span>
          <span class="stat-chip flat">on record</span>
        </div>
      </div>
      <div class="card">
        <h2>All fees</h2>
        <table class="table">
          <thead><tr><th>Student</th><th>Item</th><th>Amount</th><th>Status</th><th></th></tr></thead>
          <tbody>${rows || `<tr><td colspan="5" class="empty">No fees yet.</td></tr>`}</tbody>
        </table>
      </div>`;

    view().querySelectorAll("[data-paid]").forEach(btn => {
      btn.addEventListener("click", async () => {
        btn.disabled = true; btn.textContent = "…";
        try {
          await API.post(`/api/accountant/fees/${btn.dataset.paid}/paid`, {});
          toast("Marked paid — the student sees this update");
          this.overview();
        } catch (e) { toast(e.message); btn.disabled = false; btn.textContent = "Mark paid"; }
      });
    });
  },

  async addFee() {
    setTitle("Add fee", "Charge one student or a whole class");
    view().innerHTML = `<div class="empty">Loading…</div>`;
    let d;
    try { d = await API.get("/api/accountant/overview"); }
    catch (e) { view().innerHTML = `<div class="empty">${e.message}</div>`; return; }

    const classNames = [...new Set(d.students.map(s => s.class_name))];
    const studentOpts = d.students.map(s =>
      `<option value="${s.id}">${esc(s.name)} — ${esc(s.class_name)} (Roll ${esc(s.roll)})</option>`).join("");

    view().innerHTML = `
      <div class="grid cols-2">
        <div class="card">
          <h2>Fee for one student</h2>
          <div class="inline-form">
            <div class="fg" style="flex:1"><label>Student</label>
              <select id="oneStudent" style="width:100%">${studentOpts}</select></div>
          </div>
          <div class="inline-form">
            <div class="fg" style="flex:1"><label>Title</label>
              <input id="oneTitle" placeholder="e.g. Exam fee" style="width:100%"></div>
            <div class="fg"><label>Amount ₹</label>
              <input id="oneAmount" type="number" min="0"></div>
            <div class="fg"><label>Period</label>
              <input id="onePeriod" placeholder="Feb 2026"></div>
          </div>
          <button id="oneSave" class="btn btn-primary btn-sm">Add fee</button>
        </div>

        <div class="card">
          <h2>Fee for a whole class</h2>
          <div class="inline-form">
            <div class="fg"><label>Class</label>
              <select id="clsClass">${classNames.map(c => `<option>${esc(c)}</option>`).join("")}</select></div>
          </div>
          <div class="inline-form">
            <div class="fg" style="flex:1"><label>Title</label>
              <input id="clsTitle" placeholder="e.g. Tuition fee" style="width:100%"></div>
            <div class="fg"><label>Amount ₹</label>
              <input id="clsAmount" type="number" min="0"></div>
            <div class="fg"><label>Period</label>
              <input id="clsPeriod" placeholder="Feb 2026"></div>
          </div>
          <button id="clsSave" class="btn btn-teal btn-sm">Add to whole class</button>
        </div>
      </div>`;

    document.getElementById("oneSave").addEventListener("click", async () => {
      const body = {
        studentId: Number(document.getElementById("oneStudent").value),
        title: document.getElementById("oneTitle").value.trim(),
        amount: document.getElementById("oneAmount").value,
        period: document.getElementById("onePeriod").value.trim()
      };
      try {
        await API.post("/api/accountant/fees", body);
        toast("Fee added");
        document.getElementById("oneTitle").value = "";
        document.getElementById("oneAmount").value = "";
      } catch (e) { toast(e.message); }
    });

    document.getElementById("clsSave").addEventListener("click", async () => {
      const body = {
        className: document.getElementById("clsClass").value,
        title: document.getElementById("clsTitle").value.trim(),
        amount: document.getElementById("clsAmount").value,
        period: document.getElementById("clsPeriod").value.trim()
      };
      try {
        const r = await API.post("/api/accountant/fees/class", body);
        toast(`Fee added to ${r.count} students`);
        document.getElementById("clsTitle").value = "";
        document.getElementById("clsAmount").value = "";
      } catch (e) { toast(e.message); }
    });
  },

  // Issue a Transfer Certificate PDF to a student; list the ones issued so far.
  async tc() {
    setTitle("Transfer Certificate", "Issue a TC — the student can then view it");
    view().innerHTML = `<div class="empty">Loading…</div>`;
    let d, issued;
    try {
      d = await API.get("/api/accountant/overview");
      issued = await API.get("/api/accountant/documents");
    } catch (e) { view().innerHTML = `<div class="empty">${e.message}</div>`; return; }

    const studentOpts = d.students.map(s =>
      `<option value="${s.id}">${esc(s.name)} — ${esc(s.class_name)} (Roll ${esc(s.roll)})</option>`).join("");

    view().innerHTML = `
      <div class="card" style="margin-bottom:18px">
        <h2>Issue a transfer certificate</h2>
        <div class="inline-form">
          <div class="fg" style="flex:1"><label>Student</label>
            <select id="tcStudent" style="width:100%">${studentOpts}</select></div>
          <div class="fg" style="flex:1"><label>Title</label>
            <input id="tcTitle" value="Transfer Certificate" style="width:100%"></div>
        </div>
        <div class="inline-form">
          <div class="fg" style="flex:1"><label>PDF file</label>
            <input id="tcFile" type="file" accept="application/pdf,.pdf"></div>
          <button id="tcSend" class="btn btn-primary btn-sm">Issue TC</button>
        </div>
        <div class="check-meta">The student sees it in their “Certificates” tab. PDF up to 5 MB.</div>
      </div>
      <div class="card">
        <h2>Certificates issued</h2>
        <div id="tcList"></div>
      </div>`;

    const renderList = (docs) => {
      const list = document.getElementById("tcList");
      if (!docs.length) { list.innerHTML = `<div class="empty">None issued yet.</div>`; return; }
      list.innerHTML = "";
      docs.forEach(doc => {
        const row = el("div", "doc-row");
        row.innerHTML = `
          <div style="flex:1">
            <div class="check-title">${esc(doc.title)} <span class="check-meta">· ${esc(doc.student_name)} (${esc(doc.class_name)})</span></div>
            <div class="check-meta">${doc.created_at ? niceDate(doc.created_at) : ""}${doc.size ? " · " + fileSize(doc.size) : ""}</div>
          </div>
          <div class="doc-actions"><button class="btn btn-ghost btn-sm" data-view>View PDF</button></div>`;
        row.querySelector("[data-view]").addEventListener("click", async () => {
          try { await API.openFile(`/api/files/document/${doc.id}`); }
          catch (e) { toast(e.message); }
        });
        list.appendChild(row);
      });
    };
    renderList(issued.documents);

    document.getElementById("tcSend").addEventListener("click", async () => {
      const file = document.getElementById("tcFile").files[0];
      const err = validatePdf(file);
      if (err) return toast(err);
      const btn = document.getElementById("tcSend");
      btn.disabled = true; btn.textContent = "Issuing…";
      try {
        const dataUrl = await readFileAsDataUrl(file);
        await API.post("/api/accountant/tc", {
          studentId: Number(document.getElementById("tcStudent").value),
          title: document.getElementById("tcTitle").value.trim() || "Transfer Certificate",
          file: dataUrl, name: file.name
        });
        toast("TC issued — the student can see it now");
        document.getElementById("tcFile").value = "";
        const refreshed = await API.get("/api/accountant/documents");
        renderList(refreshed.documents);
      } catch (e) { toast(e.message); }
      finally { btn.disabled = false; btn.textContent = "Issue TC"; }
    });
  }
};
