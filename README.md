# Frontend - Transportes CR

Sistema de gestión y seguimiento integral para empresa de transporte de carga en Chile.

## 🚀 Quick Start

### Desarrollo

```bash
npm install
npm start
```

La aplicación estará disponible en `http://localhost:4201`

### Build de Producción

```bash
npm run build:prod
```

Los archivos compilados estarán en `dist/frontend/browser/`

---

## 📦 Deployment

Este proyecto se despliega automáticamente a AWS S3 + CloudFront mediante GitHub Actions.

### Configuración Inicial

1. **Crear repositorio en GitHub**: `transportes-cr-frontend`
2. **Configurar AWS** (ver `AWS_SETUP.md` para guía completa)
3. **Configurar GitHub Secrets** (ver `DEPLOYMENT.md`)
4. **Push al repositorio** - El deployment es automático

### Deployment Automático

Cada push a `main` o `master` dispara automáticamente:
- ✅ Build de producción
- ✅ Deployment a S3
- ✅ Invalidación de caché CloudFront

### URLs

- **Producción**: `https://app.transportescchr.cl`
- **API**: `https://api.transportescchr.cl/api`
- **Desarrollo**: `http://localhost:4201`

---

## 📚 Documentación

- **[AWS_SETUP.md](AWS_SETUP.md)** - Configuración completa de AWS (S3, CloudFront, IAM)
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Guía de deployment y GitHub Actions
- **[aws-iam-policy.json](aws-iam-policy.json)** - Políticas IAM necesarias
- **[../CLAUDE.md](../CLAUDE.md)** - Arquitectura del proyecto y guías de desarrollo

---

## 🛠️ Tecnologías

- **Angular** (v20) - Framework principal
- **TypeScript** - Lenguaje de programación
- **Tailwind CSS** - Framework CSS
- **SCSS** - Preprocesador CSS
- **RxJS** - Programación reactiva

---

## 📁 Estructura del Proyecto

```
frontend/
├── src/
│   ├── app/
│   │   ├── core/               # Servicios, guards, interceptors
│   │   ├── shared/             # Componentes compartidos
│   │   ├── features/
│   │   │   ├── admin/          # Panel administrativo
│   │   │   └── customer-portal/ # Portal de clientes
│   │   └── layouts/            # Layouts de la app
│   ├── environments/
│   │   ├── environment.ts               # Desarrollo (default)
│   │   ├── environment.development.ts   # Desarrollo
│   │   └── environment.production.ts    # Producción
│   └── styles.scss
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions workflow
├── angular.json
├── package.json
├── tsconfig.json
├── AWS_SETUP.md               # Guía de setup AWS
├── DEPLOYMENT.md              # Guía de deployment
└── aws-iam-policy.json        # Políticas IAM
```

---

## 🔐 Environments

### Development

```typescript
apiUrl: 'http://localhost:3000/api'
```

### Production

```typescript
apiUrl: 'https://api.transportescchr.cl/api'
```

---

## 🧪 Testing

```bash
npm test                # Ejecutar tests unitarios
```

---

## 🎨 Estilos y Componentes

### Standalone Components

Todos los componentes usan el patrón standalone:

```typescript
@Component({
  standalone: true,
  imports: [CommonModule, RouterModule, ...],
  // ...
})
```

### Tailwind CSS

Utiliza clases de Tailwind para estilos:

```html
<div class="flex items-center gap-4 p-4 bg-white rounded-lg shadow-md">
  <!-- contenido -->
</div>
```

---

## 📋 Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `npm start` | Inicia servidor de desarrollo en puerto 4201 |
| `npm run build` | Build para desarrollo |
| `npm run build:prod` | Build optimizado para producción |
| `npm test` | Ejecuta tests unitarios |
| `npm run watch` | Build en modo watch |

---

## 🚀 Inicializar Repositorio Git

Desde el directorio `frontend`:

```bash
chmod +x init-git.sh
./init-git.sh
```

El script creará automáticamente el repositorio `transportes-cr-frontend` en GitHub usando `gh` CLI.

**Requisitos**:
- Git instalado
- GitHub CLI (`gh`) instalado y autenticado

---

## 🔒 Seguridad

- ✅ Credenciales en GitHub Secrets (nunca en código)
- ✅ HTTPS forzado vía CloudFront
- ✅ CORS configurado correctamente
- ✅ Políticas IAM con permisos mínimos
- ✅ Variables de entorno por ambiente

---

## 🐛 Troubleshooting

### Error: "Cannot GET /"

**Causa**: Rutas de Angular no configuradas en S3/CloudFront

**Solución**: Configurar error document como `index.html` (ver `AWS_SETUP.md`)

### Error: "API not accessible"

**Causa**: CORS o URL incorrecta

**Solución**: Verificar `environment.production.ts` y CORS en backend

### Build muy lento

**Solución**: 
```bash
npm ci                    # Instala dependencias limpias
rm -rf .angular/cache     # Limpia caché de Angular
```

---

## 📞 Soporte

Para problemas relacionados con:
- **Deployment**: Ver `DEPLOYMENT.md`
- **AWS Setup**: Ver `AWS_SETUP.md`
- **Arquitectura**: Ver `../CLAUDE.md`

---

## ✅ Checklist de Setup

- [ ] Node.js 20+ instalado
- [ ] Dependencias instaladas (`npm install`)
- [ ] Backend corriendo en `http://localhost:3000`
- [ ] Repositorio GitHub creado
- [ ] AWS configurado (S3 + CloudFront)
- [ ] GitHub Secrets configurados
- [ ] Primer deployment exitoso

---

**Desarrollado con ❤️ para Transportes Cristian Ramirez EIRL**


To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
