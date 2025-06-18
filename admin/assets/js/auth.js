/**
 * @fileoverview Supabase authentication utilities for admin interface
 * Handles user authentication, session management, and error handling
 * @version 1.0.0
 */

/**
 * @typedef {Object} AuthState
 * @property {Object|null} user - The current authenticated user
 * @property {string|null} session - The current session
 * @property {boolean} loading - Whether authentication is in progress
 * @property {string|null} error - Error message if authentication failed
 */

/** @type {AuthState} */
let authState = {
  user: null,
  session: null,
  loading: true,
  error: null
};

/**
 * @typedef {Object} AuthEventListeners
 * @property {Function[]} onAuthStateChange - Listeners for auth state changes
 * @property {Function[]} onLogin - Listeners for login events
 * @property {Function[]} onLogout - Listeners for logout events
 * @property {Function[]} onError - Listeners for error events
 */

/** @type {AuthEventListeners} */
const listeners = {
  onAuthStateChange: [],
  onLogin: [],
  onLogout: [],
  onError: []
};

/**
 * Initializes authentication and sets up event listeners
 * @async
 * @returns {Promise<void>}
 */
async function initializeAuth() {
  try {
    // Check if Supabase client is available
    if (!window.supabase) {
      throw new Error('Supabase client is not initialized. Please include supabase-config.js first.');
    }

    // Set up auth state change listener
    window.supabase.auth.onAuthStateChange((event, session) => {
      console.log('[Auth] Auth state change event:', event, 'Session:', session ? 'exists' : 'null');
      handleAuthStateChange(event, session);
    });

    // Get initial session
    await refreshAuthState();
    
    console.log('Auth system initialized successfully');
  } catch (error) {
    console.error('Auth initialization error:', error);
    updateAuthState({ error: error.message });
  }
}

/**
 * Refreshes the current authentication state
 * @async
 * @returns {Promise<AuthState>} The updated auth state
 */
async function refreshAuthState() {
  try {
    console.log('[Auth] Refreshing auth state...');
    updateAuthState({ loading: true, error: null });
    
    const { data, error } = await window.supabase.auth.getSession();
    
    console.log('[Auth] Get session result:', {
      hasData: !!data,
      hasSession: !!data?.session,
      hasUser: !!data?.session?.user,
      accessToken: !!data?.session?.access_token,
      expiresAt: data?.session?.expires_at,
      error: error?.message
    });
    
    if (error) {
      throw error;
    }
    
    if (data?.session) {
      // Check token expiration
      const tokenExpiry = data.session.expires_at * 1000; // Convert to milliseconds
      const now = Date.now();
      const timeUntilExpiry = tokenExpiry - now;
      
      console.log('[Auth] Token status:', {
        expiresAt: new Date(tokenExpiry).toISOString(),
        timeUntilExpiry: Math.floor(timeUntilExpiry / 1000) + ' seconds',
        isExpired: timeUntilExpiry <= 0
      });

      if (timeUntilExpiry <= 0) {
        console.log('[Auth] Token expired, clearing state');
        updateAuthState({
          user: null,
          session: null,
          loading: false,
          error: 'Session expired'
        });
      } else {
        updateAuthState({
          user: data.session.user,
          session: data.session,
          loading: false
        });
      }
    } else {
      console.log('[Auth] No session found');
      updateAuthState({
        user: null,
        session: null,
        loading: false
      });
    }
    
    return getAuthState();
  } catch (error) {
    console.error('Failed to refresh auth state:', error);
    updateAuthState({ 
      error: error.message,
      loading: false
    });
    return getAuthState();
  }
}

/**
 * Handles authentication state changes
 * @param {string} event - The auth event type
 * @param {Object} session - The current session
 * @private
 */
function handleAuthStateChange(event, session) {
  console.log('[Auth] Auth state changed:', event, 'Session details:', {
    hasUser: !!session?.user,
    accessToken: !!session?.access_token,
    expiresAt: session?.expires_at
  });
  
  // Update internal state
  if (event === 'SIGNED_IN') {
    updateAuthState({ 
      user: session.user,
      session: session,
      loading: false
    });
    
    // Notify login listeners
    notifyListeners('onLogin', session.user);
  } 
  else if (event === 'SIGNED_OUT') {
    updateAuthState({ 
      user: null,
      session: null,
      loading: false
    });
    
    // Notify logout listeners
    notifyListeners('onLogout');
  }
  
  // Notify general state change listeners
  notifyListeners('onAuthStateChange', getAuthState());
}

/**
 * Updates the authentication state
 * @param {Partial<AuthState>} newState - The state properties to update
 * @private
 */
function updateAuthState(newState) {
  authState = { ...authState, ...newState };
  
  // If there's an error, notify error listeners
  if (newState.error) {
    notifyListeners('onError', newState.error);
  }
}

/**
 * Gets the current authentication state
 * @returns {AuthState} The current auth state
 */
function getAuthState() {
  return { ...authState };
}

/**
 * Notifies all listeners of a specific event type
 * @param {keyof AuthEventListeners} eventType - The type of event
 * @param {any} data - The event data
 * @private
 */
