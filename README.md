# Mission Gallery

A SmugMug-inspired photography mission management platform with AI-powered features, built for Replit deployment.

## Features

### 🎯 Mission-Based Organization

- Create photography missions for trips and locations
- Organize images by mission with separate galleries for public viewing
- Control visibility of individual images (public/private)

### 🤖 AI-Powered Tools (5 Providers, 20+ Models)

- **AI Mission Generation**: Generate detailed photography mission plans based on location and trip summary
- **Multi-AI Provider Support**: Choose from Groq, Together AI, Google Gemini, Anthropic Claude, or OpenAI
- **Smart Fallback**: Automatically switches providers if one is rate-limited
- **AI Gear List**: Automatically generate comprehensive photography gear lists
- **Gear Details**: Get detailed specifications and information about photography equipment

### 🖼️ Gallery Management

- Create multiple galleries from mission images
- Public and private gallery modes
- Customizable layouts: Grid, Masonry, Slideshow
- Diptych and Triptych support
- Share public galleries via unique URLs

### 🔐 Authentication

- Google OAuth integration
- Secure session management

## Tech Stack

### Backend

- Node.js + Express
- MongoDB + Mongoose
- Passport.js (Google OAuth)
- Cloudinary (image hosting)
- Multi-AI Integration:
  - Groq (Llama, Mixtral, Qwen)
  - Together AI (Llama, Mixtral)
  - Google Gemini (1.5/2.5 Flash, Pro)
  - Anthropic Claude (3.5 Haiku, Sonnet)
  - OpenAI (GPT-4o, GPT-4o Mini)

### Frontend

- React 18
- React Router
- TailwindCSS
- Lucide Icons
- Framer Motion
- React Dropzone

## Setup Instructions

### 1. Environment Variables

Create a `.env` file in the root directory:

```env
# Required
MONGODB_URI=your_mongodb_connection_string
SESSION_SECRET=your_random_session_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
CALLBACK_URL=https://your-replit-url.repl.co/auth/google/callback
CLIENT_URL=https://your-replit-url.repl.co
PORT=3001

# Cloudinary (for image hosting)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# AI Providers (add at least one)
GROQ_API_KEY=gsk_your_key_here                    # Recommended: Best free tier (30 req/min)
GEMINI_API_KEY=AIza_your_key_here                 # Cheap backup option
TOGETHER_API_KEY=your_key_here                    # Optional: $25 free credit
ANTHROPIC_API_KEY=sk-ant_your_key_here            # Optional: Claude models
OPENAI_API_KEY=sk_your_key_here                   # Optional: Premium option
```

**Quick Start:** Only `GROQ_API_KEY` is needed for AI features! See [AI_PROVIDERS_SETUP.md](AI_PROVIDERS_SETUP.md) for details.

### 2. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `https://your-replit-url.repl.co/auth/google/callback`
6. Copy Client ID and Client Secret to `.env`

### 3. MongoDB Setup

Option A: MongoDB Atlas (Recommended for Replit)

1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Get connection string and add to `.env`

Option B: Local MongoDB

- Use `mongodb://localhost:27017/mission-gallery`

### 4. OpenAI API Key

