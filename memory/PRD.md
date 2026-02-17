# Little Eat Italy - PRD

## Original Problem Statement
Build a modern website for "Little Eat Italy" Neapolitan pizzeria with urban, drippy, red/black/white graffiti style aesthetic. German language. CMS backend to manage all content. Action buttons for delivery services.

## User Personas
- **Pizza Lovers**: Looking for authentic Neapolitan pizza
- **Local Customers**: Neighborhood residents seeking quality dining  
- **Urban/Trendy Demographic**: Attracted by the street art aesthetic

## Core Requirements (Static)
- Modern graffiti/urban aesthetic with red/black/white palette
- German language throughout
- CMS backend for all text content management
- Hero background with Maradona graffiti from Naples
- Action buttons: Uber Eats, Lieferando, Bestellen zum Abholen, Tischreservierung
- Custom logos integrated (chef icon + drippy text logo)

## What's Been Implemented (Feb 17, 2026)
- ✅ Full-stack application (React + FastAPI + MongoDB)
- ✅ German language throughout all pages
- ✅ **CMS System**: Backend API to manage all content
  - PUT /api/content/hero - Update hero background & buttons
  - PUT /api/content/buttons - Update action button links
  - PUT /api/content/contact - Update contact page content
  - PUT /api/content/about - Update about page content
  - PUT /api/content/menu-page - Update menu page content
  - PUT /api/content/footer - Update footer content
  - GET /api/content - Get all site content
- ✅ Hero section with Maradona graffiti background
- ✅ 4 Action buttons with configurable links
- ✅ Custom logos (chef icon + drippy text logo)
- ✅ Enhanced animations and drip effects
- ✅ Improved text readability (neutral-200/300 instead of muted)
- ✅ Menu CRUD operations

## API Endpoints for Content Management
```bash
# Update hero section (background + buttons)
curl -X PUT /api/content/hero -d '{
  "background_image": "https://...",
  "subtitle": "...",
  "buttons": [
    {"id": "uber_eats", "label": "UBER EATS", "url": "https://ubereats.com/...", "is_active": true, "icon": "utensils"}
  ]
}'

# Update just the buttons
curl -X PUT /api/content/buttons -d '[
  {"id": "uber_eats", "label": "UBER EATS", "url": "https://...", "is_active": true, "icon": "utensils"}
]'
```

## Prioritized Backlog
### P0 - Complete
- All core pages with German content
- CMS system for content management
- Action buttons for delivery services

### P1 - Next Features  
- Admin dashboard UI for content management
- Image upload functionality
- Menu item management UI

### P2 - Future Enhancements
- Online ordering integration
- Real Uber Eats/Lieferando API integration
- Customer reviews section

## Next Tasks
1. Build admin dashboard UI for easier content management
2. Add image upload for menu items
3. Connect real delivery service URLs
