# Dibujo a 3D - Sólidos de Revolución

Aplicación web interactiva que te permite dibujar un perfil a mano alzada o utilizando ecuaciones matemáticas (JavaScript), para generar en tiempo real un sólido de revolución en 3D utilizando **Three.js**.

## Características principales
- ✏️ **Dibujo a mano alzada:** Dibuja el perfil sobre un lienzo (canvas 2D).
- 🧮 **Editor Live:** Modifica ecuaciones paramétricas al vuelo y renderízalo al instante.
- 💾 **Exportación:** Exporta tus modelos a formato `STL` o `OBJ` para impresión 3D.
- 📥 **Importar / Exportar JSON:** Guarda y carga los puntos generados de tus dibujos para uso posterior.
- ✨ **Material fotorrealista:** Generado con un `MeshPhysicalMaterial` que simula vidrio translúcido con propiedades físicas (refracción y rugosidad).

## Cómo publicarlo en GitHub Pages

1. Inicializa este directorio como un repositorio de Git:
   ```bash
   cd /Users/marceloontiverosbalcazar/Documents/up/calculo_integral/revolucion_3d_web
   git init
   git add .
   git commit -m "Commit inicial: Herramienta de revolucion 3D"
   ```
2. Crea un nuevo repositorio vacío en tu cuenta de GitHub (sin README, ni .gitignore).
3. Vincula tu repositorio local con el remoto y súbelo (reemplazando `TU-USUARIO` y `TU-REPO` por los correctos):
   ```bash
   git remote add origin https://github.com/TU-USUARIO/TU-REPO.git
   git branch -M main
   git push -u origin main
   ```
4. Ve a la configuración de tu repositorio en GitHub > **Pages** > **Build and deployment** y selecciona la rama `main` en la carpeta `/ (root)` y haz clic en **Save**. ¡En un par de minutos tu sitio web estará público!