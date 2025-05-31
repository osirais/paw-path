"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function World() {
  const mountRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<THREE.Mesh | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
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

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x87ceeb); //sky
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const groundGeometry = new THREE.PlaneGeometry(20, 20);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x228b22,
      side: THREE.DoubleSide,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    const playerGeometry = new THREE.BoxGeometry(1, 1, 1);
    const playerMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const player = new THREE.Mesh(playerGeometry, playerMaterial);
    player.position.y = 0.5;
    scene.add(player);
    playerRef.current = player;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    function handleResize() {
      if (!cameraRef.current || !rendererRef.current) return;
      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    }
    window.addEventListener("resize", handleResize);

    const keys = {
      w: false,
      a: false,
      s: false,
      d: false,
    };

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key.toLowerCase() in keys) {
        keys[e.key.toLowerCase() as keyof typeof keys] = true;
      }
    }

    function handleKeyUp(e: KeyboardEvent) {
      if (e.key.toLowerCase() in keys) {
        keys[e.key.toLowerCase() as keyof typeof keys] = false;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    function animate() {
      requestAnimationFrame(animate);

      if (playerRef.current && cameraRef.current) {
        const moveSpeed = 0.1;
        if (keys.w) playerRef.current.position.z -= moveSpeed;
        if (keys.s) playerRef.current.position.z += moveSpeed;
        if (keys.a) playerRef.current.position.x -= moveSpeed;
        if (keys.d) playerRef.current.position.x += moveSpeed;

        const cameraOffset = new THREE.Vector3(0, 5, 10);
        cameraRef.current.position
          .copy(playerRef.current.position)
          .add(cameraOffset);
        cameraRef.current.lookAt(playerRef.current.position);
      }

      renderer.render(scene, camera);
    }
    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      mountRef.current?.removeChild(renderer.domElement);
      scene.clear();
    };
  }, []);

  return <div ref={mountRef} style={{ width: "100vw", height: "100vh" }} />;
}
