# Little Eat Italy - PRD

## Original Problem Statement
Build a modern website for "Little Eat Italy" Neapolitan pizzeria with urban graffiti style. German language. Password-protected admin dashboard for content management.

## Admin Access
- **URL**: /admin
- **Username**: admin
- **Password**: LittleEatItaly2024! (ändern nach erstem Login!)

## What's Been Implemented (Feb 17, 2026)

### Core Website
- ✅ Full-stack app (React + FastAPI + MongoDB)
- ✅ German language throughout
- ✅ Urban graffiti design with red/black/white palette
- ✅ Custom logos (chef icon + drippy text)
- ✅ Maradona graffiti hero background
- ✅ 4 Action buttons (Uber Eats, Lieferando, Abholen, Tischreservierung)

### Admin Dashboard (NEW)
- ✅ Password-protected login (JWT authentication)
- ✅ Small "Admin" link in footer
- ✅ **STARTSEITE Tab**: Edit hero background & action button URLs
- ✅ **KONTAKT Tab**: Edit address, phone, email, opening hours
- ✅ **FOOTER Tab**: Edit marquee text, description, copyright
- ✅ **EINSTELLUNGEN Tab**: Change admin password
- ✅ Logout functionality

### API Endpoints
```
POST /api/auth/login        - Admin login
GET  /api/auth/verify       - Verify JWT token
POST /api/auth/change-password - Change password

PUT  /api/content/hero      - Update hero section
PUT  /api/content/contact   - Update contact info
PUT  /api/content/footer    - Update footer
GET  /api/content           - Get all content
```

## Next Tasks
1. Add menu item management to admin dashboard
2. Add image upload functionality
3. Connect real delivery service URLs
