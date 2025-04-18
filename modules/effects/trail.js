import * as THREE from 'three';

export function initTrail(scene) {
  const trail = {
    particles: [],
    
    // Update particle system (villain vanish particles only)
    update: function () {
      // Update all villain vanish particles
      for (let i = 0; i < this.particles.length; i++) {
        const particle = this.particles[i];
        particle.userData.life -= particle.userData.decay;
        
        // Handle particles with velocity (villain vanish particles)
        if (particle.userData.velocity) {
          particle.position.add(particle.userData.velocity);
          // Add gravity effect to villain particles
          particle.userData.velocity.y -= 0.002;
        }
        
        const lifeScale = particle.userData.life * particle.userData.life;
        particle.scale.set(lifeScale, lifeScale, lifeScale);
        particle.material.opacity = lifeScale * 0.8;
        
        if (particle.userData.life <= 0) {
          scene.remove(particle);
          this.particles.splice(i, 1);
          i--;
        }
      }
    },
    
    // Create villain vanish particles (called from vanish effect)
    createVillainParticle: function(position, color, velocity) {
      const particleGeometry = new THREE.SphereGeometry(0.1, 8, 8);
      const particleMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.8
      });
      
      const particle = new THREE.Mesh(particleGeometry, particleMaterial);
      particle.position.copy(position);
      
      particle.userData = { 
        type: 'villainVanish',
        life: 1.0, 
        decay: 0.03 + Math.random() * 0.02,
        velocity: velocity
      };
      
      scene.add(particle);
      this.particles.push(particle);
      
      return particle;
    },
    
    // Create hero pulse particles in a radial pattern
    createHeroPulseParticles: function(position) {
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const distance = 2;
        const particlePos = new THREE.Vector3(
          position.x + Math.cos(angle) * distance,
          position.y + Math.sin(angle) * distance,
          position.z
        );
        
        const velocity = new THREE.Vector3(
          Math.cos(angle) * 0.06,
          Math.sin(angle) * 0.06,
          0
        );
        
        const particleColor = new THREE.Color(0x00ffff);
        this.createVillainParticle(particlePos, particleColor, velocity);
      }
    },
    
    // Create healing effect particles
    createHealingParticles: function(position) {
      for (let i = 0; i < 20; i++) {
        const angle = (i / 20) * Math.PI * 2;
        const distance = 1.5;
        
        const particlePos = new THREE.Vector3(
          position.x + Math.cos(angle) * distance,
          position.y + Math.sin(angle) * distance,
          position.z
        );
        
        const velocity = new THREE.Vector3(
          Math.cos(angle) * 0.03,
          Math.sin(angle) * 0.03,
          0
        );
        
        const particleColor = new THREE.Color(0x00ff88);
        this.createVillainParticle(particlePos, particleColor, velocity);
      }
    },
    
    // Create villain fade effect particles
    createVillainFadeParticles: function(position) {
      // Only create a particle randomly to avoid too many
      if (Math.random() > 0.7) {
        const particleColor = new THREE.Color(0xff0000);
        particleColor.lerp(new THREE.Color(0x000000), Math.random() * 0.5);
        
        // Create a position vector for the particle with some randomness
        const particlePosition = new THREE.Vector3(
          position.x + (Math.random() - 0.5) * 1.5,
          position.y + (Math.random() - 0.5) * 3,
          position.z + (Math.random() - 0.5) * 0.5
        );
        
        // Create a velocity vector for the particle
        const velocity = new THREE.Vector3(
          (Math.random() - 0.5) * 0.05,
          (Math.random() * 0.1) - 0.05,
          (Math.random() - 0.5) * 0.05
        );
        
        // Use the trail system to create and manage the villain particle
        this.createVillainParticle(particlePosition, particleColor, velocity);
      }
    }
  };
  
  return trail;
}