function notifyListeners(eventType, data) {
  listeners[eventType].forEach(listener => {
    try {
      listener(data);
    } catch (error) {
      console.error(`Error in ${eventType} listener:`, error);
    }
  });
}

/**
 * Adds an event listener
 * @param {keyof AuthEventListeners} eventType - The type of event
 * @param {Function} callback - The callback function
 * @returns {Function} A function to remove the listener
 */
function addEventListener(eventType, callback) {
  // Handle browser standard events like visibilitychange
  if (eventType === 'visibilitychange') {
    // Delegate to the standard browser event system
    document.addEventListener('visibilitychange', callback);
    // Return a function to remove the listener
    return () => document.removeEventListener('visibilitychange', callback);
  }
  
  if (!listeners[eventType]) {
    console.warn(`Unsupported auth event type: ${eventType}`);
    return () => {};
  }
  
  listeners[eventType].push(callback);
  
  // Return a function to remove the listener
  return () => {
    const index = listeners[eventType].indexOf(callback);
    if (index !== -1) {
      listeners[eventType].splice(index, 1);
    }
  };
}

/**
 * Signs in a user with email and password
 * @async
 * @param {string} email - The user's email
 * @param {string} password - The user's password
 * @returns {Promise<Object>} The result of the sign-in attempt
 */
async function signInWithEmail(email, password) {
  try {
    console.log('[Auth] Attempting sign in...');
    updateAuthState({ loading: true, error: null });
    
    const { data, error } = await window.supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      throw error;
    }
    
    updateAuthState({ 
      user: data.user,
      session: data.session,
      loading: false
    });
    
    return { user: data.user, success: true };
  } catch (error) {
    console.error('Sign in error:', error);
    updateAuthState({ 
      error: error.message,
      loading: false
    });
    
    return { error: error.message, success: false };
  }
}

/**
 * Signs out the current user
 * @async
 * @returns {Promise<Object>} The result of the sign-out attempt
 */
async function signOut() {
  try {
    updateAuthState({ loading: true, error: null });
    
    const { error } = await window.supabase.auth.signOut();
    
    if (error) {
      throw error;
    }
    
    updateAuthState({ 
      user: null,
      session: null,
      loading: false
    });
    
    return { success: true };
  } catch (error) {
    console.error('Sign out error:', error);
    updateAuthState({ 
      error: error.message,
      loading: false 
    });
    
    return { error: error.message, success: false };
  }
}

/**
 * Checks if the user is authenticated
 * @returns {boolean} True if the user is authenticated
 */
function isAuthenticated() {
  return !!authState.user;
}

/**
 * Gets the current authenticated user
 * @returns {Object|null} The current user or null if not authenticated
 */
function getCurrentUser() {
  return authState.user;
}

/**
 * Gets the current session
 * @returns {Object|null} The current session or null if not authenticated
 */
function getCurrentSession() {
  return authState.session;
}

/**
 * Gets the current JWT token
 * @returns {string|null} The current JWT token or null if not authenticated
 */
function getToken() {
  return authState.session?.access_token || null;
}

/**
 * Resets the password for a user
 * @async
 * @param {string} email - The user's email
 * @returns {Promise<Object>} The result of the password reset attempt
 */
async function resetPassword(email) {
  try {
    updateAuthState({ loading: true, error: null });
    
    const { error } = await window.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/admin/auth/reset-password.html',
    });
    
    if (error) {
      throw error;
    }
    
    updateAuthState({ loading: false });
    
    return { success: true, message: 'Password reset email sent' };
  } catch (error) {
    console.error('Password reset error:', error);
    updateAuthState({ 
      error: error.message,
      loading: false 
    });
    
    return { error: error.message, success: false };
  }
}

/**
 * Updates the user's password
 * @async
 * @param {string} newPassword - The new password
 * @returns {Promise<Object>} The result of the password update attempt
 */
async function updatePassword(newPassword) {
  try {
    updateAuthState({ loading: true, error: null });
    
    const { error } = await window.supabase.auth.updateUser({
      password: newPassword
    });
    
    if (error) {
      throw error;
    }
    
    updateAuthState({ loading: false });
    
    return { success: true, message: 'Password updated successfully' };
  } catch (error) {
    console.error('Password update error:', error);
    updateAuthState({ 
      error: error.message,
      loading: false 
    });
    
    return { error: error.message, success: false };
  }
}

// Initialize auth when the script loads
document.addEventListener('DOMContentLoaded', initializeAuth);

// Export API
window.Auth = {
  // State management
  getState: getAuthState,
  refresh: refreshAuthState,
  
  // Event listeners
  addEventListener,
  
  // Authentication methods
  signIn: signInWithEmail,
  signOut,
  resetPassword,
  updatePassword,
  
  // Helper methods
  isAuthenticated,
  getCurrentUser,
  getCurrentSession,
  getToken,
  
  // Debug info
  _debugState: () => {
    console.log('[Auth Debug] Current state:', {
      authState,
      listeners,
      isAuthenticated: isAuthenticated(),
      currentUser: getCurrentUser(),
      hasSession: !!getCurrentSession()
    });
  }
};

// Log initial state after setup
console.log('[Auth] Module initialized');