import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { STLExporter } from 'three/addons/exporters/STLExporter.js';
import { OBJExporter } from 'three/addons/exporters/OBJExporter.js';

// 1. Configuración de Escena, Cámara y Renderer
const scene = new THREE.Scene();
scene.background = new THREE.Color('#111111');
scene.fog = new THREE.Fog('#111111', 10, 50);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 4, 12);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 4, 0);

// Iluminación realista (entorno) para que el vidrio luzca bien
const pmremGenerator = new THREE.PMREMGenerator(renderer);
scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;

// Añadimos plano de referencia (suelo)
const gridHelper = new THREE.GridHelper(20, 40, 0x4facfe, 0x333333);
scene.add(gridHelper);

// 2. Parámetros Generales
const params = {
    segments: 128,
    // Material
    color: '#c2edfc',
    transmission: 0.95,
    ior: 1.45,
    roughness: 0.02
};

// 3. Lógica del Canvas "Paint"
const drawCanvas = document.getElementById('drawCanvas');
const ctx = drawCanvas.getContext('2d');
const clearBtn = document.getElementById('clearBtn');

let isDrawing = false;
let rawPoints = []; // Almacena los puntos 2D del dibujo

function clearCanvas() {
    ctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
    rawPoints = [];
    if (glassMesh) {
        scene.remove(glassMesh);
        glassMesh = null;
    }
}

// Función para leer y renderizar desde el editor de texto
function applyEditorData() {
    const text = document.getElementById('dataEditor').value.trim();
    try {
        if (text.startsWith('[') || text.startsWith('{')) {
            // Si es un dibujo a mano libre convertido en JSON
            rawPoints = JSON.parse(text);
        } else {
            // Si son ecuaciones escritas en código JS
            const func = new Function(text);
            rawPoints = func();
            if (!Array.isArray(rawPoints)) throw new Error("El código no retornó puntos.");
        }
        
        // Redibujar en el Canvas 2D
        ctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
        if (rawPoints.length > 0) {
            ctx.beginPath();
            ctx.moveTo(rawPoints[0].x, rawPoints[0].y);
            for (let i = 1; i < rawPoints.length; i++) {
                ctx.lineTo(rawPoints[i].x, rawPoints[i].y);
            }
            ctx.strokeStyle = '#4facfe';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.stroke();
        }
        updateMesh(); // Renderizar en 3D
    } catch (err) {
        alert("Error de sintaxis en ecuaciones: " + err.message);
    }
}

clearBtn.addEventListener('click', clearCanvas);
document.getElementById('btnApply').addEventListener('click', applyEditorData);

drawCanvas.addEventListener('mousedown', (e) => {
    isDrawing = true;
    clearCanvas(); // Empieza un nuevo dibujo en cada click
    ctx.beginPath();
    const rect = drawCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ctx.moveTo(x, y);
    rawPoints.push({ x, y });
});

drawCanvas.addEventListener('mousemove', (e) => {
    if (!isDrawing) return;
    const rect = drawCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Filtrado: solo guarda el punto si se movió al menos 3 pixeles
    const lastP = rawPoints[rawPoints.length - 1];
    if (Math.hypot(x - lastP.x, y - lastP.y) > 3) {
        ctx.lineTo(x, y);
        ctx.strokeStyle = '#4facfe';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
        rawPoints.push({ x, y });
    }
});

drawCanvas.addEventListener('mouseup', () => {
    isDrawing = false;
    // Al soltar el trazo libre, actualizamos el panel con los datos numéricos JSON
    document.getElementById('dataEditor').value = JSON.stringify(rawPoints, null, 2);
    updateMesh(); // Genera el 3D al soltar el ratón
});
drawCanvas.addEventListener('mouseleave', () => {
    if (isDrawing) {
        isDrawing = false;
        updateMesh();
    }
});

// 4. Inicialización de Material y Malla
const glassMaterial = new THREE.MeshPhysicalMaterial({
    metalness: 0.1,
    side: THREE.DoubleSide, // Crucial para ver la malla dibujada por dentro y por fuera
    transparent: true
});

let glassMesh;
const SCALE = 0.02; 

function updateMesh() {
    if (glassMesh) scene.remove(glassMesh);
    if (rawPoints.length < 2) return;
    
    // Escalar puntos al espacio 3D
    // Invertimos el eje Y porque en Canvas Y crece hacia abajo, pero en 3D Y crece hacia arriba
    const scaledPoints = rawPoints.map(p => {
        return new THREE.Vector2(p.x * SCALE, (drawCanvas.height - p.y) * SCALE);
    });
    
    const geometry = new THREE.LatheGeometry(scaledPoints, params.segments);
    geometry.computeVertexNormals();
    
    glassMaterial.color.set(params.color);
    glassMaterial.transmission = params.transmission;
    glassMaterial.ior = params.ior;
    glassMaterial.roughness = params.roughness;
    glassMaterial.thickness = 0.1;

    glassMesh = new THREE.Mesh(geometry, glassMaterial);
    scene.add(glassMesh);
}

// 5. Interfaz Gráfica (lil-gui)
const gui = new GUI({ title: 'Ajustes del Material' });

gui.addColor(params, 'color').name('Color').onChange(updateMesh);
gui.add(params, 'transmission', 0, 1).name('Transmisión').onChange(updateMesh);
gui.add(params, 'ior', 1, 2.5).name('Índice de Refracción').onChange(updateMesh);
gui.add(params, 'roughness', 0, 1).name('Rugosidad').onChange(updateMesh);
gui.add(params, 'segments', 16, 256).step(1).name('Resolución (Lados)').onChange(updateMesh);

// Render inicial basado en el código del textarea
applyEditorData();

// --- 7. LÓGICA DE EXPORTACIÓN E IMPORTACIÓN ---
function downloadFile(content, fileName, mimeType = 'text/plain') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
}

document.getElementById('btnExportSTL').addEventListener('click', () => {
    if (!glassMesh) return alert("No hay modelo 3D generado.");
    const exporter = new STLExporter();
    const stlString = exporter.parse(scene);
    downloadFile(stlString, 'modelo_revolucion.stl');
});

document.getElementById('btnExportOBJ').addEventListener('click', () => {
    if (!glassMesh) return alert("No hay modelo 3D generado.");
    const exporter = new OBJExporter();
    const objString = exporter.parse(scene);
    downloadFile(objString, 'modelo_revolucion.obj');
});

document.getElementById('btnExportEq').addEventListener('click', () => {
    const text = document.getElementById('dataEditor').value;
    downloadFile(text, 'ecuaciones.txt');
});

document.getElementById('btnExportJSON').addEventListener('click', () => {
    if (!rawPoints || rawPoints.length === 0) {
        alert("No hay datos para exportar.");
        return;
    }
    const jsonString = JSON.stringify(rawPoints, null, 2);
    downloadFile(jsonString, 'puntos_revolucion.json', 'application/json');
});

document.getElementById('btnImportEq').addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt,.json,.js';
    input.onchange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (ev) => {
            document.getElementById('dataEditor').value = ev.target.result;
            applyEditorData();
        };
        reader.readAsText(file);
    };
    input.click();
});

// 6. Animación y Redimensionamiento
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();