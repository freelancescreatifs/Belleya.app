#!/bin/bash

# Script pour remplacer les couleurs vertes et noires par le branding Belleya
# (rose, violet, orange, beige)

echo "🎨 Mise à jour des couleurs du branding Belleya..."

# Couleurs vertes -> Rose/Violet Belleya
find src -type f -name "*.tsx" -exec sed -i \
  -e 's/bg-emerald-500/bg-belleya-vivid/g' \
  -e 's/bg-emerald-600/bg-belleya-bright/g' \
  -e 's/bg-green-500/bg-belleya-vivid/g' \
  -e 's/bg-green-600/bg-belleya-bright/g' \
  -e 's/text-emerald-500/text-belleya-vivid/g' \
  -e 's/text-emerald-600/text-belleya-bright/g' \
  -e 's/text-green-500/text-belleya-vivid/g' \
  -e 's/text-green-600/text-belleya-bright/g' \
  -e 's/from-emerald-500/from-belleya-bright/g' \
  -e 's/from-emerald-600/from-belleya-deep/g' \
  -e 's/to-emerald-500/to-belleya-bright/g' \
  -e 's/to-emerald-600/to-belleya-deep/g' \
  -e 's/from-green-500/from-belleya-bright/g' \
  -e 's/from-green-600/from-belleya-deep/g' \
  -e 's/to-green-500/to-belleya-bright/g' \
  -e 's/to-green-600/to-belleya-deep/g' \
  -e 's/border-emerald-/border-belleya-/g' \
  -e 's/border-green-/border-belleya-/g' \
  {} +

# Boutons noirs -> Gradient rose/violet
find src -type f -name "*.tsx" -exec sed -i \
  -e 's/bg-gray-900 text-white hover:bg-gray-800/bg-gradient-to-r from-belleya-deep to-belleya-bright text-white hover:shadow-lg hover:scale-105/g' \
  -e 's/bg-gray-800 text-white hover:bg-gray-900/bg-gradient-to-r from-belleya-deep to-belleya-bright text-white hover:shadow-lg hover:scale-105/g' \
  -e 's/bg-black text-white/bg-gradient-to-r from-belleya-deep to-belleya-bright text-white/g' \
  {} +

echo "✅ Couleurs mises à jour avec succès!"
echo "   - Vert/Emerald → Rose/Violet Belleya"
echo "   - Noir/Gray-900 → Gradient Belleya"
