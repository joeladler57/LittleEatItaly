# Little Eat Italy - PRD

## Admin Access
- **URL**: /admin
- **Username**: admin
- **Password**: LittleEatItaly2024! (ändern nach erstem Login!)

## What's Been Implemented

### Dezember 2025
- ✅ **GlobalFood Menü-Integration**: Dynamische Speisekarte von GlobalFood API
- ✅ **Bestellen zum Abholen**: Link zu https://www.foodbooking.com/api/fb/_q_y4z_v
- ✅ **Tischreservierung**: Link zu https://www.foodbooking.com/api/res/_q_y4z_v
- ✅ **Echte Uber Eats Link**: https://www.ubereats.com/de/store/little-eat-italy-pizza-napoletana-e-bar/...
- ✅ **Echte Lieferando Link**: https://order-now-toolkit.takeaway.com/widgets/button?restId=13007961
- ✅ **Social Media Links editierbar**: Instagram, Facebook, TikTok im Admin Dashboard
- ✅ **Instagram Feed Slider**: Drippy Design mit manuellen Posts auf der Startseite

### Pages
- ✅ **Startseite**: Hero mit Maradona Graffiti, 4 Action-Buttons, Features, Instagram Feed
- ✅ **Menü**: GlobalFood API Integration mit Kategorien (Vorspeisen, Pizza, Pasta, Insalata)
- ✅ **Über Uns**: Geschichte, Philosophie, Stats
- ✅ **Kontakt**: Erweitertes Formular + Kontaktinfos
- ✅ **Impressum**: Deutsche Rechtsstandards (§5 TMG, etc.)

### Homepage Action Buttons
| Button | URL |
|--------|-----|
| UBER EATS | https://www.ubereats.com/de/store/little-eat-italy-pizza-napoletana-e-bar/... |
| LIEFERANDO | https://order-now-toolkit.takeaway.com/widgets/button?restId=13007961 |
| BESTELLEN ZUM ABHOLEN | https://www.foodbooking.com/api/fb/_q_y4z_v |
| TISCHRESERVIERUNG | https://www.foodbooking.com/api/res/_q_y4z_v |

### Admin Dashboard Tabs
1. **STARTSEITE**: Hintergrundbild, Untertitel, 4 Action-Buttons (URLs)
2. **KONTAKT**: Adresse, Telefon, E-Mail, Öffnungszeiten, Formular-Einstellungen
3. **IMPRESSUM**: Titel + Markdown-Inhalt vollständig editierbar
4. **SOCIAL MEDIA**: Instagram/Facebook/TikTok Links + Instagram Feed Posts verwalten
5. **FOOTER**: Lauftext, Beschreibung, Copyright
6. **EINSTELLUNGEN**: Passwort ändern

### API Endpoints
```bash
# Content
GET  /api/content              # Alle Inhalte
PUT  /api/content/hero         # Hero-Bereich
PUT  /api/content/buttons      # Action-Buttons aktualisieren
PUT  /api/content/contact      # Kontaktseite
PUT  /api/content/impressum    # Impressum (Markdown)
PUT  /api/content/footer       # Footer + Social Media + Instagram Feed

# GlobalFood Menu
GET  /api/globalfood/menu      # Menü von GlobalFood API

# Auth
POST /api/auth/login           # Admin Login
GET  /api/auth/verify          # Token prüfen
POST /api/auth/change-password # Passwort ändern

# Kontakt
POST /api/contact              # Nachricht senden
GET  /api/contact              # Alle Nachrichten
```

### 3rd Party Integrations
- **GlobalFood API**: Restaurant Key `pQ5d8UmzbClR90Y1DR`
- **FoodBooking**: Abholen und Reservierung Links
- **Uber Eats**: Direkter Store Link
- **Lieferando**: Widget Button Link

## Next Tasks
1. E-Mail-Benachrichtigung bei neuen Kontaktanfragen
2. Bildergalerie hinzufügen
3. Echte Instagram Bilder im Admin hinzufügen
