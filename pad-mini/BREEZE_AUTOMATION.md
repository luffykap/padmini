# 🤖 Breeze PM Automation Guide

Automate syncing your project tasks from CSV to Breeze.pm.

---

## 📋 Prerequisites

1. **Breeze.pm Account** with API access
2. **API Token** from Breeze.pm settings
3. **Project ID** from your Breeze project

---

## 🔧 Setup

### Step 1: Get Your Breeze API Credentials

1. **Login to Breeze.pm**
2. Go to **Settings** → **API** → **Generate API Token**
3. Copy your API token
4. Get your project ID from the URL:
   ```
   https://YOUR_COMPANY.breeze.pm/projects/12345
                                          ^^^^^ This is your project ID
   ```

### Step 2: Configure the Script

Edit `scripts/sync-breeze.js`:

```javascript
const BREEZE_CONFIG = {
  apiUrl: 'https://YOUR_COMPANY.breeze.pm/api',
  apiToken: 'your_api_token_here',
  projectId: 'your_project_id',
};
```

### Step 3: Run the Sync

```bash
# Manual sync
node scripts/sync-breeze.js

# Or add to package.json:
npm run sync-breeze
```

---

## 🚀 Automation Options

### Option 1: Manual Sync (Simple)

Run the script whenever you update your CSV:

```bash
npm run sync-breeze
```

### Option 2: Scheduled Sync (Cron Job)

**On Mac/Linux:**

```bash
# Edit crontab
crontab -e

# Add this line to sync every day at 9 AM:
0 9 * * * cd /Users/kapilpal/pad-mini && node scripts/sync-breeze.js >> logs/breeze-sync.log 2>&1

# Or every hour:
0 * * * * cd /Users/kapilpal/pad-mini && node scripts/sync-breeze.js >> logs/breeze-sync.log 2>&1
```

### Option 3: GitHub Actions (CI/CD)

Create `.github/workflows/sync-breeze.yml`:

```yaml
name: Sync to Breeze PM

on:
  push:
    paths:
      - 'BREEZE_TASKS.csv'
      - 'Desktop/BREEZE_TASKS.csv'
  schedule:
    - cron: '0 9 * * *'  # Daily at 9 AM UTC
  workflow_dispatch:  # Manual trigger

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Sync to Breeze
        env:
          BREEZE_API_TOKEN: ${{ secrets.BREEZE_API_TOKEN }}
          BREEZE_PROJECT_ID: ${{ secrets.BREEZE_PROJECT_ID }}
        run: |
          node scripts/sync-breeze.js
```

**Setup GitHub Secrets:**
1. Go to your repo → Settings → Secrets → Actions
2. Add:
   - `BREEZE_API_TOKEN`
   - `BREEZE_PROJECT_ID`

### Option 4: File Watcher (Real-Time)

Auto-sync when CSV changes:

```bash
npm install -D chokidar-cli

# Add to package.json scripts:
"watch-csv": "chokidar 'Desktop/BREEZE_TASKS.csv' -c 'npm run sync-breeze'"

# Run:
npm run watch-csv
```

---

## 📊 What Gets Synced

The script syncs:
- ✅ Task Name
- ✅ Description
- ✅ Status (Completed, In Progress, Planned)
- ✅ Due Date
- ✅ Tags
- ✅ Priority
- ✅ Assignee (if user exists in Breeze)

**Sync Logic:**
- If task exists (by name) → **UPDATE**
- If task is new → **CREATE**
- Handles duplicates by matching task names

---

## 🔄 Alternative: Breeze → CSV Export

**Export tasks FROM Breeze to CSV:**

```javascript
// scripts/export-from-breeze.js
const breeze = new BreezeClient(BREEZE_CONFIG);

async function exportToCSV() {
  const tasks = await breeze.getTasks();
  
  const csv = [
    'Task Name,Status,Description,Due Date,Assignee,Tags',
    ...tasks.map(t => 
      `"${t.name}","${t.status}","${t.description}","${t.due_date}","${t.assignee}","${t.tags.join(',')}"`
    )
  ].join('\n');
  
  fs.writeFileSync('BREEZE_EXPORT.csv', csv);
  console.log('✅ Exported to BREEZE_EXPORT.csv');
}
```

---

## 🔌 Breeze API Endpoints

```javascript
// Get all tasks
GET /projects/:project_id/tasks.json

// Create task
POST /projects/:project_id/tasks.json
{
  "name": "Task Name",
  "description": "Details",
  "due_date": "2025-10-30",
  "list_id": 123,  // Stage/status
  "tags": ["tag1", "tag2"]
}

// Update task
PUT /tasks/:task_id.json
{
  "name": "Updated Name",
  "status": "completed"
}

// Delete task
DELETE /tasks/:task_id.json

// Get task lists (stages)
GET /projects/:project_id/stages.json

// Get users
GET /projects/:project_id/people.json
```

---

## 🛠️ Troubleshooting

### "API Token Invalid"
- Check token in Breeze.pm → Settings → API
- Make sure it's not expired
- Token should start with `breeze_`

### "Project Not Found"
- Verify project ID from URL
- Check user has access to project

### "Rate Limit Exceeded"
- Script includes 200ms delay between requests
- Increase delay if needed: `setTimeout(resolve, 500)`

### CSV Parsing Issues
- Make sure CSV uses commas (not semicolons)
- Check for unescaped quotes in descriptions
- Use quotes for fields with commas: `"Task, with comma"`

---

## 📦 Package.json Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "sync-breeze": "node scripts/sync-breeze.js",
    "export-breeze": "node scripts/export-from-breeze.js",
    "watch-csv": "chokidar 'Desktop/BREEZE_TASKS.csv' -c 'npm run sync-breeze'"
  }
}
```

---

## 🔐 Security Best Practices

1. **Never commit API tokens** to git
2. Use environment variables:
   ```bash
   export BREEZE_API_TOKEN="your_token"
   export BREEZE_PROJECT_ID="12345"
   ```
3. Add to `.gitignore`:
   ```
   .env
   .env.local
   scripts/breeze-config.json
   ```
4. Use GitHub Secrets for CI/CD

---

## 📈 Advanced: Bidirectional Sync

To keep CSV and Breeze in sync both ways:

```javascript
// 1. Download from Breeze
npm run export-breeze

// 2. Merge with local CSV (manual or script)

// 3. Upload to Breeze
npm run sync-breeze
```

Or use a smart merge script that:
- Compares timestamps
- Resolves conflicts (latest wins)
- Logs changes

---

## ✅ Quick Start

```bash
# 1. Get API token from Breeze.pm
# 2. Edit scripts/sync-breeze.js config
# 3. Run sync
node scripts/sync-breeze.js

# Expected output:
# 🚀 Starting Breeze PM sync...
# 📄 Reading CSV file...
#    Found 50 tasks in CSV
# ☁️  Fetching existing tasks from Breeze...
#    Found 30 tasks in Breeze
# 🔄 Syncing tasks...
#    ✨ Created: New Task
#    ✅ Updated: Existing Task
# 📊 Sync Summary:
#    ✨ Created: 20
#    ✅ Updated: 30
#    Total: 50
# ✅ Sync completed successfully!
```

---

**Happy Automating! 🚀**
