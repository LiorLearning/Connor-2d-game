import * as THREE from 'three';

export function createSmokeExplosion(scene, position, smokeBombTexture) {
  const smokeParticleCount = 20;
  const smokeParticles = [];
  
  // Create a more elaborate smoke cloud effect
  for (let i = 0; i < smokeParticleCount; i++) {
    const smokeMaterial = new THREE.SpriteMaterial({
      map: smokeBombTexture,
      transparent: true,
      opacity: 0.8,
      color: new THREE.Color(0xaaffff) // Light cyan tint
    });
    
    const smokeParticle = new THREE.Sprite(smokeMaterial);
    // Random size for various smoke puffs
    const size = 0.3 + Math.random() * 0.7;
    smokeParticle.scale.set(size, size, 1);
    
    // Position around impact point with some randomness
    smokeParticle.position.set(
      position.x + (Math.random() - 0.5) * 1.2,
      position.y + (Math.random() - 0.5) * 1.2,
      position.z + (Math.random() - 0.5) * 0.2
    );
    
    // Store velocity for animation
    smokeParticle.userData = {
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.03,
        (Math.random() - 0.5) * 0.03,
        0
      ),
      rotation: Math.random() * 0.1 - 0.05
    };
    
    scene.add(smokeParticle);
    smokeParticles.push(smokeParticle);
  }
  
  // Animate smoke explosion
  const smokeStartTime = Date.now();
  const smokeDuration = 800; // Longer smoke effect
  
  (function animateSmoke() {
    const smokeElapsed = Date.now() - smokeStartTime;
    if (smokeElapsed < smokeDuration) {
      const smokeProgress = smokeElapsed / smokeDuration;
      
      smokeParticles.forEach(particle => {
        // Move according to velocity
        particle.position.add(particle.userData.velocity);
        
        // Add some upward drift to simulate rising smoke
        particle.position.y += 0.005;
        
        // Rotate the smoke texture
        particle.material.rotation += particle.userData.rotation;
        
        // Expand slightly as it dissipates
        const expansion = 1 + smokeProgress * 0.5;
        particle.scale.x = particle.scale.x * expansion;
        particle.scale.y = particle.scale.y * expansion;
        
        // Fade out gradually
        particle.material.opacity = 0.8 * (1 - Math.pow(smokeProgress, 2));
      });
      
      requestAnimationFrame(animateSmoke);
    } else {
      // Remove all smoke particles
      smokeParticles.forEach(particle => scene.remove(particle));
    }
  })();
} 