# GitHub Upload & Deployment Guide

## Option 1: Using Git Command Line (Recommended)

Open a terminal (PowerShell, Command Prompt, or Git Bash) inside this folder:

```bash
# 1. Initialize Git repository
git init

# 2. Add all files
git add .

# 3. Create initial commit
git commit -m "Initial commit: Process Development & Industrial Engineering System"

# 4. Set default branch to main
git branch -M main

# 5. Link to your GitHub repository (replace with your repo URL)
git remote add origin https://github.com/<your-github-username>/<your-repo-name>.git

# 6. Push to GitHub
git push -u origin main
```

---

## Option 2: Upload Directly via GitHub Web UI

1. Go to [GitHub.com](https://github.com) and create a new repository (do not check "Initialize with README").
2. Click **"uploading an existing file"**.
3. Drag and drop all files and folders from this `github-upload-process-dashboard` folder.
4. Click **Commit changes**.

---

## Option 3: Deploy Frontend Directly to Vercel

1. Log in to [Vercel](https://vercel.com).
2. Click **Add New... > Project**.
3. Select your newly pushed GitHub repository.
4. Vercel will automatically detect **Next.js**.
5. (Optional) Add your Supabase environment variables from `.env.example`.
6. Click **Deploy**.
