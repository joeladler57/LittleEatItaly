# Little Eat Italy - PRD

## Admin Access
- **URL**: /admin
- **Username**: admin
- **Password**: LittleEatItaly2024! (ändern nach erstem Login!)

## Personal/Mitarbeiter Access
- **URL**: /personal
- **PIN**: 1234 (Standard, änderbar in Admin → Einstellungen)

## Kellner-Terminal Access
- **URL**: /terminal
- **Kellner-PINs** (konfigurierbar im Admin → TERMINAL):
  | Name | PIN |
  |------|-----|
  | Marco | 1111 |
  | Lucia | 2222 |
  | Giuseppe | 3333 |
  | Sofia | 4444 |
  | Antonio | 5555 |
  | Elena | 6666 |
  | Roberto | 7777 |
  | Francesca | 8888 |
  | Paolo | 9999 |
  | Maria | 0000 |

## What's Been Implemented

### Dezember 2025 - Kellner-Terminal (Getestet ✅)
- ✅ **Kellner-Login** (`/terminal`):
  - 4-stelliger PIN für jeden Kellner
  - Große, mobilfreundliche Nummerntastatur
  - 12-Stunden Token-Gültigkeit
- ✅ **Tischauswahl**:
  - 20 vorkonfigurierte Tische
  - Grid-Ansicht für schnelle Auswahl
  - Tischnummer auf Bon gedruckt
- ✅ **Inhouse-Menü**:
  - Separates Menü nur für Terminal
  - Kategorien: Vorspeise, Pizza, Pasta, Salat, Hauptspeise, Nachspeise, Getränke
  - Preise und Extras pro Artikel
- ✅ **Bestellvorgang**:
  - Artikel antippen → Detailansicht
  - Anzahl wählen
  - Gang wählen (Vorspeise, Hauptspeise, Nachspeise, Getränke)
  - Optionale Notiz (z.B. "ohne Zwiebeln")
  - Warenkorb mit Gesamtsumme
  - "BON DRUCKEN" sendet Bestellung an Drucker
- ✅ **Admin-Verwaltung** (`/admin/shop` → TERMINAL):
  - Kellner: Name + 4-stelliger PIN (muss einzigartig sein)
  - Tische: Nummer + optionale Beschreibung
  - **Extras/Addons**: Addon-Gruppen erstellen und Kategorien zuweisen
  - Inhouse-Menü: Artikel mit Kategorie, Preis
- ✅ **Addon-Gruppen**:
  - Gruppen wie "Extra Belag", "Extras" erstellen
  - Optionen mit Name + Preis (z.B. "Extra Käse +1.50€")
  - Mehrfachauswahl oder Einzelauswahl
  - Gruppen auf Kategorien zuweisen (z.B. alle Pizzen bekommen "Extra Belag")
- ✅ **Auto-Druck**: Bestellungen werden automatisch in Druckwarteschlange eingefügt

### Februar 2026 - Epson TM-30III Bon-Druck (Implementiert ✅)
- ✅ **Drucker-Einstellungen** im Admin-Bereich (`/admin/shop` → DRUCKER Tab):
  - IP-Adresse und Port konfigurierbar
  - Auto-Druck bei Bestellannahme aktivierbar
  - Geräte-ID für ePOS SDK
- ✅ **Bon-Designer mit Live-Vorschau**:
  - Kopfzeile: Restaurant-Name (Größe/Fett), Adresse, Telefon
  - Bestellinfo: Bestellnummer (Größe/Fett), Datum, Kundenname, Telefon, Abholzeit
  - Artikel: Anzahl, Name, Größe, Optionen/Extras, Preis
  - Notizen: Mit/Ohne Rahmen, Fett
  - Summe: Gesamtpreis (Größe/Fett), Zahlungsart
  - Fußzeile: Dankestext, Eigener Text
- ✅ **Auto-Druck im Personal-Bereich**: Bon wird automatisch gedruckt beim Akzeptieren
- ✅ **Manueller Druck**: Drucker-Button bei bestätigten Bestellungen
- ✅ **Fallback**: Browser-Druckdialog wenn Epson nicht erreichbar

