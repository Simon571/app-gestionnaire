'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Save, Copy, Check, Loader2, AlertCircle, LogIn, LogOut } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast";
import { useAppSettings } from "@/context/app-settings-context";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getApiBase } from "@/lib/api-base";

export default function AssemblyInfoPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { settings, updateSetting, updateSettings } = useAppSettings();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showGeneratedCredentials, setShowGeneratedCredentials] = useState<{ id: string; pin: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [trialDays, setTrialDays] = useState<number | null>(null);

  // Connexion de l'administrateur d'assemblee. Les identifiants sont remis par
  // l'administrateur de la plateforme (console super admin) : ID + PIN. Ils
  // ouvrent une session serveur (cookie), et l'assemblee correspondante
  // s'affiche dans toute l'application.
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loginId, setLoginId] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [session, setSession] = useState<{ id: string; name: string } | null>(null);

  // L'assemblee deja inscrite ne se reinscrit pas : le serveur attribue
  // l'identifiant une seule fois, et il n'y a plus rien a generer ici.
  const alreadyRegistered = Boolean(settings.assemblyId && settings.assemblyPin);

  // Session serveur deja posee (cookie) : on la relit au chargement pour savoir
  // si l'administrateur est deja entre, et afficher son assemblee plutot que le
  // bouton de connexion.
  useEffect(() => {
    let cancelled = false;
    async function loadSession() {
      try {
        const response = await fetch(`${getApiBase()}/api/auth/session`, {
          credentials: 'include',
          cache: 'no-store',
        });
        if (!response.ok) return;
        const data = await response.json().catch(() => ({}));
        if (cancelled) return;
        const current = data?.session;
        if (current?.role === 'assembly-admin' && current?.tenantId) {
          setSession({ id: current.tenantId, name: current.displayName ?? current.tenantId });
        }
      } catch {
        // Hors ligne : pas de session serveur, le bouton de connexion reste.
      }
    }
    void loadSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleAssemblyLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoggingIn(true);
    try {
      const response = await fetch(`${getApiBase()}/api/auth/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ mode: 'assembly', assemblyId: loginId.trim().toUpperCase(), assemblyPin: loginPin }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message =
          typeof result?.error === 'string'
            ? result.error
            : "ID ou PIN de l'assemblee incorrect.";
        setServerError(message);
        toast({ title: "Connexion refusée", description: message, variant: "destructive", duration: 20000 });
        return;
      }

      const current = result.session ?? {};
      const id: string = current.tenantId ?? current.sub ?? loginId.trim().toUpperCase();

      // Le cookie porte l'authentification cote serveur ; localStorage ne sert
      // qu'a l'affichage (barre de navigation, nom affiche).
      localStorage.setItem('lastAssemblyId', id);
      localStorage.setItem('admin_session', JSON.stringify({
        assemblyId: id,
        displayName: current.displayName ?? id,
        role: current.role ?? 'assembly-admin',
        loggedInAt: new Date().toISOString(),
        expiresAt: current.expiresAt ?? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      }));

      // Les identifiants entrent aussi dans les reglages : c'est ce que lisent
      // les pages qui les affichent ou les transmettent aux proclamateurs. Le
      // nom vient du serveur : c'est celui que l'administrateur de la plateforme
      // a inscrit, et il doit s'afficher partout dans l'application.
      updateSettings({
        assemblyId: id,
        assemblyPin: loginPin,
        ...(current.displayName ? { congregationName: current.displayName as string } : {}),
      });

      setSession({ id, name: current.displayName ?? id });
      setServerError(null);
      setIsLoginOpen(false);
      setLoginPin('');

      toast({
        title: "Connexion réussie",
        description: `Bienvenue, ${current.displayName ?? id}.`,
        duration: 15000,
      });

      // L'assemblee s'ouvre : c'est l'application que l'administrateur de la
      // plateforme vient de creer, et /desktop en est l'accueil.
      router.push('/desktop');
    } catch {
      const message =
        "Serveur injoignable. Vérifiez votre connexion Internet, puis réessayez.";
      setServerError(message);
      toast({ title: "Connexion impossible", description: message, variant: "destructive", duration: 20000 });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${getApiBase()}/api/auth/session`, { method: 'DELETE', credentials: 'include' });
    } catch {
      // Le cookie expirera de lui-meme : on nettoie quand meme l'affichage local.
    }
    localStorage.removeItem('admin_session');
    setSession(null);
    toast({ description: 'Vous êtes déconnecté.' });
    router.push('/connexion');
  };

  const copyToClipboard = (value: string, field: string) => {
    navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    toast({ description: `${field} copié dans le presse-papiers.` });
  };

  /**
   * Enregistre l'assemblee aupres du serveur.
   *
   * Avant, l'identifiant et le PIN etaient tires au hasard dans le navigateur :
   * deux postes pouvaient tomber sur le meme identifiant, le PIN n'etait jamais
   * verifie a la connexion, et surtout l'assemblee n'existait nulle part. Le
   * serveur, lui, verifie l'unicite du nom, hashe le PIN, enregistre l'assemblee
   * dans le registre de la console super admin et demarre l'essai gratuit.
   */
  const handleSave = async () => {
    if (!settings.congregationName?.trim()) {
      toast({
        title: "Nom requis",
        description: "Veuillez saisir le nom de l'assemblée avant d'enregistrer.",
        variant: "destructive",
      });
      return;
    }

    // Deja inscrite : il n'y a rien a renvoyer au serveur, on se contente de
    // rappeler les identifiants a l'ecran.
    if (alreadyRegistered) {
      setShowGeneratedCredentials({ id: settings.assemblyId, pin: settings.assemblyPin });
      toast({
        title: "✅ Enregistré !",
        description: `ID : ${settings.assemblyId} — PIN : ${settings.assemblyPin}`,
        duration: 15000,
      });
      return;
    }

    setIsSaving(true);
    setServerError(null);

    try {
      const response = await fetch(`${getApiBase()}/api/assemblies/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: settings.congregationName.trim(),
          contactEmail: settings.assemblyEmail?.trim() || undefined,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message =
          typeof result?.error === 'string'
            ? result.error
            : "L'enregistrement a échoué. Vérifiez votre connexion et réessayez.";
        setServerError(message);
        toast({ title: "Enregistrement refusé", description: message, variant: "destructive", duration: 20000 });
        return;
      }

      const newId: string = result.assembly.id;
      const newPin: string = result.pin;
      const days: number = result.trialDays ?? 30;

      updateSettings({ assemblyId: newId, assemblyPin: newPin });
      setShowGeneratedCredentials({ id: newId, pin: newPin });
      setTrialDays(days);

      toast({
        title: "✅ Enregistré !",
        description: `ID : ${newId} — PIN : ${newPin}`,
        duration: 15000,
      });

      // L'assemblee vient d'etre creee : on ouvre sa session tout de suite.
      // Sans cela, l'administrateur devait recopier les identifiants qui
      // venaient de s'afficher pour les ressaisir dans « Connexion » — et sans
      // session, le tableau de bord restait inaccessible juste apres
      // l'inscription. Si la connexion automatique echoue, on laisse les
      // identifiants a l'ecran : ils restent utilisables a la main.
      try {
        const loginResponse = await fetch(`${getApiBase()}/api/auth/session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ mode: 'assembly', assemblyId: newId, assemblyPin: newPin }),
        });

        if (loginResponse.ok) {
          const loginResult = await loginResponse.json().catch(() => ({}));
          const current = loginResult.session ?? {};
          const id: string = current.tenantId ?? newId;

          localStorage.setItem('lastAssemblyId', id);
          localStorage.setItem('admin_session', JSON.stringify({
            assemblyId: id,
            displayName: current.displayName ?? settings.congregationName,
            role: current.role ?? 'assembly-admin',
            loggedInAt: new Date().toISOString(),
            expiresAt: current.expiresAt ?? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          }));

          setSession({ id, name: current.displayName ?? settings.congregationName });
          router.push('/desktop');
        } else {
          toast({
            description:
              "Assemblée enregistrée. Utilisez « Connexion » pour ouvrir votre tableau de bord.",
            duration: 20000,
          });
        }
      } catch {
        toast({
          description:
            "Assemblée enregistrée. Vérifiez votre connexion, puis utilisez « Connexion » pour ouvrir votre tableau de bord.",
          duration: 20000,
        });
      }
    } catch {
      // Serveur injoignable : reseau coupe, MSI ouvert hors ligne. On le dit
      // clairement, sinon l'administrateur croit son assemblee enregistree.
      const message =
        "Serveur injoignable. Vérifiez votre connexion Internet, puis enregistrez à nouveau.";
      setServerError(message);
      toast({ title: "Enregistrement impossible", description: message, variant: "destructive", duration: 20000 });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold">Information de l&apos;assemblée</h1>
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Information de l&apos;assemblée</CardTitle>
            <CardDescription>
              Gérez les détails de votre assemblée locale. Ces informations seront utilisées dans toute l&apos;application.
              À l&apos;enregistrement, le serveur attribue un identifiant et un PIN, et votre essai gratuit démarre.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/*
              Identifiants remis par l'administrateur de la plateforme : ce bloc
              est le point d'entree de l'administrateur d'assemblee. Sans lui, un
              ID et un PIN distribues par la console super admin n'avaient nulle
              part ou etre saisis.
            */}
            <div className="flex flex-col gap-3 rounded-lg border bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  {session ? "Assemblée connectée" : "Vous avez reçu un ID et un PIN ?"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {session
                    ? `${session.name} — identifiant ${session.id}`
                    : "Connectez-vous pour ouvrir l'assemblée créée par l'administrateur de la plateforme."}
                </p>
              </div>
              {session ? (
                <Button variant="outline" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" /> Déconnexion
                </Button>
              ) : (
                <Button onClick={() => setIsLoginOpen(true)}>
                  <LogIn className="mr-2 h-4 w-4" /> Connexion
                </Button>
              )}
            </div>

            {serverError && (
              <div className="flex items-start gap-3 rounded-lg border border-amber-500 bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-100">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{serverError}</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="assembly-name">Nom de l&apos;assemblée</Label>
                    <Input
                      id="assembly-name"
                      placeholder="Ex: Assemblée de la Plaine"
                      value={settings.congregationName}
                      readOnly={alreadyRegistered}
                      className={alreadyRegistered ? "bg-muted" : ""}
                      onChange={(e) => updateSetting('congregationName', e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="assembly-id">ID de l&apos;assemblée</Label>
                    <div className="flex gap-2">
                      <Input
                        id="assembly-id"
                        placeholder="Attribué par le serveur à l'enregistrement"
                        value={settings.assemblyId}
                        readOnly
                        className={settings.assemblyId ? "bg-muted font-mono" : "bg-muted"}
                      />
                      {settings.assemblyId && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => copyToClipboard(settings.assemblyId, 'ID')}
                          title="Copier l'ID"
                        >
                          {copiedField === 'ID' ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      )}
                    </div>
                    {!settings.assemblyId && (
                      <p className="text-xs text-muted-foreground">Attribué par le serveur à l&apos;enregistrement</p>
                    )}
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="assembly-pin">PIN de connexion</Label>
                <div className="flex gap-2">
                  <Input
                    id="assembly-pin"
                    type="text"
                    placeholder="Attribué par le serveur à l'enregistrement"
                    value={settings.assemblyPin}
                    readOnly
                    className={settings.assemblyPin ? "bg-muted font-mono" : "bg-muted"}
                  />
                  {settings.assemblyPin && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(settings.assemblyPin, 'PIN')}
                      title="Copier le PIN"
                    >
                      {copiedField === 'PIN' ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  )}
                </div>
                {!settings.assemblyPin ? (
                  <p className="text-xs text-muted-foreground">Attribué par le serveur à l&apos;enregistrement</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Pour changer le PIN, passez par la console de la plateforme : le serveur seul peut le remplacer.
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Adresse de la Salle du Royaume</Label>
              <Input
                id="address"
                placeholder="Ex: 123 Rue du Royaume, 75001 Paris"
                value={settings.assemblyAddress}
                onChange={(e) => updateSetting('assemblyAddress', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="meeting-day">Jours et heures des réunions</Label>
                    <Input
                      id="meeting-day"
                      placeholder="Ex: Mercredi 19h, Dimanche 10h"
                      value={settings.assemblyMeetingTimes}
                      onChange={(e) => updateSetting('assemblyMeetingTimes', e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="phone">Numéro de téléphone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Ex: 01 23 45 67 89"
                      value={settings.assemblyPhone}
                      onChange={(e) => updateSetting('assemblyPhone', e.target.value)}
                    />
                </div>
            </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="website">Site web de l&apos;assemblée</Label>
                    <Input
                      id="website"
                      type="url"
                      placeholder="Ex: jw.org"
                      value={settings.assemblyWebsite}
                      onChange={(e) => updateSetting('assemblyWebsite', e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email">Adresse e-mail de contact</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Ex: contact@assemblee.org"
                      value={settings.assemblyEmail}
                      onChange={(e) => updateSetting('assemblyEmail', e.target.value)}
                    />
                </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-start gap-4">
            <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enregistrement…
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" /> Enregistrer les modifications
                  </>
                )}
            </Button>
            {(showGeneratedCredentials || alreadyRegistered) && (
              <div className="w-full rounded-lg border-2 border-green-500 bg-green-50 dark:bg-green-950 p-4 space-y-3">
                <h3 className="font-bold text-green-800 dark:text-green-200 text-lg">🔑 Identifiants de l&apos;assemblée</h3>
                <p className="text-sm text-green-700 dark:text-green-300">Communiquez ces identifiants aux proclamateurs pour qu&apos;ils se connectent sur l&apos;app mobile :</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 bg-white dark:bg-gray-900 rounded p-3 border">
                    <span className="text-sm font-medium text-muted-foreground">ID :</span>
                    <span className="font-mono font-bold text-lg">{showGeneratedCredentials?.id || settings.assemblyId}</span>
                    <Button variant="ghost" size="icon" className="ml-auto h-8 w-8" onClick={() => copyToClipboard(showGeneratedCredentials?.id || settings.assemblyId, 'ID')}>
                      {copiedField === 'ID' ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 bg-white dark:bg-gray-900 rounded p-3 border">
                    <span className="text-sm font-medium text-muted-foreground">PIN :</span>
                    <span className="font-mono font-bold text-lg">{showGeneratedCredentials?.pin || settings.assemblyPin}</span>
                    <Button variant="ghost" size="icon" className="ml-auto h-8 w-8" onClick={() => copyToClipboard(showGeneratedCredentials?.pin || settings.assemblyPin, 'PIN')}>
                      {copiedField === 'PIN' ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                {showGeneratedCredentials && (
                  <p className="text-sm font-semibold text-red-700 dark:text-red-300">
                    ⚠️ Ce PIN ne sera plus jamais réaffiché par le serveur. Copiez-le maintenant.
                  </p>
                )}
                {trialDays !== null && (
                  <p className="text-sm text-green-700 dark:text-green-300">
                    🎁 Votre essai gratuit de {trialDays} jours a démarré. Votre assemblée apparaît dès maintenant dans la
                    console de la plateforme.
                  </p>
                )}
              </div>
            )}
          </CardFooter>
        </Card>
      </div>

      {/*
        La saisie se fait dans une fenetre plutot que sur la page : ces
        identifiants appartiennent a l'administrateur seul et n'ont pas a
        rester affiches au-dessus des informations de l'assemblee.
      */}
      <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connexion à mon assemblée</DialogTitle>
            <DialogDescription>
              Saisissez l&apos;identifiant et le PIN remis par l&apos;administrateur de la plateforme.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAssemblyLogin} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="login-assembly-id">ID de l&apos;assemblée</Label>
              <Input
                id="login-assembly-id"
                placeholder="Ex: KINYOL-WGHK"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value.toUpperCase())}
                required
                disabled={isLoggingIn}
                className="font-mono uppercase"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="login-assembly-pin">PIN de l&apos;assemblée</Label>
              <Input
                id="login-assembly-pin"
                type="password"
                placeholder="6 chiffres"
                value={loginPin}
                onChange={(e) => setLoginPin(e.target.value)}
                required
                disabled={isLoggingIn}
                className="font-mono"
              />
            </div>
            <Button type="submit" disabled={isLoggingIn || !loginId.trim() || !loginPin}>
              {isLoggingIn ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Connexion…
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" /> Se connecter
                </>
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}