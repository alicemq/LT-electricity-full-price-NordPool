# CI/CD Pipeline Guide - Electricity Prices NordPool

This guide covers the complete CI/CD (Continuous Integration/Continuous Deployment) setup for the Electricity Prices NordPool project, enabling automatic container updates with GitHub data.

## 🚀 **Overview**

The CI/CD pipeline automatically:
- **Builds** the application from source code
- **Tests** all components and dependencies
- **Scans** for security vulnerabilities
- **Deploys** to CapRover production environment
- **Updates** the one-click app in CapRover repository
- **Notifies** team members of deployment status

## 📋 **Prerequisites**

### **Required**
- GitHub repository with the project
- CapRover instance running
- GitHub Actions enabled
- Docker Hub or GitHub Container Registry access

### **Optional**
- Slack workspace for notifications
- GitHub Personal Access Token for one-click app updates

## 🔧 **Setup Instructions**

### **Step 1: Run Setup Script**

```bash
# Make script executable
chmod +x scripts/setup-ci-cd.sh

# Run setup script
./scripts/setup-ci-cd.sh
```

The script will guide you through the entire setup process.

### **Step 2: Configure GitHub Secrets**

Navigate to your repository settings: `https://github.com/YOUR_USERNAME/YOUR_REPO/settings/secrets/actions`

#### **Required Secrets**

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `CAPROVER_SERVER` | Your CapRover server URL | `https://captain.yourdomain.com` |
| `CAPROVER_PASSWORD` | Your CapRover password | `your-caprover-password` |
| `CAPROVER_APP_NAME` | App name in CapRover | `electricity-prices` |

#### **Optional Secrets**

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `ONE_CLICK_APPS_TOKEN` | GitHub PAT for one-click app updates | `ghp_xxxxxxxxxxxx` |
| `SLACK_WEBHOOK_URL` | Slack webhook for notifications | `https://hooks.slack.com/...` |

### **Step 3: Configure CapRover App**

1. **Create App in CapRover**
   - App Name: Match `CAPROVER_APP_NAME` secret
   - Port: 80
   - Health Check: `/api/v1/health`

2. **Set Environment Variables**
   ```bash
   NODE_ENV=production
   DATABASE_URL=postgresql://electricity_user:electricity_password@postgres:5432/electricity_prices
   ELERING_API_URL=https://dashboard.elering.ee/api/nps/price
   FRONTEND_URL=https://your-app-name.your-domain.com
   POSTGRES_DB=electricity_prices
   POSTGRES_USER=electricity_user
   POSTGRES_PASSWORD=electricity_password
   ```

3. **Configure Volumes**
   - Container Path: `/var/lib/postgresql/data`
   - Host Path: `/captain/data/postgres`

## 📊 **Workflow Overview**

### **Main CI/CD Pipeline (`ci-cd.yml`)**

```mermaid
graph TD
    A[Push to main] --> B[Build & Test]
    B --> C[Security Scan]
    C --> D[Build Docker Images]
    D --> E[Deploy to CapRover]
    E --> F[Health Check]
    F --> G[Notify Team]
    
    H[Pull Request] --> B
    H --> C
    H --> I[No Deploy]
    
    J[Release] --> K[Tag Images]
    K --> L[Update One-Click App]
    L --> M[Generate Release Notes]
```

### **Workflow Jobs**

#### **1. Build and Test**
- ✅ Install dependencies
- ✅ Run linting
- ✅ Build frontend
- ✅ Run tests
- ✅ Test database connection

#### **2. Build Images**
- ✅ Build main application image
- ✅ Build one-click app image
- ✅ Push to GitHub Container Registry
- ✅ Apply proper tags

#### **3. Deploy**
- ✅ Deploy to CapRover (main branch only)
- ✅ Wait for deployment
- ✅ Health check verification

#### **4. Security Scan**
- ✅ Trivy vulnerability scanning
- ✅ CodeQL analysis
- ✅ Dependency review

#### **5. One-Click App Update**
- ✅ Update CapRover repository
- ✅ Create pull request
- ✅ Validate changes

## 🔄 **Deployment Triggers**

### **Automatic Deployments**

| Trigger | Action | Deploy |
|---------|--------|--------|
| Push to `main` | Build, test, deploy | ✅ Yes |
| Pull Request | Build, test, scan | ❌ No |
| Release | Tag, update one-click app | ✅ Yes |

### **Manual Deployments**

```bash
# Create a release to trigger deployment
git tag v1.0.0
git push origin v1.0.0

# Then create a release on GitHub
# Go to: https://github.com/YOUR_REPO/releases/new
```

## 🛡️ **Security Features**

### **Automated Security Scanning**

1. **Trivy Vulnerability Scanner**
   - Scans Docker images for vulnerabilities
   - Generates SARIF reports
   - Uploads to GitHub Security tab

2. **CodeQL Analysis**
   - Static code analysis
   - JavaScript/TypeScript security scanning
   - Runs on schedule and PRs

3. **Dependency Review**
   - Checks for vulnerable dependencies
   - Fails on moderate+ severity
   - Runs on all pull requests

### **Security Best Practices**

