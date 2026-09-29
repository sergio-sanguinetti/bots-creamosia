/**
 * ORQUESTADOR DE BOTS - Frontend Logic
 * Supports Spain Cities, Course Location Mapping, Employee Management & Meeting Scheduling Tabs
 */

document.addEventListener('DOMContentLoaded', () => {
  // Global State
  const state = {
    companies: [],
    courses: [],
    employees: [],
    spainCities: [],
    ipPool: [],
    meetings: [],
    selectedEmployeeIds: new Set(),
    activeBots: new Map(), // botId -> Bot object
    modalEmployee: null, // Employee currently open in IP modal
    modalSelectedIp: null, // Currently selected IP object in modal
    modalSelectedCityTab: 'ALL',
    filters: {
      companyId: '',
      courseId: '',
      search: ''
    },
    tabEmpFilters: {
      companyId: '',
      search: '',
      page: 1,
      pageSize: 10
    }
  };

  // DOM Elements
  const el = {
    // Nav Tabs
    navTabs: document.querySelectorAll('.nav-tab'),
    tabContents: document.querySelectorAll('.tab-content'),

    // Stats
    statCompanies: document.getElementById('stat-companies'),
    statCourses: document.getElementById('stat-courses'),
    statEmployees: document.getElementById('stat-employees'),
    statActiveBots: document.getElementById('stat-active-bots'),

    // Excel Import
    dropZone: document.getElementById('drop-zone'),
    excelFileInput: document.getElementById('excel-file-input'),
    uploadStatus: document.getElementById('upload-status'),
    btnDownloadTemplate: document.getElementById('btn-download-template'),

    // Tab 1 Filters & List
    filterCompany: document.getElementById('filter-company'),
    filterCourse: document.getElementById('filter-course'),
    searchEmployee: document.getElementById('search-employee'),
    employeeList: document.getElementById('employee-list'),
    selectedCount: document.getElementById('selected-count'),
    btnSelectAll: document.getElementById('btn-select-all'),
    btnDeselectAll: document.getElementById('btn-deselect-all'),
    btnAutoAssignIps: document.getElementById('btn-auto-assign-ips'),

    // Tab 1 Form & Monitor
    botLaunchForm: document.getElementById('bot-launch-form'),
    jitsiUrl: document.getElementById('jitsi-url'),
    durationMinutes: document.getElementById('duration-minutes'),
    staggeredDelay: document.getElementById('staggered-delay'),
    btnLaunchBots: document.getElementById('btn-launch-bots'),
    btnLaunchCount: document.getElementById('btn-launch-count'),
    botsTableBody: document.getElementById('bots-table-body'),
    btnStopAll: document.getElementById('btn-stop-all'),

    // Tab 2: Employees Management
    btnSyncWordpress: document.getElementById('btn-sync-wordpress'),
    btnTabAddEmployee: document.getElementById('btn-tab-add-employee'),
    tabEmpSearch: document.getElementById('tab-emp-search'),
    tabEmpFilterCompany: document.getElementById('tab-emp-filter-company'),
    tabEmpTableBody: document.getElementById('tab-emp-table-body'),
    tabEmpPageSize: document.getElementById('tab-emp-page-size'),

    // Custom Datepicker Elements
    customDatetimePicker: document.getElementById('custom-datetime-picker'),
    datepickerTrigger: document.getElementById('datepicker-trigger'),
    datepickerDisplayValue: document.getElementById('datepicker-display-value'),
    datepickerPopover: document.getElementById('datepicker-popover'),
    dpPrevMonth: document.getElementById('dp-prev-month'),
    dpNextMonth: document.getElementById('dp-next-month'),
    dpMonthYearLabel: document.getElementById('dp-month-year-label'),
    dpDaysGrid: document.getElementById('dp-days-grid'),
    dpHourSelect: document.getElementById('dp-hour-select'),
    dpMinuteSelect: document.getElementById('dp-minute-select'),
    dpBtnToday: document.getElementById('dp-btn-today'),
    dpBtnApply: document.getElementById('dp-btn-apply'),

    // Tab 3: Meetings Management
    btnTabAddMeeting: document.getElementById('btn-tab-add-meeting'),
    meetingsCardsGrid: document.getElementById('meetings-cards-grid'),

    // IP Assigner Modal Elements
    ipModalOverlay: document.getElementById('ip-modal-overlay'),
    modalEmployeeName: document.getElementById('modal-employee-name'),
    modalEmployeeSubtitle: document.getElementById('modal-employee-subtitle'),
    modalSuggestedCity: document.getElementById('modal-suggested-city'),
    customCitySelect2: document.getElementById('custom-city-select2'),
    select2CityTrigger: document.getElementById('select2-city-trigger'),
    select2CurrentLabel: document.getElementById('select2-current-label'),
    select2CityDropdown: document.getElementById('select2-city-dropdown'),
    modalCitySearch: document.getElementById('modal-city-search'),
    modalCityOptions: document.getElementById('modal-city-options'),
    ipCardsContainer: document.getElementById('ip-cards-container'),
    modalCloseBtn: document.getElementById('modal-close-btn'),
    modalBtnCancel: document.getElementById('modal-btn-cancel'),
    modalBtnUnassign: document.getElementById('modal-btn-unassign'),
    modalBtnAutoAssign: document.getElementById('modal-btn-auto-assign'),
    modalBtnGenerateIp: document.getElementById('modal-btn-generate-ip'),

    // Employee Add/Edit Modal
    empModalOverlay: document.getElementById('emp-modal-overlay'),
    empModalTitle: document.getElementById('emp-modal-title'),
    empForm: document.getElementById('emp-form'),
    empEditId: document.getElementById('emp-edit-id'),
    empFormName: document.getElementById('emp-form-name'),
    empFormCompany: document.getElementById('emp-form-company'),
    empFormDni: document.getElementById('emp-form-dni'),
    empFormEmail: document.getElementById('emp-form-email'),
    empFormLogin: document.getElementById('emp-form-login'),
    empFormPass: document.getElementById('emp-form-pass'),
    empModalSaveBtn: document.getElementById('emp-modal-save-btn'),
    empModalCancelBtn: document.getElementById('emp-modal-cancel-btn'),
    empModalClose: document.getElementById('emp-modal-close'),

    // Meeting Program/Edit Modal
    meetingModalOverlay: document.getElementById('meeting-modal-overlay'),
    meetingModalTitle: document.getElementById('meeting-modal-title'),
    meetingForm: document.getElementById('meeting-form'),
    meetingEditId: document.getElementById('meeting-edit-id'),
    meetingFormTitle: document.getElementById('meeting-form-title'),
    meetingFormUrl: document.getElementById('meeting-form-url'),
    meetingFormTime: document.getElementById('meeting-form-time'),
    meetingFormDuration: document.getElementById('meeting-form-duration'),
    meetingEmployeesSelector: document.getElementById('meeting-employees-selector'),
    meetingSelectAllEmps: document.getElementById('meeting-select-all-emps'),
    meetingDeselectAllEmps: document.getElementById('meeting-deselect-all-emps'),
    meetingFormAutoMute: document.getElementById('meeting-form-auto-mute'),
    meetingFormStaggered: document.getElementById('meeting-form-staggered'),
    meetingModalSaveBtn: document.getElementById('meeting-modal-save-btn'),
    meetingModalCancelBtn: document.getElementById('meeting-modal-cancel-btn'),
    meetingModalClose: document.getElementById('meeting-modal-close')
  };

  // Initialize App
  init();

  async function init() {
    setupTabSwitching();
    try { setupEventListeners(); } catch (e) { console.error('Error en setupEventListeners:', e); }
    try { setupSSE(); } catch (e) { console.error('Error en setupSSE:', e); }
    try { initCustomDatePicker(); } catch (e) { console.error('Error en initCustomDatePicker:', e); }
    await Promise.all([
      loadCompanies(),
      loadCourses(),
      loadEmployees(),
      loadIpPool(),
      loadActiveBots(),
      loadMeetings()
    ]).catch(err => console.error('Error en Promise.all init:', err));
    startElapsedTimer();
  }

  // --- Tab Navigation ---
  function setupTabSwitching() {
    el.navTabs.forEach(tabBtn => {
      tabBtn.addEventListener('click', () => {
        const targetTabId = tabBtn.dataset.tab;

        el.navTabs.forEach(b => b.classList.remove('active'));
        tabBtn.classList.add('active');

        el.tabContents.forEach(content => {
          if (content.id === targetTabId) {
            content.classList.remove('hidden');
            content.classList.add('active');
          } else {
            content.classList.add('hidden');
            content.classList.remove('active');
          }
        });

        if (targetTabId === 'tab-employees') {
          renderTabEmployees();
        } else if (targetTabId === 'tab-meetings') {
          loadMeetings();
        }
      });
    });
  }

  // --- API Calls ---

  async function loadCompanies() {
    try {
      const res = await fetch('/api/companies');
      const data = await res.json();
      if (data.success) {
        state.companies = data.companies;
        renderCompanyFilter();
        el.statCompanies.textContent = state.companies.length;
      }
    } catch (err) {
      console.error('Error al cargar empresas:', err);
    }
  }

  async function loadCourses() {
    try {
      const res = await fetch('/api/courses');
      const data = await res.json();
      if (data.success) {
        state.courses = data.courses;
        renderCourseFilter();
        el.statCourses.textContent = state.courses.length;
      }
    } catch (err) {
      console.error('Error al cargar cursos:', err);
    }
  }

  async function loadIpPool() {
    try {
      const res = await fetch('/api/ip-pool');
      const data = await res.json();
      if (data.success) {
        state.spainCities = data.cities;
        state.ipPool = data.ipPool;
      }
    } catch (err) {
      console.error('Error al cargar pool de IPs:', err);
    }
  }

  async function loadEmployees() {
    try {
      const params = new URLSearchParams();
      if (state.filters.companyId) params.append('companyId', state.filters.companyId);
      if (state.filters.courseId) params.append('courseId', state.filters.courseId);
      if (state.filters.search) params.append('search', state.filters.search);

      const res = await fetch(`/api/employees?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        state.employees = data.employees;
        renderEmployeeList();
        renderTabEmployees();
        el.statEmployees.textContent = state.employees.length;
      }
    } catch (err) {
      console.error('Error al cargar empleados:', err);
    }
  }

  async function loadMeetings() {
    try {
      const res = await fetch('/api/meetings');
      const data = await res.json();
      if (data.success) {
        state.meetings = data.meetings;
        renderMeetingsCards();
      }
    } catch (err) {
      console.error('Error al cargar reuniones:', err);
    }
  }

  function getActiveEmployeeIds() {
    const activeIds = new Set();
    state.activeBots.forEach(bot => {
      if (bot.employeeId) {
        activeIds.add(bot.employeeId);
      }
    });
    return activeIds;
  }

  async function loadActiveBots() {
    try {
      const res = await fetch('/api/bots/active');
      const data = await res.json();
      if (data.success) {
        state.activeBots.clear();
        data.bots.forEach(bot => state.activeBots.set(bot.id, bot));
        renderBotsTable();
        updateBotStats();
        renderEmployeeList();
      }
    } catch (err) {
      console.error('Error al cargar bots activos:', err);
    }
  }

  // --- Event Listeners Setup ---

  function setupEventListeners() {
    // Download Template
    if (el.btnDownloadTemplate) {
      el.btnDownloadTemplate.addEventListener('click', () => {
        window.location.href = '/api/download-template';
      });
    }

    // Dropzone Click & Drag Event Handlers
    if (el.dropZone) {
      el.dropZone.addEventListener('click', () => {
        if (el.excelFileInput) el.excelFileInput.click();
      });

      el.dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        el.dropZone.classList.add('dragover');
      });

      el.dropZone.addEventListener('dragleave', () => {
        el.dropZone.classList.remove('dragover');
      });

      el.dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        el.dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
          handleExcelUpload(e.dataTransfer.files[0]);
        }
      });
    }

    if (el.excelFileInput) {
      el.excelFileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
          handleExcelUpload(e.target.files[0]);
        }
      });
    }

    // Filters & Search
    if (el.filterCompany) {
      el.filterCompany.addEventListener('change', (e) => {
        state.filters.companyId = e.target.value;
        loadEmployees();
      });
    }

    if (el.filterCourse) {
      el.filterCourse.addEventListener('change', (e) => {
        state.filters.courseId = e.target.value;
        loadEmployees();
      });
    }

    let searchTimeout = null;
    if (el.searchEmployee) {
      el.searchEmployee.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          state.filters.search = e.target.value.trim();
          loadEmployees();
        }, 300);
      });
    }

    // Selection Buttons
    if (el.btnSelectAll) {
      el.btnSelectAll.addEventListener('click', () => {
        const activeEmployeeIds = getActiveEmployeeIds();
        state.employees.forEach(emp => {
          if (!activeEmployeeIds.has(emp.id)) {
            state.selectedEmployeeIds.add(emp.id);
          }
        });
        renderEmployeeList();
      });
    }

    if (el.btnDeselectAll) {
      el.btnDeselectAll.addEventListener('click', () => {
        state.selectedEmployeeIds.clear();
        renderEmployeeList();
      });
    }

    if (el.btnAutoAssignIps) {
      el.btnAutoAssignIps.addEventListener('click', () => {
        const selectedIds = Array.from(state.selectedEmployeeIds);
        autoAssignIps(selectedIds.length > 0 ? selectedIds : null);
      });
    }

    // Modal Close buttons
    if (el.modalCloseBtn) el.modalCloseBtn.addEventListener('click', closeIpModal);
    if (el.modalBtnCancel) el.modalBtnCancel.addEventListener('click', closeIpModal);
    if (el.modalBtnUnassign) el.modalBtnUnassign.addEventListener('click', () => assignSelectedIp(null));

    if (el.modalBtnAutoAssign) {
      el.modalBtnAutoAssign.addEventListener('click', () => {
        if (state.modalEmployee) {
          assignEmployeeIpAuto(state.modalEmployee.id);
          closeIpModal();
        }
      });
    }

    if (el.modalBtnGenerateIp) {
      el.modalBtnGenerateIp.addEventListener('click', async () => {
        if (!state.modalEmployee) return;
        const targetCity = state.modalSelectedCityTab !== 'ALL' ? state.modalSelectedCityTab : 'Madrid';
        try {
          const res = await fetch('/api/ip-pool/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ city: targetCity })
          });
          const data = await res.json();
          if (data.success && data.ipObj) {
            const exists = state.ipPool.some(i => i.id === data.ipObj.id);
            if (!exists) state.ipPool.push(data.ipObj);
            assignSelectedIp(data.ipObj);
          }
        } catch (err) {
          console.error('Error al generar IP de ciudad:', err);
        }
      });
    }

    // Custom City Select2 Trigger
    if (el.select2CityTrigger) {
      el.select2CityTrigger.addEventListener('click', () => {
        const isOpen = el.customCitySelect2.classList.toggle('open');
        if (isOpen) {
          el.select2CityDropdown.classList.remove('hidden');
          if (el.modalCitySearch) {
            el.modalCitySearch.value = '';
            el.modalCitySearch.focus();
            renderModalCitySelect('');
          }
        } else {
          el.select2CityDropdown.classList.add('hidden');
        }
      });
    }

    if (el.modalCitySearch) {
      el.modalCitySearch.addEventListener('input', (e) => {
        renderModalCitySelect(e.target.value);
      });
    }

    // Close select2 when clicking outside
    document.addEventListener('click', (e) => {
      if (el.customCitySelect2 && !el.customCitySelect2.contains(e.target)) {
        if (el.select2CityDropdown) el.select2CityDropdown.classList.add('hidden');
        el.customCitySelect2.classList.remove('open');
      }
    });

    // Form Launch Bots
    el.botLaunchForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (state.selectedEmployeeIds.size === 0) {
        alert('Por favor selecciona al menos un empleado para iniciar la asistencia.');
        return;
      }

      const jitsiUrl = el.jitsiUrl.value.trim();
      const durationMinutes = parseInt(el.durationMinutes.value, 10);
      const staggeredDelay = el.staggeredDelay.value === 'true';

      if (!jitsiUrl) {
        alert('Por favor especifica la URL de la sala de Jitsi.');
        return;
      }

      el.btnLaunchBots.disabled = true;
      el.btnLaunchBots.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Lanzando Bots...`;

      try {
        const res = await fetch('/api/bots/launch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            employeeIds: Array.from(state.selectedEmployeeIds),
            jitsiUrl,
            durationMinutes,
            staggeredDelay,
            autoMute: true
          })
        });

        const data = await res.json();
        if (data.success) {
          showUploadStatus(`✓ ${data.message}`, 'success');
          state.selectedEmployeeIds.clear();
          renderEmployeeList();
          updateSelectedCount();
        } else {
          alert('Error: ' + data.error);
        }
      } catch (err) {
        alert('Error al intentar lanzar bots: ' + err.message);
      } finally {
        el.btnLaunchBots.disabled = false;
        el.btnLaunchBots.innerHTML = `<i class="fa-solid fa-play"></i> Iniciar Bots de Asistencia (<span id="btn-launch-count">${state.selectedEmployeeIds.size}</span>)`;
        updateSelectedCount();
      }
    });

    // Stop All Bots
    el.btnStopAll.addEventListener('click', async () => {
      if (!confirm('¿Está seguro de que desea detener todos los bots de asistencia activos?')) return;
      try {
        await fetch('/api/bots/stop-all', { method: 'POST' });
      } catch (err) {
        console.error('Error al detener todos los bots:', err);
      }
    });

    // TAB 2: Employee Management Listeners
    if (el.btnSyncWordpress) {
      el.btnSyncWordpress.addEventListener('click', async () => {
        el.btnSyncWordpress.disabled = true;
        el.btnSyncWordpress.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sincronizando...';
        try {
          const res = await fetch('/api/sync-wordpress', { method: 'POST' });
          const data = await res.json();
          if (data.success) {
            alert(`✅ ${data.message}`);
            await Promise.all([loadCompanies(), loadCourses(), loadEmployees()]);
          } else {
            alert(`⚠️ ${data.error}`);
          }
        } catch (err) {
          alert('Error al conectar con la API de sincronización: ' + err.message);
        } finally {
          el.btnSyncWordpress.disabled = false;
          el.btnSyncWordpress.innerHTML = '<i class="fa-solid fa-rotate"></i> Sincronizar con WordPress';
        }
      });
    }

    if (el.btnTabAddEmployee) {
      el.btnTabAddEmployee.addEventListener('click', () => openEmpModal(null));
    }
    if (el.tabEmpSearch) {
      el.tabEmpSearch.addEventListener('input', (e) => {
        state.tabEmpFilters.search = e.target.value.trim();
        state.tabEmpFilters.page = 1;
        renderTabEmployees();
      });
    }
    if (el.tabEmpFilterCompany) {
      el.tabEmpFilterCompany.addEventListener('change', (e) => {
        state.tabEmpFilters.companyId = e.target.value;
        state.tabEmpFilters.page = 1;
        renderTabEmployees();
      });
    }
    if (el.tabEmpPageSize) {
      el.tabEmpPageSize.addEventListener('change', (e) => {
        state.tabEmpFilters.pageSize = parseInt(e.target.value, 10);
        state.tabEmpFilters.page = 1;
        renderTabEmployees();
      });
    }

    // Employee Modal Close
    if (el.empModalClose) el.empModalClose.addEventListener('click', closeEmpModal);
    if (el.empModalCancelBtn) el.empModalCancelBtn.addEventListener('click', closeEmpModal);
    if (el.empModalSaveBtn) el.empModalSaveBtn.addEventListener('click', saveEmployee);

    // TAB 3: Meetings Management Listeners
    if (el.btnTabAddMeeting) {
      el.btnTabAddMeeting.addEventListener('click', () => openMeetingModal(null));
    }
    if (el.meetingModalClose) el.meetingModalClose.addEventListener('click', closeMeetingModal);
    if (el.meetingModalCancelBtn) el.meetingModalCancelBtn.addEventListener('click', closeMeetingModal);
    if (el.meetingModalSaveBtn) el.meetingModalSaveBtn.addEventListener('click', saveMeeting);

    if (el.meetingSelectAllEmps) {
      el.meetingSelectAllEmps.addEventListener('click', () => {
        const checkboxes = el.meetingEmployeesSelector.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(c => c.checked = true);
      });
    }
    if (el.meetingDeselectAllEmps) {
      el.meetingDeselectAllEmps.addEventListener('click', () => {
        const checkboxes = el.meetingEmployeesSelector.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(c => c.checked = false);
      });
    }
  }

  // --- SSE Real-time Server Events ---

  function setupSSE() {
    const eventSource = new EventSource('/api/events');

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        const { type, data } = payload;

        if (type === 'BOT_UPDATED') {
          state.activeBots.set(data.id, data);
          renderBotsTable();
          updateBotStats();
          renderEmployeeList();
        } else if (type === 'BOT_REMOVED') {
          state.activeBots.delete(data.id);
          renderBotsTable();
          updateBotStats();
          renderEmployeeList();
        } else if (type === 'DATA_IMPORTED' || type === 'ALL_IPS_UPDATED') {
          loadCompanies();
          loadCourses();
          loadEmployees();
          if (type === 'DATA_IMPORTED') {
            showUploadStatus(`✓ Se importaron ${data.employeeCount} empleados y ${data.companyCount} empresas exitosamente.`, 'success');
          }
        } else if (type === 'EMPLOYEE_IP_UPDATED' || type === 'EMPLOYEE_ADDED' || type === 'EMPLOYEE_UPDATED' || type === 'EMPLOYEE_DELETED') {
          loadEmployees();
        } else if (type === 'MEETING_ADDED' || type === 'MEETING_UPDATED' || type === 'MEETING_DELETED') {
          loadMeetings();
        } else if (type === 'IP_POOL_UPDATED') {
          if (data.newIp) {
            const exists = state.ipPool.some(i => i.id === data.newIp.id || i.ip === data.newIp.ip);
            if (!exists) {
              state.ipPool.push(data.newIp);
            }
          }
        }
      } catch (e) {
        console.error('Error al procesar mensaje SSE:', e);
      }
    };
  }

  // --- File Upload Handler ---

  async function handleExcelUpload(file) {
    showUploadStatus('<i class="fa-solid fa-spinner fa-spin"></i> Procesando archivo Excel...', 'info');

    const formData = new FormData();
    formData.append('excelFile', file);

    try {
      const res = await fetch('/api/upload-excel', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        showUploadStatus(`✓ ¡Excel importado! ${data.stats.employeesCount} empleados cargados.`, 'success');
        loadCompanies();
        loadCourses();
        loadEmployees();
      } else {
        showUploadStatus(`✕ Error: ${data.error}`, 'error');
      }
    } catch (err) {
      showUploadStatus(`✕ Error de conexión: ${err.message}`, 'error');
    }
  }

  function showUploadStatus(msg, type) {
    el.uploadStatus.innerHTML = `<div class="alert alert-${type === 'error' ? 'error' : 'success'}">${msg}</div>`;
  }

  // --- Renders for Tab 1 ---

  function renderCompanyFilter() {
    el.filterCompany.innerHTML = '<option value="">-- Todas las Empresas --</option>';
    if (el.tabEmpFilterCompany) {
      el.tabEmpFilterCompany.innerHTML = '<option value="">-- Todas las Empresas --</option>';
    }

    state.companies.forEach(comp => {
      const opt = document.createElement('option');
      opt.value = comp.id;
      opt.textContent = comp.name;
      el.filterCompany.appendChild(opt);

      if (el.tabEmpFilterCompany) {
        const opt2 = opt.cloneNode(true);
        el.tabEmpFilterCompany.appendChild(opt2);
      }
    });
  }

  function renderCourseFilter() {
    el.filterCourse.innerHTML = '<option value="">-- Todos los Cursos --</option>';
    state.courses.forEach(course => {
      const opt = document.createElement('option');
      opt.value = course.id;
      opt.textContent = course.city ? `${course.title} [📍 ${course.city}]` : course.title;
      el.filterCourse.appendChild(opt);
    });
  }

  function renderEmployeeList() {
    el.employeeList.innerHTML = '';

    const activeEmployeeIds = getActiveEmployeeIds();
    const availableEmployees = state.employees.filter(emp => !activeEmployeeIds.has(emp.id));

    state.selectedEmployeeIds.forEach(id => {
      if (activeEmployeeIds.has(id)) {
        state.selectedEmployeeIds.delete(id);
      }
    });
    updateSelectedCount();

    if (availableEmployees.length === 0) {
      el.employeeList.innerHTML = `
        <div class="empty-state" style="padding: 2rem;">
          <i class="fa-solid fa-user-slash"></i>
          <p>${state.employees.length > 0 ? 'Todos los empleados filtrados ya están en la reunión en vivo.' : 'No se encontraron empleados con los filtros actuales.'}</p>
        </div>`;
      return;
    }

    availableEmployees.forEach(emp => {
      const isSelected = state.selectedEmployeeIds.has(emp.id);
      const item = document.createElement('div');
      item.className = `employee-item ${isSelected ? 'selected' : ''}`;

      const empCourses = (emp.courses || [])
        .map(cId => state.courses.find(c => c.id === cId))
        .filter(Boolean);

      const ipBadgeHtml = emp.ipAddress 
        ? `<span class="ip-badge assigned" data-emp-id="${emp.id}" title="Haga clic para cambiar la IP"><i class="fa-solid fa-network-wired"></i> ${emp.ipAddress} (${emp.ipCity || 'España'}) <i class="fa-solid fa-pen-to-square"></i></span>`
        : `<span class="ip-badge unassigned" data-emp-id="${emp.id}" title="Haga clic para asignar IP"><i class="fa-solid fa-location-dot"></i> Sin IP (Asignar)</span>`;

      const empCities = [...new Set(empCourses.map(c => c.city))];

      item.innerHTML = `
        <div class="emp-main-info">
          <label class="checkbox-container">
            <input type="checkbox" ${isSelected ? 'checked' : ''} data-id="${emp.id}">
            <span class="checkmark"></span>
          </label>
          <div class="emp-details" style="width: 100%;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem;">
              <h4>${emp.name}</h4>
              ${ipBadgeHtml}
            </div>
            <p><i class="fa-solid fa-building"></i> ${emp.companyName} | DNI: ${emp.dni}</p>
            <div class="emp-tags">
              ${empCities.map(city => `
                <span class="tag-badge city-tag">
                  <i class="fa-solid fa-location-dot"></i> ${city}
                </span>
              `).join('')}
            </div>
          </div>
        </div>
      `;

      item.addEventListener('click', (e) => {
        if (e.target.tagName !== 'INPUT' && !e.target.closest('.ip-badge')) {
          const checkbox = item.querySelector('input[type="checkbox"]');
          checkbox.checked = !checkbox.checked;
          toggleEmployeeSelection(emp.id, checkbox.checked, item);
        }
      });

      const checkbox = item.querySelector('input[type="checkbox"]');
      checkbox.addEventListener('change', (e) => {
        toggleEmployeeSelection(emp.id, e.target.checked, item);
      });

      const ipBadgeBtn = item.querySelector('.ip-badge');
      if (ipBadgeBtn) {
        ipBadgeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          openIpModal(emp);
        });
      }

      el.employeeList.appendChild(item);
    });
  }

  function toggleEmployeeSelection(empId, isChecked, itemElement) {
    if (isChecked) {
      state.selectedEmployeeIds.add(empId);
      itemElement.classList.add('selected');
    } else {
      state.selectedEmployeeIds.delete(empId);
      itemElement.classList.remove('selected');
    }
    updateSelectedCount();
  }

  function updateSelectedCount() {
    const count = state.selectedEmployeeIds.size;
    if (el.selectedCount) el.selectedCount.textContent = count;
    const launchCountSpan = document.getElementById('btn-launch-count');
    if (launchCountSpan) launchCountSpan.textContent = count;
  }

  // --- TAB 2: Renders & Operations for Employee Management ---

  function renderTabEmployees() {
    if (!el.tabEmpTableBody) return;
    el.tabEmpTableBody.innerHTML = '';

    const searchTerm = (state.tabEmpFilters.search || '').toLowerCase();
    const companyFilter = state.tabEmpFilters.companyId;

    const filtered = state.employees.filter(emp => {
      const matchComp = !companyFilter || emp.companyId === companyFilter;
      const matchSearch = !searchTerm || 
        emp.name.toLowerCase().includes(searchTerm) || 
        (emp.dni && emp.dni.toLowerCase().includes(searchTerm)) || 
        (emp.email && emp.email.toLowerCase().includes(searchTerm));
      return matchComp && matchSearch;
    });

    const totalItems = filtered.length;
    const pageSize = state.tabEmpFilters.pageSize || 10;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

    if (state.tabEmpFilters.page > totalPages) state.tabEmpFilters.page = totalPages;
    if (state.tabEmpFilters.page < 1) state.tabEmpFilters.page = 1;
    const currentPage = state.tabEmpFilters.page;

    const startIndex = totalItems > 0 ? (currentPage - 1) * pageSize : 0;
    const endIndex = Math.min(startIndex + pageSize, totalItems);
    const pageItems = filtered.slice(startIndex, endIndex);

    // Update Pagination Info UI
    const paginationInfoEl = document.getElementById('tab-emp-pagination-info');
    if (paginationInfoEl) {
      const fromNum = totalItems > 0 ? startIndex + 1 : 0;
      paginationInfoEl.innerHTML = `Mostrando <strong>${fromNum}</strong> - <strong>${endIndex}</strong> de <strong>${totalItems}</strong> trabajadores`;
    }

    // Update Pagination Buttons UI
    const paginationButtonsEl = document.getElementById('tab-emp-pagination-buttons');
    if (paginationButtonsEl) {
      paginationButtonsEl.innerHTML = '';

      // Prev Button
      const prevBtn = document.createElement('button');
      prevBtn.className = 'pagination-btn';
      prevBtn.disabled = currentPage === 1;
      prevBtn.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';
      prevBtn.addEventListener('click', () => {
        if (state.tabEmpFilters.page > 1) {
          state.tabEmpFilters.page--;
          renderTabEmployees();
        }
      });
      paginationButtonsEl.appendChild(prevBtn);

      // Page Numbers
      for (let p = 1; p <= totalPages; p++) {
        if (totalPages > 7) {
          if (p !== 1 && p !== totalPages && Math.abs(p - currentPage) > 1) {
            if (p === 2 && currentPage > 3) {
              const ellipsis = document.createElement('span');
              ellipsis.className = 'pagination-ellipsis';
              ellipsis.textContent = '...';
              paginationButtonsEl.appendChild(ellipsis);
            }
            if (p === totalPages - 1 && currentPage < totalPages - 2) {
              const ellipsis = document.createElement('span');
              ellipsis.className = 'pagination-ellipsis';
              ellipsis.textContent = '...';
              paginationButtonsEl.appendChild(ellipsis);
            }
            continue;
          }
        }

        const pageBtn = document.createElement('button');
        pageBtn.className = `pagination-btn ${p === currentPage ? 'active' : ''}`;
        pageBtn.textContent = p;
        pageBtn.addEventListener('click', () => {
          state.tabEmpFilters.page = p;
          renderTabEmployees();
        });
        paginationButtonsEl.appendChild(pageBtn);
      }

      // Next Button
      const nextBtn = document.createElement('button');
      nextBtn.className = 'pagination-btn';
      nextBtn.disabled = currentPage === totalPages;
      nextBtn.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
      nextBtn.addEventListener('click', () => {
        if (state.tabEmpFilters.page < totalPages) {
          state.tabEmpFilters.page++;
          renderTabEmployees();
        }
      });
      paginationButtonsEl.appendChild(nextBtn);
    }

    if (filtered.length === 0) {
      el.tabEmpTableBody.innerHTML = `
        <tr class="empty-row">
          <td colspan="7">
            <div class="empty-state">
              <i class="fa-solid fa-users-slash"></i>
              <p>No hay trabajadores que coincidan con la búsqueda.</p>
            </div>
          </td>
        </tr>`;
      return;
    }

    pageItems.forEach(emp => {
      const tr = document.createElement('tr');
      const ipBadge = emp.ipAddress 
        ? `<span class="ip-badge assigned" data-emp-id="${emp.id}"><i class="fa-solid fa-network-wired"></i> ${emp.ipAddress} (${emp.ipCity || 'España'})</span>`
        : `<span class="ip-badge unassigned" data-emp-id="${emp.id}"><i class="fa-solid fa-location-dot"></i> Sin IP</span>`;

      tr.innerHTML = `
        <td><strong class="employee-cell-name">${emp.name}</strong></td>
        <td>${emp.companyName || 'General'}</td>
        <td><code>${emp.dni || '-'}</code></td>
        <td>${emp.email || '-'}</td>
        <td><small class="text-muted">${emp.login || '-'}</small></td>
        <td>${ipBadge}</td>
        <td>
          <div class="table-actions-cell">
            <button class="btn btn-outline btn-sm btn-edit-emp" data-id="${emp.id}" title="Editar trabajador">
              <i class="fa-solid fa-user-pen"></i>
            </button>
            <button class="btn btn-danger btn-sm btn-delete-emp" data-id="${emp.id}" title="Eliminar trabajador">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </td>
      `;

      tr.querySelector('.btn-edit-emp').addEventListener('click', () => openEmpModal(emp));
      tr.querySelector('.btn-delete-emp').addEventListener('click', () => deleteEmployee(emp.id));
      const ipBtn = tr.querySelector('.ip-badge');
      if (ipBtn) {
        ipBtn.addEventListener('click', () => openIpModal(emp));
      }

      el.tabEmpTableBody.appendChild(tr);
    });
  }

  function openEmpModal(employee = null) {
    el.empFormCompany.innerHTML = '';
    state.companies.forEach(comp => {
      const opt = document.createElement('option');
      opt.value = comp.id;
      opt.textContent = comp.name;
      el.empFormCompany.appendChild(opt);
    });

    if (employee) {
      el.empModalTitle.textContent = 'Editar Trabajador';
      el.empEditId.value = employee.id;
      el.empFormName.value = employee.name || '';
      el.empFormCompany.value = employee.companyId || (state.companies[0] ? state.companies[0].id : '');
      el.empFormDni.value = employee.dni || '';
      el.empFormEmail.value = employee.email || '';
      el.empFormLogin.value = employee.login || '';
      el.empFormPass.value = employee.pass || '';
    } else {
      el.empModalTitle.textContent = 'Agregar Nuevo Trabajador';
      el.empForm.reset();
      el.empEditId.value = '';
    }

    el.empModalOverlay.classList.remove('hidden');
  }

  function closeEmpModal() {
    el.empModalOverlay.classList.add('hidden');
  }

  async function saveEmployee() {
    const name = el.empFormName.value.trim();
    const companyId = el.empFormCompany.value;
    if (!name || !companyId) {
      alert('Nombre y Empresa son campos obligatorios.');
      return;
    }

    const payload = {
      name,
      companyId,
      dni: el.empFormDni.value.trim(),
      email: el.empFormEmail.value.trim(),
      login: el.empFormLogin.value.trim(),
      pass: el.empFormPass.value.trim()
    };

    const id = el.empEditId.value;
    const url = id ? `/api/employees/${id}` : '/api/employees';
    const method = id ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        closeEmpModal();
        await loadEmployees();
      } else {
        alert('Error: ' + data.error);
      }
    } catch (err) {
      alert('Error al guardar trabajador: ' + err.message);
    }
  }

  async function deleteEmployee(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar este trabajador?')) return;
    try {
      const res = await fetch(`/api/employees/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        await loadEmployees();
      } else {
        alert('Error: ' + data.error);
      }
    } catch (err) {
      alert('Error al eliminar trabajador: ' + err.message);
    }
  }

  // --- TAB 3: Renders & Operations for Meeting Scheduling ---

  function renderMeetingsCards() {
    if (!el.meetingsCardsGrid) return;
    el.meetingsCardsGrid.innerHTML = '';

    if (state.meetings.length === 0) {
      el.meetingsCardsGrid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1; padding: 3rem;">
          <i class="fa-solid fa-calendar-xmark"></i>
          <p>No hay reuniones programadas actualmente.</p>
          <span>Haz clic en "Programar Nueva Reunión" para asignar trabajadores y definir la sesión.</span>
        </div>`;
      return;
    }

    state.meetings.forEach(meeting => {
      const card = document.createElement('div');
      card.className = 'meeting-card';

      const assignedEmps = (meeting.assignedEmployeeIds || [])
        .map(id => state.employees.find(e => e.id === id))
        .filter(Boolean);

      let statusBadge = '';
      if (meeting.status === 'in_progress') {
        statusBadge = '<span class="meeting-status-badge status-in_progress"><i class="fa-solid fa-spinner fa-spin"></i> En Curso</span>';
      } else if (meeting.status === 'completed') {
        statusBadge = '<span class="meeting-status-badge status-completed"><i class="fa-solid fa-check"></i> Finalizada</span>';
      } else {
        statusBadge = '<span class="meeting-status-badge status-scheduled"><i class="fa-regular fa-clock"></i> Programada</span>';
      }

      const formattedDate = meeting.scheduledTime 
        ? new Date(meeting.scheduledTime).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        : 'Inmediata';

      card.innerHTML = `
        <div>
          <div class="meeting-card-header">
            <h3 class="meeting-card-title">${meeting.title}</h3>
            ${statusBadge}
          </div>

          <div style="margin-top: 1rem; display: flex; flex-direction: column; gap: 0.4rem;">
            <div class="meeting-detail-row">
              <i class="fa-solid fa-link"></i>
              <a href="${meeting.jitsiUrl}" target="_blank" class="meeting-url-link">${meeting.jitsiUrl}</a>
            </div>
            <div class="meeting-detail-row">
              <i class="fa-solid fa-clock"></i>
              <span>${formattedDate} (${meeting.durationMinutes || 30} min)</span>
            </div>
            <div class="meeting-detail-row">
              <i class="fa-solid fa-users"></i>
              <span><strong>${assignedEmps.length}</strong> trabajadores asignados</span>
            </div>
          </div>

          <div class="meeting-assigned-badges">
            ${assignedEmps.slice(0, 5).map(e => `<span class="emp-badge"><i class="fa-solid fa-user"></i> ${e.name}</span>`).join('')}
            ${assignedEmps.length > 5 ? `<span class="emp-badge">+${assignedEmps.length - 5} más</span>` : ''}
          </div>
        </div>

        <div class="meeting-card-footer">
          <button class="btn btn-success btn-sm btn-launch-meeting" data-id="${meeting.id}">
            <i class="fa-solid fa-play"></i> Lanzar Ahora
          </button>
          <button class="btn btn-outline btn-sm btn-edit-meeting" data-id="${meeting.id}">
            <i class="fa-solid fa-pen"></i> Editar
          </button>
          <button class="btn btn-danger btn-sm btn-delete-meeting" data-id="${meeting.id}">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      `;

      card.querySelector('.btn-launch-meeting').addEventListener('click', () => launchMeeting(meeting.id));
      card.querySelector('.btn-edit-meeting').addEventListener('click', () => openMeetingModal(meeting));
      card.querySelector('.btn-delete-meeting').addEventListener('click', () => deleteMeeting(meeting.id));

      el.meetingsCardsGrid.appendChild(card);
    });
  }

  function openMeetingModal(meeting = null) {
    el.meetingEmployeesSelector.innerHTML = '';
    state.employees.forEach(emp => {
      const label = document.createElement('label');
      label.className = 'emp-checkbox-item';
      const isChecked = meeting && meeting.assignedEmployeeIds ? meeting.assignedEmployeeIds.includes(emp.id) : false;
      label.innerHTML = `
        <input type="checkbox" value="${emp.id}" ${isChecked ? 'checked' : ''}>
        <span>${emp.name} <small style="color: var(--apple-text-secondary);">(${emp.companyName || 'General'})</small></span>
      `;
      el.meetingEmployeesSelector.appendChild(label);
    });

    if (meeting) {
      el.meetingModalTitle.textContent = 'Editar Reunión Programada';
      el.meetingEditId.value = meeting.id;
      el.meetingFormTitle.value = meeting.title || '';
      el.meetingFormUrl.value = meeting.jitsiUrl || '';
      if (meeting.scheduledTime) {
        const d = new Date(meeting.scheduledTime);
        setCustomDatePickerValue(d);
      }
      el.meetingFormDuration.value = meeting.durationMinutes || 30;
      el.meetingFormAutoMute.checked = meeting.autoMute !== undefined ? meeting.autoMute : true;
      el.meetingFormStaggered.checked = meeting.staggeredDelay !== undefined ? meeting.staggeredDelay : true;
    } else {
      el.meetingModalTitle.textContent = 'Programar Nueva Reunión';
      el.meetingForm.reset();
      el.meetingEditId.value = '';
      el.meetingFormUrl.value = 'https://creamosia.com/aula-virtual/?sesion_id=17067';
      const now = new Date();
      now.setMinutes(now.getMinutes() + 10);
      setCustomDatePickerValue(now);
      el.meetingFormDuration.value = 30;
    }

    closeCustomDatePicker();
    el.meetingModalOverlay.classList.remove('hidden');
  }

  function closeMeetingModal() {
    el.meetingModalOverlay.classList.add('hidden');
    closeCustomDatePicker();
  }

  async function saveMeeting() {
    const title = el.meetingFormTitle.value.trim();
    const jitsiUrl = el.meetingFormUrl.value.trim();
    const scheduledTime = el.meetingFormTime.value;
    const durationMinutes = parseInt(el.meetingFormDuration.value, 10);

    const checkedInputs = el.meetingEmployeesSelector.querySelectorAll('input[type="checkbox"]:checked');
    const assignedEmployeeIds = Array.from(checkedInputs).map(cb => cb.value);

    if (!title || !jitsiUrl) {
      alert('Título y URL de Jitsi son campos obligatorios.');
      return;
    }
    if (assignedEmployeeIds.length === 0) {
      alert('Debe asignar al menos un trabajador a la reunión.');
      return;
    }

    const payload = {
      title,
      jitsiUrl,
      scheduledTime: scheduledTime ? new Date(scheduledTime).toISOString() : new Date().toISOString(),
      durationMinutes,
      assignedEmployeeIds,
      autoMute: el.meetingFormAutoMute.checked,
      staggeredDelay: el.meetingFormStaggered.checked
    };

    const id = el.meetingEditId.value;
    const url = id ? `/api/meetings/${id}` : '/api/meetings';
    const method = id ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        closeMeetingModal();
        await loadMeetings();
      } else {
        alert('Error: ' + data.error);
      }
    } catch (err) {
      alert('Error al guardar reunión: ' + err.message);
    }
  }

  async function deleteMeeting(id) {
    if (!confirm('¿Estás seguro de eliminar esta reunión programada?')) return;
    try {
      const res = await fetch(`/api/meetings/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        await loadMeetings();
      } else {
        alert('Error: ' + data.error);
      }
    } catch (err) {
      alert('Error al eliminar reunión: ' + err.message);
    }
  }

  async function launchMeeting(id) {
    try {
      const res = await fetch(`/api/meetings/${id}/launch`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert(`✓ ${data.message}`);
        await loadMeetings();

        // Switch to Live Orchestrator tab to watch monitor
        const liveTabBtn = document.querySelector('.nav-tab[data-tab="tab-live"]');
        if (liveTabBtn) liveTabBtn.click();
      } else {
        alert('Error al lanzar reunión: ' + data.error);
      }
    } catch (err) {
      alert('Error al conectar reunión: ' + err.message);
    }
  }

  // --- IP Assigner Modal Logic ---

  function openIpModal(employee) {
    state.modalEmployee = employee;
    state.modalSelectedIp = employee.ipAddress 
      ? state.ipPool.find(i => i.ip === employee.ipAddress)
      : null;

    let suggestedCity = 'Madrid';
    let suggestedRegion = 'Comunidad de Madrid';
    if (employee.courses && employee.courses.length > 0) {
      const course = state.courses.find(c => c.id === employee.courses[0]);
      if (course && course.city) {
        suggestedCity = course.city;
        suggestedRegion = course.region || '';
      }
    }

    el.modalEmployeeName.textContent = `Asignar IP a: ${employee.name}`;
    el.modalEmployeeSubtitle.textContent = `${employee.companyName} | DNI: ${employee.dni}`;
    el.modalSuggestedCity.textContent = `${suggestedCity} (${suggestedRegion})`;

    state.modalSelectedCityTab = employee.ipCity || suggestedCity;
    if (el.modalCitySearch) el.modalCitySearch.value = '';

    renderModalCitySelect();
    renderModalIpCards();

    el.ipModalOverlay.classList.remove('hidden');
  }

  function closeIpModal() {
    el.ipModalOverlay.classList.add('hidden');
    state.modalEmployee = null;
    state.modalSelectedIp = null;
    if (el.select2CityDropdown) el.select2CityDropdown.classList.add('hidden');
    if (el.customCitySelect2) el.customCitySelect2.classList.remove('open');
  }

  function renderModalCitySelect(searchTerm = '') {
    if (!el.modalCityOptions) return;
    el.modalCityOptions.innerHTML = '';

    const empFirstCourseCity = state.modalEmployee?.courses && state.courses.find(crs => crs.id === state.modalEmployee.courses[0])?.city;

    let currentLabelText = '🇪🇸 -- Todas las Ciudades --';
    if (state.modalSelectedCityTab !== 'ALL') {
      const found = state.spainCities.find(c => c.city === state.modalSelectedCityTab);
      if (found) {
        currentLabelText = `${found.flag} ${found.city} (${found.region})`;
      } else {
        currentLabelText = `📍 ${state.modalSelectedCityTab}`;
      }
    }
    if (el.select2CurrentLabel) el.select2CurrentLabel.textContent = currentLabelText;

    const allItem = document.createElement('div');
    allItem.className = `select2-option-item ${state.modalSelectedCityTab === 'ALL' ? 'selected' : ''}`;
    allItem.innerHTML = `<span>🇪🇸 -- Todas las Ciudades --</span>`;
    allItem.addEventListener('click', () => {
      state.modalSelectedCityTab = 'ALL';
      if (el.select2CityDropdown) el.select2CityDropdown.classList.add('hidden');
      if (el.customCitySelect2) el.customCitySelect2.classList.remove('open');
      renderModalCitySelect();
      renderModalIpCards();
    });
    el.modalCityOptions.appendChild(allItem);

    const term = searchTerm.toLowerCase().trim();
    const citiesToRender = term
      ? state.spainCities.filter(c => c.city.toLowerCase().includes(term) || c.region.toLowerCase().includes(term))
      : state.spainCities;

    citiesToRender.forEach(c => {
      const isSelected = (state.modalSelectedCityTab === c.city);
      const isSuggested = (c.city === empFirstCourseCity);
      const item = document.createElement('div');
      item.className = `select2-option-item ${isSelected ? 'selected' : ''}`;
      item.innerHTML = `
        <span>${c.flag} ${c.city} <small style="color: var(--apple-text-secondary); margin-left: 4px;">(${c.region})</small></span>
        ${isSuggested ? '<span style="color: var(--apple-orange); font-size: 0.8rem;">★ Sugerida</span>' : ''}
      `;

      item.addEventListener('click', () => {
        state.modalSelectedCityTab = c.city;
        if (el.select2CityDropdown) el.select2CityDropdown.classList.add('hidden');
        if (el.customCitySelect2) el.customCitySelect2.classList.remove('open');
        renderModalCitySelect();
        renderModalIpCards();
      });

      el.modalCityOptions.appendChild(item);
    });
  }

  function renderModalIpCards() {
    if (!el.ipCardsContainer) return;
    el.ipCardsContainer.innerHTML = '';

    const empFirstCourseCity = state.modalEmployee?.courses && state.courses.find(crs => crs.id === state.modalEmployee.courses[0])?.city;

    const filteredIps = state.modalSelectedCityTab === 'ALL'
      ? state.ipPool
      : state.ipPool.filter(ip => ip.city === state.modalSelectedCityTab);

    if (filteredIps.length === 0) {
      el.ipCardsContainer.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1; padding: 1.5rem;">
          <i class="fa-solid fa-server"></i>
          <p>No hay IPs pre-configuradas para esta ciudad.</p>
          <span style="font-size: 0.82rem; color: var(--apple-cyan);">Presiona "Generar IP de Ciudad" para crear una IP autónoma en esta región.</span>
        </div>`;
      return;
    }

    filteredIps.forEach(ipObj => {
      const isSelected = state.modalSelectedIp && (state.modalSelectedIp.id === ipObj.id || state.modalSelectedIp.ip === ipObj.ip);
      const isRecommended = ipObj.city === empFirstCourseCity;

      const card = document.createElement('div');
      card.className = `ip-option-card ${isSelected ? 'selected' : ''}`;

      card.innerHTML = `
        <div class="ip-card-header">
          <span class="ip-card-address">${ipObj.ip}</span>
        </div>
        <div class="ip-card-isp"><i class="fa-solid fa-location-dot"></i> ${ipObj.city} (${ipObj.region})</div>
        ${isRecommended ? '<span class="ip-rec-badge"><i class="fa-solid fa-star"></i> Recomendada por Curso</span>' : ''}
      `;

      card.addEventListener('click', () => {
        assignSelectedIp(ipObj);
      });

      el.ipCardsContainer.appendChild(card);
    });
  }

  async function assignSelectedIp(ipObj) {
    if (!state.modalEmployee) return;

    try {
      const res = await fetch(`/api/employees/${state.modalEmployee.id}/assign-ip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip: ipObj ? ipObj.ip : null })
      });

      const data = await res.json();
      if (data.success) {
        const emp = state.employees.find(e => e.id === state.modalEmployee.id);
        if (emp) {
          if (ipObj) {
            emp.ipAddress = ipObj.ip || ipObj.ipAddress;
            emp.ipCity = ipObj.city || ipObj.ipCity;
            emp.ipRegion = ipObj.region || ipObj.ipRegion;
            emp.ipIsp = ipObj.isp || ipObj.ipIsp;
          } else {
            emp.ipAddress = null;
            emp.ipCity = null;
            emp.ipRegion = null;
            emp.ipIsp = null;
          }
        }
        renderEmployeeList();
        renderTabEmployees();
        closeIpModal();
      }
    } catch (err) {
      console.error('Error al asignar IP:', err);
    }
  }

  async function assignEmployeeIpAuto(employeeId) {
    try {
      const res = await fetch(`/api/employees/${employeeId}/assign-ip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auto: true })
      });
      const data = await res.json();
      if (data.success) {
        await loadEmployees();
      }
    } catch (err) {
      console.error('Error al auto-asignar IP:', err);
    }
  }

  async function autoAssignIps(employeeIds = null) {
    try {
      const res = await fetch('/api/employees/auto-assign-ips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeIds })
      });
      const data = await res.json();
      if (data.success) {
        await loadEmployees();
        showUploadStatus(`✓ ${data.message}`, 'success');
      }
    } catch (err) {
      console.error('Error al auto-asignar IPs:', err);
    }
  }

  // --- Bots Live Monitor Table Render ---

  function renderBotsTable() {
    const botsArray = Array.from(state.activeBots.values());
    el.botsTableBody.innerHTML = '';

    if (botsArray.length === 0) {
      el.botsTableBody.innerHTML = `
        <tr class="empty-row">
          <td colspan="5">
            <div class="empty-state">
              <i class="fa-solid fa-robot-circle-check"></i>
              <p>No hay bots de asistencia activos en este momento.</p>
              <span>Selecciona empleados y presiona "Iniciar Bots de Asistencia" para comenzar.</span>
            </div>
          </td>
        </tr>`;
      el.btnStopAll.disabled = true;
      return;
    }

    el.btnStopAll.disabled = false;

    botsArray.forEach(bot => {
      const tr = document.createElement('tr');

      let statusBadge = '';
      if (bot.status === 'scheduled') {
        statusBadge = `<span class="bot-status-badge status-scheduled"><i class="fa-regular fa-clock"></i> Programado</span>`;
      } else if (bot.status === 'connecting') {
        const attStr = bot.attempt ? ` (${bot.attempt}/3)` : '';
        statusBadge = `<span class="bot-status-badge status-connecting"><i class="fa-solid fa-spinner fa-spin"></i> Conectando${attStr}...</span>`;
      } else if (bot.status === 'retrying') {
        const nextAtt = bot.nextAttempt || (bot.attempt ? bot.attempt + 1 : 2);
        statusBadge = `<span class="bot-status-badge status-connecting" style="border-color: var(--apple-orange); color: var(--apple-orange);"><i class="fa-solid fa-arrows-rotate fa-spin"></i> Reintentando (${nextAtt}/3)...</span>`;
      } else if (bot.status === 'connected') {
        statusBadge = `<span class="bot-status-badge status-connected"><i class="fa-solid fa-signal"></i> En Reunión</span>`;
      } else if (bot.status === 'error') {
        const errTitle = bot.errorMsg ? `title="${bot.errorMsg}"` : '';
        statusBadge = `<span class="bot-status-badge status-error" ${errTitle}><i class="fa-solid fa-circle-exclamation"></i> Fallo (3/3)</span>`;
      }

      const bytes = bot.bytesConsumed || 0;
      const mb = (bytes / (1024 * 1024)).toFixed(2);

      tr.innerHTML = `
        <td>
          <strong>${bot.employeeName}</strong><br>
          <small class="text-muted"><i class="fa-solid fa-building"></i> ${bot.companyName}</small>
          <div style="margin-top: 2px;">
            <small style="color: var(--apple-green); font-family: var(--font-mono);"><i class="fa-solid fa-network-wired"></i> IP: ${bot.ipAddress || 'España'} (${bot.ipCity || 'Madrid'})</small>
          </div>
        </td>
        <td>${statusBadge}</td>
        <td>
          <span class="mb-badge"><i class="fa-solid fa-network-wired"></i> ${mb} MB</span>
        </td>
        <td><span class="elapsed-timer" data-connected="${bot.connectedAt || ''}">${getElapsedText(bot)}</span></td>
        <td>
          <button class="btn btn-danger btn-sm btn-stop-bot" data-bot-id="${bot.id}">
            <i class="fa-solid fa-power-off"></i> Desconectar
          </button>
        </td>
      `;

      const stopBtn = tr.querySelector('.btn-stop-bot');
      stopBtn.addEventListener('click', async () => {
        try {
          await fetch('/api/bots/stop', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ botId: bot.id })
          });
        } catch (err) {
          console.error('Error al detener bot:', err);
        }
      });

      el.botsTableBody.appendChild(tr);
    });
  }

  function getElapsedText(bot) {
    if (bot.status === 'scheduled') return 'Esperando turno...';
    if (bot.status === 'connecting') return `Iniciando (Intento ${bot.attempt || 1}/3)...`;
    if (bot.status === 'retrying') return `Reintentando (${bot.nextAttempt || 2}/3)...`;
    if (bot.status === 'error') return 'Fallo tras 3 intentos';
    if (!bot.connectedAt) return '00:00';

    const start = new Date(bot.connectedAt).getTime();
    const now = Date.now();
    const diffSec = Math.floor((now - start) / 1000);

    const mins = Math.floor(diffSec / 60).toString().padStart(2, '0');
    const secs = (diffSec % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  }

  function startElapsedTimer() {
    setInterval(() => {
      const timerElements = document.querySelectorAll('.elapsed-timer');
      timerElements.forEach(span => {
        const botId = span.closest('tr')?.querySelector('.btn-stop-bot')?.dataset.botId;
        if (botId && state.activeBots.has(botId)) {
          const bot = state.activeBots.get(botId);
          span.textContent = getElapsedText(bot);
        }
      });
    }, 1000);
  }

  function updateBotStats() {
    el.statActiveBots.textContent = state.activeBots.size;
  }

  // --- Custom Date & Time Picker Implementation ---
  const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  let dpSelectedDate = new Date();
  let dpViewYear = dpSelectedDate.getFullYear();
  let dpViewMonth = dpSelectedDate.getMonth();

  function initCustomDatePicker() {
    if (!el.customDatetimePicker) return;

    // Populate hour options (00 to 23)
    if (el.dpHourSelect) {
      el.dpHourSelect.innerHTML = '';
      for (let h = 0; h < 24; h++) {
        const val = String(h).padStart(2, '0');
        const opt = document.createElement('option');
        opt.value = val;
        opt.textContent = val;
        el.dpHourSelect.appendChild(opt);
      }
    }

    // Populate minute options (00 to 59, steps of 5)
    if (el.dpMinuteSelect) {
      el.dpMinuteSelect.innerHTML = '';
      for (let m = 0; m < 60; m += 5) {
        const val = String(m).padStart(2, '0');
        const opt = document.createElement('option');
        opt.value = val;
        opt.textContent = val;
        el.dpMinuteSelect.appendChild(opt);
      }
    }

    // Toggle popover
    if (el.datepickerTrigger) {
      el.datepickerTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = el.customDatetimePicker.classList.toggle('open');
        if (isOpen) {
          el.datepickerPopover.classList.remove('hidden');
          dpViewYear = dpSelectedDate.getFullYear();
          dpViewMonth = dpSelectedDate.getMonth();
          renderCalendarGrid();
        } else {
          el.datepickerPopover.classList.add('hidden');
        }
      });
    }

    if (el.datepickerPopover) {
      el.datepickerPopover.addEventListener('click', (e) => e.stopPropagation());
    }

    // Prev / Next Month
    if (el.dpPrevMonth) {
      el.dpPrevMonth.addEventListener('click', () => {
        dpViewMonth--;
        if (dpViewMonth < 0) {
          dpViewMonth = 11;
          dpViewYear--;
        }
        renderCalendarGrid();
      });
    }

    if (el.dpNextMonth) {
      el.dpNextMonth.addEventListener('click', () => {
        dpViewMonth++;
        if (dpViewMonth > 11) {
          dpViewMonth = 0;
          dpViewYear++;
        }
        renderCalendarGrid();
      });
    }

    // Time Change
    if (el.dpHourSelect) {
      el.dpHourSelect.addEventListener('change', () => {
        dpSelectedDate.setHours(parseInt(el.dpHourSelect.value, 10));
        syncDatePickerInputs();
      });
    }

    if (el.dpMinuteSelect) {
      el.dpMinuteSelect.addEventListener('change', () => {
        dpSelectedDate.setMinutes(parseInt(el.dpMinuteSelect.value, 10));
        syncDatePickerInputs();
      });
    }

    // Today / Now button
    if (el.dpBtnToday) {
      el.dpBtnToday.addEventListener('click', () => {
        const now = new Date();
        setCustomDatePickerValue(now);
      });
    }

    // Confirm button
    if (el.dpBtnApply) {
      el.dpBtnApply.addEventListener('click', () => {
        closeCustomDatePicker();
      });
    }

    // Close when clicking outside
    document.addEventListener('click', (e) => {
      if (el.customDatetimePicker && !el.customDatetimePicker.contains(e.target)) {
        closeCustomDatePicker();
      }
    });

    // Default init date
    const initialDate = new Date();
    initialDate.setMinutes(initialDate.getMinutes() + 10);
    setCustomDatePickerValue(initialDate);
    closeCustomDatePicker();
  }

  function closeCustomDatePicker() {
    if (el.customDatetimePicker) el.customDatetimePicker.classList.remove('open');
    if (el.datepickerPopover) el.datepickerPopover.classList.add('hidden');
  }

  function setCustomDatePickerValue(dateObj) {
    if (!dateObj || isNaN(dateObj.getTime())) {
      dateObj = new Date();
    }
    dpSelectedDate = new Date(dateObj);
    dpViewYear = dpSelectedDate.getFullYear();
    dpViewMonth = dpSelectedDate.getMonth();

    syncDatePickerInputs();
    renderCalendarGrid();
  }

  function syncDatePickerInputs() {
    const y = dpSelectedDate.getFullYear();
    const m = String(dpSelectedDate.getMonth() + 1).padStart(2, '0');
    const d = String(dpSelectedDate.getDate()).padStart(2, '0');
    const hh = String(dpSelectedDate.getHours()).padStart(2, '0');
    const mm = String(dpSelectedDate.getMinutes()).padStart(2, '0');

    // Set hidden ISO local string
    if (el.meetingFormTime) {
      el.meetingFormTime.value = `${y}-${m}-${d}T${hh}:${mm}`;
    }

    // Display string
    if (el.datepickerDisplayValue) {
      el.datepickerDisplayValue.textContent = `${d}/${m}/${y} ${hh}:${mm} hs`;
    }

    // Set time dropdowns
    if (el.dpHourSelect) el.dpHourSelect.value = hh;
    if (el.dpMinuteSelect) {
      const roundedM = String(Math.floor(dpSelectedDate.getMinutes() / 5) * 5).padStart(2, '0');
      el.dpMinuteSelect.value = roundedM;
    }
  }

  function renderCalendarGrid() {
    if (!el.dpDaysGrid || !el.dpMonthYearLabel) return;

    el.dpMonthYearLabel.textContent = `${MONTH_NAMES[dpViewMonth]} ${dpViewYear}`;
    el.dpDaysGrid.innerHTML = '';

    const today = new Date();
    const todayY = today.getFullYear();
    const todayM = today.getMonth();
    const todayD = today.getDate();

    const selectedY = dpSelectedDate.getFullYear();
    const selectedM = dpSelectedDate.getMonth();
    const selectedD = dpSelectedDate.getDate();

    // First day of month (0 = Sun, 1 = Mon ... 6 = Sat)
    const firstDayIndex = new Date(dpViewYear, dpViewMonth, 1).getDay();
    const startingDay = (firstDayIndex === 0 ? 6 : firstDayIndex - 1);

    const daysInMonth = new Date(dpViewYear, dpViewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(dpViewYear, dpViewMonth, 0).getDate();

    // Previous month padding days
    for (let x = startingDay; x > 0; x--) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'dp-day-btn other-month';
      btn.textContent = daysInPrevMonth - x + 1;
      el.dpDaysGrid.appendChild(btn);
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'dp-day-btn';

      if (dpViewYear === todayY && dpViewMonth === todayM && day === todayD) {
        btn.classList.add('today');
      }
      if (dpViewYear === selectedY && dpViewMonth === selectedM && day === selectedD) {
        btn.classList.add('selected');
      }

      btn.textContent = day;
      btn.addEventListener('click', () => {
        dpSelectedDate.setFullYear(dpViewYear);
        dpSelectedDate.setMonth(dpViewMonth);
        dpSelectedDate.setDate(day);
        setCustomDatePickerValue(dpSelectedDate);
      });

      el.dpDaysGrid.appendChild(btn);
    }

    // Next month padding days to fill 42 cells (6 rows * 7 columns)
    const totalRendered = startingDay + daysInMonth;
    const remainingDays = 42 - totalRendered;
    for (let i = 1; i <= remainingDays; i++) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'dp-day-btn other-month';
      btn.textContent = i;
      el.dpDaysGrid.appendChild(btn);
    }
  }
});
