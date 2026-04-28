// =============================================
// JOB PORTAL - MAIN JAVASCRIPT
// =============================================

const API = 'php/api.php';
let currentPage = 'home';
let jobsOffset = 0;
let currentJobId = null;
let sessionData = null;

// ---- INIT ----
document.addEventListener('DOMContentLoaded', () => {
  checkSession();
  loadStats();
  loadCategories();
  loadFeaturedJobs();
  setupNavigation();
  setupSearchHero();
  loadHomePage();
});

// ---- NAVIGATION ----
function setupNavigation() {
  document.querySelectorAll('[data-page]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo(el.dataset.page);
    });
  });
  window.addEventListener('popstate', (e) => {
    if (e.state?.page) navigateTo(e.state.page, false);
  });
}

function navigateTo(page, pushState = true) {
  document.querySelectorAll('.page-section').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-' + page);
  if (target) {
    target.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.querySelectorAll('.nav-link').forEach(l => {
      l.classList.toggle('active', l.dataset.page === page);
    });
    currentPage = page;
    if (pushState) history.pushState({ page }, '', '#' + page);
    // Load page-specific content
    if (page === 'jobs') { jobsOffset = 0; loadJobs(); }
    if (page === 'contact') {}
  }
}

function loadHomePage() {
  const hash = window.location.hash.replace('#', '');
  if (hash && document.getElementById('page-' + hash)) {
    navigateTo(hash, false);
  }
}

// ---- SESSION ----
async function checkSession() {
  try {
    const res = await fetch(`${API}?action=check_session`);
    const data = await res.json();
    sessionData = data;
    updateNavForSession(data);
  } catch(e) {}
}

function updateNavForSession(data) {
  const authBtns = document.getElementById('auth-btns');
  const userMenu = document.getElementById('user-menu');
  if (data.loggedIn) {
    authBtns.classList.add('hidden');
    userMenu.classList.remove('hidden');
    document.getElementById('user-name-nav').textContent = data.name.split(' ')[0];
    document.getElementById('user-avatar-nav').textContent = data.name.charAt(0).toUpperCase();
  } else {
    authBtns.classList.remove('hidden');
    userMenu.classList.add('hidden');
  }
}

// ---- STATS ----
async function loadStats() {
  try {
    const res = await fetch(`${API}?action=get_stats`);
    const data = await res.json();
    if (data.success) {
      animateCount('stat-jobs', data.stats.jobs);
      animateCount('stat-companies', data.stats.companies);
      animateCount('stat-seekers', data.stats.seekers);
      animateCount('stat-placed', data.stats.placed);
    }
  } catch(e) {}
}

function animateCount(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  let current = 0;
  const step = Math.ceil(target / 60);
  const interval = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = current.toLocaleString() + (target > 100 ? '+' : '');
    if (current >= target) clearInterval(interval);
  }, 20);
}

// ---- CATEGORIES ----
async function loadCategories() {
  try {
    const res = await fetch(`${API}?action=get_categories`);
    const data = await res.json();
    if (data.success) renderCategories(data.categories);
  } catch(e) {}
}

function renderCategories(cats) {
  const grids = document.querySelectorAll('.categories-grid');
  grids.forEach(grid => {
    grid.innerHTML = cats.slice(0, 10).map(c => `
      <div class="category-card slide-up" onclick="filterByCategory(${c.id}, '${escHtml(c.name)}')">
        <div class="cat-icon"><i class="${c.icon || 'fas fa-briefcase'}"></i></div>
        <div class="cat-name">${escHtml(c.name)}</div>
        <div class="cat-count">${c.job_count} Jobs</div>
      </div>
    `).join('');
  });
}

function filterByCategory(id, name) {
  navigateTo('jobs');
  setTimeout(() => {
    document.getElementById('filter-category').value = id;
    jobsOffset = 0;
    loadJobs();
  }, 100);
}

// ---- FEATURED JOBS ----
async function loadFeaturedJobs() {
  try {
    const res = await fetch(`${API}?action=get_featured_jobs`);
    const data = await res.json();
    if (data.success) renderJobCards(data.jobs, 'featured-jobs-grid');
  } catch(e) {}
}

