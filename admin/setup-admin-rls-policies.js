/**
 * @fileoverview Script to set up Row Level Security policies for admin interface
 * Configures policies to:
 * - Keep read access for all users
 * - Restrict write operations (INSERT/UPDATE/DELETE) to authenticated users only
 * @version 1.0.0
 */

document.addEventListener('DOMContentLoaded', async function() {
  const results = document.getElementById('results');
  const updateButton = document.getElementById('update-policies');
  
  // Disable button until auth is initialized
  if (updateButton) {
    updateButton.disabled = true;
  }
  
  /**
   * Logs results to the UI
   * @param {string} operation - The operation being performed
   * @param {boolean} success - Whether the operation was successful
   * @param {string} message - The message to display
   * @param {string} details - Additional details to display
   */
  function logResult(operation, success, message, details = '') {
    const div = document.createElement('div');
    div.className = `p-4 mb-4 rounded ${success ? 'bg-green-900/20' : 'bg-red-900/20'}`;
    div.innerHTML = `
      <div class="flex items-center">
        <i class="fas ${success ? 'fa-check text-green-500' : 'fa-times text-red-500'} mr-2"></i>
        <div>
          <p class="font-bold ${success ? 'text-green-500' : 'text-red-500'}">${operation}</p>
          <p class="text-sm text-gray-300">${message}</p>
          ${details ? `<pre class="mt-2 text-xs text-gray-400 overflow-x-auto">${details}</pre>` : ''}
        </div>
      </div>
    `;
    results.appendChild(div);
    
    // Scroll to bottom of results
    results.scrollTop = results.scrollHeight;
  }
  
  /**
   * Initializes the UI
   */
  function initUI() {
    if (!updateButton) return;
    
    // Enable button if user is authenticated
    if (window.Auth && window.Auth.isAuthenticated()) {
      updateButton.disabled = false;
      
      // Add click event listener
      updateButton.addEventListener('click', updateRLSPolicies);
    } else {
      // Show authentication required message
      logResult(
        'Authentication Required',
        false,
        'You must be logged in to update RLS policies',
        'Please sign in using the authentication page first'
      );
    }
  }
  
  /**
   * Updates RLS policies for the events and groups tables
   */
  async function updateRLSPolicies() {
    if (!window.Auth || !window.Auth.isAuthenticated()) {
      logResult(
        'Authentication Required',
        false,
        'You must be logged in to update RLS policies',
        'Please sign in using the authentication page first'
      );
      return;
    }
    
    try {
      // Disable button during update
      if (updateButton) {
        updateButton.disabled = true;
      }
      
      logResult('RLS Setup', true, 'Starting RLS configuration update...');
      
      // Step 1: First, drop any existing test policies that allow unrestricted access
      await dropExistingTestPolicies();
      
      // Step 2: Create new policies for groups table
      const groupsPolicies = [
        {
          name: 'Allow read access for all users',
          command: `
            CREATE POLICY "Allow read access for all users"
            ON public.groups
            FOR SELECT
            USING (true)
          `
        },
        {
          name: 'Allow insert for authenticated users',
          command: `
            CREATE POLICY "Allow insert for authenticated users"
            ON public.groups
            FOR INSERT
            WITH CHECK (auth.role() = 'authenticated')
          `
        },
        {
          name: 'Allow update for authenticated users',
          command: `
            CREATE POLICY "Allow update for authenticated users"
            ON public.groups
            FOR UPDATE
            USING (auth.role() = 'authenticated')
          `
        },
        {
          name: 'Allow delete for authenticated users',
          command: `
            CREATE POLICY "Allow delete for authenticated users"
            ON public.groups
            FOR DELETE
            USING (auth.role() = 'authenticated')
          `
        }
      ];
      
      // Step 3: Create new policies for events table
      const eventsPolicies = [
        {
          name: 'Allow read access for all users',
          command: `
            CREATE POLICY "Allow read access for all users"
            ON public.events
            FOR SELECT
            USING (true)
          `
        },
        {
          name: 'Allow insert for authenticated users',
          command: `
            CREATE POLICY "Allow insert for authenticated users"
            ON public.events
            FOR INSERT
            WITH CHECK (auth.role() = 'authenticated')
          `
        },
        {
          name: 'Allow update for authenticated users',
          command: `
            CREATE POLICY "Allow update for authenticated users"
            ON public.events
            FOR UPDATE
            USING (auth.role() = 'authenticated')
          `
        },
        {
          name: 'Allow delete for authenticated users',
          command: `
            CREATE POLICY "Allow delete for authenticated users"
            ON public.events
            FOR DELETE
            USING (auth.role() = 'authenticated')
          `
        }
      ];
      
      // Step 4: Apply groups policies
      logResult('Groups Policies', true, 'Applying new groups table policies...');
      for (const policy of groupsPolicies) {
        const { error } = await supabase.rpc('apply_policy', {
          table_name: 'groups',
          policy_name: policy.name,
          policy_command: policy.command
        });
        
        if (error) {
          logResult(
            'Groups Policy',
            false,
            `Failed to create policy: ${policy.name}`,
            error.message
          );
        } else {
          logResult(
            'Groups Policy',
            true,
            `Successfully created policy: ${policy.name}`
          );
        }
      }
      
      // Step 5: Apply events policies
      logResult('Events Policies', true, 'Applying new events table policies...');
      for (const policy of eventsPolicies) {
        const { error } = await supabase.rpc('apply_policy', {
          table_name: 'events',
          policy_name: policy.name,
          policy_command: policy.command
        });
        
        if (error) {
          logResult(
            'Events Policy',
            false,
            `Failed to create policy: ${policy.name}`,
            error.message
          );
        } else {
          logResult(
            'Events Policy',
            true,
            `Successfully created policy: ${policy.name}`
          );
        }
      }
      
      // Final success message
      logResult(
        'RLS Configuration Complete',
        true,
        'Successfully configured RLS policies',
        'All necessary policies have been updated to restrict write operations to authenticated users only'
      );
      
    } catch (error) {
      logResult(
        'Error',
        false,
        'Failed to configure RLS policies',
        `Error: ${error.message}\nDetails: ${JSON.stringify(error, null, 2)}`
      );
    } finally {
      // Re-enable button after update
      if (updateButton) {
        updateButton.disabled = false;
      }
    }
  }
  
  /**
   * Drops existing test policies that allow unrestricted access
   */
  async function dropExistingTestPolicies() {
    // Policies to drop
    const policiesToDrop = [
      { table: 'groups', name: 'Enable read access for all users' },
      { table: 'groups', name: 'Enable insert for testing' },
      { table: 'groups', name: 'Enable delete for testing' },
      { table: 'events', name: 'Enable read access for all users' },
      { table: 'events', name: 'Enable insert for testing' },
      { table: 'events', name: 'Enable delete for testing' }
    ];
    
    logResult('Policy Cleanup', true, 'Dropping existing test policies...');
    
    for (const policy of policiesToDrop) {
      try {
        const { error } = await supabase.rpc('drop_policy', {
          table_name: policy.table,
          policy_name: policy.name
        });
        
        if (error && !error.message.includes('does not exist')) {
          logResult(
            'Policy Cleanup',
            false,
            `Failed to drop policy: ${policy.name}`,
            error.message
          );
        } else {
          logResult(
            'Policy Cleanup',
            true,
            `Successfully dropped policy: ${policy.name}`
          );
        }
      } catch (error) {
        // Only log as error if it's not a "policy does not exist" error
        if (!error.message.includes('does not exist')) {
          logResult(
            'Policy Cleanup',
            false,
            `Failed to drop policy: ${policy.name}`,
            error.message
          );
        }
      }
    }
  }
  
  // Check if Auth module is available
  if (window.Auth) {
    // Set up auth state change listener
    window.Auth.addEventListener('onAuthStateChange', (state) => {
      if (state.user) {
        // User is authenticated, enable the button
        if (updateButton) {
          updateButton.disabled = false;
        }
      } else {
        // User is not authenticated, disable the button
        if (updateButton) {
          updateButton.disabled = true;
        }
      }
    });
    
    // Initialize UI based on current auth state
    initUI();
  } else {
    logResult(
      'Auth Module Not Found',
      false,
      'The Auth module is not available',
      'Please ensure that auth.js is included before this script'
    );
  }
});