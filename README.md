# Petite Dent

Sitio web de **Petite Dent** — consultorio de odontopediatría de la Dra. Joanne Mendoza en Torre Agalta, Tegucigalpa.

## Vista previa local

Abre `index.html` en tu navegador, o sirve la carpeta con cualquier servidor estático:

```bash
python3 -m http.server 8080
```

Luego visita http://localhost:8080

## Publicar en GitHub Pages

1. Ve a **Settings → Pages** en el repositorio
2. En **Source**, elige **Deploy from a branch**
3. Branch: `main`, carpeta: `/ (root)`
4. Guarda — en unos minutos el sitio estará en:
   **https://stellier7.github.io/Petite-dent/**

## Agregar imágenes

Sube las fotos en la carpeta [`assets/images/`](assets/images/) siguiendo la guía en [`assets/images/README.md`](assets/images/README.md).

Enlace directo: https://github.com/stellier7/Petite-dent/tree/main/assets/images

## Estructura

```
├── index.html              # Página principal
├── assets/
│   ├── css/styles.css      # Estilos
│   ├── js/main.js          # Tabs, formulario WhatsApp, fallbacks de imágenes
│   └── images/             # Fotos del consultorio (subir aquí)
└── .nojekyll               # Config para GitHub Pages
```

## Pendiente (opcional)

- Enlaces de Facebook e Instagram en el footer (actualmente `#`)
- Dominio personalizado (ej. `petitedent.hn`) en GitHub Pages Settings
