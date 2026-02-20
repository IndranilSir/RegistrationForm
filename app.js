/* ===================================================
   EduRegister — Student Registration System
   JavaScript Logic (localStorage DB)
   =================================================== */

'use strict';

// ─── DB KEY ────────────────────────────────────────
const DB_KEY = 'eduregister_students';

// ─── LOAD / SAVE ───────────────────────────────────
function loadStudents() {
  try {
    return JSON.parse(localStorage.getItem(DB_KEY)) || [];
  } catch { return []; }
}

function saveStudents(data) {
  localStorage.setItem(DB_KEY, JSON.stringify(data));
}

// ─── GENERATE ID ───────────────────────────────────
function genId() {
  return 'S' + Date.now() + Math.floor(Math.random() * 1000);
}

// ─── CURRENT EDIT ID ───────────────────────────────
let pendingDeleteId = null;

// ─── TAB SWITCHING ─────────────────────────────────
function showTab(tab) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

  document.getElementById('section-' + tab).classList.add('active');
  document.getElementById('tab-' + tab).classList.add('active');

  if (tab === 'db') renderTable();
}

// ─── FORM VALIDATION ───────────────────────────────
const validators = {
  firstName:    v => v.trim().length >= 2  ? '' : 'First name must be at least 2 characters.',
  lastName:     v => v.trim().length >= 2  ? '' : 'Last name must be at least 2 characters.',
  email:        v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? '' : 'Please enter a valid email address.',
  phone:        v => /^[6-9]\d{9}$/.test(v.replace(/[\s\-\+]/g,'')) ? '' : 'Enter a valid 10-digit mobile number.',
  dob:          v => v !== '' ? '' : 'Date of birth is required.',
  gender:       v => v !== '' ? '' : 'Please select a gender.',
  course:       v => v !== '' ? '' : 'Please select a course.',
  year:         v => v !== '' ? '' : 'Please select year / semester.',
  rollNo:       v => v.trim().length >= 3 ? '' : 'Roll number must be at least 3 characters.',
};

function validateField(id) {
  const el  = document.getElementById(id);
  const err = document.getElementById('err-' + id);
  if (!el || !validators[id] || !err) return true;

  const msg = validators[id](el.value);
  err.textContent = msg ? ('⚠ ' + msg) : '';
  el.classList.toggle('invalid', !!msg);
  return !msg;
}

function validateAll() {
  let valid = true;
  Object.keys(validators).forEach(id => {
    if (!validateField(id)) valid = false;
  });
  return valid;
}

// ─── LIVE VALIDATION ───────────────────────────────
Object.keys(validators).forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('input',  () => validateField(id));
  if (el) el.addEventListener('change', () => validateField(id));
});

