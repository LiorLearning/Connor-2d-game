import * as THREE from 'three';

export function createJumpBoostIndicator(scene) {
  // Create jump boost indicator on first rooftop
  const jumpBoostGeometry = new THREE.PlaneGeometry(8, 10);
  const jumpBoostMaterial = new THREE.MeshBasicMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0.2,
    side: THREE.DoubleSide
  });
  const jumpBoostIndicator = new THREE.Mesh(jumpBoostGeometry, jumpBoostMaterial);
  jumpBoostIndicator.rotation.x = -Math.PI / 2; // Rotate to lay flat on rooftop
  jumpBoostIndicator.position.set(11, -0.49, 0); // Position at the right edge of first rooftop
  scene.add(jumpBoostIndicator);
  
  // Add pulsing animation to the jump boost indicator
  function animateJumpBoost() {
    requestAnimationFrame(animateJumpBoost);
    jumpBoostMaterial.opacity = 0.1 + Math.abs(Math.sin(Date.now() * 0.002)) * 0.2;
  }
  animateJumpBoost();
  
  // Add methods to highlight on activation
  jumpBoostIndicator.highlight = function() {
    const originalOpacity = jumpBoostMaterial.opacity;
    jumpBoostMaterial.opacity = 0.8;
    setTimeout(() => {
      jumpBoostMaterial.opacity = originalOpacity;
    }, 300);
  };
  
  return jumpBoostIndicator;
}

// Function to create jump flash effect
export function createJumpFlashEffect(scene, position) {
  const jumpFlash = new THREE.Mesh(
    new THREE.CircleGeometry(0.3, 16),
    new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.8 })
  );
  jumpFlash.position.set(position.x, position.y - 0.5, position.z);
  jumpFlash.rotation.x = -Math.PI / 2;
  scene.add(jumpFlash);
  
  const startTime = Date.now();
  (function removeJumpFlash() {
    const elapsed = Date.now() - startTime;
    if (elapsed < 500) {
      jumpFlash.scale.set(1 + elapsed / 250, 1 + elapsed / 250, 1);
      jumpFlash.material.opacity = 0.8 * (1 - elapsed / 500);
      requestAnimationFrame(removeJumpFlash);
    } else {
      scene.remove(jumpFlash);
    }
  })();
  
  return jumpFlash;
}