import { RefObject } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

interface DogState {
  model: THREE.Object3D | null;
  wanderDir: THREE.Vector3;
  wanderTimer: number;
  pauseTimer: number;
  isPaused: boolean;
}

export function setupDog(
  scene: THREE.Scene,
  leashedBox: THREE.Mesh,
  dogStateRef: RefObject<DogState>,
) {
  const loader = new GLTFLoader();

  loader.load(
    "/russell_terrier.glb",
    (gltf) => {
      const dogModel = gltf.scene;
      dogModel.scale.set(0.5, 0.5, 0.5);
      dogModel.position.copy(leashedBox.position);
      scene.add(dogModel);

      dogStateRef.current.model = dogModel;
    },
    undefined,
    (error) => {
      console.error("Error loading russell_terrier.glb:", error);
    },
  );
}

export function updateDog(
  playerRef: RefObject<THREE.Mesh | null>,
  leashedBox: THREE.Mesh,
  dogState: DogState,
  playerMovementDirection?: THREE.Vector3,
) {
  if (!playerRef.current) return;

  const leashMaxLength = 4;
  const leashStrength = 0.15;
  const dogSpeed = 0.0007;
  const wanderSpeed = 0.00015;
  const playerPos = playerRef.current.position;
  const leashedPos = leashedBox.position;
  const leashVec = new THREE.Vector3().subVectors(playerPos, leashedPos);
  const leashDist = leashVec.length();

  const previousDogPosition = leashedBox.position.clone();

  // always keep dog on ground
  leashedBox.position.y = 0.5;

  const dogMovementDirection = new THREE.Vector3();

  if (leashDist > leashMaxLength) {
    // leash taut: dog is pulled toward player, with a bit of jitter
    leashVec.normalize();
    const jitter = new THREE.Vector3(
      (Math.random() - 0.5) * 0.05,
      0,
      (Math.random() - 0.5) * 0.05,
    );
    leashedBox.position.add(
      leashVec.multiplyScalar(
        (leashDist - leashMaxLength) * leashStrength + dogSpeed,
      ),
    );
    const movement = leashVec.multiplyScalar(
      (leashDist - leashMaxLength) * leashStrength + dogSpeed,
    );
    leashedBox.position.add(movement);
    dogState.isPaused = false; // always move if leash is taut
    dogState.pauseTimer = 0;

    dogMovementDirection.copy(movement).normalize();
  } else {
    // leash slack: dog may pause or wander
    if (dogState.isPaused) {
      dogState.pauseTimer -= 1;
      // reduced jitter while paused
      leashedBox.position.x += (Math.random() - 0.5) * 0.003;
      leashedBox.position.z += (Math.random() - 0.5) * 0.003;
      if (dogState.pauseTimer <= 0) {
        dogState.isPaused = false;
        dogState.wanderTimer = 0; // force new wander direction
      }

      if (playerMovementDirection && playerMovementDirection.lengthSq() > 0) {
        dogMovementDirection.copy(playerMovementDirection);
      }
    } else {
      dogState.wanderTimer -= 1;
      if (dogState.wanderTimer <= 0) {
        // randomly decide to pause or wander
        if (Math.random() < 0.7) {
          dogState.isPaused = true;
          dogState.pauseTimer = 180 + Math.random() * 180; // pause 3-6s
        } else {
          const angle = Math.random() * Math.PI * 2;
          dogState.wanderDir.set(Math.cos(angle), 0, Math.sin(angle));
          dogState.wanderTimer = 60 + Math.random() * 90; // wander 1-2.5s
        }
      }
      if (!dogState.isPaused) {
        // move in wander direction, but don't stray too far from player
        const toPlayer = new THREE.Vector3().subVectors(
          playerPos,
          leashedBox.position,
        );
        if (toPlayer.length() > leashMaxLength * 0.8) {
          dogState.wanderDir.lerp(toPlayer.normalize(), 0.1);
        }

        const movement = dogState.wanderDir.clone().multiplyScalar(wanderSpeed);
        leashedBox.position.add(movement);

        // dog faces its wander direction, but if player is moving, face player's direction
        if (playerMovementDirection && playerMovementDirection.lengthSq() > 0) {
          dogMovementDirection.copy(playerMovementDirection);
        } else {
          dogMovementDirection.copy(dogState.wanderDir);
        }
      }
    }
  }

  // update dog model position & rotation
  if (dogState.model) {
    dogState.model.position.copy(leashedBox.position);
    dogState.model.position.y = 0;

    if (dogMovementDirection.lengthSq() > 0) {
      const targetRotation = Math.atan2(
        dogMovementDirection.x,
        dogMovementDirection.z,
      );
      dogState.model.rotation.y = targetRotation;
    }
  }
}
