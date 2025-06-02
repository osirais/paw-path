"use client";

import PauseMenu from "@/components/pause-menu";
import { useAnimationLoop } from "@/hooks/use-animation-loop";
import { setupControls } from "@/lib/controls";
import { setupDog } from "@/lib/dog";
import { setupRenderer } from "@/lib/renderer";
import { setupScene } from "@/lib/scene";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export default function World({
  pixelated = false,
}: { pixelated?: boolean } = {}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<THREE.Mesh | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [distanceWalked, setDistanceWalked] = useState(0);

  const yawRef = useRef(0);
  const pitchRef = useRef(0);

  const keysRef = useRef({ w: false, a: false, s: false, d: false });

  const dogStateRef = useRef({
    model: null as THREE.Object3D | null,
    wanderDir: new THREE.Vector3(1, 0, 0),
    wanderTimer: 0,
    pauseTimer: 0,
    isPaused: false,
  });

  const leashedBoxRef = useRef<THREE.Mesh | null>(null);
  const leashLineRef = useRef<THREE.Line | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // pause stuff
    document.addEventListener("keydown", (e) => {
      if (e.key === "Tab") {
        e.preventDefault();
        setIsPaused((prev) => !prev);
        if (document.pointerLockElement) {
          document.exitPointerLock();
        }
      }
    });

    // setup scene, camera, and renderer
    const { scene, ground } = setupScene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    camera.position.set(0, 5, 10);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const { renderer } = setupRenderer(pixelated);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // player stuff
    const player = new THREE.Mesh(
      new THREE.BoxGeometry(1, 2, 1),
      new THREE.MeshStandardMaterial({ color: 0xff0000 }),
    );
    player.position.y = 1; // half of height
    playerRef.current = player;

    // leashed box (dog placeholder)
    const leashedBox = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardMaterial({ color: 0x0000ff }),
    );
    leashedBox.position.set(3, 0.5, 0); // half of height
    scene.add(leashedBox);
    leashedBoxRef.current = leashedBox;

    // leash line
    const leashGeometry = new THREE.BufferGeometry().setFromPoints([
      player.position.clone(),
      leashedBox.position.clone(),
    ]);
    const leashMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
    const leashLine = new THREE.Line(leashGeometry, leashMaterial);
    scene.add(leashLine);
    leashLineRef.current = leashLine;

    setupDog(scene, leashedBox, dogStateRef);

    const {
      handleResize,
      handleKeyDown,
      handleKeyUp,
      handleMouseMove,
      handleClick,
    } = setupControls(
      { current: mountRef.current! },
      { current: cameraRef.current! },
      { current: rendererRef.current! },
      yawRef,
      pitchRef,
      keysRef,
    );

    window.addEventListener("resize", handleResize);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("pointerlockchange", () => {});
    mountRef.current.addEventListener("click", handleClick);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("pointerlockchange", () => {});
      mountRef.current?.removeEventListener("click", handleClick);
      mountRef.current?.removeChild(renderer.domElement);
      scene.clear();
      if (dogStateRef.current.model) {
        scene.remove(dogStateRef.current.model);
      }
    };
  }, [pixelated]);

  useAnimationLoop({
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
  });

  return (
    <>
      <div ref={mountRef} style={{ width: "100vw", height: "100vh" }} />
      <div className="fixed top-4 left-4 z-10 rounded-lg bg-black/70 px-4 py-2 font-mono text-sm text-white">
        Distance: {distanceWalked.toFixed(1)}m
      </div>
      {isPaused && <PauseMenu onResume={() => setIsPaused(false)} />}
    </>
  );
}
