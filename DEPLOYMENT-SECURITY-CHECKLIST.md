# ✅ Checklist de Déploiement Sécurisé

## 📋 Avant la mise en production

### Environnement & Configuration
- [ ] Générer une clé de chiffrement forte: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- [ ] Mettre `NEXT_PUBLIC_ENCRYPTION_KEY` dans `.env.local` (NE PAS commiter)
- [ ] Configurer `SUPABASE_SERVICE_ROLE_KEY` côté serveur uniquement
- [ ] Vérifier que `NODE_ENV=production`
- [ ] Configurer `NEXT_PUBLIC_FORCE_HTTPS=true`
- [ ] Activer HSTS sur le domaine

### Authentification & Autorisations
- [ ] Tester la connexion avec les credentials test
- [ ] Vérifier que les mots de passe faibles sont rejetés
- [ ] Tester les sessions expirées (tokens de 24h)
- [ ] Implémenter les rôles d'utilisateur (admin, elder, servant, publisher)
- [ ] Tester les permissions d'accès par rôle

### Chiffrement & Données
- [ ] Vérifier que toutes les données sensibles utilisent `SecureStorage`
- [ ] Tester le chiffrement/déchiffrement avec `EncryptionService`
- [ ] Vérifier que les sauvegardes sont chiffrées
- [ ] Tester la restauration de backup chiffré
- [ ] Implémenter le log d'audit complet

### GDPR Compliance
- [ ] Tester l'export de données personnelles (`exportPersonalData`)
- [ ] Tester la suppression complète (`deleteAllPersonalData`)
- [ ] Vérifier que les logs d'audit ne contiennent pas de données sensibles
- [ ] Générer un rapport de conformité RGPD
- [ ] Définir une politique de rétention des données (ex: 90 jours)
- [ ] Tester le droit à l'oubli (vérifier que tout est supprimé)

### API & Rate Limiting
- [ ] Implémenter le rate limiting sur toutes les routes API
- [ ] Tester les limites:
  - 5 tentatives de login par 15 min
  - 2 exports GDPR par 15 min
  - 1 suppression de données par 15 min
- [ ] Vérifier que les headers `X-RateLimit-*` sont présents
- [ ] Tester la gestion des dépassements (HTTP 429)

### Sécurité des En-têtes
- [ ] Vérifier `Strict-Transport-Security`
- [ ] Vérifier `Content-Security-Policy`
- [ ] Vérifier `X-Frame-Options: DENY`
- [ ] Vérifier `X-Content-Type-Options: nosniff`
- [ ] Vérifier `X-XSS-Protection: 1; mode=block`

### Sécurité des Dépendances
- [ ] Exécuter `npm audit`
- [ ] Corriger les vulnérabilités critiques
- [ ] Vérifier que crypto-js est à jour
- [ ] Vérifier que tweetnacl est à jour

### Logs & Monitoring
- [ ] Configurer les logs d'audit (`AuditLog`)
- [ ] Implémenter une sauvegarde des logs (base de données)
- [ ] Activer la surveillance des erreurs (Sentry, Datadog)
- [ ] Configurer les alertes pour:
  - Trop de tentatives de login échouées
  - Exports de données inhabituels
  - Erreurs d'accès non autorisé

### Données de Test
- [ ] Créer des comptes de test avec données anonymisées
- [ ] NE PAS utiliser de vraies données personnelles en dev
- [ ] Utiliser des adresses email de test (test@example.com)
- [ ] Supprimer toutes les données de test avant production

### Documentation & Procédures
- [ ] Documenter la procédure d'urgence (incident de sécurité)
- [ ] Documenter la procédure de récupération de données
- [ ] Documenter les responsables de la sécurité
- [ ] Créer un runbook pour la gestion des clés de chiffrement
- [ ] Documenter le processus de changement de clé de chiffrement

### Contrôle d'Accès
- [ ] Vérifier que seuls les admins peuvent accéder au /admin
- [ ] Vérifier que les données ne sont accessibles qu'au propriétaire
- [ ] Vérifier que les logs d'audit ne sont accessibles qu'aux admins
- [ ] Implémenter le rate limiting par IP

