import * as THREE from 'three';

export function createSkyline(scene) {
  const skylineGroup = new THREE.Group();
  // Return empty group - no buildings will be created
  scene.add(skylineGroup);
  return skylineGroup;
}