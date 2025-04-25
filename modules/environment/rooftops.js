import * as THREE from 'three';

export function createRooftops(scene) {
  // Setup rooftops array to store multiple rooftops
  const rooftops = [];
  
  // Create initial rooftop
  const groundGeometry = new THREE.BoxGeometry(30, 1, 10);
  const groundMaterial = new THREE.MeshPhongMaterial({
    color: 0x7ab8cc,
    emissive: 0x3a5e6d,
    emissiveIntensity: 0.3,
    shininess: 70
  });
  const initialRooftop = new THREE.Mesh(groundGeometry, groundMaterial);
  initialRooftop.position.set(0, -0.5, 0);
  initialRooftop.userData = {
    id: 0,
    xMin: -15,
    xMax: 15
  };
  scene.add(initialRooftop);
  rooftops.push(initialRooftop);
  
  // Create next rooftop with some gap
  const nextRooftop = new THREE.Mesh(
    new THREE.BoxGeometry(25, 1, 10),
    new THREE.MeshPhongMaterial({
      color: 0x89c4d6,
      emissive: 0x3f6675,
      emissiveIntensity: 0.4,
      shininess: 80
    })
  );
  // Position the next rooftop with a gap of 5 units
  nextRooftop.position.set(35, -0.5, 0);
  nextRooftop.userData = {
    id: 1,
    xMin: 22.5, // 35 - 12.5
    xMax: 47.5  // 35 + 12.5
  };
  scene.add(nextRooftop);
  rooftops.push(nextRooftop);
  
  // Create new rooftop (Roof 2) at the same level as Roof 0 and Roof 1
  const newRooftop = new THREE.Mesh(
    new THREE.BoxGeometry(25, 1, 10),
    new THREE.MeshPhongMaterial({
      color: 0x89c4d6,
      emissive: 0x3f6675,
      emissiveIntensity: 0.4,
      shininess: 80
    })
  );
  // Position the new rooftop with a smaller gap (2.5 units) from the second rooftop
  newRooftop.position.set(60, -0.5, 0);
  newRooftop.userData = {
    id: 2,
    xMin: 47.5, // 60 - 12.5
    xMax: 72.5  // 60 + 12.5
  };
  scene.add(newRooftop);
  rooftops.push(newRooftop);
  
  // Create second level platform
  const midRooftop = new THREE.Mesh(
    new THREE.BoxGeometry(18, 1, 10),
    new THREE.MeshPhongMaterial({
      color: 0x95d0e2,
      emissive: 0x456d7a,
      emissiveIntensity: 0.5,
      shininess: 85
    })
  );
  // Position the middle rooftop at a higher level
  midRooftop.position.set(80, 3.5, 0);
  midRooftop.userData = {
    id: 3,
    xMin: 71, // 80 - 9
    xMax: 89  // 80 + 9
  };
  scene.add(midRooftop);
  rooftops.push(midRooftop);
  
  // Add glowing edges to rooftops
  addEdgesToRooftops(scene, rooftops);
  
  return rooftops;
}

// Create glowing edges for rooftops
function addEdgesToRooftops(scene, rooftops) {
  const edgeHeight = 0.3, edgeWidth = 0.3;
  const edgeMaterial = new THREE.MeshPhongMaterial({
    color: 0x9fe8ff,
    emissive: 0x4db8d3,
    emissiveIntensity: 0.5,
    shininess: 90
  });
  
  // Function to add edges to a rooftop
  function addEdgesToRooftop(rooftop) {
    const width = rooftop.geometry.parameters.width;
    const depth = rooftop.geometry.parameters.depth;
    const edges = new THREE.Group();
    
    const northEdge = new THREE.Mesh(new THREE.BoxGeometry(width, edgeHeight, edgeWidth), edgeMaterial);
    northEdge.position.set(0, -0.5 + edgeHeight / 2, -depth/2);
    edges.add(northEdge);
    
    const southEdge = new THREE.Mesh(new THREE.BoxGeometry(width, edgeHeight, edgeWidth), edgeMaterial);
    southEdge.position.set(0, -0.5 + edgeHeight / 2, depth/2);
    edges.add(southEdge);
    
    const eastEdge = new THREE.Mesh(new THREE.BoxGeometry(edgeWidth, edgeHeight, depth), edgeMaterial);
    eastEdge.position.set(width/2, -0.5 + edgeHeight / 2, 0);
    edges.add(eastEdge);
    
    const westEdge = new THREE.Mesh(new THREE.BoxGeometry(edgeWidth, edgeHeight, depth), edgeMaterial);
    westEdge.position.set(-width/2, -0.5 + edgeHeight / 2, 0);
    edges.add(westEdge);
    
    edges.position.copy(rooftop.position);
    scene.add(edges);
    return edges;
  }
  
  // Add edges to each rooftop
  const rooftopEdges = rooftops.map(rooftop => addEdgesToRooftop(rooftop));
  
  return rooftopEdges;
}