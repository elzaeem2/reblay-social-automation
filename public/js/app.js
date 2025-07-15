/**
 * Main application script
 */
document.addEventListener('DOMContentLoaded', () => {
  // App state
  const state = {
    user: null,
    products: [],
    currentPage: null,
    isAuthenticated: false
  };

  // DOM Elements
  const elements = {
    // Navigation
    navAuthenticated: document.getElementById('nav-authenticated'),
    btnLogin: document.getElementById('btn-login'),
    btnRegister: document.getElementById('btn-register'),
    btnLogout: document.getElementById('btn-logout'),

    // Pages
    pages: document.querySelectorAll('.page'),

    // Forms
    loginForm: document.getElementById('login-form'),
    registerForm: document.getElementById('register-form'),
    chatForm: document.getElementById('chat-form'),
    addProductForm: document.getElementById('add-product-form'),
    editProductForm: document.getElementById('edit-product-form'),

    // Dashboard
    remainingMessages: document.getElementById('remaining-messages'),
    subscriptionExpiry: document.getElementById('subscription-expiry'),
    productCount: document.getElementById('product-count'),
    activationNeeded: document.getElementById('activation-needed'),
    activationActive: document.getElementById('activation-active'),
    activationExpiryDate: document.getElementById('activation-expiry-date'),
    activationCode: document.getElementById('activation-code'),
    btnActivate: document.getElementById('btn-activate'),

    // Store Info
    storeInfoForm: document.getElementById('store-info-form'),
    storeName: document.getElementById('store-name'),
    storeAddress: document.getElementById('store-address'),
    storeDescription: document.getElementById('store-description'),
    btnSaveStoreInfo: document.getElementById('btn-save-store-info'),

    // Contact Info
    contactForm: document.getElementById('contact-form'),
    contactPhone: document.getElementById('contact-phone'),
    contactWhatsapp: document.getElementById('contact-whatsapp'),
    contactEmail: document.getElementById('contact-email'),
    contactAddress: document.getElementById('contact-address'),
    contactHours: document.getElementById('contact-hours'),
    btnSaveContact: document.getElementById('btn-save-contact'),
    contactPreview: document.getElementById('contact-preview'),

    // Products
    productsTableBody: document.getElementById('products-table-body'),
    noProducts: document.getElementById('no-products'),
    btnSaveProduct: document.getElementById('btn-save-product'),
    btnUpdateProduct: document.getElementById('btn-update-product'),
    productName: document.getElementById('product-name'),
    productPrice: document.getElementById('product-price'),
    productDescription: document.getElementById('product-description'),
    editProductId: document.getElementById('edit-product-id'),
    editProductName: document.getElementById('edit-product-name'),
    editProductPrice: document.getElementById('edit-product-price'),
    editProductDescription: document.getElementById('edit-product-description'),

    // Chat
    chatMessages: document.getElementById('chat-messages'),
    chatInput: document.getElementById('chat-input'),
    btnNewChat: document.getElementById('btn-new-chat'),

    // Orders
    ordersTableBody: document.getElementById('orders-table-body'),
    noOrders: document.getElementById('no-orders'),
    btnRefreshOrders: document.getElementById('btn-refresh-orders'),
    btnUpdateOrderStatus: document.getElementById('btn-update-order-status'),
    updateOrderId: document.getElementById('update-order-id'),
    orderStatus: document.getElementById('order-status'),
    updateOrderStatusModal: new bootstrap.Modal(document.getElementById('update-order-status-modal')),

    // Accounts
    facebookNotConnected: document.getElementById('facebook-not-connected'),
    facebookConnected: document.getElementById('facebook-connected'),
    facebookAccountName: document.getElementById('facebook-account-name'),
    facebookPagesList: document.getElementById('facebook-pages-list'),
    btnConnectFacebook: document.getElementById('btn-connect-facebook'),
    btnDisconnectFacebook: document.getElementById('btn-disconnect-facebook'),

    // Modals
    addProductModal: new bootstrap.Modal(document.getElementById('add-product-modal')),
    editProductModal: new bootstrap.Modal(document.getElementById('edit-product-modal')),
    activationSuccessModal: new bootstrap.Modal(document.getElementById('activation-success-modal')),
    errorModal: new bootstrap.Modal(document.getElementById('error-modal')),
    activationSuccessDetails: document.getElementById('activation-success-details'),
    errorMessage: document.getElementById('error-message')
  };

  // Initialize the application
  const init = async () => {
    // Check if user is logged in
    if (API.token) {
      try {
        const user = await API.auth.getCurrentUser();
        state.user = user;
        state.isAuthenticated = true;
        updateUI();
        navigateTo('dashboard');
      } catch (error) {
        // Token is invalid, clear it
        API.clearToken();
        navigateTo('login');
      }
    } else {
      navigateTo('login');
    }

    // Set up event listeners
    setupEventListeners();

    // Load footer contact info
    loadFooterContactInfo();
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

    // Logout
    elements.btnLogout.addEventListener('click', () => {
      API.auth.logout();
      state.user = null;
      state.isAuthenticated = false;
      updateUI();
      navigateTo('login');
    });

    // Login form
    elements.loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('login-username').value;
      const password = document.getElementById('login-password').value;

      try {
        const result = await API.auth.login({ username, password });
        state.user = result.user;
        state.isAuthenticated = true;
        updateUI();
        navigateTo('dashboard');
      } catch (error) {
        showError(error.message);
      }
    });

    // Register form
    elements.registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('register-name').value;
      const username = document.getElementById('register-username').value;
      const email = document.getElementById('register-email').value;
      const password = document.getElementById('register-password').value;

      try {
        const result = await API.auth.register({ name, username, email, password });
        state.user = result.user;
        state.isAuthenticated = true;
        API.setToken(result.token);
        updateUI();
        navigateTo('dashboard');
      } catch (error) {
        showError(error.message);
      }
    });

    // Activate button
    elements.btnActivate.addEventListener('click', async () => {
      const code = elements.activationCode.value.trim();
      if (!code) {
        showError('يرجى إدخال كود التفعيل');
        return;
      }

      try {
        const result = await API.auth.activate(code);
        state.user = result.user;
        updateDashboard();

        // Show success modal
        let activationType = result.user.activationType === 'full' ? 'كامل (30 يوم)' : 'مؤقت (50 رسالة)';
        elements.activationSuccessDetails.textContent = `نوع التفعيل: ${activationType}`;
        elements.activationSuccessModal.show();
      } catch (error) {
        showError(error.message);
      }
    });

    // Chat form
    elements.chatForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const message = elements.chatInput.value.trim();
      if (!message) return;

      // Add user message to chat
      addChatMessage(message, 'user');
      elements.chatInput.value = '';

      try {
        // Show typing indicator
        const typingIndicator = addTypingIndicator();

        // Get AI response
        const response = await API.messages.sendMessage(message);

        // Remove typing indicator and add AI response
        typingIndicator.remove();
        addChatMessage(response.message, 'bot');

        // Show notification based on order status
        if (response.orderStatus === 'CONFIRMED') {
          // Add system message about order creation
          const orderMessage = document.createElement('div');
          orderMessage.className = 'system-message';
          orderMessage.innerHTML = '<i class="fas fa-check-circle me-2"></i> تم تسجيل طلبك بنجاح! يمكنك متابعة حالة الطلب في صفحة <a href="#" data-page="orders">الطلبات</a>.';
          elements.chatMessages.appendChild(orderMessage);
          elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;

          // Add click event to the orders link
          orderMessage.querySelector('a[data-page="orders"]').addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo('orders');
          });

          showSuccess('تم إنشاء طلب جديد بنجاح');
        } else if (response.orderStatus === 'PENDING') {
          // Add system message about pending order
          const orderMessage = document.createElement('div');
          orderMessage.className = 'system-message';
          orderMessage.innerHTML = '<i class="fas fa-info-circle me-2"></i> يرجى تقديم معلوماتك الشخصية لإكمال الطلب.';
          elements.chatMessages.appendChild(orderMessage);
          elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;

          // Store in local storage that we have a pending order
          if (state.user) {
            localStorage.setItem(`pending_order_${state.user.id}`, 'true');
          }
        }
      } catch (error) {
        // Handle quota exceeded error
        if (error.message === 'Message quota exceeded') {
          addChatMessage('عذراً، لقد تجاوزت الحد المسموح من الرسائل. يرجى تفعيل حسابك للاستمرار.', 'system');
          navigateTo('dashboard');
        } else {
          addChatMessage('عذراً، حدث خطأ أثناء معالجة رسالتك. يرجى المحاولة مرة أخرى.', 'system');
        }
      }
    });

    // Add product form
    elements.btnSaveProduct.addEventListener('click', async () => {
      const name = elements.productName.value.trim();
      const price = elements.productPrice.value.trim();
      const description = elements.productDescription.value.trim();

      if (!name || !price) {
        showError('يرجى إدخال اسم المنتج والسعر');
        return;
      }

      try {
        await API.products.add({ name, price, description });
        elements.addProductModal.hide();
        elements.addProductForm.reset();
        loadProducts();
      } catch (error) {
        showError(error.message);
      }
    });

    // Update product form
    elements.btnUpdateProduct.addEventListener('click', async () => {
      const id = elements.editProductId.value;
      const name = elements.editProductName.value.trim();
      const price = elements.editProductPrice.value.trim();
      const description = elements.editProductDescription.value.trim();

      if (!name || !price) {
        showError('يرجى إدخال اسم المنتج والسعر');
        return;
      }

      try {
        await API.products.update(id, { name, price, description });
        elements.editProductModal.hide();
        loadProducts();
      } catch (error) {
        showError(error.message);
      }
    });

    // Connect Facebook button - Open in popup window
    elements.btnConnectFacebook.addEventListener('click', async () => {
      try {
        // Show loading state
        elements.btnConnectFacebook.disabled = true;
        elements.btnConnectFacebook.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> جاري التحضير...';

        const result = await API.oauth.getFacebookAuthUrl();

        // Reset button state
        elements.btnConnectFacebook.disabled = false;
        elements.btnConnectFacebook.innerHTML = '<i class="fab fa-facebook me-2"></i> ربط حساب فيسبوك';

        // Open popup window
        const width = 800;
        const height = 600;
        const left = (window.innerWidth - width) / 2;
        const top = (window.innerHeight - height) / 2;

        const popup = window.open(
          result.authUrl,
          'facebook-oauth',
          `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`
        );

        // Check if popup was blocked
        if (!popup || popup.closed || typeof popup.closed === 'undefined') {
          showError('تم حظر النافذة المنبثقة. يرجى السماح بالنوافذ المنبثقة لهذا الموقع.');
          return;
        }

        // Poll for popup closure
        const checkPopupClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkPopupClosed);
            // Reload connected accounts after popup is closed
            loadConnectedAccounts();
          }
        }, 500);
      } catch (error) {
        // Reset button state
        elements.btnConnectFacebook.disabled = false;
        elements.btnConnectFacebook.innerHTML = '<i class="fab fa-facebook me-2"></i> ربط حساب فيسبوك';

        showError(error.message);
      }
    });

    // Disconnect Facebook button
    elements.btnDisconnectFacebook.addEventListener('click', async () => {
      try {
        await API.oauth.disconnectAccount();
        loadConnectedAccounts();
      } catch (error) {
        showError(error.message);
      }
    });

    // Store info form
    elements.storeInfoForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = elements.storeName.value.trim();
      const address = elements.storeAddress.value.trim();
      const description = elements.storeDescription.value.trim();

      try {
        await API.store.updateInfo({ name, address, description });
        showSuccess('تم حفظ معلومات المتجر بنجاح');
      } catch (error) {
        showError(error.message);
      }
    });

    // New chat button
    elements.btnNewChat.addEventListener('click', () => {
      // Clear chat history from UI
      elements.chatMessages.innerHTML = '';

      // Add welcome message
      const welcomeMessage = document.createElement('div');
      welcomeMessage.className = 'system-message';
      welcomeMessage.textContent = 'مرحباً! أنا المساعد الآلي الخاص بك. يمكنك اختبار كيف سيتفاعل البوت مع عملائك هنا.';
      elements.chatMessages.appendChild(welcomeMessage);

      // Clear chat history and pending order info from local storage
      if (state.user) {
        localStorage.removeItem(`chat_history_${state.user.id}`);
        localStorage.removeItem(`pending_order_${state.user.id}`);
      }

      showSuccess('تم بدء محادثة جديدة');
    });

    // Refresh orders button
    elements.btnRefreshOrders.addEventListener('click', () => {
      loadOrders();
    });

    // Update order status button
    elements.btnUpdateOrderStatus.addEventListener('click', async () => {
      const orderId = elements.updateOrderId.value;
      const status = elements.orderStatus.value;

      if (!orderId || !status) {
        showError('حدث خطأ أثناء تحديث حالة الطلب');
        return;
      }

      try {
        await API.orders.updateStatus(orderId, status);
        elements.updateOrderStatusModal.hide();
        loadOrders();
        showSuccess('تم تحديث حالة الطلب بنجاح');
      } catch (error) {
        showError(error.message);
      }
    });
  };

  // Navigate to a page
  const navigateTo = (page) => {
    // Check if user is authenticated for protected pages
    const protectedPages = ['dashboard', 'products', 'chat', 'accounts', 'orders', 'contact-settings'];
    if (protectedPages.includes(page) && !state.isAuthenticated) {
      page = 'login';
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
      if (state.isAuthenticated) {
        switch (page) {
          case 'dashboard':
            updateDashboard();
            break;
          case 'products':
            loadProducts();
            break;
          case 'accounts':
            loadConnectedAccounts();
            break;
          case 'chat':
            loadChatHistory();
            break;
          case 'orders':
            loadOrders();
            break;
          // Contact settings moved to admin panel
        }
      }
    }
  };

  // Update UI based on authentication state
  const updateUI = () => {
    if (state.isAuthenticated) {
      elements.navAuthenticated.style.display = 'flex';
      elements.btnLogin.style.display = 'none';
      elements.btnRegister.style.display = 'none';
      elements.btnLogout.style.display = 'block';
    } else {
      elements.navAuthenticated.style.display = 'none';
      elements.btnLogin.style.display = 'block';
      elements.btnRegister.style.display = 'block';
      elements.btnLogout.style.display = 'none';
    }
  };

  // Update dashboard
  const updateDashboard = async () => {
    if (!state.user) return;

    // Update message count
    elements.remainingMessages.textContent = state.user.freeMessagesRemaining || 0;

    // Update subscription expiry
    if (state.user.activationExpiry) {
      const expiryDate = new Date(state.user.activationExpiry);
      const now = new Date();
      const isExpired = expiryDate <= now;
      const daysRemaining = Math.max(0, Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24)));

      elements.subscriptionExpiry.textContent = expiryDate.toLocaleDateString('ar-IQ');
      elements.activationExpiryDate.textContent = expiryDate.toLocaleDateString('ar-IQ');

      if (isExpired) {
        // Show renewal option for expired subscriptions
        elements.activationNeeded.style.display = 'block';
        elements.activationActive.style.display = 'none';
        elements.subscriptionExpiry.textContent += ' (منتهي الصلاحية - يمكن التجديد)';
        elements.subscriptionExpiry.style.color = '#dc3545'; // Red color
      } else {
        elements.activationNeeded.style.display = 'none';
        elements.activationActive.style.display = 'block';
        elements.subscriptionExpiry.style.color = '#28a745'; // Green color

        // Show warning if less than 3 days remaining
        if (daysRemaining <= 3) {
          elements.subscriptionExpiry.textContent += ` (${daysRemaining} أيام متبقية)`;
          elements.subscriptionExpiry.style.color = '#ffc107'; // Yellow color
        }
      }
    } else {
      elements.subscriptionExpiry.textContent = 'غير مفعل';
      elements.subscriptionExpiry.style.color = '#6c757d'; // Gray color
      elements.activationNeeded.style.display = 'block';
      elements.activationActive.style.display = 'none';
    }

    // Update product count
    try {
      const products = await API.products.getAll();
      elements.productCount.textContent = products.length;
      state.products = products;
    } catch (error) {
      console.error('Error loading products:', error);
    }

    // Load store info
    loadStoreInfo();
  };

  // Load store info
  const loadStoreInfo = async () => {
    try {
      const storeInfo = await API.store.getInfo();

      // Update form fields
      elements.storeName.value = storeInfo.name || '';
      elements.storeAddress.value = storeInfo.address || '';
      elements.storeDescription.value = storeInfo.description || '';

      // Save store info to state
      state.storeInfo = storeInfo;
    } catch (error) {
      console.error('Error loading store info:', error);
    }
  };

  // Load products
  const loadProducts = async () => {
    try {
      const products = await API.products.getAll();
      state.products = products;

      if (products.length === 0) {
        elements.productsTableBody.innerHTML = '';
        elements.noProducts.style.display = 'block';
        return;
      }

      elements.noProducts.style.display = 'none';

      // Render products table
      elements.productsTableBody.innerHTML = products.map((product, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${product.name}</td>
          <td>${product.price}</td>
          <td>${product.description || '-'}</td>
          <td>
            <div class="action-buttons">
              <button class="btn btn-sm btn-primary edit-product" data-id="${product.id}">
                <i class="fas fa-edit"></i>
              </button>
              <button class="btn btn-sm btn-danger delete-product" data-id="${product.id}">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </td>
        </tr>
      `).join('');

      // Add event listeners to edit buttons
      document.querySelectorAll('.edit-product').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const productId = e.currentTarget.getAttribute('data-id');
          const product = state.products.find(p => p.id === productId);

          if (product) {
            elements.editProductId.value = product.id;
            elements.editProductName.value = product.name;
            elements.editProductPrice.value = product.price;
            elements.editProductDescription.value = product.description || '';
            elements.editProductModal.show();
          }
        });
      });

      // Add event listeners to delete buttons
      document.querySelectorAll('.delete-product').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          if (confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
            const productId = e.currentTarget.getAttribute('data-id');
            try {
              await API.products.delete(productId);
              loadProducts();
            } catch (error) {
              showError(error.message);
            }
          }
        });
      });
    } catch (error) {
      showError('حدث خطأ أثناء تحميل المنتجات');
      console.error('Error loading products:', error);
    }
  };

  // Load orders
  const loadOrders = async () => {
    try {
      const orders = await API.orders.getAll();

      if (orders.length === 0) {
        elements.ordersTableBody.innerHTML = '';
        elements.noOrders.style.display = 'block';
        return;
      }

      elements.noOrders.style.display = 'none';

      // Sort orders by date (newest first)
      orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      // Render orders table
      elements.ordersTableBody.innerHTML = orders.map((order, index) => {
        // Format date
        const orderDate = new Date(order.createdAt);
        const formattedDate = orderDate.toLocaleDateString('ar-IQ') + ' ' +
                             orderDate.toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' });

        // Get status class and text
        let statusClass = 'bg-secondary';
        let statusText = 'قيد الانتظار';

        switch (order.status) {
          case 'pending':
            statusClass = 'bg-warning text-dark';
            statusText = 'قيد الانتظار';
            break;
          case 'processing':
            statusClass = 'bg-info text-dark';
            statusText = 'قيد المعالجة';
            break;
          case 'completed':
            statusClass = 'bg-success';
            statusText = 'مكتمل';
            break;
          case 'cancelled':
            statusClass = 'bg-danger';
            statusText = 'ملغي';
            break;
        }

        return `
          <tr>
            <td>${index + 1}</td>
            <td>${order.productName}</td>
            <td>${order.quantity}</td>
            <td>${order.customerInfo || '-'}</td>
            <td><span class="badge ${statusClass}">${statusText}</span></td>
            <td>${formattedDate}</td>
            <td>
              <div class="action-buttons">
                <button class="btn btn-sm btn-primary update-order-status" data-id="${order.id}" data-status="${order.status}">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger delete-order" data-id="${order.id}">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');

      // Add event listeners to update status buttons
      document.querySelectorAll('.update-order-status').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const orderId = e.currentTarget.getAttribute('data-id');
          const currentStatus = e.currentTarget.getAttribute('data-status');

          elements.updateOrderId.value = orderId;
          elements.orderStatus.value = currentStatus;
          elements.updateOrderStatusModal.show();
        });
      });

      // Add event listeners to delete buttons
      document.querySelectorAll('.delete-order').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          if (confirm('هل أنت متأكد من حذف هذا الطلب؟')) {
            const orderId = e.currentTarget.getAttribute('data-id');
            try {
              await API.orders.delete(orderId);
              loadOrders();
              showSuccess('تم حذف الطلب بنجاح');
            } catch (error) {
              showError(error.message);
            }
          }
        });
      });
    } catch (error) {
      showError('حدث خطأ أثناء تحميل الطلبات');
      console.error('Error loading orders:', error);
    }
  };

  // Load connected accounts
  const loadConnectedAccounts = async () => {
    try {
      const accounts = await API.oauth.getConnectedAccounts();

      if (accounts.connected) {
        elements.facebookNotConnected.style.display = 'none';
        elements.facebookConnected.style.display = 'block';

        // Update account info
        elements.facebookAccountName.textContent = accounts.name || 'غير معروف';

        // Add email if available
        if (accounts.email && document.getElementById('facebook-account-email')) {
          document.getElementById('facebook-account-email').textContent = accounts.email;
        }

        // Render pages and Instagram accounts list
        if (accounts.accounts && accounts.accounts.length > 0) {

          let pagesHtml = '';

          accounts.accounts.forEach(account => {

            // Facebook page
            pagesHtml += `
              <li>
                <div class="account-icon fb-icon">
                  <i class="fab fa-facebook-f"></i>
                </div>
                <div class="account-details">
                  <div class="account-name">${account.name}</div>
                  <div class="account-type">صفحة فيسبوك</div>
                </div>
                <span class="account-status">متصل</span>
              </li>
            `;

            // Instagram account if available
            if (account.instagram) {

              pagesHtml += `
                <li>
                  <div class="account-icon ig-icon">
                    <i class="fab fa-instagram"></i>
                  </div>
                  <div class="account-details">
                    <div class="account-name">${account.instagram.name || account.instagram.username}</div>
                    <div class="account-type">حساب انستغرام${account.instagram.username ? ` (@${account.instagram.username})` : ''}</div>
                  </div>
                  <span class="account-status">متصل</span>
                </li>
              `;
            }
          });


          elements.facebookPagesList.innerHTML = pagesHtml;
        } else {

          elements.facebookPagesList.innerHTML = `
            <div class="alert alert-warning">
              <i class="fas fa-exclamation-triangle me-2"></i>
              لم يتم العثور على صفحات مرتبطة. يرجى التأكد من أن لديك صفحات على فيسبوك وأنك منحت الأذونات المطلوبة.
            </div>
          `;
        }

        // Show connection time if available
        if (accounts.connectedAt) {
          const connectionDate = new Date(accounts.connectedAt);
          const formattedDate = connectionDate.toLocaleDateString('ar-IQ') + ' ' +
                               connectionDate.toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' });

          // Add connection time info if container exists
          if (document.getElementById('facebook-pages-container')) {
            const connectionInfo = document.createElement('div');
            connectionInfo.className = 'text-muted small mt-3';
            connectionInfo.innerHTML = `<i class="fas fa-clock me-1"></i> تم الربط في: ${formattedDate}`;
            document.getElementById('facebook-pages-container').appendChild(connectionInfo);
          }
        }
      } else {
        elements.facebookNotConnected.style.display = 'block';
        elements.facebookConnected.style.display = 'none';
      }
    } catch (error) {
      showError('حدث خطأ أثناء تحميل الحسابات المرتبطة');
      console.error('Error loading connected accounts:', error);
    }
  };

  // Add chat message
  const addChatMessage = (message, type) => {
    const messageElement = document.createElement('div');
    messageElement.className = `${type}-message`;

    // Create message content element to handle text with line breaks
    const contentElement = document.createElement('div');
    contentElement.className = 'message-content';

    // Replace line breaks with <br> tags
    const formattedMessage = message.replace(/\n/g, '<br>');
    contentElement.innerHTML = formattedMessage;

    messageElement.appendChild(contentElement);

    if (type !== 'system') {
      const timeElement = document.createElement('span');
      timeElement.className = 'message-time';
      timeElement.textContent = new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' });
      messageElement.appendChild(timeElement);

      // Add message indicator
      const indicatorElement = document.createElement('div');
      indicatorElement.className = 'message-indicator';
      messageElement.appendChild(indicatorElement);
    }

    elements.chatMessages.appendChild(messageElement);
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;

    // Save message to local storage for conversation continuity
    saveMessageToLocalStorage(message, type);
  };

  // Save message to local storage
  const saveMessageToLocalStorage = (message, type) => {
    if (!state.user) return;

    // Get existing messages
    const storedMessages = localStorage.getItem(`chat_history_${state.user.id}`);
    let messages = storedMessages ? JSON.parse(storedMessages) : [];

    // Add new message
    messages.push({
      content: message,
      type: type === 'bot' ? 'ai' : type,
      timestamp: new Date().toISOString()
    });

    // Keep only the last 10 messages
    if (messages.length > 10) {
      messages = messages.slice(-10);
    }

    // Save back to local storage
    localStorage.setItem(`chat_history_${state.user.id}`, JSON.stringify(messages));
  };

  // Load chat history from local storage
  const loadChatHistory = () => {
    if (!state.user) return;

    // Clear existing messages
    elements.chatMessages.innerHTML = '';

    // Add system welcome message
    addChatMessage('مرحباً! أنا المساعد الآلي الخاص بك. يمكنك اختبار كيف سيتفاعل البوت مع عملائك هنا.', 'system');

    // Get stored messages
    const storedMessages = localStorage.getItem(`chat_history_${state.user.id}`);
    if (!storedMessages) return;

    const messages = JSON.parse(storedMessages);

    // Add messages to chat
    messages.forEach(msg => {
      const type = msg.type === 'ai' ? 'bot' : msg.type;
      if (type !== 'system') { // Skip system messages as we already added a welcome message
        addChatMessage(msg.content, type);
      }
    });
  };

  // Add typing indicator
  const addTypingIndicator = () => {
    const typingElement = document.createElement('div');
    typingElement.className = 'bot-message typing-indicator';
    typingElement.innerHTML = '<span>جاري الكتابة</span><span class="dot">.</span><span class="dot">.</span><span class="dot">.</span>';
    elements.chatMessages.appendChild(typingElement);
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
    return typingElement;
  };

  // Show error message
  const showError = (message) => {
    elements.errorMessage.textContent = message;
    elements.errorModal.show();
  };

  // Show success message
  const showSuccess = (message) => {
    // Create a toast notification
    const toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    toastContainer.style.zIndex = '5';

    const toast = document.createElement('div');
    toast.className = 'toast align-items-center text-white bg-success border-0';
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');

    const toastBody = document.createElement('div');
    toastBody.className = 'd-flex';

    const messageDiv = document.createElement('div');
    messageDiv.className = 'toast-body';
    messageDiv.textContent = message;

    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'btn-close btn-close-white me-2 m-auto';
    closeButton.setAttribute('data-bs-dismiss', 'toast');
    closeButton.setAttribute('aria-label', 'Close');

    toastBody.appendChild(messageDiv);
    toastBody.appendChild(closeButton);
    toast.appendChild(toastBody);
    toastContainer.appendChild(toast);
    document.body.appendChild(toastContainer);

    const bsToast = new bootstrap.Toast(toast, { delay: 3000 });
    bsToast.show();

    // Remove the toast container after it's hidden
    toast.addEventListener('hidden.bs.toast', () => {
      document.body.removeChild(toastContainer);
    });
  };

  // Contact Information Functions
  const loadContactInfo = async () => {
    try {
      const response = await api.get('/contact');
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
      showToast('خطأ في تحميل معلومات الاتصال', 'error');
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

      const response = await api.post('/contact', contactData);
      if (response.success) {
        showToast('تم حفظ معلومات الاتصال بنجاح', 'success');
        updateContactPreview(response.data);
      } else {
        showToast(response.message || 'خطأ في حفظ معلومات الاتصال', 'error');
      }
    } catch (error) {
      console.error('Error saving contact info:', error);
      showToast('خطأ في حفظ معلومات الاتصال', 'error');
    }
  };

  const updateContactPreview = (contact) => {
    if (!elements.contactPreview) return;

    let previewHtml = '<div class="small">';

    if (contact.phone) {
      previewHtml += `<p class="mb-1"><i class="fas fa-phone me-1"></i> ${contact.phone}</p>`;
    }

    if (contact.whatsapp) {
      previewHtml += `<p class="mb-1"><i class="fab fa-whatsapp me-1"></i> ${contact.whatsapp}</p>`;
    }

    if (contact.supportEmail) {
      previewHtml += `<p class="mb-1"><i class="fas fa-envelope me-1"></i> ${contact.supportEmail}</p>`;
    }

    if (contact.address) {
      previewHtml += `<p class="mb-1"><i class="fas fa-map-marker-alt me-1"></i> ${contact.address}</p>`;
    }

    if (contact.workingHours) {
      previewHtml += `<p class="mb-1"><i class="fas fa-clock me-1"></i> ${contact.workingHours}</p>`;
    }

    if (!contact.phone && !contact.whatsapp && !contact.supportEmail && !contact.address && !contact.workingHours) {
      previewHtml += '<p class="text-muted">لم يتم إدخال معلومات اتصال بعد</p>';
    }

    previewHtml += '</div>';
    elements.contactPreview.innerHTML = previewHtml;

    // Update footer contact info
    updateFooterContactInfo(contact);
  };

  const updateFooterContactInfo = (contact) => {
    // Update footer contact information
    const footerEmail = document.getElementById('footer-email');
    const footerPhone = document.getElementById('footer-phone');
    const footerAddress = document.getElementById('footer-address');
    const footerHours = document.getElementById('footer-hours');
    const footerHoursItem = document.getElementById('footer-hours-item');

    if (footerEmail && contact.supportEmail) {
      footerEmail.textContent = contact.supportEmail;
    }

    if (footerPhone && contact.phone) {
      footerPhone.textContent = contact.phone;
    }

    if (footerAddress && contact.address) {
      footerAddress.textContent = contact.address;
    }

    if (footerHours && footerHoursItem && contact.workingHours) {
      footerHours.textContent = contact.workingHours;
      footerHoursItem.style.display = 'list-item';
    }
  };

  // Load footer contact info on page load
  const loadFooterContactInfo = async () => {
    try {
      if (state.isAuthenticated) {
        const response = await api.get('/contact');
        if (response.success) {
          updateFooterContactInfo(response.data);
        }
      }
    } catch (error) {
      // Silently fail - footer will use default values
    }
  };

  // Contact info event listeners moved to admin panel



  // Initialize the application
  init();
});