- ✅ No secrets in code
- ✅ Secure Docker base images
- ✅ Dependency vulnerability scanning
- ✅ Code security analysis
- ✅ Container security scanning

## 📈 **Monitoring and Observability**

### **Deployment Monitoring**

1. **GitHub Actions Dashboard**
   - Real-time workflow status
   - Build and deployment logs
   - Failure notifications

2. **CapRover Dashboard**
   - Application status
   - Container health
   - Resource usage

3. **Health Checks**
   - Automated health verification
   - Retry logic for reliability
   - Failure notifications

### **Logging and Debugging**

```bash
# View GitHub Actions logs
# Go to: https://github.com/YOUR_REPO/actions

# View CapRover logs
# Go to: https://captain.yourdomain.com/apps/YOUR_APP/logs

# Check application health
curl https://your-app.yourdomain.com/api/v1/health
```

## 🔧 **Troubleshooting**

### **Common Issues**

#### **1. Deployment Fails**

**Symptoms**: GitHub Actions deployment job fails

**Solutions**:
- Check CapRover credentials in secrets
- Verify app name matches CapRover
- Check CapRover server connectivity
- Review deployment logs

#### **2. Health Check Fails**

**Symptoms**: Application deploys but health check fails

**Solutions**:
- Check application logs in CapRover
- Verify environment variables
- Check database connectivity
- Review startup script

#### **3. Build Fails**

**Symptoms**: Docker build fails

**Solutions**:
- Check Dockerfile syntax
- Verify all required files exist
- Check for dependency issues
- Review build logs

#### **4. Security Scan Fails**

**Symptoms**: Security scanning job fails

**Solutions**:
- Update vulnerable dependencies
- Fix security issues in code
- Review security scan reports
- Address CodeQL findings

### **Debug Commands**

```bash
# Test CapRover connectivity
curl -u admin:password https://captain.yourdomain.com/api/v2/user/apps/appDefinitions/register

# Check Docker image
docker pull ghcr.io/YOUR_REPO:latest
docker run --rm ghcr.io/YOUR_REPO:latest

# Test local build
docker build -f Dockerfile.captain -t test-app .
docker run --rm -p 80:80 test-app
```

## 📝 **Best Practices**

### **Development Workflow**

1. **Feature Development**
   ```bash
   git checkout -b feature/new-feature
   # Make changes
   git commit -m "Add new feature"
   git push origin feature/new-feature
   # Create pull request
   ```

2. **Code Review**
   - All changes go through pull requests
   - Automated tests must pass
   - Security scans must pass
   - Code review required

3. **Release Process**
   ```bash
   # Merge to main
   git checkout main
   git merge feature/new-feature
   git push origin main
   
   # Create release
   git tag v1.1.0
   git push origin v1.1.0
   ```

### **Maintenance**

1. **Regular Updates**
   - Monitor dependency updates
   - Update base images regularly
   - Review security alerts
   - Keep workflows updated

2. **Monitoring**
   - Check GitHub Actions regularly
   - Monitor application health
   - Review deployment logs
   - Track performance metrics

## 🎯 **Advanced Configuration**

### **Custom Workflows**

You can customize the CI/CD pipeline by modifying the workflow files:

- `.github/workflows/ci-cd.yml` - Main pipeline
- `.github/workflows/one-click-app-update.yml` - One-click app updates
- `.github/workflows/codeql-analysis.yml` - Security analysis
- `.github/workflows/dependency-review.yml` - Dependency scanning

### **Environment-Specific Deployments**

```yaml
# Add environment-specific configurations
- name: Deploy to Staging
  if: github.ref == 'refs/heads/develop'
  run: |
    # Staging deployment logic

- name: Deploy to Production
  if: github.ref == 'refs/heads/main'
  run: |
    # Production deployment logic
```

### **Rollback Strategy**

```yaml
# Add rollback capability
- name: Rollback on failure
  if: failure()
  run: |
    # Rollback to previous version
    # Notify team of rollback
```

## 📊 **Performance Optimization**

### **Build Optimization**

1. **Docker Layer Caching**
   - Uses GitHub Actions cache
   - Optimizes build times
   - Reduces bandwidth usage

2. **Parallel Jobs**
   - Security scanning runs in parallel
   - Independent job execution
   - Faster overall pipeline

3. **Resource Optimization**
   - Efficient Docker images
   - Minimal base images
   - Optimized dependencies

### **Deployment Optimization**

1. **Health Check Strategy**
   - Progressive health checks
   - Retry logic
   - Graceful failure handling

2. **Rolling Updates**
   - Zero-downtime deployments
   - Health check verification
   - Automatic rollback on failure

## 🔮 **Future Enhancements**

### **Planned Features**

- [ ] **Multi-environment support** (staging, production)
- [ ] **Blue-green deployments**
- [ ] **Advanced monitoring integration**
- [ ] **Automated performance testing**
- [ ] **Cost optimization alerts**

### **Integration Possibilities**

- [ ] **Slack/Teams notifications**
- [ ] **Jira integration**
- [ ] **Monitoring dashboards**
- [ ] **Performance metrics**
- [ ] **Cost tracking**

---

**Status**: ✅ **Production Ready**  
**Last Updated**: June 2024  
**Maintainer**: Electricity Prices NordPool Team 