// ---- JOBS LIST ----
async function loadJobs(append = false) {
  const searchVal  = document.getElementById('job-search')?.value || '';
  const locVal     = document.getElementById('loc-search')?.value || '';
  const catVal     = document.getElementById('filter-category')?.value || '';
  const typeVals   = [...document.querySelectorAll('input[name="job_type"]:checked')].map(i => i.value);
  const modeVals   = [...document.querySelectorAll('input[name="work_mode"]:checked')].map(i => i.value);
  const expVal     = document.querySelector('input[name="experience"]:checked')?.value || '';

  const params = new URLSearchParams({
    action: 'get_jobs',
    search: searchVal,
    location: locVal,
    category: catVal,
    job_type: typeVals[0] || '',
    work_mode: modeVals[0] || '',
    experience: expVal,
    limit: 9,
    offset: jobsOffset
  });

  const grid = document.getElementById('jobs-grid');
  const countEl = document.getElementById('jobs-count-text');
  const loadMoreBtn = document.getElementById('load-more-btn');

  if (!append) {
    grid.innerHTML = '<div class="loading-overlay"><div class="spinner spinner-dark"></div></div>';
  }

  try {
    const res = await fetch(`${API}?${params}`);
    const data = await res.json();
    if (data.success) {
      if (!append) grid.innerHTML = '';
      if (data.jobs.length === 0 && !append) {
        grid.innerHTML = `<div class="no-results" style="grid-column:1/-1"><i class="fas fa-search"></i><h3>Koi jobs nahi mili</h3><p>Filter change karke dobara try karein</p></div>`;
      } else {
        data.jobs.forEach(job => {
          const card = createJobCard(job);
          grid.appendChild(card);
        });
      }
      if (countEl) countEl.innerHTML = `<span>${data.total}</span> jobs found`;
      jobsOffset += data.jobs.length;
      if (loadMoreBtn) loadMoreBtn.style.display = jobsOffset >= data.total ? 'none' : 'flex';
    }
  } catch(e) {
    grid.innerHTML = '<div class="no-results" style="grid-column:1/-1"><i class="fas fa-wifi"></i><h3>Load failed</h3><p>Server se connect nahi ho pa raha</p></div>';
  }
}

function renderJobCards(jobs, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  jobs.forEach(job => container.appendChild(createJobCard(job)));
}

function createJobCard(job) {
  const div = document.createElement('div');
  div.className = 'job-card' + (job.is_featured == 1 ? ' featured' : '');
  div.innerHTML = `
    <div class="job-card-top">
      <div class="job-company">
        <div class="company-logo">${job.company_name ? job.company_name.charAt(0) : 'C'}</div>
        <div>
          <div class="company-name">${escHtml(job.company_name || 'Company')}</div>
          <div style="font-size:12px;color:var(--text-light)"><i class="fas fa-map-marker-alt" style="margin-right:4px"></i>${escHtml(job.location || 'Location N/A')}</div>
        </div>
      </div>
      <button class="job-bookmark" onclick="event.stopPropagation(); toggleSave(this, ${job.id})" title="Save Job">
        <i class="far fa-bookmark"></i>
      </button>
    </div>
    <div class="job-title">${escHtml(job.title)}</div>
    <div class="job-tags">
      <span class="badge badge-info">${escHtml(job.job_type)}</span>
      <span class="badge badge-purple">${escHtml(job.work_mode)}</span>
      <span class="badge badge-gray">${escHtml(job.experience_level)}</span>
    </div>
    <div class="job-footer">
      <div>
        <div class="job-salary">${job.salary_formatted || 'Not Disclosed'}</div>
        <div class="job-meta"><i class="far fa-clock"></i> ${job.posted_ago}</div>
      </div>
      <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); viewJob(${job.id})">View Job</button>
    </div>
  `;
  div.addEventListener('click', () => viewJob(job.id));
  return div;
}

// ---- JOB DETAIL ----
async function viewJob(id) {
  currentJobId = id;
  navigateTo('job-detail');
  const container = document.getElementById('job-detail-content');
  container.innerHTML = '<div class="loading-overlay"><div class="spinner spinner-dark"></div></div>';

  try {
    const res = await fetch(`${API}?action=get_job_detail&id=${id}`);
    const data = await res.json();
    if (data.success) renderJobDetail(data.job);
    else container.innerHTML = '<div class="no-results"><h3>Job not found</h3></div>';
  } catch(e) {
    container.innerHTML = '<div class="no-results"><h3>Load failed</h3></div>';
  }
}

