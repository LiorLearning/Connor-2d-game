import * as THREE from 'three';

// Create a singleton texture loader to be reused across the application
const textureLoader = new THREE.TextureLoader();

// Set texture loading options for better memory management
const textureOptions = {
  anisotropy: 1, // Lower anisotropy for better performance
  minFilter: THREE.LinearFilter,
  magFilter: THREE.LinearFilter
};

// Load and cache all textures
let ninjaTexture, villainTexture, smokeBombTexture, minionTexture, boltTexture, gunManTexture, rifleManTexture;

export function loadTextures() {
  // Load all textures if not already loaded
  if (!ninjaTexture) {
    ninjaTexture = textureLoader.load(
      'https://play.rosebud.ai/assets/ChatGPT_Image_Apr_10__2025__04_35_45_AM-removebg-preview.png?ilkK',
      undefined, // onLoad callback
      undefined, // onProgress callback
      undefined, // onError callback
      textureOptions
    );
  }
  
  if (!villainTexture) {
    villainTexture = textureLoader.load(
      'https://play.rosebud.ai/assets/image (19).png?4ziz',
      undefined, undefined, undefined, textureOptions
    );
  }
  
  if (!smokeBombTexture) {
    smokeBombTexture = textureLoader.load(
      'https://play.rosebud.ai/assets/ChatGPT_Image_Apr_10__2025__10_51_55_PM-removebg-preview.png?rK7q',
      undefined, undefined, undefined, textureOptions
    );
  }

  if (!boltTexture) {
    boltTexture = textureLoader.load(
      './assets/bolt.png',
      undefined, undefined, undefined, textureOptions
    );
  }
  
  if (!gunManTexture) {
    gunManTexture = textureLoader.load(
      './assets/gun-man.png',
      undefined, undefined, undefined, textureOptions
    );
  }
  
  if (!rifleManTexture) {
    rifleManTexture = textureLoader.load(
      './assets/rifle-man.png',
      undefined, undefined, undefined, textureOptions
    );
  }
  
  if (!minionTexture && villainTexture) {
    // Reuse villain texture for minions
    minionTexture = villainTexture.clone();
  }
  
  return {
    ninjaTexture,
    villainTexture,
    smokeBombTexture,
    minionTexture,
    boltTexture,
    gunManTexture,
    rifleManTexture
  };
}