// Check if user is authenticated
function checkAuth() {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  if (!token || !user) {
    window.location.href = 'login.html';
    return false;
  }

  // Add token to all API requests
  fetch = window.fetch;
  window.fetch = function() {
    let args = Array.prototype.slice.call(arguments);
    if (args[1] && args[1].headers) {
      args[1].headers.Authorization = `Bearer ${token}`;
    } else if (args[1]) {
      args[1].headers = { Authorization: `Bearer ${token}` };
    } else {
      args[1] = { headers: { Authorization: `Bearer ${token}` } };
    }
    return fetch.apply(window, args);
  };

  return true;
}

// Add logout button to navigation
function addLogoutButton() {
  const user = JSON.parse(localStorage.getItem('user'));
  const nav = document.querySelector('nav') || document.createElement('nav');
  
  // Add user info and logout button
  const userInfo = document.createElement('div');
  userInfo.className = 'user-info';
  userInfo.innerHTML = `
    <span>Welcome, ${user.firstName} ${user.lastName} (${user.role})</span>
    <button onclick="logout()">Logout</button>
  `;
  
  nav.appendChild(userInfo);
  
  if (!document.querySelector('nav')) {
    document.body.insertBefore(nav, document.body.firstChild);
  }

  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    nav {
      background-color: #f8f9fa;
      padding: 10px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 15px;
    }

    .user-info span {
      font-weight: bold;
    }

    .user-info button {
      padding: 5px 15px;
      background-color: #dc3545;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }

    .user-info button:hover {
      background-color: #c82333;
    }
  `;
  document.head.appendChild(style);
}

// Logout function
function logout() {
  fetch('/api/auth/logout', {
    method: 'POST'
  }).finally(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'logout.html';
  });
}

// Check role authorization
function checkRole(allowedRoles) {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user || !allowedRoles.includes(user.role)) {
    alert('You do not have permission to access this page');
    window.location.href = 'index.html';
    return false;
  }
  return true;
}

// Initialize auth on page load
document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname.endsWith('login.html') || 
      window.location.pathname.endsWith('signup.html') ||
      window.location.pathname.endsWith('logout.html')) {
    return;
  }
  
  if (checkAuth()) {
    addLogoutButton();
  }
});
