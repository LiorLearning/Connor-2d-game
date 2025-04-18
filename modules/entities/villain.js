import * as THREE from 'three';
import { loadTextures } from '../utils/textureLoader.js';

export function initVillain(scene) {
  // Load textures
  const { villainTexture } = loadTextures();
  
  // Create villain object
  const villain = {
    group: new THREE.Group()
  };

  // Create villain sprite and red glow effect
  const villainMaterial = new THREE.SpriteMaterial({
    map: villainTexture,
    transparent: true,
    alphaTest: 0.1,
    color: 0xffffff
  });
  
  const villainSprite = new THREE.Sprite(villainMaterial);
  villainSprite.scale.set(3.0, 3.0, 1);
  // Tag the villain's left boundary as "back" and right as "front".
  // Since the front is on the right by design, to show the villain's front on the left side,
  // we flip it horizontally by setting a negative scale.x.
  villainSprite.scale.x = -Math.abs(villainSprite.scale.x);
  villain.group.add(villainSprite);

  const villainGlowMaterial = new THREE.SpriteMaterial({
    map: villainTexture,
    transparent: true,
    color: 0xff3333,
    opacity: 0.3
  });
  
  const villainGlowSprite = new THREE.Sprite(villainGlowMaterial);
  villainGlowSprite.scale.set(3.3, 3.3, 1);
  villainGlowSprite.scale.x = -Math.abs(villainGlowSprite.scale.x);
  villain.group.add(villainGlowSprite);

  // Position the villain on the right for visibility
  villain.group.position.set(3, 1.5, 0);
  scene.add(villain.group);
  
  // Expose sprite components
  villain.sprite = villainSprite;
  villain.glowSprite = villainGlowSprite;
  
  // Add fade method
  villain.fadeOut = function(callback) {
    const startOpacity = 1.0;
    const duration = 1500; // 1.5 seconds
    const startTime = Date.now();
    
    function fadeVillain() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1.0);
      
      // Fade out the villain sprites
      villainSprite.material.opacity = startOpacity * (1 - progress);
      villainGlowSprite.material.opacity = 0.3 * (1 - progress);
      
      // Add particle effect as villain vanishes - this would call trail system
      // which will be passed from the main animation loop
      
      if (progress < 1.0) {
        requestAnimationFrame(fadeVillain);
      } else {
        villain.group.visible = false;
        if (callback) callback();
      }
    }
    
    fadeVillain();
  };
  
  return villain;
}