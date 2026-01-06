# 🚀 SETUP INSTRUCTIONS

## Step 1: Copy Frontend to Your Project

Copy the entire `storytime-frontend` folder to your project:

```bash
# From where you downloaded this:
cp -r storytime-frontend /Users/carlvann/Desktop/CourseWork2508-ftb-ct-web-pt/capstone/storytime-voice/frontend
```

## Step 2: Install Dependencies

```bash
cd /Users/carlvann/Desktop/CourseWork2508-ftb-ct-web-pt/capstone/storytime-voice/frontend
npm install
```

This will install:
- React 18.2.0
- React Router 6.20.0
- Axios 1.6.2
- Vite 5.0.8

## Step 3: Start Backend (Terminal 1)

```bash
cd /Users/carlvann/Desktop/CourseWork2508-ftb-ct-web-pt/capstone/storytime-voice/backend
node server.js
```

You should see:
```
Server running on port 5001
Environment: development
```

## Step 4: Start Frontend (Terminal 2)

```bash
cd /Users/carlvann/Desktop/CourseWork2508-ftb-ct-web-pt/capstone/storytime-voice/frontend
npm run dev
```

You should see:
```
VITE v5.0.8  ready in 500 ms

➜  Local:   http://localhost:3000/
➜  Network: use --host to expose
```

## Step 5: Open Browser

Open: http://localhost:3000

You should see the StoryTime Voice landing page!

## Step 6: Test Login

Use the existing test account:
- Email: `newuser@test.com`
- Password: `testpass123`

Click "Log In" and you should be redirected to the dashboard!

---

## 🎉 Success Checklist

- [ ] Backend running on port 5001
- [ ] Frontend running on port 3000
- [ ] Can see landing page
- [ ] Can login with test account
- [ ] Can see dashboard with stats
- [ ] Can see existing voice clone
- [ ] Can generate new audio
- [ ] Can see audio history

---

## 🐛 Troubleshooting

**Backend won't start:**
- Make sure PostgreSQL database is accessible
- Check .env file has correct DATABASE_URL
- Run: `cd backend && npm install`

**Frontend won't start:**
- Run: `cd frontend && npm install`
- Delete `node_modules` and `package-lock.json`, then reinstall

**"Network Error" in browser:**
- Backend not running
- Check proxy settings in vite.config.js
- Try: http://localhost:5001/api/health in browser

**Can't login:**
- Check browser console for errors
- Check Network tab for API response
- Try registering a new account instead

---

## 📂 Final Project Structure

```
storytime-voice/
├── backend/              ← Already complete ✅
│   ├── server.js
│   ├── package.json
│   └── ... (all your backend files)
└── frontend/             ← New! 🎉
    ├── src/
    │   ├── components/
    │   ├── context/
    │   ├── pages/
    │   ├── services/
    │   └── App.jsx
    ├── index.html
    ├── package.json
    └── vite.config.js
```

---

## 🎯 What You Built

✅ Complete authentication system
✅ Protected routes
✅ Voice clone upload
✅ Audio generation interface
✅ Audio history viewer
✅ Responsive design
✅ Professional UI/UX
✅ Error handling
✅ Loading states

Total: **10 pages/components** + **1 API service** + **800+ lines of code**

---

## 🚀 Next Session Ideas

1. **Add Features:**
   - Audio waveform visualization
   - Drag-and-drop file upload
   - Toast notifications
   - Settings page

2. **Integrate Real APIs:**
   - ElevenLabs voice cloning
   - Cloudflare R2 storage
   - Payment system (Stripe)

3. **Deploy:**
   - Frontend: Vercel/Netlify
   - Backend: Render/Railway
   - Database: Already on Render ✅

---

Need help? Check the README.md in the frontend folder!