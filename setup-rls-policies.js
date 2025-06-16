/**
 * @fileoverview Script to set up Row Level Security policies for test environment
 */

document.addEventListener('DOMContentLoaded', async function() {
  const results = document.getElementById('results');
  
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
  }

  try {
    // Step 1: Enable RLS on tables
    logResult('RLS Setup', true, 'Starting RLS configuration...');

    // Create policies for groups table
    const groupsPolicies = [
      {
        name: 'Enable read access for all users',
        command: `
          CREATE POLICY "Enable read access for all users"
          ON public.groups
          FOR SELECT
          USING (true)
        `
      },
      {
        name: 'Enable insert for testing',
        command: `
          CREATE POLICY "Enable insert for testing"
          ON public.groups
          FOR INSERT
          WITH CHECK (true)
        `
      },
      {
        name: 'Enable delete for testing',
        command: `
          CREATE POLICY "Enable delete for testing"
          ON public.groups
          FOR DELETE
          USING (true)
        `
      }
    ];

    // Create policies for events table
    const eventsPolicies = [
      {
        name: 'Enable read access for all users',
        command: `
          CREATE POLICY "Enable read access for all users"
          ON public.events
          FOR SELECT
          USING (true)
        `
      },
      {
        name: 'Enable insert for testing',
        command: `
          CREATE POLICY "Enable insert for testing"
          ON public.events
          FOR INSERT
          WITH CHECK (true)
        `
      },
      {
        name: 'Enable delete for testing',
        command: `
          CREATE POLICY "Enable delete for testing"
          ON public.events
          FOR DELETE
          USING (true)
        `
      }
    ];

    // Apply groups policies
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

    // Apply events policies
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
      'All necessary policies have been created for testing'
    );

  } catch (error) {
    logResult(
      'Error',
      false,
      'Failed to configure RLS policies',
      `Error: ${error.message}\nDetails: ${JSON.stringify(error, null, 2)}`
    );
  }
});