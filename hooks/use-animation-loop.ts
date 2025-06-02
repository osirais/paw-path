"use client";

import {
  CHUNK_LENGTH_SIZE,
  CHUNK_VIEW_CONE_DOT_THRESHOLD,
} from "@/constants/chunk";
import { updateDog } from "@/lib/dog";
import { genChunk } from "@/utils/gen-chunk";
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
  renderTargetRef: RefObject<THREE.WebGLRenderTarget | null>;
  screenSceneRef: RefObject<THREE.Scene | null>;
  screenCameraRef: RefObject<THREE.OrthographicCamera | null>;
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
  renderTargetRef,
  screenSceneRef,
  screenCameraRef,
  sceneRef,
  keysRef,
  pixelated,
  distanceWalked,
  setDistanceWalked,
}: AnimationLoopProps) {
  const previousPositionRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const isFirstFrameRef = useRef(true);

  const chunksRef = useRef<Map<string, THREE.Group>>(new Map());

  useEffect(() => {
    function chunkKey(x: number, z: number) {
      return `${x}_${z}`;
    }

    function animate() {
      requestAnimationFrame(animate);

      if (isPaused) return;

      const scene = sceneRef.current;
      const player = playerRef.current;
      if (!scene || !player) return;

      let playerMovementDirection: THREE.Vector3 | undefined;

      {
        const positionBeforeMovement = player.position.clone();

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
          player.position.x += dx * moveSpeed;
          player.position.z += dz * moveSpeed;

          playerMovementDirection = new THREE.Vector3(dx, 0, dz).normalize();

          if (!isFirstFrameRef.current) {
            const distanceMoved = player.position.distanceTo(
              positionBeforeMovement,
            );
            if (distanceMoved > 0) {
              setDistanceWalked((prev) => prev + distanceMoved);
            }
          }
        }

        if (isFirstFrameRef.current) {
          previousPositionRef.current.copy(player.position);
          isFirstFrameRef.current = false;
        }

        const eyeOffset = new THREE.Vector3(0, 1.6, 0);
        cameraRef
          .current!.position.copy(player.position)
          .add(eyeOffset)
          .setY(player.position.y + 1.6);

        const yaw = yawRef.current;
        const pitch = pitchRef.current;
        const lookDir = new THREE.Vector3(
          Math.sin(yaw) * Math.cos(pitch),
          Math.sin(pitch),
          -Math.cos(yaw) * Math.cos(pitch),
        );
        cameraRef.current!.lookAt(
          cameraRef.current!.position.clone().add(lookDir),
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

      // chunk management stuff

      // compute player chunk coordinates (2d)
      const edgeThreshold = CHUNK_LENGTH_SIZE * 0.3;

      const playerX = player.position.x;
      const playerZ = player.position.z;
      const playerChunkX = Math.floor(playerX / CHUNK_LENGTH_SIZE);
      const playerChunkZ = Math.floor(playerZ / CHUNK_LENGTH_SIZE);

      const neededChunks = new Set<string>();

      for (let dz = -1; dz <= 1; dz++) {
        for (let dx = -1; dx <= 1; dx++) {
          neededChunks.add(chunkKey(playerChunkX + dx, playerChunkZ + dz));
        }
      }

      const localX = playerX % CHUNK_LENGTH_SIZE;
      const localZ = playerZ % CHUNK_LENGTH_SIZE;

      const edgeOffsets = [
        { cond: localX < edgeThreshold, dx: -2, dzRange: [-1, 0, 1] },
        {
          cond: localX > CHUNK_LENGTH_SIZE - edgeThreshold,
          dx: 2,
          dzRange: [-1, 0, 1],
        },
        { cond: localZ < edgeThreshold, dz: -2, dxRange: [-1, 0, 1] },
        {
          cond: localZ > CHUNK_LENGTH_SIZE - edgeThreshold,
          dz: 2,
          dxRange: [-1, 0, 1],
        },
      ];

      for (const { cond, dx, dz, dxRange, dzRange } of edgeOffsets) {
        if (!cond) continue;

        if (dx !== undefined) {
          for (const dzVal of dzRange)
            neededChunks.add(chunkKey(playerChunkX + dx, playerChunkZ + dzVal));
        } else if (dz !== undefined) {
          for (const dxVal of dxRange)
            neededChunks.add(chunkKey(playerChunkX + dxVal, playerChunkZ + dz));
        }
      }

      // create chunks if missing
      for (const key of neededChunks) {
        if (!chunksRef.current.has(key)) {
          const [xStr, zStr] = key.split("_");
          const x = parseInt(xStr);
          const z = parseInt(zStr);

          const chunkGroup = genChunk();
          chunkGroup.position.set(
            x * CHUNK_LENGTH_SIZE,
            0,
            z * CHUNK_LENGTH_SIZE,
          );
          scene.add(chunkGroup);
          chunksRef.current.set(key, chunkGroup);
          console.log("Created chunk at", x, z);
        }
      }

      // remove chunks not needed anymore
      for (const [key, chunkGroup] of chunksRef.current.entries()) {
        if (!neededChunks.has(key)) {
          scene.remove(chunkGroup);
          chunksRef.current.delete(key);
          console.log("Removed chunk", key);
        }
      }

      // don't show chunks out of view
      const playerPos = player.position;
      const yaw = yawRef.current;
      const pitch = pitchRef.current;
      // forward vector from yaw/pitch (same as camera look direction)
      const forward = new THREE.Vector3(
        Math.sin(yaw) * Math.cos(pitch),
        Math.sin(pitch),
        -Math.cos(yaw) * Math.cos(pitch),
      );

      for (const chunkGroup of chunksRef.current.values()) {
        const chunkCenter = chunkGroup.position.clone();
        const halfSize = CHUNK_LENGTH_SIZE / 2;

        const corners = [
          new THREE.Vector3(
            chunkCenter.x - halfSize,
            chunkCenter.y,
            chunkCenter.z - halfSize,
          ),
          new THREE.Vector3(
            chunkCenter.x - halfSize,
            chunkCenter.y,
            chunkCenter.z + halfSize,
          ),
          new THREE.Vector3(
            chunkCenter.x + halfSize,
            chunkCenter.y,
            chunkCenter.z - halfSize,
          ),
          new THREE.Vector3(
            chunkCenter.x + halfSize,
            chunkCenter.y,
            chunkCenter.z + halfSize,
          ),
        ];

        // check if any corner is in front (dot > threshold)
        let visible = false;
        for (const corner of corners) {
          const toCorner = corner.clone().sub(playerPos).normalize();
          const dot = forward.dot(toCorner);
          if (dot > CHUNK_VIEW_CONE_DOT_THRESHOLD) {
            visible = true;
            break;
          }
        }

        chunkGroup.visible = visible;
      }

      if (rendererRef.current && cameraRef.current && sceneRef.current) {
        const renderer = rendererRef.current;

        if (
          pixelated &&
          renderTargetRef.current &&
          screenSceneRef.current &&
          screenCameraRef.current
        ) {
          renderer.setRenderTarget(renderTargetRef.current);
          renderer.render(sceneRef.current, cameraRef.current);

          renderer.setRenderTarget(null);
          renderer.render(screenSceneRef.current, screenCameraRef.current);
        } else {
          renderer.setRenderTarget(null);
          renderer.render(sceneRef.current, cameraRef.current);
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
    renderTargetRef,
    screenSceneRef,
    screenCameraRef,
    sceneRef,
    keysRef,
    pixelated,
    distanceWalked,
    setDistanceWalked,
  ]);
}
