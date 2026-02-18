# Little Eat Italy - PRD

## Admin Access
- **URL**: /admin
- **Username**: admin
- **Password**: LittleEatItaly2024! (ändern nach erstem Login!)

## What's Been Implemented

### Februar 2026 - Web Push Notifications (Getestet ✅)
- ✅ **Push-Benachrichtigungen bei geschlossenem Browser**:
  - Automatische Benachrichtigung bei neuen Bestellungen/Reservierungen
  - Funktioniert auch wenn Browser/App geschlossen ist
  - VAPID-Authentifizierung für sichere Push-Kommunikation
  - Push-Button zum Aktivieren/Deaktivieren im Admin-Bereich
  - Test-Notification-Button zum Testen
- ✅ **Push-Endpoints**:
  - `/api/push/vapid-key` - Öffentlicher VAPID-Schlüssel
  - `/api/push/subscribe` - Gerät für Push registrieren
  - `/api/push/unsubscribe` - Push deaktivieren
  - `/api/push/subscriptions` - Alle registrierten Geräte anzeigen
  - `/api/push/test` - Test-Benachrichtigung senden

### Februar 2026 - PWA Restaurant Admin App (Getestet ✅)
- ✅ **Progressive Web App (PWA)**: 
  - Installierbar auf Mobilgeräten (Android/iOS)
  - Offline-fähig durch Service Worker
  - App-Icons in allen Größen (72px - 512px)
  - Start-URL: `/admin/shop`
- ✅ **Echtzeit-Benachrichtigungen**:
  - Automatisches Polling alle 4 Sekunden
  - Audio-Benachrichtigung bei neuen Bestellungen/Reservierungen
  - Visueller LIVE-Indikator (grün pulsierend)
  - Sound-Toggle zum Ein-/Ausschalten
  - Vibration auf Mobilgeräten
- ✅ **Mobile-optimierte Verwaltung**:
  - Responsive Layout für alle Bildschirmgrößen
  - PWA Install-Banner für einfache Installation
  - Stat-Karten pulsieren bei neuen Eingängen

### Februar 2026 - Bestell- & Reservierungssystem V2 (Getestet ✅)
- ✅ **Online Bestellsystem** (`/bestellen`): Warenkorb, Kategorien, Artikelauswahl, ASAP-Option, Zeitauswahl basierend auf Öffnungszeiten
- ✅ **Reservierungssystem** (`/reservieren`): Dynamische Datums-/Zeitauswahl basierend auf Öffnungszeiten und Feiertagen
- ✅ **Zahlungsart-Auswahl**: Barzahlung oder Kartenzahlung bei Abholung wählbar
- ✅ **Safari-kompatible Dropdowns**: Custom Dropdown-Komponenten für volle Browser-Kompatibilität
- ✅ **Add-on System**: 
  - Globale Add-on Gruppen (z.B. Dressing, Extras) mit Optionen und Aufpreisen
  - Kategorien können Add-on Gruppen zugeordnet bekommen
  - Pflicht- und Mehrfachauswahl möglich
  - Im Frontend werden Add-ons bei Bestellung angezeigt
- ✅ **Shop Admin** (`/admin/shop`): 
  - BESTELLUNGEN: Neue/Bestätigte/Stornierte Bestellungen verwalten, ASAP-Bestätigung mit Zubereitungszeit, Zahlungsart-Anzeige
  - RESERVIERUNGEN: Nach Datum gruppiert, Bestätigen/Ablehnen
  - MENÜ: Kategorien und Artikel verwalten, Add-on Gruppen erstellen und zuordnen
  - EINSTELLUNGEN: Öffnungszeiten pro Tag, Geschlossene Tage, Vorlaufzeiten, Restaurant-Infos
- ✅ **Nur Abholung**: Bar oder Kartenzahlung bei Abholung
- ⏸️ **E-Mail-Bestätigung**: Code bereit, Resend API-Key benötigt

### Test-Ergebnisse (18.02.2026)
- Backend: **100% (28/28 Tests bestanden)** - PWA + Push Notifications
- Frontend: **100% alle Features verifiziert**
- PWA: Manifest, Service Worker, Icons, Notification Sound
- Push: VAPID, Subscribe, Unsubscribe, Test Notifications
- Polling-Mechanismus, Mobile Layout - alles funktional

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

**Shop-Verwaltung** (`/admin/shop`) - **PWA**:
- 🟢 **LIVE-Modus**: Automatische Aktualisierung alle 4 Sekunden
- 🔔 **Audio-Benachrichtigungen**: Ton bei neuen Bestellungen/Reservierungen
- 📱 **PWA-Installation**: Als App auf Handy installierbar
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

## PWA Installation
**So installierst du die App auf deinem Handy:**
1. Öffne `/admin/shop` im Browser auf deinem Handy
2. Klicke auf "INSTALLIEREN" im Banner oder im Menü
3. Die App erscheint auf deinem Startbildschirm
4. Öffne die App - sie zeigt automatisch neue Bestellungen mit Ton-Benachrichtigung!

## Backlog / Zukünftige Features
- Push-Benachrichtigungen (Web Push API) für Hintergrund-Notifications
- Statistiken-Dashboard für Bestellungen/Reservierungen
- Code-Refactoring: `server.py` in separate Router aufteilen
- Mehrsprachigkeit (DE/EN)
