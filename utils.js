import * as THREE from 'three';

// Utility functions for the game
export function worldToScreen(worldVector, camera) {
  const vector = worldVector.clone();
  // Project vector to screen space
  vector.project(camera);
  
  // Convert to screen coordinates
  return {
    x: (vector.x * 0.5 + 0.5) * window.innerWidth,
    y: (-vector.y * 0.5 + 0.5) * window.innerHeight
  };
}

// Debounced window resize handler
export function createResizeHandler(camera, renderer) {
  let resizeTimeout;
  return function handleResize() {
    // Debounce resize events
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }, 250);
  };
}

