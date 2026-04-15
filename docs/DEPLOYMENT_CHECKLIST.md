# Deployment Checklist - Cloud Run Excel Processor

Use this checklist to ensure a smooth deployment of the Cloud Run integration.

## Pre-Deployment

### 1. Cloud Run Service

- [ ] Cloud Run service is deployed and running
- [ ] Service URL is noted and accessible
- [ ] Health check endpoint returns 200 OK
- [ ] Process endpoint is functional (tested with curl)
- [ ] CORS is configured (if calling directly from client)
- [ ] Environment variables set on Cloud Run (GOOGLE_GENAI_API_KEY)
- [ ] Resource limits configured (memory, CPU, timeout)
- [ ] IAM permissions configured correctly

**Test Commands:**
```bash
# Health check
curl https://your-cloud-run-url.run.app/health_check

# Process test
curl -X POST https://your-cloud-run-url.run.app/process_excel \
  -F "file=@test.xlsx" \
  -F "supplier=Test" \
  -F "month=2025-10"
```

### 2. Code Changes

- [ ] All new files created and committed
- [ ] All modified files committed
- [ ] No uncommitted changes (except .env.local)
- [ ] Git branch is up to date
- [ ] No merge conflicts
- [ ] All tests passing locally
- [ ] No linter errors
- [ ] TypeScript compiles without errors

**Verification Commands:**
```bash
# Check git status
git status

# Run linter
npm run lint

# Type check
npm run typecheck

# Build test
npm run build
```

### 3. Environment Variables

- [ ] `EXCEL_API_URL` documented
- [ ] Local `.env.local` configured (for testing)
- [ ] Production environment variables prepared
- [ ] All Firebase variables still present
- [ ] No hardcoded URLs in code

**Required Variables:**
```env
EXCEL_API_URL=https://your-cloud-run-url.run.app
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
FIREBASE_ADMIN_PROJECT_ID=...
FIREBASE_ADMIN_CLIENT_EMAIL=...
FIREBASE_ADMIN_PRIVATE_KEY=...
GOOGLE_GENAI_API_KEY=...
```

### 4. Documentation

- [ ] README.md updated
- [ ] MIGRATION_GUIDE.md created
- [ ] CLOUD_RUN_SETUP.md created
- [ ] QUICK_REFERENCE.md created
- [ ] MIGRATION_SUMMARY.md created
- [ ] DEPLOYMENT_CHECKLIST.md created (this file)
- [ ] All documentation reviewed for accuracy

### 5. Local Testing

- [ ] Application runs locally (`npm run dev`)
- [ ] Health check shows "API Online"
- [ ] Can upload Excel file
- [ ] File processes successfully
- [ ] Data saves to Firestore
- [ ] File status updates to "Procesado"
- [ ] Can view processed data
- [ ] Can export to Excel
- [ ] No console errors
- [ ] No network errors

---

## Deployment

### Option A: Vercel

#### 1. Environment Variables

- [ ] Go to Project Settings → Environment Variables
- [ ] Add `EXCEL_API_URL` with Cloud Run URL
- [ ] Verify all Firebase variables are present
- [ ] Set for Production, Preview, and Development
- [ ] Save changes

#### 2. Deploy

- [ ] Push code to main branch
- [ ] Vercel auto-deploys (or manual deploy)
- [ ] Wait for deployment to complete
- [ ] Check deployment logs for errors
- [ ] Note the deployment URL

#### 3. Verify

- [ ] Visit deployment URL
- [ ] Login to application
- [ ] Check health indicator in dashboard
- [ ] Upload test Excel file
- [ ] Verify processing works
- [ ] Check Firestore for data
- [ ] Test all main features

### Option B: Netlify

#### 1. Environment Variables

- [ ] Go to Site Settings → Environment Variables
- [ ] Add `EXCEL_API_URL` with Cloud Run URL
- [ ] Verify all Firebase variables are present
- [ ] Save changes

#### 2. Deploy

