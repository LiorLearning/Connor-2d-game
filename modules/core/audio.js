export function setupAudio() {
  // Create audio element for background music
  const backgroundMusic = new Audio();
  backgroundMusic.src = 'https://mathkraft-games.s3.us-east-1.amazonaws.com/Loren/battle-march-action-loop-6935.mp3';
  backgroundMusic.loop = true;
  backgroundMusic.volume = 0.2; // Set to 50% volume
  
  // Play background music (will start when user interacts with the page)
  document.addEventListener('click', () => {
    if (backgroundMusic.paused) {
      backgroundMusic.play().catch(error => {
        console.warn('Audio playback failed:', error);
      });
    }
  }, { once: true });
  
  return backgroundMusic;
}