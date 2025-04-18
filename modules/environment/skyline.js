import * as THREE from 'three';

export function createSkyline(scene) {
  const skylineGroup = new THREE.Group();
  const buildingCount = 40;
  const buildingWidth = 2;
  const spacing = 2.5;
  
  // Use geometry instancing for similar buildings
  const buildingGeometries = [
    new THREE.BoxGeometry(buildingWidth, 4, 1.5),
    new THREE.BoxGeometry(buildingWidth, 6, 1.5),
    new THREE.BoxGeometry(buildingWidth, 8, 1.5)
  ];
  
  // Create reusable materials to reduce draw calls
  const buildingMaterials = [
    new THREE.MeshPhongMaterial({
      color: 0x000000,
      emissive: new THREE.Color(0.05, 0.05, 0.2),
      shininess: 30
    }),
    new THREE.MeshPhongMaterial({
      color: 0x000000,
      emissive: new THREE.Color(0.05, 0.2, 0.05),
      shininess: 30
    }),
    new THREE.MeshPhongMaterial({
      color: 0x000000,
      emissive: new THREE.Color(0.2, 0.05, 0.05),
      shininess: 30
    })
  ];
  
  // Reuse geometries and materials to create buildings
  for (let i = 0; i < buildingCount; i++) {
    const geometryIndex = Math.floor(Math.random() * buildingGeometries.length);
    const materialIndex = Math.floor(Math.random() * buildingMaterials.length);
    
    const building = new THREE.Mesh(
      buildingGeometries[geometryIndex],
      buildingMaterials[materialIndex]
    );
    
    const height = buildingGeometries[geometryIndex].parameters.height;
    building.position.set(
      (i - buildingCount / 2) * spacing, 
      height / 2 - 0.5, 
      -10 - (Math.random() * 10)
    );
    
    skylineGroup.add(building);
  }
  
  scene.add(skylineGroup);
  return skylineGroup;
}