"use client";

import { updateDog } from "@/lib/dog";
import { useEffect, type MutableRefObject } from "react";
import * as THREE from "three";

interface AnimationLoopProps {
  isPaused: boolean;
  playerRef: MutableRefObject<THREE.Mesh | null>;
  cameraRef: MutableRefObject<THREE.PerspectiveCamera | null>;
  leashedBoxRef: MutableRefObject<THREE.Mesh | null>;
  leashLineRef: MutableRefObject<THREE.Line | null>;
  dogStateRef: MutableRefObject<{
    model: THREE.Object3D | null;
    wanderDir: THREE.Vector3;
    wanderTimer: number;
    pauseTimer: number;
    isPaused: boolean;
  }>;
  yawRef: MutableRefObject<number>;
  pitchRef: MutableRefObject<number>;
  rendererRef: MutableRefObject<THREE.WebGLRenderer | null>;
  sceneRef: MutableRefObject<THREE.Scene | null>;
  keysRef: MutableRefObject<{ w: boolean; a: boolean; s: boolean; d: boolean }>;
  pixelated: boolean;
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
}: AnimationLoopProps) {
  useEffect(() => {
    function animate() {
      requestAnimationFrame(animate);

      if (isPaused) return;

      if (playerRef.current && cameraRef.current) {
        const moveSpeed = 0.1;
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
        updateDog(playerRef, leashedBoxRef.current, dogStateRef.current);
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
  ]);
}
