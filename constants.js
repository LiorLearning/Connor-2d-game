// Game environment settings
export const ENVIRONMENT = {
    BACKGROUND_COLOR: 0x050510,
    FOG_COLOR: 0x050510,
    FOG_NEAR: 10,
    FOG_FAR: 30
  };
  
  // Camera configuration
  export const CAMERA = {
    FOV: 70,
    NEAR: 0.1,
    FAR: 100,
    POSITION: { x: 0, y: 3, z: 8 },
    LOOK_AT: { x: 0, y: 2, z: 0 }
  };
  
  // Renderer settings
  export const RENDERER = {
    ANTIALIAS: true,
    POWER_PREFERENCE: 'high-performance',
    PRECISION: 'mediump',
    SHADOW_MAP_ENABLED: true,
    PIXEL_RATIO_LIMIT: 2
  };
  
  // Lighting configuration
  export const LIGHTING = {
    AMBIENT_LIGHT: {
      COLOR: 0x101020,
      INTENSITY: 1
    },
    DIRECTIONAL_LIGHT: {
      COLOR: 0x9090ff,
      INTENSITY: 1,
      POSITION: { x: 5, y: 10, z: 7 }
    }
  };
  
  // Texture loading options
  export const TEXTURE_OPTIONS = {
    ANISOTROPY: 1,
    MIN_FILTER: 'LinearFilter',
    MAG_FILTER: 'LinearFilter'
  };
  
  // Asset URLs
  export const ASSETS = {
    TEXTURES: {
      NINJA: 'https://play.rosebud.ai/assets/ChatGPT_Image_Apr_10__2025__04_35_45_AM-removebg-preview.png?ilkK',
      VILLAIN: 'https://play.rosebud.ai/assets/image (19).png?4ziz',
      SMOKE_BOMB: 'https://play.rosebud.ai/assets/ChatGPT_Image_Apr_10__2025__10_51_55_PM-removebg-preview.png?rK7q',
      MINIONS: './assets/minions.png'
    },
    AUDIO: {
      BACKGROUND_MUSIC: 'https://mathkraft-games.s3.us-east-1.amazonaws.com/Loren/battle-march-action-loop-6935.mp3',
      ATTACK_SOUND: 'https://mathkraft-games.s3.us-east-1.amazonaws.com/Loren/dragon-quick-roar-mammel-94666.mp3'
    }
  };
  
  // Hero configuration
  export const HERO = {
    INITIAL_POSITION: { x: 0, y: 1.5, z: 0 },
    SPRITE_SCALE: 3.0,
    GLOW_SCALE: 3.3,
    GLOW_COLOR: 0x00ffff,
    GLOW_OPACITY: 0.3,
    HEALTH: 100,
    INVULNERABLE_TIME: 1000,
    MOVEMENT_SPEED: 0.3,
    JUMP_VELOCITY: 0.25,
    SUPER_JUMP_VELOCITY: 0.35,
    SUPER_JUMP_MOMENTUM: 0.4,
    GRAVITY: 0.015,
    ATTACK_COOLDOWN: 500,
    DODGE: {
      SPEED: 0.6,
      DURATION: 250,
      COOLDOWN: 1000
    }
  };
  
  // Villain configuration
  export const VILLAIN = {
    SPRITE_SCALE: 3.0,
    GLOW_SCALE: 3.3,
    GLOW_COLOR: 0xff3333,
    GLOW_OPACITY: 0.3,
    INITIAL_POSITION: { x: 3, y: 1.5, z: 0 }
  };
  
  // Minion configuration
  export const MINION = {
    SPRITE_SCALE: 2.0,
    GLOW_SCALE: 2.2,
    GLOW_COLOR: 0x8833ff,
    GLOW_OPACITY: 0.3,
    SPRITE_COLOR: 0xbbbbff,
    HEALTH: 100,
    HIT_COOLDOWN: 500,
    ATTACK_RANGE: 2.5,
    ATTACK_DAMAGE: 10,
    TOTAL_COUNT: 20
  };
  
  // Gameplay timing and phases
  export const GAMEPLAY = {
    VILLAIN_SPEECH_DURATION: 3000,
    VILLAIN_VANISH_DELAY: 5000,
    VILLAIN_VANISH_DURATION: 1500,
    SMOKE_BOMB_RESPAWN_COOLDOWN: 10000
  };
  
  // Rooftop configuration
  export const ROOFTOPS = {
    INITIAL: {
      WIDTH: 30,
      HEIGHT: 1,
      DEPTH: 10,
      COLOR: 0x005566,
      EMISSIVE: 0x003344,
      EMISSIVE_INTENSITY: 0.5,
      SHININESS: 50
    },
    SECONDARY: {
      WIDTH: 25,
      HEIGHT: 1,
      DEPTH: 10,
      COLOR: 0x006677,
      EMISSIVE: 0x004455,
      EMISSIVE_INTENSITY: 0.6,
      SHININESS: 60,
      GAP: 5
    },
    EDGE: {
      HEIGHT: 0.3,
      WIDTH: 0.3,
      COLOR: 0x00ddff,
      EMISSIVE: 0x00aaff,
      EMISSIVE_INTENSITY: 0.6,
      SHININESS: 30
    }
  };
  
  // Physics and collision values
  export const PHYSICS = {
    GRAVITY: 0.015,
    GROUND_FRICTION: 0.85,
    HERO_HALF_WIDTH: 1.0,
    ATTACK_RANGE: 3.0
  };
  
  // UI settings
  export const UI = {
    FONT_FAMILY: "'Orbitron', sans-serif",
    PRIMARY_COLOR: '#00ffff',
    DANGER_COLOR: '#ff3333',
    WARNING_COLOR: '#ffff00',
    SUCCESS_COLOR: '#00ff00',
    ACCENT_COLOR: '#ff33ff',
    FONT_URL: 'https://fonts.googleapis.com/css2?family=Orbitron:wght@500&display=swap'
  };
  
  // Effect settings
  export const EFFECTS = {
    PARTICLE_DECAY: 0.03,
    FLASH_DURATION: 150,
    PULSE_RATE: 0.003
  };