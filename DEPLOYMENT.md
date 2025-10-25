# Frontend Deployment Guide

## 🚀 Despliegue Automático con GitHub Actions

Este proyecto está configurado para desplegarse automáticamente a AWS S3 + CloudFront cada vez que se hace push a las ramas `main` o `master`.

---

## 📋 Pre-requisitos

### 1. AWS Setup Completado
✅ Bucket S3 creado: `app.transportescchr.cl`  
✅ Static Website Hosting habilitado  
✅ CloudFront distribution configurada  
✅ Certificado SSL validado (si usas dominio personalizado)  
✅ Usuario IAM con políticas correctas (ver `aws-iam-policy.json`)

### 2. Credenciales AWS
Debes tener:
- AWS Access Key ID
- AWS Secret Access Key
- CloudFront Distribution ID

⚠️ **IMPORTANTE**: Las credenciales NUNCA deben estar en el código. Se configuran como GitHub Secrets.

---

## 🔐 Configuración de GitHub Secrets

### Paso 1: Acceder a la configuración de Secrets

1. Ve a tu repositorio en GitHub: `https://github.com/cramirez1996/transportes-cr-frontend`
2. Click en **Settings** (⚙️)
3. En el menú lateral izquierdo, ve a **Secrets and variables** → **Actions**
4. Click en **New repository secret**

### Paso 2: Crear los siguientes Secrets

Crea cada uno de estos secrets individualmente:

#### Secret 1: AWS_ACCESS_KEY_ID
- **Name**: `AWS_ACCESS_KEY_ID`
- **Value**: Tu AWS Access Key (ej: `AKIA...`)
- Click **Add secret**

#### Secret 2: AWS_SECRET_ACCESS_KEY
- **Name**: `AWS_SECRET_ACCESS_KEY`
- **Value**: Tu AWS Secret Access Key
- Click **Add secret**

#### Secret 3: AWS_REGION
- **Name**: `AWS_REGION`
- **Value**: `us-east-1` (o tu región)
- Click **Add secret**

#### Secret 4: S3_BUCKET
- **Name**: `S3_BUCKET`
- **Value**: `app.transportescchr.cl`
- Click **Add secret**

#### Secret 5: CLOUDFRONT_DISTRIBUTION_ID
- **Name**: `CLOUDFRONT_DISTRIBUTION_ID`
- **Value**: `E37NHHZ8PFOAQC`
- Click **Add secret**

### Verificar Secrets

Una vez creados, deberías ver todos los secrets listados:

```
AWS_ACCESS_KEY_ID                 ********
AWS_SECRET_ACCESS_KEY             ********
AWS_REGION                        ********
S3_BUCKET                         ********
CLOUDFRONT_DISTRIBUTION_ID        ********
```

---

## 📦 Proceso de Deployment

### Deployment Automático

El workflow se ejecuta automáticamente cuando:

1. **Push a main/master**:
   ```bash
   git add .
   git commit -m "feat: nueva funcionalidad"
   git push origin main
   ```

2. **Manualmente desde GitHub**:
   - Ve a **Actions** → **Deploy to S3 and CloudFront**
   - Click **Run workflow** → **Run workflow**

### ¿Qué hace el workflow?

1. ✅ Checkout del código
2. ✅ Instala Node.js 20
3. ✅ Instala dependencias (`npm ci`)
4. ✅ Build de producción (`npm run build:prod`)
5. ✅ Sube archivos a S3 con caché optimizado
6. ✅ Invalida caché de CloudFront
7. ✅ Muestra resumen del deployment

### Monitorear el Deployment

1. Ve a **Actions** en tu repositorio
2. Click en el workflow en ejecución
3. Verás el progreso en tiempo real

---

## 🛠️ Deployment Manual (Emergencia)

Si GitHub Actions falla o necesitas desplegar manualmente:

### Desde tu máquina local:

```bash
# 1. Navega al directorio frontend
cd frontend

# 2. Instala dependencias (si es necesario)
npm install

# 3. Build de producción
npm run build:prod

# 4. Configura AWS CLI (una sola vez)
aws configure
# Ingresa: Access Key, Secret Key, Región (us-east-1), Output (json)

# 5. Sube a S3
aws s3 sync dist/frontend/browser s3://app.transportescchr.cl/ --delete

# 6. Invalida CloudFront
aws cloudfront create-invalidation \
  --distribution-id E37NHHZ8PFOAQC \
  --paths "/*"
```

---

## 🌐 URLs del Proyecto

### Desarrollo
- **Local**: `http://localhost:4201`
- **API Local**: `http://localhost:3000/api`

### Producción
- **Frontend**: `https://app.transportescchr.cl`
- **API**: `https://api.transportescchr.cl/api`

