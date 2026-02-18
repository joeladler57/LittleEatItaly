# Little Eat Italy - PRD

## Admin Access
- **URL**: /admin
- **Username**: admin
- **Password**: LittleEatItaly2024! (ändern nach erstem Login!)

## What's Been Implemented

### Februar 2026 - Bestell- & Reservierungssystem V2 (Getestet ✅)
- ✅ **Online Bestellsystem** (`/bestellen`): Warenkorb, Kategorien, Artikelauswahl, ASAP-Option, Zeitauswahl basierend auf Öffnungszeiten
- ✅ **Reservierungssystem** (`/reservieren`): Dynamische Datums-/Zeitauswahl basierend auf Öffnungszeiten und Feiertagen
- ✅ **Shop Admin** (`/admin/shop`): 
  - BESTELLUNGEN: Neue/Bestätigte/Stornierte Bestellungen verwalten, ASAP-Bestätigung mit Zubereitungszeit
  - RESERVIERUNGEN: Nach Datum gruppiert, Bestätigen/Ablehnen
  - MENÜ: Kategorien und Artikel verwalten
  - EINSTELLUNGEN: Öffnungszeiten pro Tag, Geschlossene Tage, Vorlaufzeiten, Restaurant-Infos
- ✅ **Nur Abholung & Barzahlung**: Wie gewünscht
- ⏸️ **E-Mail-Bestätigung**: Code bereit, Resend API-Key benötigt

### Test-Ergebnisse (18.02.2026)
- Backend: **100% (18/18 Tests bestanden)**
- Frontend: **100% bestanden**
- Vollständiger Bestellablauf getestet
- ASAP-Bestell-Workflow mit Admin-Zubereitungszeit funktioniert

### Frühere Updates
- ✅ **GlobalFood Menü-Integration**: Dynamische Speisekarte
- ✅ **Echte Links**: Uber Eats, Lieferando, Abholen, Reservierung
- ✅ **Social Media Links editierbar**: Instagram, Facebook, TikTok

### Pages
- ✅ **Startseite**: Hero mit Maradona Graffiti, 4 Action-Buttons
- ✅ **Menü** (`/menu`): GlobalFood API
- ✅ **Online Bestellen** (`/bestellen`): Eigenes Bestellsystem
- ✅ **Reservieren** (`/reservieren`): Tischreservierung
- ✅ **Über Uns**: Geschichte, Philosophie
- ✅ **Kontakt**: Formular + Infos
- ✅ **Impressum**: Rechtliche Infos

### Homepage Action Buttons
| Button | URL |
|--------|-----|
| UBER EATS | https://www.ubereats.com/de/store/little-eat-italy... |
| LIEFERANDO | https://order-now-toolkit.takeaway.com/widgets/button?restId=13007961 |
| BESTELLEN ZUM ABHOLEN | /bestellen (internes System) |
| TISCHRESERVIERUNG | /reservieren (internes System) |

### Admin Dashboard
**Webseiten-Verwaltung** (`/admin`):
- STARTSEITE, KONTAKT, IMPRESSUM, SOCIAL MEDIA, FOOTER, EINSTELLUNGEN

**Shop-Verwaltung** (`/admin/shop`):
- BESTELLUNGEN: Status verwalten (Neu → Bestätigt → Storniert), ASAP-Bestellungen mit Zubereitungszeit-Eingabe bestätigen
- RESERVIERUNGEN: Nach Datum gruppiert, Bestätigen/Stornieren
- MENÜ: Kategorien und Artikel verwalten (hinzufügen, bearbeiten, löschen)
- EINSTELLUNGEN: Öffnungszeiten pro Wochentag, Geschlossene Tage (Feiertage), Vorlaufzeiten, Restaurant-Kontaktdaten

### API Endpoints
```bash
# Shop Menu
GET  /api/shop/menu                    # Menü abrufen
PUT  /api/shop/menu                    # Menü aktualisieren (Admin)

# Orders
POST /api/shop/orders                  # Bestellung aufgeben
GET  /api/shop/orders                  # Alle Bestellungen (Admin)
PUT  /api/shop/orders/{id}/status      # Status ändern (Admin)

# Reservations
POST /api/shop/reservations            # Reservierung anfragen
GET  /api/shop/reservations            # Alle Reservierungen (Admin)
PUT  /api/shop/reservations/{id}/status # Status ändern (Admin)

# Settings
GET  /api/shop/settings                # Einstellungen abrufen
PUT  /api/shop/settings                # Einstellungen ändern (Admin)
```

### E-Mail Konfiguration
Für E-Mail-Bestätigungen Resend API-Key in `/app/backend/.env` eintragen:
```
RESEND_API_KEY=re_xxxxxxxxxxxx
SENDER_EMAIL=bestellung@little-eat-italy.de
```

### 3rd Party Integrations
- **GlobalFood API**: Restaurant Key `pQ5d8UmzbClR90Y1DR`
- **Resend**: E-Mail-Versand (API-Key benötigt)

## Next Tasks
1. 🟡 **E-Mail-Benachrichtigungen aktivieren**: Resend API-Key in `/app/backend/.env` eintragen
2. 🟢 Impressum mit echten Firmendaten ergänzen (über Admin)
3. 🟢 Weitere Menü-Artikel hinzufügen (über Shop Admin)

## Backlog / Zukünftige Features
- Push-Benachrichtigungen für neue Bestellungen (Browser-Notifications oder Telegram)
- Statistiken-Dashboard für Bestellungen/Reservierungen
- Code-Refactoring: `server.py` in separate Router aufteilen
- Mehrsprachigkeit (DE/EN)