// ─── FORM SUBMIT ───────────────────────────────────
document.getElementById('registrationForm').addEventListener('submit', function (e) {
  e.preventDefault();
  if (!validateAll()) {
    showToast('Please fix the errors before submitting.', 'error');
    // scroll to first error
    const firstErr = this.querySelector('.invalid');
    if (firstErr) firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  const students = loadStudents();
  const editId   = document.getElementById('editId').value;

  // check duplicate roll number
  const rollNo = getValue('rollNo');
  const rollDup = students.find(s => s.rollNo.toLowerCase() === rollNo.toLowerCase() && s.id !== editId);
  if (rollDup) {
    const errEl = document.getElementById('err-rollNo');
    if (errEl) errEl.textContent = '⚠ This roll number is already registered.';
    document.getElementById('rollNo').classList.add('invalid');
    showToast('Roll number already exists!', 'error');
    return;
  }

  // check duplicate email
  const email = getValue('email');
  const emailDup = students.find(s => s.email.toLowerCase() === email.toLowerCase() && s.id !== editId);
  if (emailDup) {
    const errEl = document.getElementById('err-email');
    if (errEl) errEl.textContent = '⚠ This email is already registered.';
    document.getElementById('email').classList.add('invalid');
    showToast('Email already registered!', 'error');
    return;
  }

  const student = {
    id:            editId || genId(),
    firstName:     getValue('firstName'),
    lastName:      getValue('lastName'),
    email:         getValue('email'),
    phone:         getValue('phone'),
    dob:           getValue('dob'),
    gender:        getValue('gender'),
    course:        getValue('course'),
    year:          getValue('year'),
    rollNo:        getValue('rollNo'),
    admissionDate: getValue('admissionDate'),
    address:       getValue('address'),
    guardianName:  getValue('guardianName'),
    guardianPhone: getValue('guardianPhone'),
    registeredOn:  editId ? (students.find(s => s.id === editId)?.registeredOn || new Date().toISOString()) : new Date().toISOString(),
    updatedOn:     editId ? new Date().toISOString() : null,
  };

  if (editId) {
    const idx = students.findIndex(s => s.id === editId);
    if (idx !== -1) students[idx] = student;
    showToast('Student record updated successfully!', 'success');
  } else {
    students.push(student);
    showToast('Student registered successfully!', 'success');
  }

  saveStudents(students);
  updateBadge();
  resetForm();
});

function getValue(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

// ─── RESET FORM ────────────────────────────────────
function resetForm() {
  document.getElementById('registrationForm').reset();
  document.getElementById('editId').value = '';
  document.querySelectorAll('.error').forEach(e => e.textContent = '');
  document.querySelectorAll('.invalid').forEach(e => e.classList.remove('invalid'));

  const btn = document.getElementById('submitBtn');
  btn.innerHTML = '<i class="fas fa-user-plus"></i> Register Student';

  // set today's admission date
  document.getElementById('admissionDate').value = new Date().toISOString().split('T')[0];
}

// ─── RENDER TABLE ──────────────────────────────────
function renderTable() {
  const students   = loadStudents();
  const query      = (document.getElementById('searchInput')?.value || '').toLowerCase().trim();
  const tbody      = document.getElementById('tableBody');
  const emptyState = document.getElementById('empty-state');
  const totalLabel = document.getElementById('total-label');

  const filtered = students.filter(s => {
    if (!query) return true;
    return (
      s.firstName.toLowerCase().includes(query) ||
      s.lastName.toLowerCase().includes(query) ||
      s.email.toLowerCase().includes(query) ||
      s.rollNo.toLowerCase().includes(query) ||
      s.course.toLowerCase().includes(query) ||
      s.phone.includes(query)
    );
  });

  totalLabel.textContent = filtered.length;

  if (filtered.length === 0) {
    tbody.innerHTML = '';
    emptyState.classList.remove('hidden');
    emptyState.querySelector('p').textContent = students.length === 0
      ? 'No students registered yet.'
      : 'No students match your search.';
    return;
  }

  emptyState.classList.add('hidden');

  tbody.innerHTML = filtered.map((s, i) => `
    <tr>
      <td>${i + 1}</td>
      <td class="td-name">${esc(s.firstName)} ${esc(s.lastName)}</td>
      <td><span class="td-rollno">${esc(s.rollNo)}</span></td>
      <td>${esc(s.email)}</td>
      <td>${esc(s.phone)}</td>
      <td><span class="course-pill">${esc(s.course)}</span></td>
      <td>${esc(s.year)}</td>
      <td>${esc(s.gender)}</td>
      <td>${formatDate(s.registeredOn)}</td>
      <td class="td-actions">
        <button class="btn btn-icon btn-primary" title="View Details" onclick="viewStudent('${s.id}')">
          <i class="fas fa-eye"></i>
        </button>
        <button class="btn btn-icon btn-secondary" title="Edit" onclick="editStudent('${s.id}')">
          <i class="fas fa-pen"></i>
        </button>
        <button class="btn btn-icon btn-danger" title="Delete" onclick="confirmDelete('${s.id}')">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

// ─── EDIT STUDENT ──────────────────────────────────
function editStudent(id) {
  const students = loadStudents();
  const s = students.find(st => st.id === id);
  if (!s) return;

  document.getElementById('editId').value   = s.id;
  document.getElementById('firstName').value = s.firstName;
  document.getElementById('lastName').value  = s.lastName;
  document.getElementById('email').value     = s.email;
  document.getElementById('phone').value     = s.phone;
  document.getElementById('dob').value       = s.dob;
  document.getElementById('gender').value    = s.gender;
  document.getElementById('course').value    = s.course;
  document.getElementById('year').value      = s.year;
  document.getElementById('rollNo').value    = s.rollNo;
  document.getElementById('admissionDate').value = s.admissionDate;
  document.getElementById('address').value   = s.address;
  document.getElementById('guardianName').value  = s.guardianName;
  document.getElementById('guardianPhone').value = s.guardianPhone;

  const btn = document.getElementById('submitBtn');
  btn.innerHTML = '<i class="fas fa-floppy-disk"></i> Update Student';

  showTab('form');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  showToast('Editing student record…', 'info');
}

// ─── VIEW STUDENT DETAIL MODAL ─────────────────────
function viewStudent(id) {
  const students = loadStudents();
  const s = students.find(st => st.id === id);
  if (!s) return;

  document.getElementById('modal-title').textContent = `${s.firstName} ${s.lastName}`;

  const body = document.getElementById('modal-body');
  body.innerHTML = `
    ${row('Roll Number',      s.rollNo)}
    ${row('Email',            s.email)}
    ${row('Phone',            s.phone)}
    ${row('Date of Birth',    formatDate(s.dob))}
    ${row('Gender',           s.gender)}
    ${row('Course',           s.course)}
    ${row('Year / Semester',  s.year)}
    ${row('Admission Date',   s.admissionDate ? formatDate(s.admissionDate) : '—')}
    ${row('Guardian Name',    s.guardianName  || '—')}
    ${row('Guardian Phone',   s.guardianPhone || '—')}
    ${rowFull('Address',      s.address       || '—')}
    ${rowFull('Registered On', formatDateTime(s.registeredOn))}
    ${s.updatedOn ? rowFull('Last Updated', formatDateTime(s.updatedOn)) : ''}
  `;

  document.getElementById('modal-overlay').classList.remove('hidden');
}

function row(label, value) {
  return `<div class="detail-item"><label>${label}</label><span>${esc(String(value))}</span></div>`;
}
function rowFull(label, value) {
  return `<div class="detail-item full"><label>${label}</label><span>${esc(String(value))}</span></div>`;
}

function closeModal(e) {
  if (!e || e.target.id === 'modal-overlay') {
    document.getElementById('modal-overlay').classList.add('hidden');
  }
}

// ─── DELETE ────────────────────────────────────────
function confirmDelete(id) {
  pendingDeleteId = id;
  document.getElementById('confirm-overlay').classList.remove('hidden');
}

document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
  if (!pendingDeleteId) return;
  let students = loadStudents();
  students = students.filter(s => s.id !== pendingDeleteId);
  saveStudents(students);
  pendingDeleteId = null;
  closeConfirm();
  renderTable();
  updateBadge();
  showToast('Student deleted successfully.', 'error');
});

function closeConfirm() {
  pendingDeleteId = null;
  document.getElementById('confirm-overlay').classList.add('hidden');
}

// ─── CLEAR ALL ─────────────────────────────────────
function clearAllData() {
  const students = loadStudents();
  if (students.length === 0) {
    showToast('Database is already empty.', 'info');
    return;
  }
  if (confirm(`Are you sure you want to delete ALL ${students.length} student record(s)? This cannot be undone.`)) {
    localStorage.removeItem(DB_KEY);
    renderTable();
    updateBadge();
    showToast('All records cleared.', 'error');
  }
}

// ─── EXPORT CSV ────────────────────────────────────
function exportCSV() {
  const students = loadStudents();
  if (students.length === 0) {
    showToast('No data to export.', 'info');
    return;
  }

  const headers = ['ID','First Name','Last Name','Roll No','Email','Phone','DOB','Gender','Course','Year','Admission Date','Address','Guardian Name','Guardian Phone','Registered On'];
  const rows = students.map(s => [
    s.id, s.firstName, s.lastName, s.rollNo, s.email, s.phone,
    s.dob, s.gender, s.course, s.year, s.admissionDate,
    `"${(s.address || '').replace(/"/g, '""')}"`,
    s.guardianName, s.guardianPhone, formatDateTime(s.registeredOn)
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `students_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast(`Exported ${students.length} record(s) to CSV.`, 'success');
}

// ─── BADGE UPDATE ──────────────────────────────────
function updateBadge() {
  const count = loadStudents().length;
  document.getElementById('student-count').textContent = count;
}

// ─── TOAST ─────────────────────────────────────────
let toastTimer;
function showToast(msg, type = 'info') {
  const toast = document.getElementById('toast');
  clearTimeout(toastTimer);
  toast.className  = `toast ${type}`;
  const icons = { success: 'circle-check', error: 'circle-xmark', info: 'circle-info' };
  toast.innerHTML  = `<i class="fas fa-${icons[type] || 'circle-info'}"></i> ${msg}`;
  // force reflow
  void toast.offsetWidth;
  toast.classList.add('show');
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3500);
}

// ─── HELPERS ───────────────────────────────────────
function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d)) return iso; // already a date string like YYYY-MM-DD
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ─── KEYBOARD ──────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.getElementById('modal-overlay').classList.add('hidden');
    closeConfirm();
  }
});

// ─── INIT ──────────────────────────────────────────
(function init() {
  // set default admission date = today
  const admEl = document.getElementById('admissionDate');
  if (admEl) admEl.value = new Date().toISOString().split('T')[0];

  updateBadge();
  renderTable();
})();