---

## 🐛 Troubleshooting

### Error: "AccessDenied" en S3

**Causa**: Credenciales incorrectas o políticas IAM insuficientes

**Solución**:
1. Verifica que los secrets estén correctamente configurados
2. Revisa las políticas IAM del usuario (ver `aws-iam-policy.json`)
3. Verifica que el bucket policy permita las operaciones

### Error: "InvalidationBatch" en CloudFront

**Causa**: Distribution ID incorrecto o permisos faltantes

**Solución**:
1. Verifica el `CLOUDFRONT_DISTRIBUTION_ID` en GitHub Secrets
2. Asegúrate que el usuario IAM tenga permisos de CloudFront

### Los cambios no se reflejan en el sitio

**Causa**: Caché de CloudFront

**Solución**:
```bash
# Invalida manualmente el caché
aws cloudfront create-invalidation \
  --distribution-id E37NHHZ8PFOAQC \
  --paths "/*"
```

### Build falla con errores de TypeScript

**Causa**: Errores en el código

**Solución**:
1. Ejecuta `npm run build:prod` localmente para ver los errores
2. Corrige los errores de TypeScript
3. Haz commit y push de nuevo

### Workflow no se ejecuta

**Causa**: Archivo YAML mal formateado o rama incorrecta

**Solución**:
1. Verifica que el archivo esté en `.github/workflows/deploy.yml`
2. Verifica que estés pusheando a `main` o `master`
3. Revisa la sintaxis YAML en GitHub Actions

---

## 📊 Caché Strategy

El workflow configura caché optimizado:

### Archivos con caché largo (1 año)
- `*.js`, `*.css`, `*.png`, `*.jpg`, `*.svg`, etc.
- Cache-Control: `public,max-age=31536000,immutable`

### Archivos sin caché
- `index.html`
- Cache-Control: `public,max-age=0,must-revalidate`

Esto asegura:
✅ Archivos estáticos con hash se cachean permanentemente  
✅ `index.html` siempre se revalida (importante para SPAs)  
✅ Actualizaciones instantáneas después de cada deploy

---

## 🔒 Seguridad

### ✅ Buenas Prácticas Aplicadas

- ✅ Credenciales en GitHub Secrets (no en código)
- ✅ Usuario IAM con permisos mínimos necesarios
- ✅ CloudFront con HTTPS forzado
- ✅ Bucket S3 no público (acceso vía CloudFront)
- ✅ Certificado SSL/TLS validado

### ⚠️ Nunca Hagas Esto

- ❌ Commitear credenciales AWS en el código
- ❌ Usar políticas IAM con `"Resource": "*"` si puedes evitarlo
- ❌ Deshabilitar HTTPS en CloudFront
- ❌ Hacer el bucket S3 público sin CloudFront

---

## 📝 Checklist de Deployment

Antes del primer deployment, verifica:

- [ ] AWS Setup completado (ver `AWS_SETUP.md`)
- [ ] Bucket S3 creado y configurado
- [ ] CloudFront distribution creada
- [ ] Certificado SSL validado
- [ ] DNS configurado (CNAME a CloudFront)
- [ ] Usuario IAM creado con políticas correctas
- [ ] GitHub Secrets configurados (5 secrets)
- [ ] Repositorio creado en GitHub
- [ ] Código pusheado al repositorio
- [ ] Workflow ejecutado exitosamente

---

## 📚 Comandos Útiles

```bash
# Ver status del deployment
gh workflow view "Deploy to S3 and CloudFront"

# Ejecutar workflow manualmente
gh workflow run deploy.yml

# Ver logs del último deployment
gh run list --workflow=deploy.yml
gh run view <run-id> --log

# Ver secrets configurados (solo nombres, no valores)
gh secret list

# Listar archivos en S3
aws s3 ls s3://app.transportescchr.cl/ --recursive --human-readable

# Ver distribuciones de CloudFront
aws cloudfront list-distributions --query "DistributionList.Items[*].[Id,DomainName,Aliases.Items[0]]" --output table

# Ver invalidaciones de CloudFront
aws cloudfront list-invalidations --distribution-id E37NHHZ8PFOAQC
```

---

## 🆘 Soporte

Si encuentras problemas:

1. **Revisa logs en GitHub Actions** → pestaña Actions
2. **Consulta AWS_SETUP.md** para configuración detallada
3. **Revisa políticas IAM** en `aws-iam-policy.json`
4. **Verifica CloudFront y S3** en AWS Console

---

**✅ Una vez configurado, el deployment es completamente automático!**

Cada push a `main`/`master` desplegará automáticamente a producción en ~3-5 minutos.
