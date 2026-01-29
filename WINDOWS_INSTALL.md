# Windows Installation Guide

## Problem: Chinese characters not displaying correctly

The original `install.bat` has encoding issues on Windows. The characters display as garbled text (e.g., '瀹夎' instead of '安装').

## Solution: Use English version scripts

I have created three installation scripts for you:

### 1. install.bat (English version - uses yarn)
**For users with yarn installed**

```bash
# Double-click to run
install.bat
```

**Features:**
- Checks Node.js
- Checks and installs yarn if needed
- Installs dependencies with yarn
- Creates .env.local file
- Starts development server

**If you get "yarn not found" error:**
- Close the Command Prompt window
- Open a new Command Prompt window
- Run `install.bat` again
- OR use `install-npm.bat` instead

---

### 2. install-npm.bat (Recommended - uses npm)
**For users who prefer npm (no extra installation needed)**

```bash
# Double-click to run
install-npm.bat
```

**Features:**
- Checks Node.js
- Installs dependencies with npm
- Falls back to yarn if npm fails
- Creates .env.local file
- Starts development server

**This is the most reliable option!**

---

### 3. install-manual.bat (Step-by-step guide)
**For users who want control over the installation process**

```bash
# Double-click to run
install-manual.bat
```

**Features:**
- Interactive installation process
- Choose between npm or yarn
- Provides clear instructions
- Doesn't auto-start server (you start it manually)

---

## Quick Installation (Recommended)

### Option A: Use npm (Easiest)

1. Download and extract the project
2. Open Command Prompt in the project folder
3. Run:
   ```bash
   npm install
   npm run dev
   ```

### Option B: Use install-npm.bat

1. Download and extract the project
2. Double-click `install-npm.bat`
3. Wait for installation to complete
4. Visit http://localhost:5000

---

## Common Problems & Solutions

### Problem 1: "'yarn' is not recognized as an internal or external command"

**Cause:** Yarn is not installed or not in PATH

**Solution:**
1. Use npm instead:
   ```bash
   npm install
   npm run dev
   ```

OR

2. Install yarn globally:
   ```bash
   npm install -g yarn
   ```
   **Important:** Close and reopen Command Prompt after installing!

---

### Problem 2: Chinese characters display as garbled text

**Cause:** File encoding issue

**Solution:**
- Use the new English version scripts (`install.bat`, `install-npm.bat`, or `install-manual.bat`)

---

### Problem 3: "Node.js is not installed"

**Cause:** Node.js is not installed on your system

**Solution:**
1. Visit https://nodejs.org
2. Download and install Node.js (version 18 or later)
3. Restart Command Prompt
4. Run the installation script again

---

### Problem 4: Installation hangs or takes too long

**Cause:** Slow network connection or large dependency download

**Solution:**
1. Check your internet connection
2. Try using npm with timeout:
   ```bash
   npm install --timeout=180000
   ```

3. Or use Chinese npm mirror (if in China):
   ```bash
   npm config set registry https://registry.npmmirror.com
   npm install
   ```

---

### Problem 5: Port 5000 already in use

**Cause:** Another application is using port 5000

**Solution:**

**Option A:** Stop the other application
- Find and close the application using port 5000

**Option B:** Use a different port
Edit `package.json` and change the dev script:
```json
"dev": "next dev --port 3000"
```

---

## Step-by-Step Manual Installation

If the scripts don't work, follow these steps manually:

### Step 1: Install Node.js
- Download from https://nodejs.org
- Install Node.js 18 or later
- Restart your computer

### Step 2: Open Command Prompt
- Navigate to the project folder
- Press Shift + Right-click in the folder
- Select "Open PowerShell window here" or "Open command window here"

### Step 3: Install dependencies
```bash
npm install
```

**If npm install fails, try:**
```bash
# Force clean install
rmdir /s /q node_modules
del package-lock.json
npm install
```

### Step 4: Start the application
```bash
npm run dev
```

### Step 5: Open your browser
- Visit http://localhost:5000
- Register an account
- Start encrypting files!

---

## Verification

To verify the installation:

1. Check Node.js version:
   ```bash
   node --version
   ```
   Should be v18.0.0 or later

2. Check npm version:
   ```bash
   npm --version
   ```

3. Check if dependencies are installed:
   ```bash
   dir node_modules
   ```
   Should see many folders

4. Test the application:
   ```bash
   npm run dev
   ```
   Should see "Ready in ..." message

---

## Environment Configuration

### Default Configuration

The project includes a `.env.local` file with Supabase configuration:

```env
NEXT_PUBLIC_SUPABASE_URL=https://wzvpiyjxlaihcjgdchez.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**You can use the application without Supabase:**
- ✅ All features work locally
- ✅ Data stored in browser localStorage
- ❌ No cloud sync
- ❌ No cross-device access

### Enable Cloud Sync (Optional)

If you want to use cloud sync:

1. Create a Supabase project at https://supabase.com
2. Create a Storage bucket named `file-encrypt`
3. Update `.env.local` with your Supabase credentials
4. Restart the application

---

## Need Help?

If you're still having issues:

1. Check the error message carefully
2. Refer to this guide's "Common Problems" section
3. Check `TROUBLESHOOTING.md` in the project folder
4. Make sure Node.js and npm are properly installed
5. Try running commands manually instead of using the script

---

## File Structure After Installation

```
file-encryptor-with-ticket/
├── node_modules/          # Installed dependencies (large folder)
├── .next/                # Next.js build cache
├── src/                  # Source code
├── public/               # Static files
├── package.json          # Project configuration
├── .env.local           # Environment variables
├── install.bat          # Yarn-based installer (English)
├── install-npm.bat      # Npm-based installer (Recommended)
└── install-manual.bat   # Interactive installer
```

---

**Happy encrypting!** 🔐