- [ ] Push code to main branch
- [ ] Netlify auto-deploys (or manual deploy)
- [ ] Wait for deployment to complete
- [ ] Check deployment logs for errors
- [ ] Note the deployment URL

#### 3. Verify

- [ ] Visit deployment URL
- [ ] Login to application
- [ ] Check health indicator in dashboard
- [ ] Upload test Excel file
- [ ] Verify processing works
- [ ] Check Firestore for data
- [ ] Test all main features

### Option C: Firebase Hosting

#### 1. Environment Variables

- [ ] Update `.env.production` or use Firebase config
- [ ] Set `EXCEL_API_URL` in environment
- [ ] Verify all Firebase variables are present

#### 2. Build

```bash
npm run build
```

- [ ] Build completes without errors
- [ ] Check build output for warnings

#### 3. Deploy

```bash
firebase deploy
```

- [ ] Deployment completes successfully
- [ ] Note the hosting URL

#### 4. Verify

- [ ] Visit hosting URL
- [ ] Login to application
- [ ] Check health indicator in dashboard
- [ ] Upload test Excel file
- [ ] Verify processing works
- [ ] Check Firestore for data
- [ ] Test all main features

---

## Post-Deployment

### 1. Smoke Tests

- [ ] Application loads without errors
- [ ] Login works
- [ ] Dashboard displays correctly
- [ ] Health check shows "API Online"
- [ ] Can navigate between pages
- [ ] All UI elements render correctly

### 2. Feature Tests

- [ ] **File Upload**
  - [ ] Can select file
  - [ ] Can drag and drop file
  - [ ] File validation works
  - [ ] Duplicate detection works

- [ ] **File Processing**
  - [ ] File status shows "Pendiente"
  - [ ] Status changes to "Procesando"
  - [ ] Status changes to "Procesado"
  - [ ] Processing time is reasonable
  - [ ] Error handling works

- [ ] **Data Display**
  - [ ] Can view processed files
  - [ ] Can see file details
  - [ ] Products display correctly
  - [ ] Combos display correctly
  - [ ] Statistics are accurate

- [ ] **Excel Export**
  - [ ] Can export data to Excel
  - [ ] Export file downloads
  - [ ] Export data is correct

- [ ] **User Management** (if Admin)
  - [ ] Can view users
  - [ ] Can add users
  - [ ] Can edit users
  - [ ] Can delete users

### 3. Performance Tests

- [ ] Page load time < 3 seconds
- [ ] File upload is responsive
- [ ] Processing time is acceptable
- [ ] No memory leaks
- [ ] No excessive API calls
- [ ] Health check doesn't impact performance

### 4. Error Handling Tests

- [ ] Upload invalid file type → Shows error
- [ ] Upload duplicate file → Shows warning
- [ ] Cloud Run offline → Shows error gracefully
- [ ] Network error → Shows error message
- [ ] Large file → Handles appropriately

### 5. Browser Tests

- [ ] **Chrome** - All features work
- [ ] **Firefox** - All features work
- [ ] **Safari** - All features work
- [ ] **Edge** - All features work
- [ ] **Mobile Chrome** - Responsive and functional
- [ ] **Mobile Safari** - Responsive and functional

### 6. Monitoring Setup

- [ ] **Cloud Run Monitoring**
  - [ ] Check Cloud Run metrics dashboard
  - [ ] Set up alerts for errors
  - [ ] Set up alerts for high latency
  - [ ] Set up alerts for high memory usage

- [ ] **Application Monitoring**
  - [ ] Check application logs
  - [ ] Set up error tracking (Sentry, etc.)
  - [ ] Set up performance monitoring
  - [ ] Set up uptime monitoring

- [ ] **Firebase Monitoring**
  - [ ] Check Firestore usage
  - [ ] Check Auth usage
  - [ ] Set up billing alerts

### 7. Documentation

- [ ] Update deployment documentation with actual URLs
- [ ] Document any issues encountered
- [ ] Document any workarounds needed
- [ ] Update team wiki/docs
- [ ] Notify team of deployment

