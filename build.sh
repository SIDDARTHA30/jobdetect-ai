#!/bin/bash
# ═══════════════════════════════════════════════
# JOBDETECT — Build & deploy script
# Run this ONCE before pushing to GitHub
# ═══════════════════════════════════════════════

set -e  # stop on any error

echo "🔨 Step 1: Installing frontend dependencies..."
cd frontend
npm install

echo "⚡ Step 2: Building React frontend..."
npm run build

echo "📦 Step 3: Copying build to backend/app/static/..."
cd ..
rm -rf backend/app/static
mkdir -p backend/app/static
cp -r frontend/dist/* backend/app/static/

echo "✅ Build complete! Files in backend/app/static/"
echo ""
echo "📤 Step 4: Commit and push to GitHub..."
git add .
git commit -m "deploy: build frontend and update static files"
git push

echo ""
echo "🚀 Done! Now deploy on Render:"
echo "   Build:  pip install -r requirements.txt"
echo "   Start:  uvicorn app.main:app --host 0.0.0.0 --port \$PORT"
echo "   Root:   backend/"
echo ""
echo "🌐 Your app will be at: https://your-app.onrender.com"
