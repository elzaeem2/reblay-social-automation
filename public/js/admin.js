/**
 * Admin panel script
 */
document.addEventListener('DOMContentLoaded', () => {
  // App state
  const state = {
    isAdmin: false,
    users: [],
    codes: [],
    stats: null,
    currentPage: null
  };

  // DOM Elements
  const elements = {
    // Navigation
    adminNav: document.getElementById('admin-nav'),
    btnAdminLogout: document.getElementById('btn-admin-logout'),
    
    // Pages
    pages: document.querySelectorAll('.page'),
    
    // Forms
    adminLoginForm: document.getElementById('admin-login-form'),
    addCodeForm: document.getElementById('add-code-form'),
    
    // Dashboard
    totalUsers: document.getElementById('total-users'),
    activeUsers: document.getElementById('active-users'),
    totalMessages: document.getElementById('total-messages'),
    totalCodes: document.getElementById('total-codes'),
    
    // Users
    usersTableBody: document.getElementById('users-table-body'),
    noUsers: document.getElementById('no-users'),
    
    // Codes
    codesTableBody: document.getElementById('codes-table-body'),
    noCodes: document.getElementById('no-codes'),
    btnGenerateCode: document.getElementById('btn-generate-code'),
    codeTypeRadios: document.getElementsByName('code-type'),
    codeDescription: document.getElementById('code-description'),
    
    // Contact Info
    contactForm: document.getElementById('contact-form'),
    contactPhone: document.getElementById('contact-phone'),
    contactWhatsapp: document.getElementById('contact-whatsapp'),
    contactEmail: document.getElementById('contact-email'),
    contactAddress: document.getElementById('contact-address'),
    contactHours: document.getElementById('contact-hours'),
    contactPreview: document.getElementById('contact-preview'),
    btnSaveContact: document.getElementById('btn-save-contact'),

    // Modals
    addCodeModal: new bootstrap.Modal(document.getElementById('add-code-modal')),
    errorModal: new bootstrap.Modal(document.getElementById('admin-error-modal')),
    errorMessage: document.getElementById('admin-error-message')
  };

  // Charts
  let messagesPerDayChart = null;
  let messagesPerUserChart = null;

  // Initialize the application
  const init = async () => {
    // Check if admin is logged in
    try {
      const result = await API.admin.checkStatus();
      state.isAdmin = result.isAdmin;
      updateUI();
      
      if (state.isAdmin) {
        navigateTo('dashboard');
      } else {
        navigateTo('admin-login');
      }
    } catch (error) {
      navigateTo('admin-login');
    }

    // Set up event listeners
    setupEventListeners();
  };

  // Set up event listeners
  const setupEventListeners = () => {
    // Navigation
    document.querySelectorAll('[data-page]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = e.currentTarget.getAttribute('data-page');
        navigateTo(page);
      });
    });

    // Admin logout
    elements.btnAdminLogout.addEventListener('click', async () => {
      try {
        await API.admin.logout();
        state.isAdmin = false;
        updateUI();
        navigateTo('admin-login');
      } catch (error) {
        showError(error.message);
      }
    });

    // Admin login form
    elements.adminLoginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('admin-username').value;
      const password = document.getElementById('admin-password').value;

      try {
        await API.admin.login({ username, password });
        state.isAdmin = true;
        updateUI();
        navigateTo('dashboard');
      } catch (error) {
        showError(error.message);
      }
    });

    // Save contact info button
    if (elements.btnSaveContact) {
      elements.btnSaveContact.addEventListener('click', saveContactInfo);
    }

    // Generate code button
    elements.btnGenerateCode.addEventListener('click', async () => {
      // Get selected code type
      let type = 'full';
      for (const radio of elements.codeTypeRadios) {
        if (radio.checked) {
          type = radio.value;
          break;
        }
      }
      
      const description = elements.codeDescription.value.trim();
      
      try {
        await API.admin.generateCode({ type, description });
        elements.addCodeModal.hide();
        elements.addCodeForm.reset();
        loadCodes();
      } catch (error) {
        showError(error.message);
      }
    });
  };

  // Navigate to a page
  const navigateTo = (page) => {
    // Check if admin is authenticated for protected pages
    const protectedPages = ['dashboard', 'users', 'codes'];
    if (protectedPages.includes(page) && !state.isAdmin) {
      page = 'admin-login';
    }

    // Hide all pages
    elements.pages.forEach(p => {
      p.style.display = 'none';
    });

    // Show selected page
    const selectedPage = document.getElementById(`page-${page}`);
    if (selectedPage) {
      selectedPage.style.display = 'block';
      state.currentPage = page;

      // Load page-specific data
      if (state.isAdmin) {
        switch (page) {
          case 'dashboard':
            loadStats();
            break;
          case 'users':
            loadUsers();
            break;
          case 'codes':
            loadCodes();
            break;
          case 'contact-settings':
            loadContactInfo();
            break;
        }
      }
    }
  };

  // Update UI based on authentication state
  const updateUI = () => {
    if (state.isAdmin) {
      elements.adminNav.style.display = 'flex';
      elements.btnAdminLogout.style.display = 'block';
    } else {
      elements.adminNav.style.display = 'none';
      elements.btnAdminLogout.style.display = 'none';
    }
  };

  // Load statistics
  const loadStats = async () => {
    try {
      const stats = await API.admin.getStats();
      state.stats = stats;
      
      // Update dashboard counters
      elements.totalUsers.textContent = stats.totalUsers;
      elements.activeUsers.textContent = stats.activeUsers;
      elements.totalMessages.textContent = stats.totalMessages;
      
      // Load codes count
      const codes = await API.admin.getCodes();
      elements.totalCodes.textContent = codes.length;
      
      // Create or update charts
      createMessagesPerDayChart(stats.messagesPerDay);
      createMessagesPerUserChart(stats.messagesPerUser);
    } catch (error) {
      showError('حدث خطأ أثناء تحميل الإحصائيات');
      console.error('Error loading stats:', error);
    }
  };

  // Create messages per day chart
  const createMessagesPerDayChart = (data) => {
    const ctx = document.getElementById('messages-per-day-chart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (messagesPerDayChart) {
      messagesPerDayChart.destroy();
    }
    
    // Sort dates
    const sortedDates = Object.keys(data).sort();
    const values = sortedDates.map(date => data[date]);
    
    messagesPerDayChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: sortedDates,
        datasets: [{
          label: 'عدد الرسائل',
          data: values,
          backgroundColor: 'rgba(67, 97, 238, 0.2)',
          borderColor: 'rgba(67, 97, 238, 1)',
          borderWidth: 2,
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: true,
            text: 'الرسائل حسب اليوم'
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  };

  // Create messages per user chart
  const createMessagesPerUserChart = (data) => {
    const ctx = document.getElementById('messages-per-user-chart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (messagesPerUserChart) {
      messagesPerUserChart.destroy();
    }
    
    const users = Object.keys(data);
    const values = users.map(user => data[user]);
    
    messagesPerUserChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: users,
        datasets: [{
          label: 'عدد الرسائل',
          data: values,
          backgroundColor: 'rgba(67, 97, 238, 0.7)',
          borderColor: 'rgba(67, 97, 238, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: true,
            text: 'الرسائل حسب المستخدم'
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  };

  // Load users
  const loadUsers = async () => {
    try {
      const users = await API.admin.getUsers();
      state.users = users;
      
      if (users.length === 0) {
        elements.usersTableBody.innerHTML = '';
        elements.noUsers.style.display = 'block';
        return;
      }
      
      elements.noUsers.style.display = 'none';
      
      // Render users table
      elements.usersTableBody.innerHTML = users.map((user, index) => {
        // Format expiry date
        let expiryDate = 'غير مفعل';
        if (user.activationExpiry) {
          const date = new Date(user.activationExpiry);
          expiryDate = date.toLocaleDateString('ar-IQ');
        }
        
        // Format creation date
        const creationDate = new Date(user.createdAt).toLocaleDateString('ar-IQ');
        
        return `
          <tr>
            <td>${index + 1}</td>
            <td>${user.name}</td>
            <td>${user.username}</td>
            <td>${user.email}</td>
            <td>${user.freeMessagesRemaining || 0}</td>
            <td>${expiryDate}</td>
            <td>${creationDate}</td>
          </tr>
        `;
      }).join('');
    } catch (error) {
      showError('حدث خطأ أثناء تحميل المستخدمين');
      console.error('Error loading users:', error);
    }
  };

  // Load activation codes
  const loadCodes = async () => {
    try {
      const codes = await API.admin.getCodes();
      state.codes = codes;
      
      if (codes.length === 0) {
        elements.codesTableBody.innerHTML = '';
        elements.noCodes.style.display = 'block';
        return;
      }
      
      elements.noCodes.style.display = 'none';
      
      // Render codes table
      elements.codesTableBody.innerHTML = codes.map(code => {
        // Format dates
        const creationDate = new Date(code.createdAt).toLocaleDateString('ar-IQ');
        let usedDate = '-';
        if (code.usedAt) {
          usedDate = new Date(code.usedAt).toLocaleDateString('ar-IQ');
        }
        
        // Format type
        const type = code.type === 'full' ? 'كامل (30 يوم)' : 'مؤقت (50 رسالة)';
        
        // Format status
        const status = code.used ? 
          '<span class="badge bg-secondary">مستخدم</span>' : 
          '<span class="badge bg-success">متاح</span>';
        
        return `
          <tr>
            <td><strong>${code.code}</strong></td>
            <td>${type}</td>
            <td>${code.description || '-'}</td>
            <td>${status}</td>
            <td>${creationDate}</td>
            <td>${usedDate}</td>
            <td>${code.usedBy || '-'}</td>
            <td>
              ${!code.used ? `
                <button class="btn btn-sm btn-danger delete-code" data-code="${code.code}">
                  <i class="fas fa-trash"></i>
                </button>
              ` : ''}
            </td>
          </tr>
        `;
      }).join('');
      
      // Add event listeners to delete buttons
      document.querySelectorAll('.delete-code').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          if (confirm('هل أنت متأكد من حذف هذا الكود؟')) {
            const code = e.currentTarget.getAttribute('data-code');
            try {
              await API.admin.deleteCode(code);
              loadCodes();
            } catch (error) {
              showError(error.message);
            }
          }
        });
      });
    } catch (error) {
      showError('حدث خطأ أثناء تحميل أكواد التفعيل');
      console.error('Error loading codes:', error);
    }
  };

  // Contact Information Functions
  const loadContactInfo = async () => {
    try {
      const response = await API.admin.get('/contact');
      if (response.success) {
        const contact = response.data;

        // Fill form fields
        if (elements.contactPhone) elements.contactPhone.value = contact.phone || '';
        if (elements.contactWhatsapp) elements.contactWhatsapp.value = contact.whatsapp || '';
        if (elements.contactEmail) elements.contactEmail.value = contact.supportEmail || '';
        if (elements.contactAddress) elements.contactAddress.value = contact.address || '';
        if (elements.contactHours) elements.contactHours.value = contact.workingHours || '';

        // Update preview
        updateContactPreview(contact);
      }
    } catch (error) {
      console.error('Error loading contact info:', error);
      showError('خطأ في تحميل معلومات الاتصال');
    }
  };

  const saveContactInfo = async () => {
    try {
      const contactData = {
        phone: elements.contactPhone?.value || '',
        whatsapp: elements.contactWhatsapp?.value || '',
        supportEmail: elements.contactEmail?.value || '',
        address: elements.contactAddress?.value || '',
        workingHours: elements.contactHours?.value || ''
      };

      const response = await API.admin.post('/contact', contactData);
      if (response.success) {
        showSuccess('تم حفظ معلومات الاتصال بنجاح');
        updateContactPreview(response.data);
      } else {
        showError(response.message || 'خطأ في حفظ معلومات الاتصال');
      }
    } catch (error) {
      console.error('Error saving contact info:', error);
      showError('خطأ في حفظ معلومات الاتصال');
    }
  };

  const updateContactPreview = (contact) => {
    if (!elements.contactPreview) return;

    let previewHtml = '<div class="contact-preview">';

    if (contact.supportEmail) {
      previewHtml += `<p><i class="fas fa-envelope me-2"></i><strong>البريد الإلكتروني:</strong> ${contact.supportEmail}</p>`;
    }

    if (contact.phone) {
      previewHtml += `<p><i class="fas fa-phone me-2"></i><strong>الهاتف:</strong> ${contact.phone}</p>`;
    }

    if (contact.whatsapp) {
      previewHtml += `<p><i class="fab fa-whatsapp me-2"></i><strong>الواتساب:</strong> ${contact.whatsapp}</p>`;
    }

    if (contact.address) {
      previewHtml += `<p><i class="fas fa-map-marker-alt me-2"></i><strong>العنوان:</strong> ${contact.address}</p>`;
    }

    if (contact.workingHours) {
      previewHtml += `<p><i class="fas fa-clock me-2"></i><strong>ساعات العمل:</strong> ${contact.workingHours}</p>`;
    }

    if (!contact.supportEmail && !contact.phone && !contact.address) {
      previewHtml += '<p class="text-muted small">لم يتم إدخال معلومات الاتصال بعد</p>';
    }

    previewHtml += '</div>';
    elements.contactPreview.innerHTML = previewHtml;
  };

  // Show success message
  const showSuccess = (message) => {
    // Create a simple success toast
    const toast = document.createElement('div');
    toast.className = 'toast align-items-center text-white bg-success border-0 position-fixed top-0 end-0 m-3';
    toast.style.zIndex = '9999';
    toast.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">
          <i class="fas fa-check-circle me-2"></i>${message}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
      </div>
    `;

    document.body.appendChild(toast);
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();

    // Remove toast after it's hidden
    toast.addEventListener('hidden.bs.toast', () => {
      document.body.removeChild(toast);
    });
  };

  // Show error message
  const showError = (message) => {
    elements.errorMessage.textContent = message;
    elements.errorModal.show();
  };

  // Initialize the application
  init();
});