### 8. Backup & Rollback Plan

- [ ] Note current deployment version
- [ ] Document rollback procedure
- [ ] Test rollback procedure (optional)
- [ ] Keep previous version available
- [ ] Document any database changes

---

## Rollback Procedure (if needed)

### If Deployment Fails

1. **Check Logs**
   ```bash
   # Vercel
   vercel logs
   
   # Netlify
   netlify logs
   
   # Firebase
   firebase functions:log
   ```

2. **Identify Issue**
   - [ ] Check error messages
   - [ ] Check environment variables
   - [ ] Check Cloud Run status
   - [ ] Check Firebase status

3. **Quick Fix or Rollback**
   - [ ] If quick fix available, apply and redeploy
   - [ ] If not, rollback to previous version

### Rollback Steps

#### Vercel
```bash
# Rollback to previous deployment
vercel rollback
```

#### Netlify
```bash
# Rollback via Netlify UI
# Deploys → Select previous deploy → Publish
```

#### Firebase
```bash
# Redeploy previous version
git checkout <previous-commit>
npm run build
firebase deploy
```

#### Manual Rollback
```bash
# Revert code changes
git revert <commit-hash>
git push

# Or reset to previous commit
git reset --hard <previous-commit>
git push --force
```

---

## Success Criteria

Deployment is successful when:

- ✅ Application loads without errors
- ✅ Health check shows "API Online"
- ✅ Users can upload files
- ✅ Files process successfully
- ✅ Data saves to Firestore
- ✅ All features work as expected
- ✅ No critical errors in logs
- ✅ Performance is acceptable
- ✅ All tests pass

---

## Post-Deployment Monitoring (First 24 Hours)

### Hour 1
- [ ] Check application is accessible
- [ ] Monitor error rates
- [ ] Check Cloud Run metrics
- [ ] Check user activity

### Hour 6
- [ ] Review error logs
- [ ] Check performance metrics
- [ ] Verify file processing success rate
- [ ] Check Firestore usage

### Hour 24
- [ ] Review full day metrics
- [ ] Check for any patterns in errors
- [ ] Verify all features working
- [ ] Collect user feedback

---

## Troubleshooting

### Issue: Health Check Shows "API Offline"

**Check:**
1. `EXCEL_API_URL` environment variable
2. Cloud Run service status
3. Network connectivity
4. CORS configuration

**Fix:**
- Verify environment variable is correct
- Restart Cloud Run service if needed
- Check Cloud Run logs for errors

### Issue: File Processing Fails

**Check:**
1. Cloud Run logs
2. Next.js API logs
3. File format and size
4. Network errors

**Fix:**
- Check error message in UI
- Verify Cloud Run is processing correctly
- Check file is valid Excel format
- Retry with smaller file

### Issue: Slow Performance

**Check:**
1. Cloud Run cold start
2. File size
3. Network latency
4. Cloud Run resources

**Fix:**
- Increase Cloud Run memory
- Set minimum instances
- Optimize file size
- Check network connection

---

## Contacts

### Technical Issues
- Cloud Run: [GCP Support](https://cloud.google.com/support)
- Firebase: [Firebase Support](https://firebase.google.com/support)
- Next.js: [Next.js Docs](https://nextjs.org/docs)

### Team Contacts
- Frontend Lead: [Name/Email]
- Backend Lead: [Name/Email]
- DevOps Lead: [Name/Email]
- Project Manager: [Name/Email]

---

## Sign-Off

### Deployment Completed By
- Name: ___________________________
- Date: ___________________________
- Time: ___________________________

### Verified By
- Name: ___________________________
- Date: ___________________________
- Time: ___________________________

### Notes
```
[Add any deployment notes, issues encountered, or special considerations]
```

---

**Deployment Status:** [ ] Not Started | [ ] In Progress | [ ] Completed | [ ] Rolled Back

**Last Updated:** October 6, 2025
