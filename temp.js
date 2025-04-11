
  // Add this to the minion update logic around line 2140
  // Inside the minions.forEach loop where minion movement is updated
  if (minion.active && minion.level >= 2) {
    // Level 2+ minions can shoot at the hero from any distance
    const now = Date.now();
    const rangedAttackDistance = 15; // Much wider range than melee
    const distance = Math.abs(hero.position.x - minion.group.position.x);
    
    // If hero is in range and minion can shoot
    if (distance < rangedAttackDistance && now - minion.lastProjectile > minion.projectileCooldown) {
      minion.lastProjectile = now;
      
      // Determine direction for projectile
      const attackDirection = minion.group.position.x < hero.position.x ? 1 : -1;
      
      // Create dark energy projectile
      const projectileGeometry = new THREE.PlaneGeometry(1.0, 0.4);
      const projectileMaterial = new THREE.MeshBasicMaterial({
        color: 0xff3333,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide
      });
      const projectile = new THREE.Mesh(projectileGeometry, projectileMaterial);
      
      // Position projectile at minion's position
      projectile.position.set(
        minion.group.position.x + (attackDirection * 0.7), 
        minion.group.position.y, 
        0
      );
      
      // Rotate based on attack direction
      projectile.rotation.z = attackDirection > 0 ? -Math.PI / 6 : Math.PI / 6;
      
      scene.add(projectile);
      
      // Create trail effect for projectile
      const trail = new THREE.Mesh(
        new THREE.PlaneGeometry(0.6, 0.3),
        new THREE.MeshBasicMaterial({
          color: 0x880000,
          transparent: true,
          opacity: 0.5
        })
      );
      trail.position.copy(projectile.position);
      trail.position.x -= attackDirection * 0.5;
      trail.rotation.z = projectile.rotation.z;
      scene.add(trail);
      
      // Animate projectile - make it slower for Level 2 to make it easier to dodge
      const projectileStartTime = Date.now();
      const projectileDuration = 800; // Slower than standard projectile
      const startX = projectile.position.x;
      const targetX = hero.position.x;
      const totalDistance = targetX - startX;
      
      (function animateProjectile() {
        const elapsed = Date.now() - projectileStartTime;
        if (elapsed < projectileDuration) {
          const progress = elapsed / projectileDuration;
          
          // Move projectile toward target
          projectile.position.x = startX + (progress * totalDistance);
          
          // Update trail position
          trail.position.x = projectile.position.x - (attackDirection * 0.5);
          
          // Add some wobble effect
          if (elapsed % 40 < 20) {
            projectile.rotation.z = attackDirection > 0 ? -Math.PI / 6 - 0.1 : Math.PI / 6 + 0.1;
            projectile.position.y = minion.group.position.y + Math.sin(elapsed * 0.1) * 0.1;
          } else {
            projectile.rotation.z = attackDirection > 0 ? -Math.PI / 6 + 0.1 : Math.PI / 6 - 0.1;
            projectile.position.y = minion.group.position.y + Math.sin(elapsed * 0.1) * 0.1;
          }
          
          // Fade out trail
          trail.material.opacity = 0.5 * (1 - progress);
          
          // Check collision with hero during projectile flight
          if (!hero.isInvulnerable) {
            const projectileToHeroDistance = Math.sqrt(
              Math.pow(hero.position.x - projectile.position.x, 2) + 
              Math.pow(hero.position.y - projectile.position.y, 2)
            );
            
            if (projectileToHeroDistance < 1.0) {
              // Hero was hit by projectile
              hero.health -= 10;
              hero.lastHit = Date.now();
              hero.isInvulnerable = true;
              
              // Update health bar
              updateHealthBar(hero.health);
              
              // Create impact effect
              const impactEffect = new THREE.Mesh(
                new THREE.CircleGeometry(0.8, 16),
                new THREE.MeshBasicMaterial({
                  color: 0xff3333,
                  transparent: true,
                  opacity: 0.8
                })
              );
              impactEffect.position.set(hero.position.x, hero.position.y, 0);
              scene.add(impactEffect);
              
              // Animate impact effect
              const impactStartTime = Date.now();
              const impactDuration = 150;
              
              (function animateImpact() {
                const impactElapsed = Date.now() - impactStartTime;
                if (impactElapsed < impactDuration) {
                  const impactProgress = impactElapsed / impactDuration;
                  impactEffect.scale.set(1 + impactProgress * 2, 1 + impactProgress * 2, 1);
                  impactEffect.material.opacity = 0.8 * (1 - impactProgress);
                  requestAnimationFrame(animateImpact);
                } else {
                  scene.remove(impactEffect);
                }
              })();
              
              // End projectile animation early
              scene.remove(projectile);
              scene.remove(trail);
              return;
            }
          }
          
          requestAnimationFrame(animateProjectile);
        } else {
          // Create impact effect if projectile missed
          const impactEffect = new THREE.Mesh(
            new THREE.CircleGeometry(0.5, 16),
            new THREE.MeshBasicMaterial({
              color: 0xff0000,
              transparent: true,
              opacity: 0.6
            })
          );
          impactEffect.position.set(projectile.position.x, projectile.position.y, 0);
          scene.add(impactEffect);
          
          // Simple fade out animation
          const impactStartTime = Date.now();
          const impactDuration = 100;
          
          (function animateImpact() {
            const impactElapsed = Date.now() - impactStartTime;
            if (impactElapsed < impactDuration) {
              const impactProgress = impactElapsed / impactDuration;
              impactEffect.scale.set(1 + impactProgress, 1 + impactProgress, 1);
              impactEffect.material.opacity = 0.6 * (1 - impactProgress);
              requestAnimationFrame(animateImpact);
            } else {
              scene.remove(impactEffect);
            }
          })();
          
          // Remove projectile and trail
          scene.remove(projectile);
          scene.remove(trail);
        }
      })();
    }
  }