function renderJobDetail(job) {
  const container = document.getElementById('job-detail-content');
  const skillsHtml = (job.skills_required || '').split(',').map(s => s.trim()).filter(Boolean).map(s => `<span class="skill-tag">${escHtml(s)}</span>`).join('');
  
  container.innerHTML = `
    <div class="job-detail-grid">
      <div class="job-detail-main">
        <div class="job-detail-header fade-in">
          <div class="job-detail-company">
            <div class="company-logo-lg">${(job.company_name || 'C').charAt(0)}</div>
            <div>
              <h2 style="font-family:var(--font-display);font-size:22px;font-weight:800;color:var(--secondary)">${escHtml(job.company_name || '')}</h2>
              <div style="color:var(--text-secondary);font-size:14px">${escHtml(job.industry || 'Technology')}</div>
            </div>
          </div>
          <h1 class="job-detail-title">${escHtml(job.title)}</h1>
          <div class="job-detail-meta-row">
            <div class="job-detail-meta-item"><i class="fas fa-map-marker-alt"></i>${escHtml(job.location || 'N/A')}</div>
            <div class="job-detail-meta-item"><i class="fas fa-briefcase"></i>${escHtml(job.job_type)}</div>
            <div class="job-detail-meta-item"><i class="fas fa-laptop-house"></i>${escHtml(job.work_mode)}</div>
            <div class="job-detail-meta-item"><i class="fas fa-star"></i>${escHtml(job.experience_level)}</div>
            <div class="job-detail-meta-item"><i class="fas fa-users"></i>${job.vacancies} Vacancies</div>
            <div class="job-detail-meta-item"><i class="far fa-clock"></i>${job.posted_ago}</div>
          </div>
          <div class="job-tags">
            <span class="badge badge-info">${escHtml(job.job_type)}</span>
            <span class="badge badge-purple">${escHtml(job.work_mode)}</span>
            <span class="badge badge-success">${escHtml(job.experience_level)}</span>
            ${job.category_name ? `<span class="badge badge-warning">${escHtml(job.category_name)}</span>` : ''}
          </div>
        </div>
        <div class="job-detail-section fade-in">
          <h3><i class="fas fa-file-alt" style="color:var(--primary);margin-right:10px"></i>Job Description</h3>
          <p>${escHtml(job.description).replace(/\n/g, '<br>')}</p>
        </div>
        ${job.requirements ? `
        <div class="job-detail-section fade-in">
          <h3><i class="fas fa-list-check" style="color:var(--primary);margin-right:10px"></i>Requirements</h3>
          <p>${escHtml(job.requirements).replace(/\n/g, '<br>')}</p>
        </div>` : ''}
        ${skillsHtml ? `
        <div class="job-detail-section fade-in">
          <h3><i class="fas fa-code" style="color:var(--primary);margin-right:10px"></i>Skills Required</h3>
          <div class="skills-list">${skillsHtml}</div>
        </div>` : ''}
        <div class="company-info-card fade-in">
          <h3 style="font-family:var(--font-display);font-weight:700;margin-bottom:16px">About Company</h3>
          <p style="color:var(--text-secondary);font-size:14px;line-height:1.8">${escHtml(job.company_desc || 'A leading company in its industry.')}</p>
          ${job.website ? `<a href="${escHtml(job.website)}" target="_blank" class="btn btn-ghost btn-sm" style="margin-top:12px"><i class="fas fa-globe"></i> Visit Website</a>` : ''}
        </div>
      </div>
      <div>
        <div class="apply-card fade-in">
          <div class="apply-salary">
            <div style="font-size:12px;color:var(--text-secondary);margin-bottom:4px">Salary Package</div>
            <div class="apply-salary-amount">${job.salary_formatted || 'Not Disclosed'}</div>
          </div>
          ${job.deadline ? `<div style="font-size:13px;color:var(--text-secondary);margin-bottom:20px"><i class="fas fa-calendar" style="color:var(--primary);margin-right:6px"></i>Apply by: <strong>${job.deadline}</strong></div>` : ''}
          <button class="btn btn-primary btn-full btn-lg" onclick="openApplyModal(${job.id})">
            <i class="fas fa-paper-plane"></i> Apply Now
          </button>
          <button class="btn btn-outline btn-full" style="margin-top:10px" onclick="toggleSaveDetail(${job.id}, this)">
            <i class="far fa-bookmark"></i> Save Job
          </button>
          <div style="border-top:1px solid var(--border);margin-top:20px;padding-top:20px">
            <div style="font-size:12px;color:var(--text-secondary);text-align:center">
              <i class="fas fa-eye" style="margin-right:6px"></i>${job.views} views
            </div>
          </div>
        </div>
        <div class="apply-card" style="margin-top:16px">
          <h4 style="font-weight:700;margin-bottom:12px">Job Overview</h4>
          <div style="display:flex;flex-direction:column;gap:12px">
            ${[
              ['fa-briefcase','Job Type', job.job_type],
              ['fa-laptop-house','Work Mode', job.work_mode],
              ['fa-graduation-cap','Education', job.education_required || 'Any'],
              ['fa-users','Vacancies', job.vacancies],
              ['fa-calendar-check','Posted', job.posted_ago],
              ['fa-tag','Category', job.category_name || 'General'],
            ].map(([icon,label,val]) => `
              <div style="display:flex;align-items:center;gap:12px;font-size:13px">
                <i class="fas ${icon}" style="color:var(--primary);width:16px;text-align:center"></i>
                <div><div style="color:var(--text-secondary)">${label}</div><div style="font-weight:600">${escHtml(String(val))}</div></div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
}

