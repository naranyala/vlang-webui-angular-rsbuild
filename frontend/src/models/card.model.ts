export interface Card {
  id: number;
  title: string;
  description: string;
  icon: string;
  color: string;
  content: string;
}

export interface CardItem {
  title: string;
  description: string;
  icon: string;
  color: string;
  content: string;
  link?: string;
}

export interface WindowEntry {
  id: string;
  title: string;
  minimized: boolean;
  focused: boolean;
}

export interface BottomPanelTab {
  id: string;
  label: string;
  icon: string;
  content: string;
}

export interface SearchResult {
  query: string;
  results: Card[];
}

export const TECH_CARDS: Card[] = [
  {
    id: 1,
    title: 'Login / Register',
    description: 'Access your account or create a new one',
    icon: '🔐',
    color: '#667eea',
    content: `
      <div class="auth-container">
        <div class="auth-tabs">
          <button class="auth-tab active" data-tab="login">Login</button>
          <button class="auth-tab" data-tab="register">Register</button>
        </div>

        <!-- Login Form -->
        <div class="auth-form-container active" id="login-form">
          <form class="auth-form" onsubmit="handleLogin(event)">
            <div class="form-group">
              <label for="login-email">Email</label>
              <input type="email" id="login-email" placeholder="Enter your email" required />
            </div>
            <div class="form-group">
              <label for="login-password">Password</label>
              <input type="password" id="login-password" placeholder="Enter your password" required />
            </div>
            <div class="form-options">
              <label class="checkbox-label">
                <input type="checkbox" id="remember-me" />
                <span>Remember me</span>
              </label>
              <a href="#" class="forgot-link">Forgot password?</a>
            </div>
            <button type="submit" class="btn-primary">Sign In</button>
          </form>
        </div>

        <!-- Register Form -->
        <div class="auth-form-container" id="register-form">
          <form class="auth-form" onsubmit="handleRegister(event)">
            <div class="form-group">
              <label for="register-name">Full Name</label>
              <input type="text" id="register-name" placeholder="Enter your name" required />
            </div>
            <div class="form-group">
              <label for="register-email">Email</label>
              <input type="email" id="register-email" placeholder="Enter your email" required />
            </div>
            <div class="form-group">
              <label for="register-password">Password</label>
              <input type="password" id="register-password" placeholder="Create a password" required minlength="6" />
            </div>
            <div class="form-group">
              <label for="register-confirm">Confirm Password</label>
              <input type="password" id="register-confirm" placeholder="Confirm your password" required minlength="6" />
            </div>
            <div class="form-options">
              <label class="checkbox-label">
                <input type="checkbox" id="agree-terms" required />
                <span>I agree to the Terms & Conditions</span>
              </label>
            </div>
            <button type="submit" class="btn-primary">Create Account</button>
          </form>
        </div>

        <div class="auth-divider">
          <span>or continue with</span>
        </div>

        <div class="social-login">
          <button class="btn-social btn-google">
            <span class="social-icon">G</span> Google
          </button>
          <button class="btn-social btn-github">
            <span class="social-icon">⌘</span> GitHub
          </button>
        </div>
      </div>

      <script>
        function handleLogin(event) {
          event.preventDefault();
          const email = document.getElementById('login-email').value;
          const password = document.getElementById('login-password').value;
          console.log('Login attempt:', { email, password });
          alert('Login attempted with: ' + email);
        }

        function handleRegister(event) {
          event.preventDefault();
          const name = document.getElementById('register-name').value;
          const email = document.getElementById('register-email').value;
          const password = document.getElementById('register-password').value;
          const confirm = document.getElementById('register-confirm').value;

          if (password !== confirm) {
            alert('Passwords do not match!');
            return;
          }
          console.log('Register attempt:', { name, email, password });
          alert('Registration attempted for: ' + email);
        }

        // Tab switching
        document.querySelectorAll('.auth-tab').forEach(tab => {
          tab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.auth-form-container').forEach(f => f.classList.remove('active'));
            this.classList.add('active');
            document.getElementById(tabName + '-form').classList.add('active');
          });
        });
      <\/script>
    `,
  },
  {
    id: 2,
    title: 'SQLite CRUD Demo',
    description: 'Complete CRUD operations with Vlang SQLite integration',
    icon: '🗄️',
    color: '#003b52',
    content: `
      <div class="sqlite-crud-container">
        <div class="crud-header">
          <h2 class="crud-title">📊 User Management</h2>
          <div class="crud-actions">
            <button class="btn-refresh" onclick="loadUsers()" title="Refresh data">
              <span class="icon">🔄</span>
            </button>
            <button class="btn-add" onclick="showAddModal()" title="Add new user">
              <span class="icon">➕</span> Add User
            </button>
          </div>
        </div>

        <!-- Stats Cards -->
        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-value" id="total-users">0</span>
            <span class="stat-label">Total Users</span>
          </div>
          <div class="stat-card">
            <span class="stat-value" id="active-users">0</span>
            <span class="stat-label">Active</span>
          </div>
          <div class="stat-card">
            <span class="stat-value" id="inactive-users">0</span>
            <span class="stat-label">Inactive</span>
          </div>
        </div>

        <!-- Search and Filter -->
        <div class="crud-toolbar">
          <div class="search-box">
            <span class="search-icon">🔍</span>
            <input type="text" id="user-search" placeholder="Search users..." oninput="searchUsers()" />
          </div>
          <div class="filter-box">
            <select id="status-filter" onchange="filterUsers()">
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <!-- Data Table -->
        <div class="table-container">
          <table class="crud-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="users-table-body">
              <tr class="loading-row">
                <td colspan="7">Loading data...</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="pagination">
          <button class="btn-page" onclick="previousPage()" id="btn-prev">← Prev</button>
          <span class="page-info" id="page-info">Page 1 of 1</span>
          <button class="btn-page" onclick="nextPage()" id="btn-next">Next →</button>
        </div>

        <!-- Add/Edit Modal -->
        <div class="modal-overlay" id="user-modal">
          <div class="modal-content">
            <div class="modal-header">
              <h3 id="modal-title">Add New User</h3>
              <button class="btn-close" onclick="closeModal()">✕</button>
            </div>
            <form class="modal-form" onsubmit="saveUser(event)">
              <input type="hidden" id="user-id" />
              <div class="form-row">
                <div class="form-group">
                  <label for="user-name">Name *</label>
                  <input type="text" id="user-name" placeholder="Enter name" required />
                </div>
                <div class="form-group">
                  <label for="user-email">Email *</label>
                  <input type="email" id="user-email" placeholder="Enter email" required />
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label for="user-role">Role</label>
                  <select id="user-role">
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="moderator">Moderator</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="user-status">Status</label>
                  <select id="user-status">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label for="user-password">Password</label>
                  <input type="password" id="user-password" placeholder="Leave blank to keep unchanged" />
                </div>
              </div>
              <div class="modal-actions">
                <button type="button" class="btn-cancel" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn-save">Save User</button>
              </div>
            </form>
          </div>
        </div>

        <!-- Delete Confirmation Modal -->
        <div class="modal-overlay" id="delete-modal">
          <div class="modal-content modal-sm">
            <div class="modal-header">
              <h3>Confirm Delete</h3>
              <button class="btn-close" onclick="closeDeleteModal()">✕</button>
            </div>
            <div class="modal-body">
              <p>Are you sure you want to delete user <strong id="delete-user-name"></strong>?</p>
              <p class="warning-text">This action cannot be undone.</p>
            </div>
            <div class="modal-actions">
              <button type="button" class="btn-cancel" onclick="closeDeleteModal()">Cancel</button>
              <button type="button" class="btn-delete" onclick="confirmDelete()">Delete</button>
            </div>
          </div>
        </div>

        <!-- Toast Notification -->
        <div class="toast" id="toast">
          <span class="toast-icon" id="toast-icon">✓</span>
          <span class="toast-message" id="toast-message">Operation successful</span>
        </div>
      </div>

      <script>
        // SQLite CRUD Demo - Client-side logic
        let users = [];
        let filteredUsers = [];
        let currentPage = 1;
        const pageSize = 10;
        let deleteUserId = null;

        // Initialize
        document.addEventListener('DOMContentLoaded', function() {
          loadUsers();
        });

        // Load users from Vlang backend
        function loadUsers() {
          showLoading();
          
          // Call Vlang backend via WebUI
          if (window.webui) {
            window.webui.call('get_users').then(function(response) {
              users = JSON.parse(response || '[]');
              filteredUsers = [...users];
              updateStats();
              renderTable();
              hideLoading();
            }).catch(function(err) {
              console.error('Error loading users:', err);
              // Use demo data for display purposes
              useDemoData();
            });
          } else {
            // Fallback to demo data
            useDemoData();
          }
        }

        // Demo data for visualization
        function useDemoData() {
          users = [
            { id: 1, name: 'John Doe', email: 'john@example.com', role: 'admin', status: 'active', created_at: '2024-01-15' },
            { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'user', status: 'active', created_at: '2024-02-20' },
            { id: 3, name: 'Bob Wilson', email: 'bob@example.com', role: 'moderator', status: 'inactive', created_at: '2024-03-10' },
            { id: 4, name: 'Alice Brown', email: 'alice@example.com', role: 'user', status: 'active', created_at: '2024-04-05' },
            { id: 5, name: 'Charlie Davis', email: 'charlie@example.com', role: 'user', status: 'active', created_at: '2024-05-12' },
          ];
          filteredUsers = [...users];
          updateStats();
          renderTable();
          hideLoading();
          showToast('Using demo data', 'info');
        }

        // Update statistics
        function updateStats() {
          document.getElementById('total-users').textContent = users.length;
          document.getElementById('active-users').textContent = users.filter(u => u.status === 'active').length;
          document.getElementById('inactive-users').textContent = users.filter(u => u.status === 'inactive').length;
        }

        // Render table
        function renderTable() {
          const tbody = document.getElementById('users-table-body');
          const start = (currentPage - 1) * pageSize;
          const end = start + pageSize;
          const pageData = filteredUsers.slice(start, end);

          if (pageData.length === 0) {
            tbody.innerHTML = '<tr class="empty-row"><td colspan="7">No users found</td></tr>';
            return;
          }

          tbody.innerHTML = pageData.map(user => \`
            <tr>
              <td>\${user.id}</td>
              <td><div class="user-name">\${user.name}</div></td>
              <td>\${user.email}</td>
              <td><span class="badge badge-role">\${user.role}</span></td>
              <td><span class="badge badge-\${user.status}">\${user.status}</span></td>
              <td>\${user.created_at || 'N/A'}</td>
              <td>
                <div class="action-buttons">
                  <button class="btn-action btn-edit" onclick="editUser(\${user.id})" title="Edit">✏️</button>
                  <button class="btn-action btn-delete" onclick="deleteUser(\${user.id}, '\${user.name}')" title="Delete">🗑️</button>
                </div>
              </td>
            </tr>
          \`).join('');

          updatePagination();
        }

        // Update pagination
        function updatePagination() {
          const totalPages = Math.ceil(filteredUsers.length / pageSize) || 1;
          document.getElementById('page-info').textContent = \`Page \${currentPage} of \${totalPages}\`;
          document.getElementById('btn-prev').disabled = currentPage <= 1;
          document.getElementById('btn-next').disabled = currentPage >= totalPages;
        }

        // Pagination handlers
        function previousPage() {
          if (currentPage > 1) {
            currentPage--;
            renderTable();
          }
        }

        function nextPage() {
          const totalPages = Math.ceil(filteredUsers.length / pageSize);
          if (currentPage < totalPages) {
            currentPage++;
            renderTable();
          }
        }

        // Search
        function searchUsers() {
          const query = document.getElementById('user-search').value.toLowerCase();
          const statusFilter = document.getElementById('status-filter').value;
          
          filteredUsers = users.filter(user => {
            const matchesSearch = !query || 
              user.name.toLowerCase().includes(query) || 
              user.email.toLowerCase().includes(query);
            const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
            return matchesSearch && matchesStatus;
          });
          
          currentPage = 1;
          renderTable();
        }

        // Filter
        function filterUsers() {
          searchUsers();
        }

        // Show add modal
        function showAddModal() {
          document.getElementById('modal-title').textContent = 'Add New User';
          document.getElementById('user-id').value = '';
          document.getElementById('user-name').value = '';
          document.getElementById('user-email').value = '';
          document.getElementById('user-role').value = 'user';
          document.getElementById('user-status').value = 'active';
          document.getElementById('user-password').value = '';
          document.getElementById('user-modal').classList.add('active');
        }

        // Edit user
        function editUser(id) {
          const user = users.find(u => u.id === id);
          if (!user) return;

          document.getElementById('modal-title').textContent = 'Edit User';
          document.getElementById('user-id').value = user.id;
          document.getElementById('user-name').value = user.name;
          document.getElementById('user-email').value = user.email;
          document.getElementById('user-role').value = user.role;
          document.getElementById('user-status').value = user.status;
          document.getElementById('user-password').value = '';
          document.getElementById('user-modal').classList.add('active');
        }

        // Save user (Create/Update)
        function saveUser(event) {
          event.preventDefault();
          
          const userData = {
            id: document.getElementById('user-id').value || null,
            name: document.getElementById('user-name').value,
            email: document.getElementById('user-email').value,
            role: document.getElementById('user-role').value,
            status: document.getElementById('user-status').value,
            password: document.getElementById('user-password').value || null
          };

          if (window.webui) {
            window.webui.call('save_user', JSON.stringify(userData)).then(function(response) {
              showToast(userData.id ? 'User updated successfully' : 'User created successfully', 'success');
              closeModal();
              loadUsers();
            }).catch(function(err) {
              console.error('Error saving user:', err);
              // Optimistic update for demo
              if (!userData.id) {
                userData.id = Math.max(...users.map(u => u.id), 0) + 1;
                userData.created_at = new Date().toISOString().split('T')[0];
                users.push(userData);
              } else {
                const index = users.findIndex(u => u.id == userData.id);
                if (index >= 0) users[index] = { ...users[index], ...userData };
              }
              filteredUsers = [...users];
              updateStats();
              renderTable();
              showToast(userData.id ? 'User updated (demo)' : 'User created (demo)', 'success');
              closeModal();
            });
          } else {
            // Demo mode
            if (!userData.id) {
              userData.id = Math.max(...users.map(u => u.id), 0) + 1;
              userData.created_at = new Date().toISOString().split('T')[0];
              users.push(userData);
            } else {
              const index = users.findIndex(u => u.id == userData.id);
              if (index >= 0) users[index] = { ...users[index], ...userData };
            }
            filteredUsers = [...users];
            updateStats();
            renderTable();
            showToast(userData.id ? 'User updated (demo)' : 'User created (demo)', 'success');
            closeModal();
          }
        }

        // Close modal
        function closeModal() {
          document.getElementById('user-modal').classList.remove('active');
        }

        // Delete user
        function deleteUser(id, name) {
          deleteUserId = id;
          document.getElementById('delete-user-name').textContent = name;
          document.getElementById('delete-modal').classList.add('active');
        }

        // Close delete modal
        function closeDeleteModal() {
          document.getElementById('delete-modal').classList.remove('active');
          deleteUserId = null;
        }

        // Confirm delete
        function confirmDelete() {
          if (!deleteUserId) return;

          if (window.webui) {
            window.webui.call('delete_user', String(deleteUserId)).then(function() {
              showToast('User deleted successfully', 'success');
              closeDeleteModal();
              loadUsers();
            }).catch(function(err) {
              console.error('Error deleting user:', err);
              // Optimistic delete for demo
              users = users.filter(u => u.id !== deleteUserId);
              filteredUsers = [...users];
              updateStats();
              renderTable();
              showToast('User deleted (demo)', 'success');
              closeDeleteModal();
            });
          } else {
            // Demo mode
            users = users.filter(u => u.id !== deleteUserId);
            filteredUsers = [...users];
            updateStats();
            renderTable();
            showToast('User deleted (demo)', 'success');
            closeDeleteModal();
          }
        }

        // Utility functions
        function showLoading() {
          document.getElementById('users-table-body').innerHTML = 
            '<tr class="loading-row"><td colspan="7">Loading data...</td></tr>';
        }

        function hideLoading() {
          // Table is rendered with data
        }

        function showToast(message, type = 'success') {
          const toast = document.getElementById('toast');
          const icon = document.getElementById('toast-icon');
          const msg = document.getElementById('toast-message');
          
          icon.textContent = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
          toast.className = 'toast toast-' + type;
          msg.textContent = message;
          toast.classList.add('active');
          
          setTimeout(() => {
            toast.classList.remove('active');
          }, 3000);
        }
      <\/script>
    `,
  },
];
