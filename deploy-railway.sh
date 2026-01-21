#!/bin/bash

# Script de déploiement sur Railway
# Usage: ./deploy-railway.sh

set -e

echo "🚀 Préparation du déploiement sur Railway..."
echo ""

# Vérifier que git est clean
if ! git diff-index --quiet HEAD --; then
    echo "⚠️  Il y a des changements non commités."
    echo "Veuillez faire un commit avant de déployer."
    exit 1
fi

# Vérifier la branche
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" != "main" ]; then
    echo "⚠️  Vous n'êtes pas sur la branche 'main' (actuellement sur '$BRANCH')"
    read -p "Continuer quand même ? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "✅ Vérification du build local..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Erreur lors du build!"
    exit 1
fi

echo ""
echo "✅ Build réussi!"
echo ""
echo "📝 Commitez vos changements et faites un 'git push' pour déclencher le déploiement sur Railway."
echo ""
echo "Si le déploiement automatique n'est pas activé :"
echo "  1. Allez sur https://railway.app"
echo "  2. Ouvrez votre projet"
echo "  3. Cliquez sur 'Deploy' ou 'Redeploy'"
echo ""
echo "Consultez RAILWAY-DEPLOYMENT-GUIDE.md pour plus d'informations."
