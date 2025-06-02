"use client";

import { updateDog } from "@/lib/dog";
import { RefObject, useEffect, useRef } from "react";
import * as THREE from "three";

interface AnimationLoopProps {
  isPaused: boolean;
  playerRef: RefObject<THREE.Mesh | null>;
  cameraRef: RefObject<THREE.PerspectiveCamera | null>;
  leashedBoxRef: RefObject<THREE.Mesh | null>;
  leashLineRef: RefObject<THREE.Line | null>;
  dogStateRef: RefObject<{
    model: THREE.Object3D | null;
    wanderDir: THREE.Vector3;
    wanderTimer: number;
    pauseTimer: number;
    isPaused: boolean;
  }>;
  yawRef: RefObject<number>;
  pitchRef: RefObject<number>;
  rendererRef: RefObject<THREE.WebGLRenderer | null>;
  sceneRef: RefObject<THREE.Scene | null>;
  keysRef: RefObject<{ w: boolean; a: boolean; s: boolean; d: boolean }>;
  pixelated: boolean;
  distanceWalked: number;
  setDistanceWalked: React.Dispatch<React.SetStateAction<number>>;
}

export function useAnimationLoop({
  isPaused,
  playerRef,
  cameraRef,
  leashedBoxRef,
  leashLineRef,
  dogStateRef,
  yawRef,
  pitchRef,
  rendererRef,
  sceneRef,
  keysRef,
  pixelated,
  distanceWalked,
  setDistanceWalked,
}: AnimationLoopProps) {
  const previousPositionRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const isFirstFrameRef = useRef(true);

  useEffect(() => {
    function animate() {
      requestAnimationFrame(animate);

      if (isPaused) return;

      let playerMovementDirection: THREE.Vector3 | undefined;

      if (playerRef.current && cameraRef.current) {
        const positionBeforeMovement = playerRef.current.position.clone();

        const moveSpeed = 0.001;
        const moveDir = new THREE.Vector3();
        const keys = keysRef.current;

        if (keys.w) moveDir.z -= 1;
        if (keys.s) moveDir.z += 1;
        if (keys.a) moveDir.x -= 1;
        if (keys.d) moveDir.x += 1;

        if (moveDir.lengthSq() > 0) {
          moveDir.normalize();
          const yaw = yawRef.current;
          const cosYaw = Math.cos(yaw);
          const sinYaw = Math.sin(yaw);
          const dx = moveDir.x * cosYaw - moveDir.z * sinYaw;
          const dz = moveDir.x * sinYaw + moveDir.z * cosYaw;
          playerRef.current.position.x += dx * moveSpeed;
          playerRef.current.position.z += dz * moveSpeed;

          // store the movement direction (for dog)
          playerMovementDirection = new THREE.Vector3(dx, 0, dz).normalize();

          if (!isFirstFrameRef.current) {
            const distanceMoved = playerRef.current.position.distanceTo(
              positionBeforeMovement,
            );
            if (distanceMoved > 0) {
              setDistanceWalked((prev) => prev + distanceMoved);
            }
          }
        }

        if (isFirstFrameRef.current) {
          previousPositionRef.current.copy(playerRef.current.position);
          isFirstFrameRef.current = false;
        }

        const eyeOffset = new THREE.Vector3(0, 1.6, 0);
        cameraRef.current.position
          .copy(playerRef.current.position)
          .add(eyeOffset)
          .setY(playerRef.current.position.y + 1.6);

        const yaw = yawRef.current;
        const pitch = pitchRef.current;
        const lookDir = new THREE.Vector3(
          Math.sin(yaw) * Math.cos(pitch),
          Math.sin(pitch),
          -Math.cos(yaw) * Math.cos(pitch),
        );
        cameraRef.current.lookAt(
          cameraRef.current.position.clone().add(lookDir),
        );
      }

      if (leashedBoxRef.current && playerRef.current) {
        updateDog(
          playerRef,
          leashedBoxRef.current,
          dogStateRef.current,
          playerMovementDirection,
        );
      }

      if (leashLineRef.current && playerRef.current && leashedBoxRef.current) {
        leashLineRef.current.geometry.setFromPoints([
          playerRef.current.position.clone(),
          leashedBoxRef.current.position.clone(),
        ]);
        leashLineRef.current.geometry.attributes.position.needsUpdate = true;
      }

      if (rendererRef.current && cameraRef.current && sceneRef.current) {
        if (pixelated) {
          rendererRef.current.render(sceneRef.current, cameraRef.current);
        } else {
          rendererRef.current.render(sceneRef.current, cameraRef.current);
        }
      }
    }

    animate();
  }, [
    isPaused,
    playerRef,
    cameraRef,
    leashedBoxRef,
    leashLineRef,
    dogStateRef,
    yawRef,
    pitchRef,
    rendererRef,
    sceneRef,
    keysRef,
    pixelated,
    distanceWalked,
    setDistanceWalked,
  ]);
}