1. Get API key from [OpenAI Platform](https://platform.openai.com/)
2. Add to `.env` file

### 5. Installation

```bash
npm install
```

### 6. Development

```bash
# Run both frontend and backend
npm run dev

# Backend only
npm run server

# Frontend only
npm run client
```

### 7. Production Build

```bash
npm run build
npm start
```

## Replit Deployment

### Quick Start on Replit

1. **Import to Replit**

   - Click "Import from GitHub" or upload the project
   - Replit will detect the configuration automatically

2. **Set Secrets (Environment Variables)**

   - Go to "Secrets" tab in Replit
   - Add all environment variables from `.env.example`
   - Update `CALLBACK_URL` and `CLIENT_URL` with your Replit URL

3. **Configure Google OAuth**

   - Update redirect URI in Google Console with your Replit URL
   - Format: `https://your-project.your-username.repl.co/auth/google/callback`

4. **Run the Application**
   - Click "Run" button
   - Replit will execute `npm start`

### Replit Configuration Files

- `.replit` - Defines run command and deployment settings
- `replit.nix` - Specifies system dependencies

## Usage Guide

### Creating a Mission

1. **Manual Creation**

   - Click "Create Mission" in dashboard
   - Fill in title, description, location, dates
   - Choose layout preferences
   - Toggle diptych/triptych options

2. **AI-Assisted Creation**
   - Click "Generate Missions with AI"
   - Enter location and trip summary
   - Select preferences
   - Choose from AI-generated mission ideas

### Managing Images

1. **Upload Images**

   - Open mission detail page
   - Drag & drop images or click to select
   - Images are automatically processed and thumbnailed

2. **Control Visibility**
   - Click eye icon on each image
   - Green eye = public, gray eye = private
   - Only public images appear in public galleries

### Creating Galleries

1. **From Mission**

   - Open mission detail page
   - Click "Create Gallery"
   - Gallery includes all mission images

2. **Customize Gallery**
   - Toggle public/private status
   - Choose layout (Grid, Masonry, Slideshow)
   - Remove unwanted images
   - Share public URL

### Generating Gear Lists

1. Open mission detail page
2. Click "Generate with AI"
3. Provide optional inputs:
   - Trip duration
   - Weather conditions
   - Photography style
   - Budget range
4. Review AI-generated gear recommendations
5. Click info icon for detailed specifications

## API Endpoints

### Authentication

- `GET /auth/google` - Initiate Google OAuth
- `GET /auth/google/callback` - OAuth callback
- `GET /auth/logout` - Logout user
- `GET /auth/user` - Get current user

### Missions

- `GET /api/missions` - Get all user missions
- `GET /api/missions/:id` - Get single mission
- `POST /api/missions` - Create mission
- `PUT /api/missions/:id` - Update mission
- `DELETE /api/missions/:id` - Delete mission
- `POST /api/missions/generate` - AI generate missions
- `POST /api/missions/:id/gear` - AI generate gear list

### Images

- `POST /api/images/upload/:missionId` - Upload images
- `GET /api/images/mission/:missionId` - Get mission images
- `PUT /api/images/:id` - Update image
- `DELETE /api/images/:id` - Delete image
- `POST /api/images/reorder` - Reorder images

### Galleries

- `GET /api/galleries` - Get user galleries
- `GET /api/galleries/:id` - Get single gallery
- `GET /api/galleries/public/:slug` - Get public gallery
- `POST /api/galleries` - Create gallery
- `PUT /api/galleries/:id` - Update gallery
- `DELETE /api/galleries/:id` - Delete gallery
- `POST /api/galleries/:id/images` - Add images to gallery
- `DELETE /api/galleries/:id/images/:imageId` - Remove image

## Project Structure

```
mission-gallery/
├── server/
│   ├── config/
│   │   └── passport.js          # Passport configuration
│   ├── middleware/
│   │   └── auth.js              # Authentication middleware
│   ├── models/
│   │   ├── User.js              # User model
│   │   ├── Mission.js           # Mission model
│   │   ├── Image.js             # Image model
│   │   └── Gallery.js           # Gallery model
│   ├── routes/
│   │   ├── auth.js              # Auth routes
│   │   ├── missions.js          # Mission routes
│   │   ├── images.js            # Image routes
│   │   └── galleries.js         # Gallery routes
│   ├── services/
│   │   └── aiService.js         # OpenAI integration
│   └── index.js                 # Server entry point
├── src/
│   ├── components/
│   │   └── Navbar.jsx           # Navigation component
│   ├── context/
│   │   └── AuthContext.jsx      # Auth context provider
│   ├── pages/
│   │   ├── Home.jsx             # Landing page
│   │   ├── Login.jsx            # Login page
│   │   ├── Dashboard.jsx        # User dashboard
│   │   ├── CreateMission.jsx    # Mission creation
│   │   ├── MissionDetail.jsx    # Mission detail & images
│   │   ├── GalleryView.jsx      # Gallery editor
│   │   └── PublicGallery.jsx    # Public gallery view
│   ├── App.jsx                  # App component
│   ├── main.jsx                 # React entry point
│   └── index.css                # Global styles
├── uploads/                     # Image storage (gitignored)
├── .env                         # Environment variables (gitignored)
├── .env.example                 # Environment template
├── package.json                 # Dependencies
├── vite.config.js               # Vite configuration
├── tailwind.config.js           # Tailwind configuration
└── README.md                    # This file
```

## Features in Detail

### Diptych & Triptych Support

- Toggle options during mission creation
- AI considers these preferences when generating missions
- Layout system supports multi-image compositions

### Customizable Layouts

- **Grid**: Traditional photo grid
- **Masonry**: Pinterest-style layout
- **Slideshow**: Full-width sequential display
- **Custom**: Advanced layout options (extensible)

### Public vs Private Images

- Mission galleries contain all images (private workspace)
- Public galleries only show images marked as public
- Fine-grained control over what viewers see

## Troubleshooting

### Images not uploading

- Check file size limits (50MB max)
- Verify upload directory permissions
- Check server logs for errors

### OAuth not working

- Verify redirect URI matches exactly
- Check Google Console credentials
- Ensure HTTPS in production

### AI features failing

- Verify OpenAI API key is valid
- Check API quota and billing
- Review server logs for errors

## Future Enhancements

- [ ] Bulk image editing
- [ ] Advanced search and filtering
- [ ] Image metadata extraction (EXIF)
- [ ] Social sharing integrations
- [ ] Collaborative galleries
- [ ] Mobile app
- [ ] Advanced layout builder
- [ ] Print ordering integration

## License

MIT License - feel free to use for personal or commercial projects.

## Support

For issues or questions:

1. Check the troubleshooting section
2. Review server logs
3. Check browser console for frontend errors
4. Verify all environment variables are set correctly

---

Built with ❤️ for photographers who love organized adventures.
