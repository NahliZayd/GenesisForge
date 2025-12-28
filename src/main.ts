import * as THREE from 'three';
import GUI from 'lil-gui';
import Stats from 'stats.js';
import { Globe } from './core/Globe';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { Starfield } from './effects/Starfield';
import { PLANET_PRESETS } from './data/presets';

// --- Initialization ---
const init = () => {
    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    // Stats Panel
    const stats = new Stats();
    stats.showPanel(0); // 0: fps, 1: ms, 2: mb
    document.body.appendChild(stats.dom);

    // Starfield Background
    const starfield = new Starfield(15000, 800);
    scene.add(starfield.getMesh());

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 2.0);
    sunLight.position.set(50, 20, 30);
    scene.add(sunLight);

    // Camera
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 25);

    // Renderer
    const container = document.getElementById('canvas-container')!;
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // Post-processing
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        0.5,  // strength
        0.4,  // radius
        0.85  // threshold
    );
    composer.addPass(bloomPass);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 12;
    controls.maxDistance = 100;

    // Globe
    const globe = new Globe(10);
    scene.add(globe.container);

    // Day/Night Cycle
    let dayNightEnabled = false;
    let dayNightTime = 0;

    // GUI Setup
    const gui = new GUI();
    gui.domElement.style.position = 'absolute';
    gui.domElement.style.top = '10px';
    gui.domElement.style.right = '10px';

    // Terrain Folder
    const terrainFolder = gui.addFolder('🌍 Terrain');
    const terrainParams = {
        frequency: globe.params.frequency,
        height: globe.params.heightMultiplier,
        seed: globe.params.seed,
        regenerate: () => {
            globe.params.frequency = terrainParams.frequency;
            globe.params.heightMultiplier = terrainParams.height;
            globe.params.seed = terrainParams.seed;
            globe.rebuild();
        }
    };

    terrainFolder.add(terrainParams, 'frequency', 0.1, 5.0).name('Frequency');
    terrainFolder.add(terrainParams, 'height', 0.0, 0.5).name('Height');
    terrainFolder.add(terrainParams, 'seed', 0, 10000, 1).name('Seed');
    terrainFolder.add(terrainParams, 'regenerate').name('🔄 Regenerate');
    terrainFolder.open();

    // Presets Folder
    const presetsFolder = gui.addFolder('🎨 Presets');
    const presetButtons: any = {};
    PLANET_PRESETS.forEach(preset => {
        presetButtons[preset.name] = () => {
            terrainParams.frequency = preset.frequency;
            terrainParams.height = preset.heightMultiplier;
            terrainParams.seed = preset.seed;
            globe.params.frequency = preset.frequency;
            globe.params.heightMultiplier = preset.heightMultiplier;
            globe.params.seed = preset.seed;
            globe.rebuild();
            terrainFolder.controllersRecursive().forEach(c => c.updateDisplay());
        };
        presetsFolder.add(presetButtons, preset.name).name(preset.name);
    });

    // Visual Effects Folder
    const effectsFolder = gui.addFolder('✨ Effects');
    const effectsParams = {
        autoRotate: false,
        rotationSpeed: 0.1,
        clouds: false,
        dayNight: false,
        bloom: true,
        bloomStrength: 0.5,
        wireframe: false
    };

    effectsFolder.add(effectsParams, 'autoRotate').name('Auto Rotate').onChange((v: boolean) => {
        globe.autoRotate = v;
    });
    effectsFolder.add(effectsParams, 'rotationSpeed', 0.01, 1.0).name('Rotation Speed').onChange((v: number) => {
        globe.rotationSpeed = v;
    });
    effectsFolder.add(effectsParams, 'clouds').name('Clouds').onChange((v: boolean) => {
        if (globe.cloudLayer) {
            globe.cloudLayer.setVisible(v);
        }
    });
    effectsFolder.add(effectsParams, 'dayNight').name('Day/Night Cycle').onChange((v: boolean) => {
        dayNightEnabled = v;
    });
    effectsFolder.add(effectsParams, 'bloom').name('Bloom').onChange((v: boolean) => {
        bloomPass.enabled = v;
    });
    effectsFolder.add(effectsParams, 'bloomStrength', 0, 2).name('Bloom Strength').onChange((v: number) => {
        bloomPass.strength = v;
    });
    effectsFolder.add(effectsParams, 'wireframe').name('Wireframe').onChange((v: boolean) => {
        scene.traverse((obj) => {
            if (obj instanceof THREE.Mesh && obj.material instanceof THREE.MeshStandardMaterial) {
                obj.material.wireframe = v;
            }
        });
    });
    effectsFolder.open();

    // Tools Folder
    const toolsFolder = gui.addFolder('🛠️ Tools');
    const toolsParams = {
        screenshot: () => {
            renderer.render(scene, camera);
            const dataURL = renderer.domElement.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `genesisforge_${Date.now()}.png`;
            link.href = dataURL;
            link.click();
        },
        stats: true,
        lodVisualization: false
    };

    toolsFolder.add(toolsParams, 'screenshot').name('📸 Screenshot');
    toolsFolder.add(toolsParams, 'stats').name('Show Stats').onChange((v: boolean) => {
        stats.dom.style.display = v ? 'block' : 'none';
    });
    toolsFolder.add(toolsParams, 'lodVisualization').name('LOD Colors').onChange((v: boolean) => {
        // Toggle LOD visualization (would need to modify QuadNode materials)
        console.log('LOD Visualization:', v);
    });

    // Biome Legend
    const legendDiv = document.createElement('div');
    legendDiv.style.position = 'absolute';
    legendDiv.style.bottom = '20px';
    legendDiv.style.left = '20px';
    legendDiv.style.background = 'rgba(0,0,0,0.7)';
    legendDiv.style.color = 'white';
    legendDiv.style.padding = '15px';
    legendDiv.style.borderRadius = '8px';
    legendDiv.style.fontFamily = 'monospace';
    legendDiv.style.fontSize = '12px';
    legendDiv.style.display = 'none';
    legendDiv.innerHTML = `
        <strong>🌍 Biome Legend</strong><br>
        <div style="margin-top:8px">
            <span style="color:#4d8c73">██</span> Sea Floor<br>
            <span style="color:#ede0b1">██</span> Beach<br>
            <span style="color:#80b34d">██</span> Coastal Vegetation<br>
            <span style="color:#339933">██</span> Lowland Forest<br>
            <span style="color:#6b5c33">██</span> Highland<br>
            <span style="color:#807366">██</span> Rocky Mountain<br>
            <span style="color:#e6e6f0">██</span> Snow Peaks
        </div>
    `;
    document.body.appendChild(legendDiv);

    toolsFolder.add({ showLegend: false }, 'showLegend').name('Biome Legend').onChange((v: boolean) => {
        legendDiv.style.display = v ? 'block' : 'none';
    });

    // Animation Loop
    const clock = new THREE.Clock();
    const animate = () => {
        stats.begin();
        requestAnimationFrame(animate);

        const delta = clock.getDelta();

        // Update controls
        controls.update();

        // Day/Night Cycle
        if (dayNightEnabled) {
            dayNightTime += delta * 0.1;
            const angle = dayNightTime;
            sunLight.position.set(
                Math.cos(angle) * 50,
                Math.sin(angle) * 30,
                30
            );

            // Adjust ambient light based on sun position
            const sunHeight = Math.sin(angle);
            ambientLight.intensity = 0.1 + Math.max(0, sunHeight) * 0.3;
        }

        // Update starfield
        starfield.update(delta);

        // Update globe
        const sunDirection = sunLight.position.clone().normalize();
        globe.update(camera, delta, sunDirection);

        // Render
        composer.render();

        stats.end();
    };

    // Resize Handler
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        composer.setSize(window.innerWidth, window.innerHeight);
    });

    animate();
};

init();

