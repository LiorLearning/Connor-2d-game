import * as THREE from 'three';

// Global exports for use in other modules
export let scene, camera, renderer;

export function initScene() {
  // Create scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050510);
  scene.fog = new THREE.Fog(0x050510, 10, 30);

  // Create camera
  camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.set(0, 3, 8);
  camera.lookAt(0, 2, 0);
  
  // Create renderer
  renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    powerPreference: 'high-performance',
    precision: 'mediump'
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for performance
  renderer.shadowMap.enabled = true;
  document.getElementById('renderDiv').appendChild(renderer.domElement);

  // Add lights
  const ambientLight = new THREE.AmbientLight(0x101020);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0x9090ff, 1);
  directionalLight.position.set(5, 10, 7);
  scene.add(directionalLight);
  
  return scene;
}

// Helper function to convert 3D world coordinates to 2D screen coordinates
export function worldToScreen(worldVector) {
  const vector = worldVector.clone();
  // Project vector to screen space
  vector.project(camera);
  
  // Convert to screen coordinates
  return {
    x: (vector.x * 0.5 + 0.5) * window.innerWidth,
    y: (-vector.y * 0.5 + 0.5) * window.innerHeight
  };
}

// Screen shake effect
export function triggerScreenShake(intensity, duration) {
  const shakeStartTime = Date.now();
  // Store the camera's intended logical position (following the hero)
  const intendedCameraX = camera.position.x; 
  const intendedCameraY = 3;
  const intendedCameraZ = 8;

  function shake() {
    const elapsed = Date.now() - shakeStartTime;
    if (elapsed < duration) {
      const shakeAmount = intensity * (1 - elapsed / duration); // Decrease intensity over time
      // Apply shake relative to the intended position
      camera.position.x = intendedCameraX + (Math.random() - 0.5) * shakeAmount * 2;
      camera.position.y = intendedCameraY + (Math.random() - 0.5) * shakeAmount;
      // Keep Z fixed unless you want depth shake too
      camera.position.z = intendedCameraZ; 
      
      requestAnimationFrame(shake);
    } else {
      // Reset camera precisely to its intended logical position after shake
      camera.position.x = intendedCameraX;
      camera.position.y = intendedCameraY;
      camera.position.z = intendedCameraZ;
    }
  }
  shake();
}