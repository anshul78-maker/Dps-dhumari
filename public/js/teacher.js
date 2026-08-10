const TeacherApp = {
  _overview: null,

  pages: [
    { label: "My classes",   render: () => TeacherApp.classes() },
    { label: "Attendance",   render: () => TeacherApp.attendance() },
    { label: "Enter marks",  render: () => TeacherApp.marks() },
    { label: "Assignments",  render: () => TeacherApp.assignments() },
    { label: "Submissions",  render: () => TeacherApp.submissions() },
    { label: "Report Cards", render: () => TeacherApp.reportCards() },
    { label: "Notices",      render: () => Notices.render() }
  ],

  async ov() {
    if (!this._overview) this._overview = await API.get("/api/teacher/overview");
    return this._overview;
  },

  async classes() {
    setTitle("My classes", "Classes and subjects you teach");
    view().innerHTML = `<div class="empty">Loading…</div>`;
    const d = await this.ov();
    const rows = d.classes.map(c => `
      <tr><td>${esc(c.class_name)}</td><td>${esc(c.subject)}</td></tr>`).join("");
    view().innerHTML = `
      <div class="card">
        <h2>Teaching assignments</h2>
        <table class="table">
          <thead><tr><th>Class</th><th>Subject</th></tr></thead>
          <tbody>${rows || `<tr><td colspan="2" class="empty">No classes assigned.</td></tr>`}</tbody>
        </table>
      </div>`;
  },

  async attendance() {
    setTitle("Attendance", "Mark today's attendance");
    const d = await this.ov();
    const classNames = [...new Set(d.classes.map(c => c.class_name))];
    const today = new Date().toISOString().slice(0, 10);

    view().innerHTML = `
      <div class="card">
        <div class="inline-form">
          <div class="fg"><label>Class</label>
            <select id="atClass">${classNames.map(c => `<option>${esc(c)}</option>`).join("")}</select></div>
          <div class="fg"><label>Date</label>
            <input id="atDate" type="date" value="${today}"></div>
          <button id="atLoad" class="btn btn-primary btn-sm">Load students</button>
        </div>
        <div id="atList"></div>
      </div>`;

    document.getElementById("atLoad").addEventListener("click", async () => {
      const className = document.getElementById("atClass").value;
      const { students } = await API.get("/api/teacher/class?className=" + encodeURIComponent(className));
      const list = document.getElementById("atList");
      if (!students.length) { list.innerHTML = `<div class="empty">No students.</div>`; return; }
      list.innerHTML = students.map(s => `
        <div class="check-row">
          <input type="checkbox" data-id="${s.id}" checked>
          <div style="flex:1"><div class="check-title">${esc(s.name)}</div>
          <div class="check-meta">Roll ${esc(s.roll)}</div></div>
          <span class="check-meta">present</span>
        </div>`).join("") +
        `<button id="atSave" class="btn btn-teal btn-sm" style="margin-top:12px">Save attendance</button>`;

      document.getElementById("atSave").addEventListener("click", async () => {
        const date = document.getElementById("atDate").value;
        const records = [...list.querySelectorAll("input[type=checkbox]")]
          .map(b => ({ studentId: Number(b.dataset.id), present: b.checked }));
        try {
          const r = await API.post("/api/teacher/attendance", { date, records });
          toast(`Saved for ${r.count} students`);
        } catch (e) { toast(e.message); }
      });
    });
  },

  async marks() {
    setTitle("Enter marks", "Add an exam result for a student");
    const d = await this.ov();
    const opts = d.classes.map((c, i) =>
      `<option value="${i}">${esc(c.class_name)} · ${esc(c.subject)}</option>`).join("");

    view().innerHTML = `
      <div class="card">
        <div class="inline-form">
          <div class="fg"><label>Class · subject</label>
            <select id="mkCombo">${opts}</select></div>
          <div class="fg"><label>Student</label>
            <select id="mkStudent"><option>Load a class…</option></select></div>
          <div class="fg"><label>Exam</label>
            <input id="mkExam" placeholder="e.g. Unit Test 3"></div>
          <div class="fg"><label>Score</label>
            <input id="mkScore" type="number" min="0" style="min-width:80px"></div>
          <div class="fg"><label>Out of</label>
            <input id="mkMax" type="number" value="100" style="min-width:80px"></div>
          <button id="mkSave" class="btn btn-primary btn-sm">Save mark</button>
        </div>
        <div id="mkMsg" class="check-meta"></div>
      </div>`;

    const loadStudents = async () => {
      const c = d.classes[Number(document.getElementById("mkCombo").value)];
      const { students } = await API.get("/api/teacher/class?className=" + encodeURIComponent(c.class_name));
      document.getElementById("mkStudent").innerHTML =
        students.map(s => `<option value="${s.id}">${esc(s.name)} (Roll ${esc(s.roll)})</option>`).join("");
    };
    document.getElementById("mkCombo").addEventListener("change", loadStudents);
    await loadStudents();

    document.getElementById("mkSave").addEventListener("click", async () => {
      const c = d.classes[Number(document.getElementById("mkCombo").value)];
      const body = {
        studentId: Number(document.getElementById("mkStudent").value),
        className: c.class_name, subject: c.subject,
        exam: document.getElementById("mkExam").value.trim(),
        score: document.getElementById("mkScore").value,
        max: document.getElementById("mkMax").value
      };
      try {
        await API.post("/api/teacher/marks", body);
        toast("Mark saved");
        document.getElementById("mkExam").value = "";
        document.getElementById("mkScore").value = "";
      } catch (e) { toast(e.message); }
    });
  },

  async assignments() {
    setTitle("Assignments", "Create work for a class you teach");
    const d = await this.ov();
    const opts = d.classes.map((c, i) =>
      `<option value="${i}">${esc(c.class_name)} · ${esc(c.subject)}</option>`).join("");

    view().innerHTML = `
      <div class="card">
        <div class="inline-form">
          <div class="fg"><label>Class · subject</label>
            <select id="asCombo">${opts}</select></div>
          <div class="fg" style="flex:1"><label>Title</label>
            <input id="asTitle" placeholder="e.g. Algebra worksheet 5" style="width:100%"></div>
          <div class="fg"><label>Due date</label>
            <input id="asDue" type="date"></div>
        </div>
        <div class="inline-form">
          <div class="fg" style="flex:1"><label>Details</label>
            <input id="asDetails" placeholder="Instructions for students" style="width:100%"></div>
          <button id="asSave" class="btn btn-primary btn-sm">Create assignment</button>
        </div>
      </div>`;

    document.getElementById("asSave").addEventListener("click", async () => {
      const c = d.classes[Number(document.getElementById("asCombo").value)];
      const body = {
        className: c.class_name, subject: c.subject,
        title: document.getElementById("asTitle").value.trim(),
        details: document.getElementById("asDetails").value.trim(),
        due: document.getElementById("asDue").value
      };
      try {
        await API.post("/api/teacher/assignments", body);
        toast("Assignment created — students can see it now");
        document.getElementById("asTitle").value = "";
        document.getElementById("asDetails").value = "";
      } catch (e) { toast(e.message); }
    });
  },

  // Review who has submitted their PDF for a chosen assignment.
  async submissions() {
    setTitle("Submissions", "See and open student assignment PDFs");
    view().innerHTML = `<div class="empty">Loading…</div>`;
    let d;
    try { d = await API.get("/api/teacher/assignments"); }
    catch (e) { view().innerHTML = `<div class="empty">${e.message}</div>`; return; }

    if (!d.assignments.length) {
      view().innerHTML = `<div class="card"><div class="empty">You haven't created any assignments yet.</div></div>`;
      return;
    }

    const opts = d.assignments.map((a, i) =>
      `<option value="${i}">${esc(a.title)} — ${esc(a.class_name)} · ${esc(a.subject)} (${a.submitted}/${a.class_size})</option>`).join("");

    view().innerHTML = `
      <div class="card">
        <div class="inline-form">
          <div class="fg" style="flex:1"><label>Assignment</label>
            <select id="sbPick" style="width:100%">${opts}</select></div>
        </div>
        <div id="sbList"></div>
      </div>`;

    const load = async () => {
      const a = d.assignments[Number(document.getElementById("sbPick").value)];
      const list = document.getElementById("sbList");
      list.innerHTML = `<div class="empty">Loading…</div>`;
      let r;
      try { r = await API.get(`/api/teacher/assignments/${a.id}/submissions`); }
      catch (e) { list.innerHTML = `<div class="empty">${esc(e.message)}</div>`; return; }
      list.innerHTML = "";
      r.rows.forEach(s => {
        const row = el("div", "doc-row" + (s.has_file ? " done" : ""));
        row.innerHTML = `
          <div style="flex:1">
            <div class="check-title">${esc(s.name)} <span class="check-meta">· Roll ${esc(s.roll)}</span></div>
            <div class="doc-status">${s.has_file
              ? `<span class="badge badge-paid">Submitted</span> <span class="check-meta">${esc(s.original_name || "PDF")}${s.uploaded_at ? " · " + niceDate(s.uploaded_at) : ""}</span>`
              : `<span class="badge badge-due">Not submitted</span>`}</div>
          </div>
          <div class="doc-actions">
            ${s.has_file ? `<button class="btn btn-primary btn-sm" data-view>View PDF</button>` : ""}
          </div>`;
        const v = row.querySelector("[data-view]");
        if (v) v.addEventListener("click", async () => {
          try { await API.openFile(`/api/files/submission/${s.submission_id}`); }
          catch (e) { toast(e.message); }
        });
        list.appendChild(row);
      });
    };
    document.getElementById("sbPick").addEventListener("change", load);
    await load();
  },

  // Send a report-card PDF to a student in one of my classes.
  async reportCards() {
    setTitle("Report Cards", "Send a report card PDF to a student");
    view().innerHTML = `<div class="empty">Loading…</div>`;
    let d;
    try { d = await API.get("/api/teacher/students"); }
    catch (e) { view().innerHTML = `<div class="empty">${e.message}</div>`; return; }

    if (!d.students.length) {
      view().innerHTML = `<div class="card"><div class="empty">No students in your classes yet.</div></div>`;
      return;
    }
    const studentOpts = d.students.map(s =>
      `<option value="${s.id}">${esc(s.name)} — ${esc(s.class_name)} (Roll ${esc(s.roll)})</option>`).join("");

    view().innerHTML = `
      <div class="card">
        <h2>Send a report card</h2>
        <div class="inline-form">
          <div class="fg" style="flex:1"><label>Student</label>
            <select id="rcStudent" style="width:100%">${studentOpts}</select></div>
          <div class="fg" style="flex:1"><label>Title</label>
            <input id="rcTitle" value="Report card" style="width:100%"></div>
        </div>
        <div class="inline-form">
          <div class="fg" style="flex:1"><label>PDF file</label>
            <input id="rcFile" type="file" accept="application/pdf,.pdf"></div>
          <button id="rcSend" class="btn btn-primary btn-sm">Send report card</button>
        </div>
        <div class="check-meta">The student sees it in their “Report Card” tab. PDF up to 5 MB.</div>
      </div>`;

    document.getElementById("rcSend").addEventListener("click", async () => {
      const file = document.getElementById("rcFile").files[0];
      const err = validatePdf(file);
      if (err) return toast(err);
      const btn = document.getElementById("rcSend");
      btn.disabled = true; btn.textContent = "Sending…";
      try {
        const dataUrl = await readFileAsDataUrl(file);
        await API.post("/api/teacher/report-cards", {
          studentId: Number(document.getElementById("rcStudent").value),
          title: document.getElementById("rcTitle").value.trim() || "Report card",
          file: dataUrl, name: file.name
        });
        toast("Report card sent — the student can see it now");
        document.getElementById("rcFile").value = "";
      } catch (e) { toast(e.message); }
      finally { btn.disabled = false; btn.textContent = "Send report card"; }
    });
  }
};
