/**
 * @fileoverview Supabase client configuration and initialization with error handling
 * and connection status monitoring.
 * @version 1.2.0
 */

/** @type {string} The Supabase project URL */
const SUPABASE_URL = 'https://qfkxftmzrfpskdtlolos.supabase.co';

/** @type {string} The Supabase anonymous API key */
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFma3hmdG16cmZwc2tkdGxvbG9zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5Nzc4MTUsImV4cCI6MjA2NDU1MzgxNX0.oYw-bU8Vg4-NDaTubgxCY_8iOpBNvOh4l82XKCJrkDM';

/**
 * @typedef {Object} ConnectionStatus
 * @property {boolean} isConnected - Whether the client is connected
 * @property {Date} lastChecked - Timestamp of last connection check
 * @property {string} [error] - Error message if connection failed
 * @property {number} reconnectAttempts - Number of reconnection attempts
 */

/** @type {ConnectionStatus} */
let connectionStatus = {
  isConnected: false,
  lastChecked: new Date(),
  error: null,
  reconnectAttempts: 0
};

/**
 * Validates the Supabase URL format
 * @param {string} url - The URL to validate
 * @returns {boolean} True if URL is valid
 * @throws {Error} If URL format is invalid
 */
function validateUrl(url) {
  try {
    const urlObj = new URL(url);
    if (!urlObj.hostname.includes('supabase.co')) {
      throw new Error('Invalid Supabase URL domain');
    }
    return true;
  } catch (error) {
    throw new Error(`Invalid Supabase URL: ${error.message}`);
  }
}

/**
 * Validates the Supabase key format
 * @param {string} key - The key to validate
 * @returns {boolean} True if key is valid
 * @throws {Error} If key format is invalid
 */
function validateKey(key) {
  if (!/^eyJ[A-Za-z0-9-_]*\.[A-Za-z0-9-_]*\.[A-Za-z0-9-_]*$/.test(key)) {
    throw new Error('Invalid Supabase key format');
  }
  return true;
}

/**
 * Attempts to reconnect to Supabase
 * @param {Object} client - Supabase client instance
 * @returns {Promise<boolean>} True if reconnection successful
 * @private
 */
async function attemptReconnection(client) {
  const maxAttempts = 3;
  const backoffDelay = 1000; // 1 second

  while (connectionStatus.reconnectAttempts < maxAttempts) {
    try {
      connectionStatus.reconnectAttempts++;
      const { data, error } = await client
        .from('groups')
        .select('id')
        .limit(1);
      
      if (!error) {
        connectionStatus.isConnected = true;
        connectionStatus.error = null;
        connectionStatus.reconnectAttempts = 0;
        return true;
      }
      
      await new Promise(resolve => setTimeout(resolve, backoffDelay * connectionStatus.reconnectAttempts));
    } catch (error) {
      console.error('Reconnection attempt failed:', error);
    }
  }
  return false;
}

/**
 * Initializes the Supabase client with error handling
 * @returns {Object} The initialized Supabase client
 * @throws {Error} If initialization fails
 */
function initializeSupabase() {
  try {
    // Validate credentials
    validateUrl(SUPABASE_URL);
    validateKey(SUPABASE_ANON_KEY);
    
    // Enhanced config for GitHub Pages compatibility
    const config = {
      auth: {
        autoRefreshToken: true,
        persistSession: true
      },
      db: {
        schema: 'public'
      },
      global: {
        headers: {
          'x-testing-mode': 'true' // Custom header for test environment
        }
      }
    };
    
    // Add GitHub Pages specific headers if needed
    if (window.GITHUB_PAGES_DOMAIN) {
      console.log('Adding GitHub Pages specific configuration');
      config.global.headers['x-github-pages-domain'] = window.GITHUB_PAGES_DOMAIN;
    }
    
    const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, config);
    
    // Verify the client was created successfully
    if (!client) {
      throw new Error('Failed to create Supabase client');
    }
    
    return client;
  } catch (error) {
    console.error('Supabase initialization error:', error);
    connectionStatus.error = error.message;
    connectionStatus.isConnected = false;
    throw error;
  }
}

/**
 * Checks the connection status with Supabase
 * @async
 * @returns {Promise<boolean>} True if connected successfully
 */
async function checkConnection() {
  try {
    // Attempt a simple query to verify connection
    const { data, error } = await supabase
      .from('groups')
      .select('id')
      .limit(1);
      
    connectionStatus.lastChecked = new Date();
    
    if (error) {
      throw error;
    }
    
    connectionStatus.isConnected = true;
    connectionStatus.error = null;
    connectionStatus.reconnectAttempts = 0;
    return true;
  } catch (error) {
    console.error('Supabase connection error:', error);
    connectionStatus.isConnected = false;
    connectionStatus.error = error.message;
    
    // Attempt reconnection if not already trying
    if (connectionStatus.reconnectAttempts === 0) {
      console.log('Attempting to reconnect...');
      return attemptReconnection(supabase);
    }
    
    return false;
  }
}

/**
 * Gets the current connection status
 * @returns {ConnectionStatus} The current connection status
 */
function getConnectionStatus() {
  return { ...connectionStatus };
}

// Initialize the Supabase client
const supabase = initializeSupabase();

// Set up connection monitoring
setInterval(checkConnection, 60000); // Check connection every minute
checkConnection(); // Initial connection check

// Make functions and client globally available
window.supabase = supabase;
window.checkConnection = checkConnection;
window.getConnectionStatus = getConnectionStatus;