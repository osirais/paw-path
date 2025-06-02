import type { MutableRefObject, RefObject } from "react";
import type * as THREE from "three";

export function setupControls(
  mountRef: RefObject<HTMLDivElement>,
  cameraRef: RefObject<THREE.PerspectiveCamera>,
  rendererRef: RefObject<THREE.WebGLRenderer>,
  yawRef: RefObject<number>,
  pitchRef: RefObject<number>,
  keysRef: MutableRefObject<{ w: boolean; a: boolean; s: boolean; d: boolean }>,
) {
  const handleResize = () => {
    if (!cameraRef.current || !rendererRef.current) return;
    cameraRef.current.aspect = window.innerWidth / window.innerHeight;
    cameraRef.current.updateProjectionMatrix();
    rendererRef.current.setSize(window.innerWidth, window.innerHeight);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    const key = e.key.toLowerCase();
    if (key in keysRef.current) {
      keysRef.current[key as keyof typeof keysRef.current] = true;
    }
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    const key = e.key.toLowerCase();
    if (key in keysRef.current) {
      keysRef.current[key as keyof typeof keysRef.current] = false;
    }
  };

  // update yaw and pitch
  const handleMouseMove = (e: MouseEvent) => {
    if (document.pointerLockElement === mountRef.current) {
      const sensitivity = 0.002;
      if (yawRef.current !== undefined) {
        yawRef.current += e.movementX * sensitivity;
      }
      if (pitchRef.current !== undefined) {
        pitchRef.current -= e.movementY * sensitivity;
        const maxPitch = Math.PI / 2 - 0.05;
        pitchRef.current = Math.max(
          -maxPitch,
          Math.min(maxPitch, pitchRef.current),
        );
      }
    }
  };

  const handleClick = () => {
    mountRef.current?.requestPointerLock();
  };

  return {
    handleResize,
    handleKeyDown,
    handleKeyUp,
    handleMouseMove,
    handleClick,
  };
}
