# LyceumVault

A modern web application for managing and archiving thesis documents.

## Prerequisites

### Installing Node.js & npm

**For Linux/macOS users:**
- Install with [nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

**For Windows users:**

1. Download Node.js MSI installer from https://nodejs.org/en/download
2. Complete the installation process
3. Open PowerShell as administrator and verify installation:
   ```powershell
   node -v
   ```
4. If needed, bypass execution policy:
   ```powershell
   set-executionpolicy -scope process -executionpolicy bypass
   ```
5. Verify npm installation:
   ```powershell
   npm -v
   ```

## Setup Instructions
### 1. Clone the Repository
```sh
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
```

### 2. Install Dependencies
```sh
npm install
```

### 3. Install Supabase CLI
```sh
npm install supabase --save-dev
```

### 4. Login to Supabase
```sh
npx supabase login
```

### 5. Link Your Supabase Project
```sh
npx supabase link --project-ref zummzziydfpvwuxxuyyu
```

### 6. Install SendGrid for Email Verification
```sh
npm install @resend
```

### 7. Configure Environment Variables
```sh
# Set your SendGrid API key
npx supabase secrets set RESEND_API_KEY=re....

# Set environment
npx supabase secrets set ENVIRONMENT=production
```

### 8. Deploy Edge Functions
```sh
npx supabase functions deploy delete-user
npx supabase functions deploy send-verification-email
```

### 9. Start Development Server
```sh
npm run dev
```
### 10. Push
# 1. Initialize git (if not already done)
git init

# 2. Add the remote repository (only once)
git remote add origin https://github.com/slrclpubatangas/thesis-nexus-archive.git

# 3. Verify that the remote is set
git remote -v

# 4. Add all your files
git add .

# 5. Commit your changes with a clear message
git commit -m "Initial project upload"

# 6. Ensure your local branch is named main
git branch -M main

# 7. Pull the latest changes from GitHub (to avoid conflicts)
git pull origin main --rebase

# 8. Push your files to the main branch
git push origin main

## Alternative Development Methods

### GitHub Web Editor
1. Navigate to the desired file(s)
2. Click the "Edit" button (pencil icon) at the top right
3. Make your changes and commit

### GitHub Codespaces
1. Navigate to the main page of your repository
2. Click on the "Code" button (green button) near the top right
3. Select the "Codespaces" tab
4. Click "New codespace" to launch a new Codespace environment
5. Edit files directly within the Codespace and commit your changes

## Tech Stack

This project is built with:

- **Vite** - Build tool and development server
- **TypeScript** - Type-safe JavaScript
- **React** - UI framework
- **shadcn-ui** - Component library
- **Tailwind CSS** - Utility-first CSS framework
- **Supabase** - Backend and database
- **SendGrid** - Email service

## Deployment

This project can be deployed to various hosting platforms:

### Option 1: Vercel
1. Connect your GitHub repository
2. Configure build settings (auto-detected for Vite)
3. Deploy with automatic CI/CD

### Option 2: Netlify
1. Import your project from GitHub
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Deploy

### Option 3: GitHub Pages
1. Configure GitHub Actions workflow
2. Build the project
3. Deploy to gh-pages branch

### Option 4: Custom VPS
1. Build the project: `npm run build`
2. Serve the `dist` folder with a web server (nginx, Apache, etc.)
