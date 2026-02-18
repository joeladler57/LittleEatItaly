import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import { API } from "../App";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { toast } from "sonner";
import { 
  LogOut, Save, Image, Link as LinkIcon, Type, 
  Phone, Mail, Clock, MapPin, Settings, Lock, FileText, MessageSquare,
  Instagram, Facebook, Share2, Plus, Trash2
} from "lucide-react";

const AdminPage = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [content, setContent] = useState(null);
  const [saving, setSaving] = useState(false);
  const [passwordData, setPasswordData] = useState({ current_password: "", new_password: "", confirm_password: "" });

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (token) {
      verifyToken(token);
    } else {
      setIsLoading(false);
    }
  }, []);

  const verifyToken = async (token) => {
    try {
      await axios.get(`${API}/auth/verify`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsAuthenticated(true);
      fetchContent();
    } catch (e) {
      localStorage.removeItem("admin_token");
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchContent = async () => {
    try {
      const response = await axios.get(`${API}/content`);
      // Ensure impressum exists
      if (!response.data.impressum) {
        response.data.impressum = { title: "IMPRESSUM", content: "" };
      }
      setContent(response.data);
    } catch (e) {
      toast.error("Fehler beim Laden der Inhalte");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API}/auth/login`, loginData);
      localStorage.setItem("admin_token", response.data.access_token);
      setIsAuthenticated(true);
      fetchContent();
      toast.success("Erfolgreich eingeloggt!");
    } catch (e) {
      toast.error("Login fehlgeschlagen. Bitte Zugangsdaten überprüfen.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    setIsAuthenticated(false);
    navigate("/");
    toast.success("Erfolgreich ausgeloggt!");
  };

  const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("admin_token")}` }
  });

  const saveHeroContent = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/content/hero`, content.hero, getAuthHeader());
      toast.success("Hero-Bereich gespeichert!");
    } catch (e) {
      toast.error("Fehler beim Speichern");
    } finally {
      setSaving(false);
    }
  };

  const saveContactContent = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/content/contact`, content.contact_page, getAuthHeader());
      toast.success("Kontaktseite gespeichert!");
    } catch (e) {
      toast.error("Fehler beim Speichern");
    } finally {
      setSaving(false);
    }
  };

  const saveFooterContent = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/content/footer`, content.footer, getAuthHeader());
      toast.success("Footer gespeichert!");
    } catch (e) {
      toast.error("Fehler beim Speichern");
    } finally {
      setSaving(false);
    }
  };

  const saveImpressumContent = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/content/impressum`, content.impressum, getAuthHeader());
      toast.success("Impressum gespeichert!");
    } catch (e) {
      toast.error("Fehler beim Speichern");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error("Passwörter stimmen nicht überein");
      return;
    }
    try {
      await axios.post(`${API}/auth/change-password`, {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      }, getAuthHeader());
      toast.success("Passwort geändert!");
      setPasswordData({ current_password: "", new_password: "", confirm_password: "" });
    } catch (e) {
      toast.error("Fehler beim Ändern des Passworts");
    }
  };

  const updateButton = (index, field, value) => {
    const newButtons = [...content.hero.buttons];
    newButtons[index] = { ...newButtons[index], [field]: value };
    setContent({ ...content, hero: { ...content.hero, buttons: newButtons } });
  };

  const updateHour = (index, field, value) => {
    const newHours = [...content.contact_page.hours];
    newHours[index] = { ...newHours[index], [field]: value };
    setContent({ ...content, contact_page: { ...content.contact_page, hours: newHours } });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-pizza-black flex items-center justify-center pt-20">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-pizza-red border-t-transparent rounded-full" />
      </div>
    );
  }

  // Login Form
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-pizza-black flex items-center justify-center pt-20 px-4">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="text-center mb-8">
            <Lock className="w-16 h-16 text-pizza-red mx-auto mb-4" />
            <h1 className="font-anton text-4xl tracking-wider text-pizza-white">
              ADMIN <span className="text-pizza-red">LOGIN</span>
            </h1>
            <p className="font-mono text-sm text-neutral-400 mt-2">Nur für autorisierte Benutzer</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6 p-8 border border-pizza-dark bg-pizza-dark/30">
            <div>
              <Label className="font-mono text-sm text-neutral-300 mb-2 block">BENUTZERNAME</Label>
              <Input type="text" value={loginData.username} onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                required data-testid="admin-username-input"
                className="bg-pizza-black border-pizza-dark focus:border-pizza-red text-pizza-white font-mono rounded-none h-12"
                placeholder="Benutzername" />
            </div>
            <div>
              <Label className="font-mono text-sm text-neutral-300 mb-2 block">PASSWORT</Label>
              <Input type="password" value={loginData.password} onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                required data-testid="admin-password-input"
                className="bg-pizza-black border-pizza-dark focus:border-pizza-red text-pizza-white font-mono rounded-none h-12"
                placeholder="••••••••" />
            </div>
            <Button type="submit" data-testid="admin-login-btn"
              className="w-full bg-pizza-red hover:bg-red-700 text-pizza-white font-anton text-lg tracking-widest py-6 rounded-none">
              EINLOGGEN
            </Button>
          </form>
          <p className="text-center mt-6">
            <a href="/" className="font-mono text-sm text-neutral-400 hover:text-pizza-red transition-colors">← Zurück zur Webseite</a>
          </p>
        </motion.div>
      </div>
    );
  }

  // Admin Dashboard
  return (
    <div className="min-h-screen bg-pizza-black pt-24 pb-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="font-anton text-3xl sm:text-4xl tracking-wider text-pizza-white">
              ADMIN <span className="text-pizza-red">DASHBOARD</span>
            </h1>
            <p className="font-mono text-sm text-neutral-400 mt-1">Verwalte alle Inhalte deiner Webseite</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate("/admin/shop")} 
              className="bg-pizza-red hover:bg-red-700 text-pizza-white font-mono rounded-none">
              🍕 Shop Verwaltung
            </Button>
            <Button onClick={handleLogout} data-testid="admin-logout-btn"
              className="bg-transparent border border-pizza-dark hover:border-pizza-red text-neutral-300 hover:text-pizza-red font-mono rounded-none">
              <LogOut className="w-4 h-4 mr-2" />Ausloggen
            </Button>
          </div>
        </div>

        {content && (
          <Tabs defaultValue="hero" className="w-full">
            <TabsList className="flex flex-wrap gap-2 mb-8 bg-transparent">
              {[
                { id: "hero", label: "STARTSEITE", icon: Image },
                { id: "contact", label: "KONTAKT", icon: Phone },
                { id: "impressum", label: "IMPRESSUM", icon: FileText },
                { id: "social", label: "SOCIAL MEDIA", icon: Share2 },
                { id: "footer", label: "FOOTER", icon: Type },
                { id: "settings", label: "EINSTELLUNGEN", icon: Settings },
              ].map((tab) => (
                <TabsTrigger key={tab.id} value={tab.id}
                  className="flex items-center gap-2 font-anton text-sm tracking-widest px-4 py-3 rounded-none border border-pizza-dark data-[state=active]:bg-pizza-red data-[state=active]:border-pizza-red data-[state=active]:text-pizza-white text-neutral-400 hover:border-pizza-red transition-all">
                  <tab.icon className="w-4 h-4" />{tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Hero Section */}
            <TabsContent value="hero" className="space-y-6">
              <div className="p-6 border border-pizza-dark bg-pizza-dark/20">
                <h2 className="font-anton text-xl tracking-wider text-pizza-white mb-6 flex items-center gap-2">
                  <Image className="w-5 h-5 text-pizza-red" />HERO-BEREICH
                </h2>
                <div className="space-y-4">
                  <div>
                    <Label className="font-mono text-sm text-neutral-300 mb-2 block">HINTERGRUNDBILD URL</Label>
                    <Input value={content.hero?.background_image || ""} onChange={(e) => setContent({ ...content, hero: { ...content.hero, background_image: e.target.value } })}
                      className="bg-pizza-black border-pizza-dark focus:border-pizza-red text-pizza-white font-mono rounded-none" placeholder="https://..." />
                  </div>
                  <div>
                    <Label className="font-mono text-sm text-neutral-300 mb-2 block">UNTERTITEL</Label>
                    <Textarea value={content.hero?.subtitle || ""} onChange={(e) => setContent({ ...content, hero: { ...content.hero, subtitle: e.target.value } })}
                      className="bg-pizza-black border-pizza-dark focus:border-pizza-red text-pizza-white font-mono rounded-none min-h-[100px]" />
                  </div>
                </div>
                <h3 className="font-anton text-lg tracking-wider text-pizza-white mt-8 mb-4 flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-pizza-red" />ACTION BUTTONS
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {content.hero?.buttons?.map((button, index) => (
                    <div key={button.id} className="p-4 border border-pizza-dark bg-pizza-black/50">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-anton text-sm text-pizza-red">{button.label}</span>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <span className="font-mono text-xs text-neutral-400">Aktiv</span>
                          <input type="checkbox" checked={button.is_active} onChange={(e) => updateButton(index, "is_active", e.target.checked)} className="w-4 h-4 accent-pizza-red" />
                        </label>
                      </div>
                      <div className="space-y-2">
                        <Input value={button.label} onChange={(e) => updateButton(index, "label", e.target.value)} placeholder="Button Text"
                          className="bg-pizza-black border-pizza-dark focus:border-pizza-red text-pizza-white font-mono rounded-none text-sm" />
                        <Input value={button.url} onChange={(e) => updateButton(index, "url", e.target.value)} placeholder="https://..."
                          className="bg-pizza-black border-pizza-dark focus:border-pizza-red text-pizza-white font-mono rounded-none text-sm" />
                      </div>
                    </div>
                  ))}
                </div>
                <Button onClick={saveHeroContent} disabled={saving} className="mt-6 bg-pizza-red hover:bg-red-700 text-pizza-white font-anton tracking-widest rounded-none">
                  <Save className="w-4 h-4 mr-2" />{saving ? "SPEICHERN..." : "HERO SPEICHERN"}
                </Button>
              </div>
            </TabsContent>

            {/* Contact Section */}
            <TabsContent value="contact" className="space-y-6">
              <div className="p-6 border border-pizza-dark bg-pizza-dark/20">
                <h2 className="font-anton text-xl tracking-wider text-pizza-white mb-6 flex items-center gap-2">
                  <Phone className="w-5 h-5 text-pizza-red" />KONTAKTINFORMATIONEN
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="font-mono text-sm text-neutral-300 mb-2 block flex items-center gap-2"><MapPin className="w-4 h-4 text-pizza-red" />ADRESSE ZEILE 1</Label>
                      <Input value={content.contact_page?.address_line1 || ""} onChange={(e) => setContent({ ...content, contact_page: { ...content.contact_page, address_line1: e.target.value } })}
                        className="bg-pizza-black border-pizza-dark focus:border-pizza-red text-pizza-white font-mono rounded-none" />
                    </div>
                    <div>
                      <Label className="font-mono text-sm text-neutral-300 mb-2 block">ADRESSE ZEILE 2</Label>
                      <Input value={content.contact_page?.address_line2 || ""} onChange={(e) => setContent({ ...content, contact_page: { ...content.contact_page, address_line2: e.target.value } })}
                        className="bg-pizza-black border-pizza-dark focus:border-pizza-red text-pizza-white font-mono rounded-none" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label className="font-mono text-sm text-neutral-300 mb-2 block flex items-center gap-2"><Phone className="w-4 h-4 text-pizza-red" />TELEFON</Label>
                      <Input value={content.contact_page?.phone || ""} onChange={(e) => setContent({ ...content, contact_page: { ...content.contact_page, phone: e.target.value } })}
                        className="bg-pizza-black border-pizza-dark focus:border-pizza-red text-pizza-white font-mono rounded-none" />
                    </div>
                    <div>
                      <Label className="font-mono text-sm text-neutral-300 mb-2 block flex items-center gap-2"><Mail className="w-4 h-4 text-pizza-red" />E-MAIL</Label>
                      <Input value={content.contact_page?.email || ""} onChange={(e) => setContent({ ...content, contact_page: { ...content.contact_page, email: e.target.value } })}
                        className="bg-pizza-black border-pizza-dark focus:border-pizza-red text-pizza-white font-mono rounded-none" />
                    </div>
                  </div>
                </div>

                <h3 className="font-anton text-lg tracking-wider text-pizza-white mt-8 mb-4 flex items-center gap-2"><Clock className="w-4 h-4 text-pizza-red" />ÖFFNUNGSZEITEN</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {content.contact_page?.hours?.map((hour, index) => (
                    <div key={index} className="flex gap-2">
                      <Input value={hour.day} onChange={(e) => updateHour(index, "day", e.target.value)}
                        className="bg-pizza-black border-pizza-dark focus:border-pizza-red text-pizza-white font-mono rounded-none text-sm flex-1" placeholder="Tag" />
                      <Input value={hour.time} onChange={(e) => updateHour(index, "time", e.target.value)}
                        className="bg-pizza-black border-pizza-dark focus:border-pizza-red text-pizza-white font-mono rounded-none text-sm w-32" placeholder="Zeit" />
                    </div>
                  ))}
                </div>

                <h3 className="font-anton text-lg tracking-wider text-pizza-white mt-8 mb-4 flex items-center gap-2"><MessageSquare className="w-4 h-4 text-pizza-red" />FORMULAR-EINSTELLUNGEN</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={content.contact_page?.form_phone_enabled !== false}
                        onChange={(e) => setContent({ ...content, contact_page: { ...content.contact_page, form_phone_enabled: e.target.checked } })} className="w-4 h-4 accent-pizza-red" />
                      <span className="font-mono text-sm text-neutral-300">Telefonnummer-Feld anzeigen</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={content.contact_page?.form_subject_enabled !== false}
                        onChange={(e) => setContent({ ...content, contact_page: { ...content.contact_page, form_subject_enabled: e.target.checked } })} className="w-4 h-4 accent-pizza-red" />
                      <span className="font-mono text-sm text-neutral-300">Betreff-Feld anzeigen</span>
                    </label>
                  </div>
                  <div>
                    <Label className="font-mono text-sm text-neutral-300 mb-2 block">ERFOLGS-NACHRICHT</Label>
                    <Input value={content.contact_page?.form_success_message || ""} onChange={(e) => setContent({ ...content, contact_page: { ...content.contact_page, form_success_message: e.target.value } })}
                      className="bg-pizza-black border-pizza-dark focus:border-pizza-red text-pizza-white font-mono rounded-none" placeholder="Nachricht nach erfolgreichem Absenden" />
                  </div>
                  <div>
                    <Label className="font-mono text-sm text-neutral-300 mb-2 block">HINWEIS-TEXT</Label>
                    <Textarea value={content.contact_page?.form_note || ""} onChange={(e) => setContent({ ...content, contact_page: { ...content.contact_page, form_note: e.target.value } })}
                      className="bg-pizza-black border-pizza-dark focus:border-pizza-red text-pizza-white font-mono rounded-none min-h-[80px]" />
                  </div>
                </div>

                <Button onClick={saveContactContent} disabled={saving} className="mt-6 bg-pizza-red hover:bg-red-700 text-pizza-white font-anton tracking-widest rounded-none">
                  <Save className="w-4 h-4 mr-2" />{saving ? "SPEICHERN..." : "KONTAKT SPEICHERN"}
                </Button>
              </div>
            </TabsContent>

            {/* Impressum Section */}
            <TabsContent value="impressum" className="space-y-6">
              <div className="p-6 border border-pizza-dark bg-pizza-dark/20">
                <h2 className="font-anton text-xl tracking-wider text-pizza-white mb-6 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-pizza-red" />IMPRESSUM
                </h2>
                <p className="font-mono text-sm text-neutral-400 mb-4">
                  Der Text unterstützt Markdown-Formatierung: **fett**, *kursiv*, # Überschriften
                </p>
                <div className="space-y-4">
                  <div>
                    <Label className="font-mono text-sm text-neutral-300 mb-2 block">TITEL</Label>
                    <Input value={content.impressum?.title || "IMPRESSUM"} onChange={(e) => setContent({ ...content, impressum: { ...content.impressum, title: e.target.value } })}
                      className="bg-pizza-black border-pizza-dark focus:border-pizza-red text-pizza-white font-mono rounded-none" />
                  </div>
                  <div>
                    <Label className="font-mono text-sm text-neutral-300 mb-2 block">INHALT (MARKDOWN)</Label>
                    <Textarea value={content.impressum?.content || ""} onChange={(e) => setContent({ ...content, impressum: { ...content.impressum, content: e.target.value } })}
                      className="bg-pizza-black border-pizza-dark focus:border-pizza-red text-pizza-white font-mono rounded-none min-h-[400px]"
                      placeholder="Impressum-Text hier eingeben... (Markdown wird unterstützt)" />
                  </div>
                </div>
                <Button onClick={saveImpressumContent} disabled={saving} className="mt-6 bg-pizza-red hover:bg-red-700 text-pizza-white font-anton tracking-widest rounded-none">
                  <Save className="w-4 h-4 mr-2" />{saving ? "SPEICHERN..." : "IMPRESSUM SPEICHERN"}
                </Button>
              </div>
            </TabsContent>

            {/* Social Media Section */}
            <TabsContent value="social" className="space-y-6">
              <div className="p-6 border border-pizza-dark bg-pizza-dark/20">
                <h2 className="font-anton text-xl tracking-wider text-pizza-white mb-6 flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-pizza-red" />SOCIAL MEDIA LINKS
                </h2>
                <div className="space-y-4">
                  {(content.footer?.social_links || [
                    { id: "instagram", platform: "instagram", url: "", is_active: true },
                    { id: "facebook", platform: "facebook", url: "", is_active: true },
                    { id: "tiktok", platform: "tiktok", url: "", is_active: false },
                  ]).map((link, index) => (
                    <div key={link.id} className="p-4 border border-pizza-dark bg-pizza-black/50">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-anton text-sm text-pizza-red uppercase flex items-center gap-2">
                          {link.platform === "instagram" && <Instagram className="w-4 h-4" />}
                          {link.platform === "facebook" && <Facebook className="w-4 h-4" />}
                          {link.platform === "tiktok" && <span className="text-xs">TikTok</span>}
                          {link.platform}
                        </span>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <span className="font-mono text-xs text-neutral-400">Aktiv</span>
                          <input type="checkbox" checked={link.is_active}
                            onChange={(e) => {
                              const newLinks = [...(content.footer?.social_links || [])];
                              newLinks[index] = { ...newLinks[index], is_active: e.target.checked };
                              setContent({ ...content, footer: { ...content.footer, social_links: newLinks } });
                            }} className="w-4 h-4 accent-pizza-red" />
                        </label>
                      </div>
                      <Input value={link.url}
                        onChange={(e) => {
                          const newLinks = [...(content.footer?.social_links || [])];
                          newLinks[index] = { ...newLinks[index], url: e.target.value };
                          setContent({ ...content, footer: { ...content.footer, social_links: newLinks } });
                        }}
                        placeholder={`https://${link.platform}.com/littleeatitaly`}
                        className="bg-pizza-black border-pizza-dark focus:border-pizza-red text-pizza-white font-mono rounded-none text-sm" />
                    </div>
                  ))}
                </div>

                <h2 className="font-anton text-xl tracking-wider text-pizza-white mt-10 mb-6 flex items-center gap-2">
                  <Instagram className="w-5 h-5 text-pizza-red" />INSTAGRAM FEED
                </h2>
                <p className="font-mono text-sm text-neutral-400 mb-4">
                  Füge Instagram Bilder manuell hinzu, die auf der Startseite angezeigt werden.
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={content.footer?.instagram_feed?.enabled !== false}
                        onChange={(e) => setContent({ 
                          ...content, 
                          footer: { 
                            ...content.footer, 
                            instagram_feed: { ...(content.footer?.instagram_feed || {}), enabled: e.target.checked } 
                          } 
                        })} className="w-4 h-4 accent-pizza-red" />
                      <span className="font-mono text-sm text-neutral-300">Instagram Feed auf Startseite anzeigen</span>
                    </label>
                  </div>
                  
                  <div>
                    <Label className="font-mono text-sm text-neutral-300 mb-2 block">INSTAGRAM BENUTZERNAME</Label>
                    <Input value={content.footer?.instagram_feed?.username || ""} 
                      onChange={(e) => setContent({ 
                        ...content, 
                        footer: { 
                          ...content.footer, 
                          instagram_feed: { ...(content.footer?.instagram_feed || {}), username: e.target.value } 
                        } 
                      })}
                      placeholder="@littleeatitaly"
                      className="bg-pizza-black border-pizza-dark focus:border-pizza-red text-pizza-white font-mono rounded-none" />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <Label className="font-mono text-sm text-neutral-300">INSTAGRAM POSTS</Label>
                      <Button type="button" onClick={() => {
                        const posts = content.footer?.instagram_feed?.posts || [];
                        setContent({
                          ...content,
                          footer: {
                            ...content.footer,
                            instagram_feed: {
                              ...(content.footer?.instagram_feed || {}),
                              posts: [...posts, { image_url: "", caption: "", link: "" }]
                            }
                          }
                        });
                      }} className="bg-pizza-red hover:bg-red-700 text-pizza-white font-mono text-xs rounded-none h-8 px-3">
                        <Plus className="w-3 h-3 mr-1" />POST HINZUFÜGEN
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(content.footer?.instagram_feed?.posts || []).map((post, index) => (
                        <div key={index} className="p-4 border border-pizza-dark bg-pizza-black/50 relative">
                          <button onClick={() => {
                            const posts = [...(content.footer?.instagram_feed?.posts || [])];
                            posts.splice(index, 1);
                            setContent({
                              ...content,
                              footer: {
                                ...content.footer,
                                instagram_feed: { ...(content.footer?.instagram_feed || {}), posts }
                              }
                            });
                          }} className="absolute top-2 right-2 text-neutral-400 hover:text-pizza-red">
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <div className="space-y-2">
                            <Input value={post.image_url}
                              onChange={(e) => {
                                const posts = [...(content.footer?.instagram_feed?.posts || [])];
                                posts[index] = { ...posts[index], image_url: e.target.value };
                                setContent({
                                  ...content,
                                  footer: {
                                    ...content.footer,
                                    instagram_feed: { ...(content.footer?.instagram_feed || {}), posts }
                                  }
                                });
                              }}
                              placeholder="Bild URL"
                              className="bg-pizza-black border-pizza-dark focus:border-pizza-red text-pizza-white font-mono rounded-none text-sm" />
                            <Input value={post.caption}
                              onChange={(e) => {
                                const posts = [...(content.footer?.instagram_feed?.posts || [])];
                                posts[index] = { ...posts[index], caption: e.target.value };
                                setContent({
                                  ...content,
                                  footer: {
                                    ...content.footer,
                                    instagram_feed: { ...(content.footer?.instagram_feed || {}), posts }
                                  }
                                });
                              }}
                              placeholder="Beschreibung"
                              className="bg-pizza-black border-pizza-dark focus:border-pizza-red text-pizza-white font-mono rounded-none text-sm" />
                            <Input value={post.link}
                              onChange={(e) => {
                                const posts = [...(content.footer?.instagram_feed?.posts || [])];
                                posts[index] = { ...posts[index], link: e.target.value };
                                setContent({
                                  ...content,
                                  footer: {
                                    ...content.footer,
                                    instagram_feed: { ...(content.footer?.instagram_feed || {}), posts }
                                  }
                                });
                              }}
                              placeholder="Link zum Post (optional)"
                              className="bg-pizza-black border-pizza-dark focus:border-pizza-red text-pizza-white font-mono rounded-none text-sm" />
                            {post.image_url && (
                              <img src={post.image_url} alt="Preview" className="w-full h-24 object-cover mt-2 border border-pizza-dark" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <Button onClick={saveFooterContent} disabled={saving} className="mt-6 bg-pizza-red hover:bg-red-700 text-pizza-white font-anton tracking-widest rounded-none">
                  <Save className="w-4 h-4 mr-2" />{saving ? "SPEICHERN..." : "SOCIAL MEDIA SPEICHERN"}
                </Button>
              </div>
            </TabsContent>

            {/* Footer Section */}
            <TabsContent value="footer" className="space-y-6">
              <div className="p-6 border border-pizza-dark bg-pizza-dark/20">
                <h2 className="font-anton text-xl tracking-wider text-pizza-white mb-6 flex items-center gap-2">
                  <Type className="w-5 h-5 text-pizza-red" />FOOTER
                </h2>
                <div className="space-y-4">
                  <div>
                    <Label className="font-mono text-sm text-neutral-300 mb-2 block">LAUFTEXT (MARQUEE)</Label>
                    <Input value={content.footer?.marquee_text || ""} onChange={(e) => setContent({ ...content, footer: { ...content.footer, marquee_text: e.target.value } })}
                      className="bg-pizza-black border-pizza-dark focus:border-pizza-red text-pizza-white font-mono rounded-none" />
                  </div>
                  <div>
                    <Label className="font-mono text-sm text-neutral-300 mb-2 block">BESCHREIBUNG</Label>
                    <Textarea value={content.footer?.brand_description || ""} onChange={(e) => setContent({ ...content, footer: { ...content.footer, brand_description: e.target.value } })}
                      className="bg-pizza-black border-pizza-dark focus:border-pizza-red text-pizza-white font-mono rounded-none min-h-[100px]" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="font-mono text-sm text-neutral-300 mb-2 block">COPYRIGHT</Label>
                      <Input value={content.footer?.copyright || ""} onChange={(e) => setContent({ ...content, footer: { ...content.footer, copyright: e.target.value } })}
                        className="bg-pizza-black border-pizza-dark focus:border-pizza-red text-pizza-white font-mono rounded-none" />
                    </div>
                    <div>
                      <Label className="font-mono text-sm text-neutral-300 mb-2 block">"MADE WITH" TEXT</Label>
                      <Input value={content.footer?.made_with || ""} onChange={(e) => setContent({ ...content, footer: { ...content.footer, made_with: e.target.value } })}
                        className="bg-pizza-black border-pizza-dark focus:border-pizza-red text-pizza-white font-mono rounded-none" />
                    </div>
                  </div>
                </div>
                <Button onClick={saveFooterContent} disabled={saving} className="mt-6 bg-pizza-red hover:bg-red-700 text-pizza-white font-anton tracking-widest rounded-none">
                  <Save className="w-4 h-4 mr-2" />{saving ? "SPEICHERN..." : "FOOTER SPEICHERN"}
                </Button>
              </div>
            </TabsContent>

            {/* Settings Section */}
            <TabsContent value="settings" className="space-y-6">
              <div className="p-6 border border-pizza-dark bg-pizza-dark/20">
                <h2 className="font-anton text-xl tracking-wider text-pizza-white mb-6 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-pizza-red" />PASSWORT ÄNDERN
                </h2>
                <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                  <div>
                    <Label className="font-mono text-sm text-neutral-300 mb-2 block">AKTUELLES PASSWORT</Label>
                    <Input type="password" value={passwordData.current_password} onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                      required className="bg-pizza-black border-pizza-dark focus:border-pizza-red text-pizza-white font-mono rounded-none" />
                  </div>
                  <div>
                    <Label className="font-mono text-sm text-neutral-300 mb-2 block">NEUES PASSWORT</Label>
                    <Input type="password" value={passwordData.new_password} onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                      required className="bg-pizza-black border-pizza-dark focus:border-pizza-red text-pizza-white font-mono rounded-none" />
                  </div>
                  <div>
                    <Label className="font-mono text-sm text-neutral-300 mb-2 block">PASSWORT BESTÄTIGEN</Label>
                    <Input type="password" value={passwordData.confirm_password} onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                      required className="bg-pizza-black border-pizza-dark focus:border-pizza-red text-pizza-white font-mono rounded-none" />
                  </div>
                  <Button type="submit" className="bg-pizza-red hover:bg-red-700 text-pizza-white font-anton tracking-widest rounded-none">
                    <Lock className="w-4 h-4 mr-2" />PASSWORT ÄNDERN
                  </Button>
                </form>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
