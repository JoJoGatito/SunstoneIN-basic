# Supabase Integration Deployment Guide

This guide walks through the process of deploying the Supabase integration for the Sunstone Inclusivity Network website.

## Prerequisites

1. Access to Supabase dashboard
2. Git access to both dev and production repositories
3. GitHub Pages configured for testing
4. Local development environment set up

## Step-by-Step Deployment

### 1. Database Setup

1. Log in to Supabase Dashboard:
   ```
   https://app.supabase.com
   ```

2. Navigate to SQL Editor:
   - Click "SQL Editor" in the left sidebar
   - Create a new query

3. Run Database Setup:
   - Open `setup-test-data.sql` from your local repository
   - Copy the entire content into the SQL Editor
   - Execute the script
   - Verify the results in the output panel

4. Verify Data:
   - Check the Tables view
   - Confirm 5 groups are created
   - Confirm 8 events are populated
   - Verify RLS policies are active

### 2. Local Testing

1. Start Local Server:
   ```bash
   python3 -m http.server 3000
   ```

2. Run Connection Test:
   - Open http://localhost:3000/test-connection.html
   - Verify all tests pass
   - Check console for errors

3. Run Group Events Test:
   - Open http://localhost:3000/test-group-events.html
   - Verify event queries work
   - Check real-time functionality
   - Confirm performance metrics

4. Test JSON Fallback:
   - Temporarily disable Supabase connection
   - Verify events still display from JSON
   - Re-enable Supabase connection
   - Verify smooth transition back

### 3. Dev Deployment

1. Push to Dev Repository:
   ```bash
   git checkout dev
   git add .
   git commit -m "Phase 2: Supabase Integration"
   git push origin dev
   ```

2. Test on GitHub Pages:
   - Wait for deployment to complete
   - Test all functionality
   - Verify Supabase connection
   - Check cross-browser compatibility

### 4. Production Deployment

1. Database Preparation:
   - Log in to production Supabase instance
   - Run `setup-test-data.sql`
   - Verify data population
   - Test RLS policies

2. Code Deployment:
   ```bash
   git checkout main
   git merge dev
   git push origin main
   ```

3. Verification:
   - Monitor deployment
   - Test all features
   - Check error logs
   - Verify performance

### 5. Monitoring

1. Watch for:
   - Page load times (target: < 2s)
   - Query response times (target: < 500ms)
   - Error rates (target: < 0.1%)
   - Real-time update latency (target: < 100ms)

2. Error Monitoring:
   - Check browser console logs
   - Monitor Supabase dashboard
   - Watch error tracking
   - Review performance metrics

### 6. Rollback Procedure

If critical issues occur:

1. Immediate Actions:
   ```bash
   # Revert the last commit
   git revert HEAD
   git push origin main
   ```

2. Database Rollback:
   - Disable RLS temporarily
   - Clear test data if needed
   - Re-enable RLS
   - Verify JSON fallback works

3. Documentation:
   - Document the issue
   - Record error messages
   - Note performance metrics
   - Plan resolution steps

## Support

If you encounter issues during deployment:

1. Check the deployment plan in `docs/phase2_deployment_plan.md`
2. Review error logs in browser console and Supabase dashboard
3. Test JSON fallback functionality
4. Document any issues for future reference

## Success Verification

- [ ] Database setup complete
- [ ] Local tests passing
- [ ] Dev deployment successful
- [ ] Production deployment verified
- [ ] Monitoring in place
- [ ] Documentation updated
- [ ] Rollback procedure tested