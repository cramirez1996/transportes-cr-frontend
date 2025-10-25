#!/bin/bash
# Git Initialization Script for Frontend (Bash version)
# Run this script from the frontend directory to initialize Git and push to GitHub

echo "🚀 Inicializando repositorio Git para Frontend..."
echo ""

# Check if we're in the frontend directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Debes ejecutar este script desde el directorio frontend/"
    exit 1
fi

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Error: Git no está instalado. Instálalo primero."
    exit 1
fi

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ Error: GitHub CLI (gh) no está instalado."
    echo "   Instálalo desde: https://cli.github.com/"
    exit 1
fi

# Check if gh is authenticated
if ! gh auth status &> /dev/null; then
    echo "⚠️  GitHub CLI no está autenticado"
    echo "   Ejecutando autenticación..."
    gh auth login
fi

# Initialize Git if not already initialized
if [ ! -d ".git" ]; then
    echo "📦 Inicializando repositorio Git..."
    git init
    echo "✅ Git inicializado"
else
    echo "ℹ️  Repositorio Git ya inicializado"
fi

# Check if remote exists
if ! git remote get-url origin &> /dev/null; then
    echo ""
    echo "🔗 Creando repositorio en GitHub..."
    echo ""
    
    # Create GitHub repository
    if gh repo create transportes-cr-frontend --public --source=. --remote=origin --description="Sistema de Control - Transportes CR (Frontend)"; then
        echo "✅ Repositorio creado: transportes-cr-frontend"
        echo "✅ Remote configurado automáticamente"
    else
        echo "❌ Error al crear el repositorio"
        echo ""
        echo "Opciones:"
        echo "1. El repositorio ya existe - Configura el remote manualmente:"
        echo "   git remote add origin https://github.com/cramirez1996/transportes-cr-frontend.git"
        echo ""
        echo "2. Problemas de autenticación - Ejecuta:"
        echo "   gh auth login"
        exit 1
    fi
else
    remote_url=$(git remote get-url origin)
    echo "ℹ️  Remote ya configurado: $remote_url"
fi

# Add all files
echo ""
echo "📝 Agregando archivos al staging area..."
git add .

# Show status
echo ""
echo "📊 Estado del repositorio:"
git status --short

# Commit
echo ""
echo "💾 Creando commit inicial..."
git commit -m "feat: initial commit - Frontend deployment setup

- Configuración de ambiente de producción (https://api.transportescchr.cl/api)
- GitHub Actions workflow para deploy a S3 + CloudFront
- CloudFront Distribution: E37NHHZ8PFOAQC
- Bucket S3: app.transportescchr.cl
- Documentación completa de deployment
- Políticas IAM para AWS"

echo "✅ Commit creado exitosamente"

# Check current branch
current_branch=$(git branch --show-current)

if [ "$current_branch" != "main" ] && [ "$current_branch" != "master" ]; then
    echo ""
    echo "⚠️  Rama actual: $current_branch"
    echo "El workflow está configurado para main/master"
    
    read -p "¿Quieres renombrar la rama a 'main'? (s/n): " response
    if [ "$response" = "s" ] || [ "$response" = "S" ]; then
        git branch -M main
        echo "✅ Rama renombrada a 'main'"
        current_branch="main"
    fi
fi

# Push to remote
if git remote get-url origin &> /dev/null; then
    echo ""
    read -p "🚀 ¿Quieres hacer push al repositorio remoto ahora? (s/n): " push_now
    
    if [ "$push_now" = "s" ] || [ "$push_now" = "S" ]; then
        echo ""
        echo "📤 Haciendo push a origin/$current_branch..."
        
        if git push -u origin "$current_branch"; then
            echo ""
            echo "✅ Push exitoso!"
            echo ""
            echo "🎉 ¡Repositorio configurado correctamente!"
            echo ""
            echo "📋 Próximos pasos:"
            echo "  1. Ve a GitHub → Settings → Secrets and variables → Actions"
            echo "  2. Configura los siguientes secrets:"
            echo "     - AWS_ACCESS_KEY_ID"
            echo "     - AWS_SECRET_ACCESS_KEY"
            echo "     - AWS_REGION (us-east-1)"
            echo "     - S3_BUCKET (app.transportescchr.cl)"
            echo "     - CLOUDFRONT_DISTRIBUTION_ID (E37NHHZ8PFOAQC)"
            echo ""
            echo "  3. ⚠️  IMPORTANTE: Usa NUEVAS credenciales AWS"
            echo ""
            echo "  4. El workflow se ejecutará automáticamente en cada push"
            echo ""
            echo "📚 Ver documentación completa en DEPLOYMENT.md"
        else
            echo ""
            echo "❌ Error al hacer push"
            echo ""
            echo "Intenta hacer push manualmente:"
            echo "  git push -u origin $current_branch"
        fi
    else
        echo ""
        echo "ℹ️  Push omitido. Puedes hacerlo después con:"
        echo "   git push -u origin $current_branch"
        echo ""
        echo "📋 No olvides configurar GitHub Secrets después:"
        echo "  - AWS_ACCESS_KEY_ID"
        echo "  - AWS_SECRET_ACCESS_KEY"
        echo "  - AWS_REGION (us-east-1)"
        echo "  - S3_BUCKET (app.transportescchr.cl)"
        echo "  - CLOUDFRONT_DISTRIBUTION_ID (E37NHHZ8PFOAQC)"
    fi
fi

echo ""
echo "✅ Script completado"
echo ""
