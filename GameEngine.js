function _class_call_check(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}
function _defineProperties(target, props) {
    for(var i = 0; i < props.length; i++){
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
    }
}
function _create_class(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    return Constructor;
}
import * as THREE from 'three';
import { RENDERER, CAMERA, ENVIRONMENT } from './constants.js';
import { createResizeHandler } from './utils.js';
export var GameEngine = /*#__PURE__*/ function() {
    "use strict";
    function GameEngine() {
        _class_call_check(this, GameEngine);
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clock = new THREE.Clock();
        this.lastTime = 0;
        this.gameObjects = [];
        this.isRunning = false;
    }
    _create_class(GameEngine, [
        {
            key: "initialize",
            value: function initialize(renderDiv) {
                // Create scene
                this.scene = new THREE.Scene();
                this.scene.background = new THREE.Color(ENVIRONMENT.BACKGROUND_COLOR);
                this.scene.fog = new THREE.Fog(ENVIRONMENT.FOG_COLOR, ENVIRONMENT.FOG_NEAR, ENVIRONMENT.FOG_FAR);
                // Create camera
                this.camera = new THREE.PerspectiveCamera(CAMERA.FOV, window.innerWidth / window.innerHeight, CAMERA.NEAR, CAMERA.FAR);
                this.camera.position.set(CAMERA.POSITION.x, CAMERA.POSITION.y, CAMERA.POSITION.z);
                this.camera.lookAt(CAMERA.LOOK_AT.x, CAMERA.LOOK_AT.y, CAMERA.LOOK_AT.z);
                // Create renderer
                this.renderer = new THREE.WebGLRenderer({
                    antialias: RENDERER.ANTIALIAS,
                    powerPreference: RENDERER.POWER_PREFERENCE,
                    precision: RENDERER.PRECISION
                });
                this.renderer.setSize(window.innerWidth, window.innerHeight);
                this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, RENDERER.PIXEL_RATIO_LIMIT));
                this.renderer.shadowMap.enabled = RENDERER.SHADOW_MAP_ENABLED;
                renderDiv.appendChild(this.renderer.domElement);
                // Setup resize handler
                window.addEventListener('resize', createResizeHandler(this.camera, this.renderer));
            }
        },
        {
            key: "addGameObject",
            value: function addGameObject(gameObject) {
                this.gameObjects.push(gameObject);
                if (gameObject.mesh) {
                    this.scene.add(gameObject.mesh);
                }
                return gameObject;
            }
        },
        {
            key: "removeGameObject",
            value: function removeGameObject(gameObject) {
                var index = this.gameObjects.indexOf(gameObject);
                if (index !== -1) {
                    this.gameObjects.splice(index, 1);
                    if (gameObject.mesh) {
                        this.scene.remove(gameObject.mesh);
                    }
                }
            }
        },
        {
            key: "update",
            value: function update(currentTime) {
                if (!this.isRunning) return;
                requestAnimationFrame(this.update.bind(this));
                var deltaTime = this.clock.getDelta();
                var elapsed = currentTime - this.lastTime;
                this.lastTime = currentTime;
                // Skip frames if too much time has passed (for performance)
                if (elapsed > 33.33) return;
                var _iteratorNormalCompletion = true, _didIteratorError = false, _iteratorError = undefined;
                try {
                    // Update all game objects
                    for(var _iterator = this.gameObjects[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true){
                        var gameObject = _step.value;
                        if (gameObject.update) {
                            gameObject.update(deltaTime, elapsed);
                        }
                    }
                } catch (err) {
                    _didIteratorError = true;
                    _iteratorError = err;
                } finally{
                    try {
                        if (!_iteratorNormalCompletion && _iterator.return != null) {
                            _iterator.return();
                        }
                    } finally{
                        if (_didIteratorError) {
                            throw _iteratorError;
                        }
                    }
                }
                // Render the scene
                this.renderer.render(this.scene, this.camera);
            }
        },
        {
            key: "start",
            value: function start() {
                if (this.isRunning) return;
                this.isRunning = true;
                this.lastTime = performance.now();
                this.update(this.lastTime);
            }
        },
        {
            key: "stop",
            value: function stop() {
                this.isRunning = false;
            }
        }
    ]);
    return GameEngine;
}();
