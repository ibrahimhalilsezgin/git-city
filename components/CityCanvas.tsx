'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { BuildingLayout, DistrictLayout } from '@/lib/treemap';

interface CityCanvasProps {
  buildings: BuildingLayout[];
  districts: DistrictLayout[];
  selectedBuilding: BuildingLayout | null;
  hoveredBuilding: BuildingLayout | null;
  onSelectBuilding: (building: BuildingLayout | null) => void;
  onHoverBuilding: (building: BuildingLayout | null) => void;
  cameraPreset?: 'iso' | 'top' | 'front';
}

interface BuildingRuntime {
  mesh: THREE.Mesh;
  layout: BuildingLayout;
  currentHeight: number;
  targetHeight: number;
}

export default function CityCanvas({
  buildings,
  districts,
  selectedBuilding,
  hoveredBuilding,
  onSelectBuilding,
  onHoverBuilding,
  cameraPreset,
}: CityCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  const buildingsRuntimeRef = useRef<Map<string, BuildingRuntime>>(new Map());
  const districtMeshesRef = useRef<THREE.Mesh[]>([]);

  // Hover/Select refs to avoid stale closure in animate/event loops
  const hoveredBuildingRef = useRef<BuildingLayout | null>(hoveredBuilding);
  hoveredBuildingRef.current = hoveredBuilding;
  const selectedBuildingRef = useRef<BuildingLayout | null>(selectedBuilding);
  selectedBuildingRef.current = selectedBuilding;

  // Initialize Scene, Camera, Renderer, Controls
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#090d16');
    scene.fog = new THREE.FogExp2('#090d16', 0.012);
    sceneRef.current = scene;

    // Camera (Isometric angle)
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(48, 42, 48);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.05; // don't go below ground
    controls.minDistance = 8;
    controls.maxDistance = 180;
    controlsRef.current = controls;

    // Lighting
    const ambientLight = new THREE.AmbientLight('#ffffff', 0.75);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight('#ffffff', 1.8);
    sunLight.position.set(50, 80, 40);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 250;
    const d = 55;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight('#60a5fa', 0.6);
    fillLight.position.set(-40, 30, -40);
    scene.add(fillLight);

    // City Island Base Ground Slab
    const groundGeo = new THREE.BoxGeometry(76, 1.2, 76);
    const groundMat = new THREE.MeshStandardMaterial({
      color: '#111827',
      roughness: 0.85,
      metalness: 0.1,
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.position.y = -0.6;
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);

    // Subtle Grid on ground
    const grid = new THREE.GridHelper(76, 38, '#1e293b', '#131d2e');
    grid.position.y = 0.02;
    scene.add(grid);

    // Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Smooth height tweening for buildings
      buildingsRuntimeRef.current.forEach((item) => {
        if (Math.abs(item.currentHeight - item.targetHeight) > 0.01) {
          item.currentHeight += (item.targetHeight - item.currentHeight) * 0.18;
          item.mesh.scale.y = Math.max(0.01, item.currentHeight);
          item.mesh.position.y = item.currentHeight / 2;
        }

        // Hover & Selection visuals
        const isHovered = hoveredBuildingRef.current?.path === item.layout.path;
        const isSelected = selectedBuildingRef.current?.path === item.layout.path;

        const mat = item.mesh.material as THREE.MeshStandardMaterial;
        if (isSelected) {
          mat.emissive.set('#38bdf8');
          mat.emissiveIntensity = 0.6;
        } else if (isHovered) {
          mat.emissive.set('#ffffff');
          mat.emissiveIntensity = 0.4;
        } else {
          mat.emissive.set(item.layout.color);
          mat.emissiveIntensity = 0.08;
        }
      });

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Raycasting for Mouse Interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleMouseMove = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const buildingMeshes = Array.from(buildingsRuntimeRef.current.values()).map((b) => b.mesh);
      const intersects = raycaster.intersectObjects(buildingMeshes, false);

      if (intersects.length > 0) {
        const hitMesh = intersects[0].object as THREE.Mesh;
        const hitPath = hitMesh.userData.path;
        const hitRuntime = buildingsRuntimeRef.current.get(hitPath);
        if (hitRuntime) {
          onHoverBuilding(hitRuntime.layout);
          renderer.domElement.style.cursor = 'pointer';
          return;
        }
      }

      onHoverBuilding(null);
      renderer.domElement.style.cursor = 'default';
    };

    const handleClick = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const buildingMeshes = Array.from(buildingsRuntimeRef.current.values()).map((b) => b.mesh);
      const intersects = raycaster.intersectObjects(buildingMeshes, false);

      if (intersects.length > 0) {
        const hitMesh = intersects[0].object as THREE.Mesh;
        const hitPath = hitMesh.userData.path;
        const hitRuntime = buildingsRuntimeRef.current.get(hitPath);
        if (hitRuntime) {
          onSelectBuilding(hitRuntime.layout);
          return;
        }
      }

      onSelectBuilding(null);
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousemove', handleMouseMove);
    dom.addEventListener('click', handleClick);

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      dom.removeEventListener('mousemove', handleMouseMove);
      dom.removeEventListener('click', handleClick);
      renderer.dispose();
      if (container.contains(dom)) {
        container.removeChild(dom);
      }
    };
  }, []);

  // Update Districts in Scene
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Clean old district meshes
    districtMeshesRef.current.forEach((m) => {
      scene.remove(m);
      m.geometry.dispose();
      (m.material as THREE.Material).dispose();
    });
    districtMeshesRef.current = [];

    // Create subtle district pads
    districts.forEach((d) => {
      const padGeo = new THREE.PlaneGeometry(d.width, d.depth);
      const padMat = new THREE.MeshBasicMaterial({
        color: '#1e293b',
        wireframe: true,
        transparent: true,
        opacity: 0.35,
      });
      const padMesh = new THREE.Mesh(padGeo, padMat);
      padMesh.rotation.x = -Math.PI / 2;
      padMesh.position.set(d.x, 0.04 + d.level * 0.01, d.z);
      scene.add(padMesh);
      districtMeshesRef.current.push(padMesh);
    });
  }, [districts]);

  // Update Buildings in Scene
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const currentMap = buildingsRuntimeRef.current;
    const newPathSet = new Set(buildings.map((b) => b.path));

    // Remove buildings no longer in layout
    for (const [path, runtime] of currentMap.entries()) {
      if (!newPathSet.has(path)) {
        scene.remove(runtime.mesh);
        runtime.mesh.geometry.dispose();
        (runtime.mesh.material as THREE.Material).dispose();
        currentMap.delete(path);
      }
    }

    // Add or update buildings
    buildings.forEach((b) => {
      let runtime = currentMap.get(b.path);

      if (!runtime) {
        // Box unit geometry (unit height 1, scaled by currentHeight)
        const geo = new THREE.BoxGeometry(b.width, 1, b.depth);
        const mat = new THREE.MeshStandardMaterial({
          color: b.color,
          roughness: 0.35,
          metalness: 0.15,
          emissive: b.color,
          emissiveIntensity: 0.1,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.position.set(b.x, 0.01, b.z);
        mesh.scale.y = 0.01;
        mesh.userData = { path: b.path };
        scene.add(mesh);

        runtime = {
          mesh,
          layout: b,
          currentHeight: 0.01,
          targetHeight: b.targetHeight,
        };
        currentMap.set(b.path, runtime);
      } else {
        // Update layout target height and dimensions
        runtime.layout = b;
        runtime.targetHeight = b.targetHeight;
        runtime.mesh.position.x = b.x;
        runtime.mesh.position.z = b.z;
      }
    });
  }, [buildings]);

  // Camera presets
  useEffect(() => {
    if (!cameraRef.current || !controlsRef.current || !cameraPreset) return;
    const camera = cameraRef.current;
    const controls = controlsRef.current;

    if (cameraPreset === 'iso') {
      camera.position.set(48, 42, 48);
      controls.target.set(0, 0, 0);
    } else if (cameraPreset === 'top') {
      camera.position.set(0, 75, 0.1);
      controls.target.set(0, 0, 0);
    } else if (cameraPreset === 'front') {
      camera.position.set(0, 25, 60);
      controls.target.set(0, 4, 0);
    }
    controls.update();
  }, [cameraPreset]);

  return <div ref={containerRef} className="w-full h-full relative select-none overflow-hidden" />;
}