### Tests de Pénétration (avant production)
- [ ] Tester l'injection SQL (les données chiffrées sont protégées)
- [ ] Tester le XSS (utiliser `sanitize()` pour l'affichage)
- [ ] Tester le CSRF (vérifier les tokens CSRF)
- [ ] Tester la force brute (rate limiting)
- [ ] Tester le fuzzing sur les API endpoints

---

## 🚀 Déploiement

### Infrastructure
- [ ] Déployer sur un serveur HTTPS uniquement
- [ ] Configurer les certificats SSL/TLS (Let's Encrypt ou AWS ACM)
- [ ] Activer HSTS (preload list)
- [ ] Mettre en place un WAF (Web Application Firewall)
- [ ] Configurer les pare-feu et groupes de sécurité

### Secrets Management
- [ ] Utiliser AWS Secrets Manager / Vault / GitHub Secrets
- [ ] NE JAMAIS exposer les clés dans Git
- [ ] Implémenter la rotation automatique des clés
- [ ] Auditer l'accès aux secrets
- [ ] Chiffrer les secrets en transit

### Sauvegarde & Récupération
- [ ] Mettre en place une sauvegarde quotidienne
- [ ] Chiffrer les sauvegardes
- [ ] Tester la restauration à partir des sauvegardes
- [ ] Stocker les sauvegardes dans un endroit sécurisé
- [ ] Implémenter un plan de récupération après sinistre (DRP)

### Performance & Monitoring
- [ ] Vérifier les performances du chiffrement AES-256
- [ ] Mettre en place des métriques de sécurité
- [ ] Configurer les alertes de sécurité
- [ ] Implémenter les logs centralisés (ELK, Splunk)
- [ ] Tester la scalabilité

---

## 📊 Post-Déploiement

### Audit Régulier
- [ ] Vérifier les logs chaque semaine
- [ ] Analyser les patterns d'accès
- [ ] Chercher les comportements suspects
- [ ] Vérifier les permissions utilisateur

### Mises à Jour Régulières
- [ ] Appliquer les patchs de sécurité rapidement
- [ ] Mettre à jour les dépendances mensuellement
- [ ] Tester les mises à jour en environnement de staging
- [ ] Documenter les changements

### Conformité Réglementaire
- [ ] Faire un audit RGPD trimestriel
- [ ] Vérifier la politique de confidentialité à jour
- [ ] Informer les utilisateurs des changements de sécurité
- [ ] Maintenir un registre de conformité

### Formation & Sensibilisation
- [ ] Former l'équipe à la sécurité
- [ ] Tester les connaissances en sécurité
- [ ] Implémenter la sensibilisation au phishing
- [ ] Maintenir une culture de la sécurité

---

## 🆘 Procédure d'Incident

Si une violation de sécurité est détectée:

1. **Immediate (0-1h):**
   - Isoler le système affecté
   - Notifier l'équipe de sécurité
   - Commencer l'investigation

2. **Court terme (1-24h):**
   - Analyser la portée de l'incident
   - Sécuriser l'accès non autorisé
   - Sauvegarder les preuves

3. **Moyen terme (24-72h):**
   - Notifier les utilisateurs affectés
   - Notifier les autorités (CNIL si RGPD)
   - Préparer un rapport d'incident

4. **Long terme:**
   - Implémenter les correctifs
   - Mettre à jour les procédures
   - Faire une post-mortem

---

## 📞 Contacts d'Urgence

- **Security Team:** security@app-gestionnaire.com
- **CTO/Lead Sécurité:** [Nom et contact]
- **CNIL (France):** https://www.cnil.fr/
- **ANSSI:** https://www.anssi.gouv.fr/

---

**Dernier audit:** [Date]  
**Prochaine revue:** [Date + 3 mois]  
**Responsable:** [Nom et titre]

> **Rappel:** La sécurité est une responsabilité partagée. Chacun doit faire sa part pour protéger les données des utilisateurs.