### Februar 2026 - Mobile UI Fix für "HEUTE"-Tab (Behoben ✅)
- ✅ **Scrolling Tab-Leiste**: Horizontale Scrollbar für Tabs auf mobilen Geräten
- ✅ **Uhrzeiten jetzt sichtbar**: Reservierungszeiten werden korrekt auf allen Bildschirmgrößen angezeigt
- ✅ **Responsive Layout**: Grid-basiertes Design für Zeit, Name und Personenanzahl

### Februar 2026 - Personal-App / Mitarbeiter-Login (Getestet ✅)
- ✅ **Separates Login für Mitarbeiter**:
  - 4-stelliger PIN-Code (konfigurierbar im Admin-Bereich)
  - Eigene URL `/personal` ohne Website-Navigation
  - 12-Stunden Token-Gültigkeit
- ✅ **Mitarbeiter-Dashboard**:
  - LIVE-Indikator mit 4-Sekunden-Polling
  - Sound-/Push-Benachrichtigungen
  - Filter: Neu, Zubereitung, Bereit, Alle
  - Bestellungen annehmen/ablehnen mit Zubereitungszeit für ASAP
  - Reservierungen bestätigen/stornieren
- ✅ **Wie GloriaFood-App**:
  - Mobile-optimiert für Tablets/Smartphones
  - Kein Zugriff auf Menü oder Einstellungen (nur Bestellungen/Reservierungen)

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
- Backend: **100% (50/50 Tests bestanden)** - PWA + Push + Staff Login
- Frontend: **100% alle Features verifiziert**
- Personal-App: PIN-Login, Dashboard, Filter, Bestellungen/Reservierungen
- PWA: Manifest, Service Worker, Icons, Notification Sound
- Push: VAPID, Subscribe, Unsubscribe, Test Notifications

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
- TERMINAL: Kellner, Tische und Inhouse-Menü verwalten
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

# Staff / Personal
POST /api/staff/login                  # PIN-Login für Mitarbeiter
GET  /api/staff/verify                 # Token verifizieren
GET  /api/staff/orders                 # Bestellungen für Personal
PUT  /api/staff/orders/{id}/status     # Bestellung Status ändern
GET  /api/staff/reservations           # Reservierungen für Personal
PUT  /api/staff/reservations/{id}/status # Reservierung Status ändern

# Terminal / Kellner-Terminal
POST /api/terminal/login               # Kellner-Login mit PIN
GET  /api/terminal/tables              # Alle Tische abrufen
GET  /api/terminal/menu                # Terminal-Menü abrufen
GET  /api/terminal/categories          # Kategorien abrufen
POST /api/terminal/orders              # Bestellung aufgeben (→ Druckwarteschlange)
GET  /api/terminal/orders              # Bestellungen abrufen
GET  /api/terminal/orders/today        # Heutige Bestellungen
GET  /api/terminal/waiters             # Kellner abrufen (Admin)
POST /api/terminal/waiters             # Kellner hinzufügen (Admin)
PUT  /api/terminal/waiters/{id}        # Kellner bearbeiten (Admin)
DELETE /api/terminal/waiters/{id}      # Kellner löschen (Admin)
POST /api/terminal/tables              # Tisch hinzufügen (Admin)
PUT  /api/terminal/tables/{id}         # Tisch bearbeiten (Admin)
DELETE /api/terminal/tables/{id}       # Tisch löschen (Admin)
GET  /api/terminal/menu/all            # Alle Menüartikel inkl. inaktive (Admin)
POST /api/terminal/menu                # Artikel hinzufügen (Admin)
PUT  /api/terminal/menu/{id}           # Artikel bearbeiten (Admin)
DELETE /api/terminal/menu/{id}         # Artikel löschen (Admin)
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
- **Web Push**: VAPID-Keys konfiguriert für Push-Benachrichtigungen

## Next Tasks
1. 🟡 **E-Mail-Benachrichtigungen aktivieren**: Resend API-Key in `/app/backend/.env` eintragen
2. 🟢 Impressum mit echten Firmendaten ergänzen (über Admin)
3. 🟢 Weitere Menü-Artikel hinzufügen (über Shop Admin)