// ---- HERO SEARCH ----
function setupSearchHero() {
  const heroSearchBtn = document.getElementById('hero-search-btn');
  if (heroSearchBtn) {
    heroSearchBtn.addEventListener('click', () => {
      const q = document.getElementById('hero-search-input').value;
      const l = document.getElementById('hero-loc-input').value;
      navigateTo('jobs');
      setTimeout(() => {
        document.getElementById('job-search').value = q;
        document.getElementById('loc-search').value = l;
        jobsOffset = 0;
        loadJobs();
      }, 150);
    });
  }
  document.getElementById('hero-search-input')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('hero-search-btn').click();
  });
}

// ---- SAVE JOB ----
async function toggleSave(btn, jobId) {
  if (!sessionData?.loggedIn) { showToast('Please login to save jobs', 'error'); openModal('auth-modal'); return; }
  try {
    const res = await fetch(API, { method: 'POST', body: new URLSearchParams({ action: 'save_job', job_id: jobId }) });
    const data = await res.json();
    if (data.success) {
      btn.classList.toggle('saved', data.saved);
      btn.innerHTML = `<i class="${data.saved ? 'fas' : 'far'} fa-bookmark"></i>`;
      showToast(data.message, 'success');
    }
  } catch(e) {}
}

async function toggleSaveDetail(jobId, btn) {
  if (!sessionData?.loggedIn) { showToast('Please login to save jobs', 'error'); openModal('auth-modal'); return; }
  try {
    const res = await fetch(API, { method: 'POST', body: new URLSearchParams({ action: 'save_job', job_id: jobId }) });
    const data = await res.json();
    if (data.success) {
      btn.innerHTML = `<i class="${data.saved ? 'fas' : 'far'} fa-bookmark"></i> ${data.saved ? 'Saved' : 'Save Job'}`;
      showToast(data.message, 'success');
    }
  } catch(e) {}
}

// ---- APPLY MODAL ----
function openApplyModal(jobId) {
  if (!sessionData?.loggedIn) { showToast('Please login to apply', 'error'); openModal('auth-modal'); return; }
  currentJobId = jobId;
  openModal('apply-modal');
}

async function submitApplication() {
  const cover = document.getElementById('cover-letter').value;
  const btn = document.getElementById('apply-submit-btn');
  btn.disabled = true;
  btn.innerHTML = '<div class="spinner"></div> Submitting...';
  try {
    const res = await fetch(API, {
      method: 'POST',
      body: new URLSearchParams({ action: 'apply_job', job_id: currentJobId, cover_letter: cover })
    });
    const data = await res.json();
    closeModal('apply-modal');
    showToast(data.message || (data.success ? 'Applied!' : 'Failed'), data.success ? 'success' : 'error');
  } catch(e) {
    showToast('Something went wrong', 'error');
  }
  btn.disabled = false;
  btn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Application';
}

// ---- AUTH ----
let authMode = 'login';

