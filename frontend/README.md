# StoryTime Voice - Frontend

A modern React application for voice cloning and text-to-speech generation.

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ installed
- Backend server running on `http://localhost:5001`

### Installation

```bash
# Navigate to frontend directory
cd storytime-frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will open at `http://localhost:3000`

## 📁 Project Structure

```
storytime-frontend/
├── src/
│   ├── components/
│   │   ├── Navigation.jsx          # Top navigation bar
│   │   └── ProtectedRoute.jsx      # Auth route guard
│   ├── context/
│   │   └── AuthContext.jsx         # Global auth state
│   ├── pages/
│   │   ├── Home.jsx                # Landing page
│   │   ├── Login.jsx               # Login form
│   │   ├── Register.jsx            # Registration form
│   │   ├── Dashboard.jsx           # User dashboard
│   │   ├── VoiceClone.jsx          # Voice upload/management
│   │   └── GenerateAudio.jsx       # Text-to-speech generator
│   ├── services/
│   │   └── api.js                  # API client & endpoints
│   ├── App.jsx                     # Main app with routing
│   ├── App.css                     # All styles
│   └── main.jsx                    # React entry point
├── index.html
├── vite.config.js
└── package.json
```

## 🎯 Features

### Authentication
- User registration with validation
- Secure login with JWT tokens
- Protected routes
- Auto-redirect for unauthorized access
- Persistent login (localStorage)

### Voice Clone Management
- Upload audio files (MP3, WAV, M4A)
- View voice clone status
- Delete voice clone
- File validation (type & size)

### Audio Generation
- Convert text to speech
- Adjust stability & similarity settings
- Play generated audio
- View audio history
- Delete audio files

### Dashboard
- Overview of user stats
- Recent audio files
- Quick action buttons
- Voice status indicator

## 🔌 API Integration

The frontend connects to your backend at `http://localhost:5001/api`

### API Endpoints Used

**Authentication:**
- `POST /auth/register` - Create account
- `POST /auth/login` - Login
- `GET /auth/profile` - Get user profile

**Voice:**
- `POST /voices` - Upload voice clone
- `GET /voices/mine` - Get user's voice
- `GET /voices/status` - Check voice status
- `DELETE /voices/mine` - Delete voice

**Audio:**
- `POST /audio` - Generate audio
- `GET /audio/history` - Get audio list
- `GET /audio/:id` - Get single audio
- `DELETE /audio/:id` - Delete audio

## 🎨 Routes

| Route | Component | Auth Required | Description |
|-------|-----------|---------------|-------------|
| `/` | Home | No | Landing page |
| `/login` | Login | No | Login form |
| `/register` | Register | No | Registration form |
| `/dashboard` | Dashboard | Yes | User dashboard |
| `/voice-clone` | VoiceClone | Yes | Voice management |
| `/generate` | GenerateAudio | Yes | Audio generation |

## 🔐 Authentication Flow

1. User registers/logs in
2. JWT token stored in localStorage
3. Token automatically added to API requests
4. Protected routes check auth status
5. 401 responses trigger logout & redirect

## 💾 Local Storage

The app stores:
- `token` - JWT authentication token
- `user` - User profile data (firstName, email, etc.)

## 🎨 Styling

Built with custom CSS using:
- CSS Variables for theming
- Flexbox & Grid layouts
- Responsive design (mobile-first)
- Smooth transitions & animations

## 🛠️ Development

### Available Scripts

```bash
# Start dev server (hot reload)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Making Changes

**Add a new page:**
1. Create component in `src/pages/`
2. Add route in `src/App.jsx`
3. Add navigation link in `src/components/Navigation.jsx`

**Add new API endpoint:**
1. Open `src/services/api.js`
2. Add method to appropriate API object
3. Use in component with `async/await`

**Update styles:**
- All styles are in `src/App.css`
- Use existing CSS variables for consistency
- Follow BEM naming convention

## 🧪 Testing the App

### Test User Credentials
```
Email: newuser@test.com
Password: testpass123
```

This user already has:
- ✅ Account created
- ✅ Voice clone uploaded
- ✅ Sample audio files

### Testing Flow

1. **Start Backend:**
   ```bash
   cd ../backend
   node server.js
   ```

2. **Start Frontend:**
   ```bash
   npm run dev
   ```

3. **Test Authentication:**
   - Visit `http://localhost:3000`
   - Click "Log In"
   - Use test credentials above
   - Should redirect to dashboard

4. **Test Voice Clone:**
   - Go to "My Voice"
   - Should see existing voice clone
   - Try deleting (WARNING: will delete all audio too!)
   - Upload new audio file

5. **Test Audio Generation:**
   - Go to "Generate Audio"
   - Enter text (max 5000 chars)
   - Adjust stability/similarity sliders
   - Click "Generate Audio"
   - Audio should play automatically

## 🚨 Common Issues

### "Network Error" or "Failed to fetch"
- **Solution:** Make sure backend is running on port 5001
- Check `vite.config.js` proxy settings

### "401 Unauthorized"
- **Solution:** Token expired or invalid
- Clear localStorage and login again
- Check token in browser DevTools → Application → Local Storage

### Audio won't play
- **Solution:** Check audio URL in Network tab
- Verify mock services are returning valid URLs
- Try different browser

### File upload fails
- **Solution:** Check file type (MP3, WAV, M4A only)
- Verify file size < 10MB
- Check backend uploads directory exists

## 🔄 Connecting to Real APIs

Currently using mock services. To integrate real APIs:

### ElevenLabs Integration
1. Get API key from elevenlabs.io
2. Update `backend/services/elevenLabsService.js`
3. Replace mock responses with real API calls
4. No frontend changes needed!

### Cloudflare R2 Integration
1. Set up R2 bucket
2. Update `backend/services/storageService.js`
3. Configure environment variables
4. No frontend changes needed!

## 📱 Responsive Design

The app is fully responsive:
- **Desktop:** Full layout with sidebar
- **Tablet:** Collapsed navigation
- **Mobile:** Stacked layout, hamburger menu

Breakpoint: `768px`

## 🎯 Next Steps

### Immediate Improvements
- [ ] Add loading skeletons
- [ ] Add toast notifications
- [ ] Add audio waveform visualization
- [ ] Add drag-and-drop file upload
- [ ] Add progress bar for uploads

### Future Features
- [ ] User settings page
- [ ] Audio export in different formats
- [ ] Batch audio generation
- [ ] Voice comparison tool
- [ ] Audio editing capabilities

## 📄 License

MIT

## 👨‍💻 Support

For issues or questions:
1. Check backend is running
2. Check browser console for errors
3. Verify API endpoints in Network tab
4. Check localStorage for token

---

**Built with ❤️ using React + Vite**