## Mitarbeiter-App einrichten
**So richtest du die Personal-App für Mitarbeiter ein:**
1. Gehe zu `/admin/shop` → EINSTELLUNGEN
2. Setze den gewünschten 4-stelligen PIN unter "PERSONAL-PIN"
3. Speichere die Einstellungen
4. Teile deinen Mitarbeitern die URL `/personal` und den PIN mit

**Für Mitarbeiter:**
1. Öffne `/personal` auf dem Tablet/Handy
2. Gib den PIN ein (z.B. 1234)
3. Aktiviere Sound und Push für Benachrichtigungen
4. Die App aktualisiert automatisch alle 4 Sekunden

## PWA Installation & Push-Benachrichtigungen
**So installierst du die App auf deinem Handy:**
1. Öffne `/admin/shop` oder `/personal` im Browser
2. Klicke auf "INSTALLIEREN" im Banner oder im Menü
3. Die App erscheint auf deinem Startbildschirm

**So aktivierst du Push-Benachrichtigungen:**
1. Logge dich ein (Admin oder Personal)
2. Klicke auf das Glocken-Icon (🔔) in der Header-Leiste
3. Erlaube Benachrichtigungen wenn gefragt
4. Du erhältst jetzt Benachrichtigungen auch bei geschlossenem Browser!

## Druck-Station für Bon-Druck (Dezember 2025)
**Netzwerk-Drucker über ePOS-Print XML!** Der Epson TM-m30II wird direkt vom Browser angesteuert.

**WICHTIG:** Die Print-Station muss auf einem Gerät laufen, das im **gleichen WLAN** wie der Drucker ist (z.B. das alte Android-Handy).

**So funktioniert's:**
1. Öffne `/print-station` auf dem alten Android-Handy (im Restaurant-WLAN)
2. PIN eingeben (1234)
3. "Verbinden" tippen
4. Fertig! Bons werden automatisch gedruckt

**Technische Details:**
- Kommunikation über ePOS-Print XML API
- HTTP POST an `http://192.168.2.129:8008/cgi-bin/epos/service.cgi`
- Das Android-Handy fungiert als Brücke zwischen Cloud und lokalem Drucker

**Einstellungen (Zahnrad-Icon):**
- IP-Adresse ändern
- Port ändern (Standard: 8008)

**Funktionen:**
- ✅ Auto-Druck wenn Bestellung angenommen wird
- ✅ Manuelle Druck-Buttons
- ✅ Sound-Benachrichtigung
- ✅ Warteschlange-Anzeige
- ✅ Print-Historie

## Kellner-Terminal einrichten
**So richtest du das Terminal für Kellner ein:**
1. Gehe zu `/admin/shop` → TERMINAL
2. **Kellner hinzufügen**: Name + 4-stelliger PIN für jeden Kellner
3. **Tische hinzufügen**: Tischnummern (1, 2, ... oder "Terrasse 1", etc.)
4. **Inhouse-Menü pflegen**: Alle Artikel die per Terminal bestellt werden können

**Für Kellner:**
1. Öffne `/terminal` auf dem Tablet/Handy
2. PIN eingeben (z.B. 1111 für Marco)
3. Tisch wählen
4. Artikel antippen, Anzahl und Gang wählen
5. "BON DRUCKEN" drücken → Bestellung geht an die Küche

### Dezember 2025 - Desktop Warenkorb Fix (Behoben ✅)
- ✅ **Desktop Cart Layout Fix**: 
  - `overflow-x-hidden` aus OrderPage.jsx entfernt, das den Warenkorb abschnitt
  - Container-Padding und Sidebar-Breite für verschiedene Desktop-Auflösungen optimiert
  - "ZUR KASSE" Button ist jetzt auf allen Desktop-Bildschirmen (1920px, 1440px) vollständig sichtbar
  - Getestet auf 1920x1080 und 1440x900 Viewports

## Backlog / Zukünftige Features
- E-Mail-Benachrichtigungen aktivieren (Resend API-Key benötigt)
- Statistiken-Dashboard für Bestellungen/Reservierungen
- Code-Refactoring: `server.py` in separate Router aufteilen (über 1500 Zeilen, sollte in `/backend/routers/` aufgeteilt werden)
- Mehrsprachigkeit (DE/EN)
- Terminal: Extras/Addons pro Artikel konfigurieren