function switchAuthTab(tab) {
  authMode = tab;
  document.querySelectorAll('.modal-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  document.getElementById('login-form').classList.toggle('hidden', tab !== 'login');
  document.getElementById('register-form').classList.toggle('hidden', tab !== 'register');
}

async function submitLogin() {
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const btn = document.getElementById('login-btn');
  if (!email || !password) { showToast('Sab fields bharo', 'error'); return; }
  btn.disabled = true;
  btn.innerHTML = '<div class="spinner"></div> Logging in...';
  try {
    const res = await fetch(API, { method: 'POST', body: new URLSearchParams({ action: 'login', email, password }) });
    const data = await res.json();
    if (data.success) {
      sessionData = { loggedIn: true, role: data.role, name: data.name };
      updateNavForSession(sessionData);
      closeModal('auth-modal');
      showToast(`Welcome back, ${data.name}!`, 'success');
      if (data.role === 'admin' || data.role === 'employer') {
        setTimeout(() => navigateTo('dashboard'), 500);
      }
    } else {
      showToast(data.message || 'Login failed', 'error');
    }
  } catch(e) { showToast('Server error', 'error'); }
  btn.disabled = false;
  btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
}

async function submitRegister() {
  const name = document.getElementById('reg-name').value;
  const email = document.getElementById('reg-email').value;
  const phone = document.getElementById('reg-phone').value;
  const password = document.getElementById('reg-password').value;
  const role = document.getElementById('reg-role').value;
  const btn = document.getElementById('register-btn');
  if (!name || !email || !password) { showToast('Sab fields bharo', 'error'); return; }
  btn.disabled = true;
  btn.innerHTML = '<div class="spinner"></div> Registering...';
  try {
    const res = await fetch(API, { method: 'POST', body: new URLSearchParams({ action: 'register', name, email, phone, password, role }) });
    const data = await res.json();
    if (data.success) {
      sessionData = { loggedIn: true, role: data.role, name };
      updateNavForSession(sessionData);
      closeModal('auth-modal');
      showToast('Account bana liya! Welcome!', 'success');
    } else {
      showToast(data.message || 'Registration failed', 'error');
    }
  } catch(e) { showToast('Server error', 'error'); }
  btn.disabled = false;
  btn.innerHTML = '<i class="fas fa-user-plus"></i> Register';
}

async function logout() {
  await fetch(`${API}?action=logout`);
  sessionData = { loggedIn: false };
  updateNavForSession(sessionData);
  navigateTo('home');
  showToast('Logged out successfully', 'success');
}

// ---- CONTACT FORM ----
async function submitContact() {
  const name    = document.getElementById('c-name').value;
  const email   = document.getElementById('c-email').value;
  const subject = document.getElementById('c-subject').value;
  const message = document.getElementById('c-message').value;
  const btn = document.getElementById('contact-btn');
  if (!name || !email || !message) { showToast('Sab fields bharo', 'error'); return; }
  btn.disabled = true;
  btn.innerHTML = '<div class="spinner"></div> Sending...';
  try {
    const res = await fetch(API, { method: 'POST', body: new URLSearchParams({ action: 'contact', name, email, subject, message }) });
    const data = await res.json();
    showToast(data.message || 'Message send ho gaya!', data.success ? 'success' : 'error');
    if (data.success) { document.getElementById('contact-form').reset(); }
  } catch(e) { showToast('Failed to send', 'error'); }
  btn.disabled = false;
  btn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Message';
}

// ---- DASHBOARD ----
let dashData = null;

async function loadDashboard() {
  try {
    const res = await fetch(`${API}?action=dashboard_stats`);
    const data = await res.json();
    if (data.success) {
      dashData = data.data;
      renderDashboard(data.data);
    }
  } catch(e) {}
}

function renderDashboard(data) {
  const role = sessionData?.role;
  const statsEl = document.getElementById('dash-stats');
  
  if (role === 'admin') {
    statsEl.innerHTML = `
      ${statCard('fas fa-briefcase', 'Total Jobs', data.total_jobs, 'orange')}
      ${statCard('fas fa-users', 'Total Users', data.total_users, 'blue')}
      ${statCard('fas fa-file-alt', 'Applications', data.total_apps, 'green')}
      ${statCard('fas fa-building', 'Companies', data.total_companies, 'purple')}
    `;
    renderRecentTable('dash-recent', data.recent_apps, ['Seeker','Job','Status'], ['seeker_name','job_title','status']);
  } else if (role === 'employer') {
    statsEl.innerHTML = `
      ${statCard('fas fa-briefcase', 'My Jobs', data.my_jobs, 'orange')}
      ${statCard('fas fa-file-alt', 'Applications', data.total_apps, 'green')}
      ${statCard('fas fa-check-circle', 'Active Jobs', data.active_jobs, 'blue')}
      ${statCard('fas fa-chart-line', 'Avg. Apps/Job', data.my_jobs ? Math.round(data.total_apps/data.my_jobs) : 0, 'purple')}
    `;
    renderRecentTable('dash-recent', data.recent_apps, ['Candidate','Job','Status','Date'], ['seeker_name','job_title','status','applied_at']);
  } else {
    statsEl.innerHTML = `
      ${statCard('fas fa-paper-plane', 'Applied', data.applied, 'orange')}
      ${statCard('fas fa-bookmark', 'Saved Jobs', data.saved, 'blue')}
      ${statCard('fas fa-check-double', 'Hired', data.hired, 'green')}
      ${statCard('fas fa-percentage', 'Success Rate', data.applied ? Math.round((data.hired/data.applied)*100) + '%' : '0%', 'purple')}
    `;
    renderRecentTable('dash-recent', data.my_apps, ['Job Title','Company','Status','Applied'], ['title','company_name','status','applied_at']);
  }
}

function statCard(icon, label, val, color) {
  return `<div class="stat-card"><div class="stat-icon ${color}"><i class="${icon}"></i></div><div><div class="stat-num">${val}</div><div class="stat-label">${label}</div></div></div>`;
}

function renderRecentTable(containerId, rows, headers, keys) {
  const el = document.getElementById(containerId);
  if (!el || !rows?.length) { if(el) el.innerHTML = '<p style="color:var(--text-secondary);padding:20px">No data yet.</p>'; return; }
  const statusColors = { pending:'badge-warning', reviewed:'badge-info', shortlisted:'badge-success', hired:'badge-success', rejected:'badge-danger', active:'badge-success', inactive:'badge-danger', closed:'badge-gray', interviewed:'badge-purple' };
  el.innerHTML = `
    <table class="table">
      <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
      <tbody>
        ${rows.map(r => `<tr>${keys.map(k => {
          if (k === 'status') return `<td><span class="badge ${statusColors[r[k]] || 'badge-gray'}">${r[k]}</span></td>`;
          if (k === 'applied_at' || k === 'created_at') return `<td style="font-size:12px;color:var(--text-secondary)">${r[k] ? new Date(r[k]).toLocaleDateString('en-IN') : '-'}</td>`;
          return `<td>${escHtml(String(r[k] || '-'))}</td>`;
        }).join('')}</tr>`).join('')}
      </tbody>
    </table>
  `;
}

// ---- POST JOB ----
async function submitPostJob() {
  const form = document.getElementById('post-job-form');
  const data = Object.fromEntries(new FormData(form));
  const btn = document.getElementById('post-job-btn');
  btn.disabled = true;
  btn.innerHTML = '<div class="spinner"></div> Posting...';
  try {
    const res = await fetch(API, { method: 'POST', body: new URLSearchParams({ action: 'post_job', ...data }) });
    const result = await res.json();
    showToast(result.message || (result.success ? 'Job posted!' : 'Failed'), result.success ? 'success' : 'error');
    if (result.success) { form.reset(); switchDashPage('dash-home'); loadDashboard(); }
  } catch(e) { showToast('Error posting job', 'error'); }
  btn.disabled = false;
  btn.innerHTML = '<i class="fas fa-plus"></i> Post Job';
}

// ---- DASH NAVIGATION ----
function switchDashPage(pageId) {
  document.querySelectorAll('.dashboard-page').forEach(p => p.classList.remove('active'));
  document.getElementById(pageId)?.classList.add('active');
  document.querySelectorAll('.sidebar-nav-item').forEach(i => i.classList.toggle('active', i.dataset.dash === pageId));
  if (pageId === 'dash-home') loadDashboard();
}

// ---- LOAD MORE ----
function loadMoreJobs() {
  loadJobs(true);
}

// ---- MODAL HELPERS ----
function openModal(id) {
  document.getElementById(id)?.classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closeModal(id) {
  document.getElementById(id)?.classList.remove('active');
  document.body.style.overflow = '';
}
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) closeModal(e.target.id);
});

// ---- TOAST ----
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<i class="toast-icon fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i><span class="toast-message">${escHtml(message)}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 50);
  setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 400); }, 3500);
}

// ---- UTIL ----
function escHtml(str) {
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(str));
  return d.innerHTML;
}

// ---- FILTERS ----
function clearFilters() {
  document.querySelectorAll('input[name="job_type"], input[name="work_mode"], input[name="experience"]').forEach(i => i.checked = false);
  document.getElementById('filter-category').value = '';
  jobsOffset = 0;
  loadJobs();
}

// ---- POST JOB FORM CATEGORIES ----
async function loadPostJobCategories() {
  try {
    const res = await fetch(`${API}?action=get_categories`);
    const data = await res.json();
    if (data.success) {
      const sel = document.getElementById('post-category');
      if (sel) sel.innerHTML = '<option value="">Select Category</option>' + data.categories.map(c => `<option value="${c.id}">${escHtml(c.name)}</option>`).join('');
    }
  } catch(e) {}
}
