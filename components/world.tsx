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

    const renderer = new THREE.WebGLRenderer({ antialias: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(1);
    renderer.domElement.style.imageRendering = "pixelated";
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const pixelWidth = 128;
    const pixelHeight = 128;

    const renderTarget = new THREE.WebGLRenderTarget(pixelWidth, pixelHeight, {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      generateMipmaps: false,
      depthBuffer: true,
    });

    const screenScene = new THREE.Scene();
    const screenCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const screenMaterial = new THREE.MeshBasicMaterial({
      map: renderTarget.texture,
    });

    const screenQuad = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      screenMaterial,
    );
    screenScene.add(screenQuad);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 20),
      new THREE.MeshStandardMaterial({
        color: 0x228b22,
        side: THREE.DoubleSide,
      }),
    );
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    const player = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardMaterial({ color: 0xff0000 }),
    );
    player.position.y = 0.5;
    scene.add(player);
    playerRef.current = player;

    const leashedBox = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardMaterial({ color: 0x0000ff }),
    );
    leashedBox.position.set(3, 0.5, 0);
    scene.add(leashedBox);

    const leashGeometry = new THREE.BufferGeometry().setFromPoints([
      player.position.clone(),
      leashedBox.position.clone(),
    ]);
    const leashMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
    const leashLine = new THREE.Line(leashGeometry, leashMaterial);
    scene.add(leashLine);

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    const keys = { w: false, a: false, s: false, d: false };

    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current) return;
      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() in keys) {
        keys[e.key.toLowerCase() as keyof typeof keys] = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() in keys) {
        keys[e.key.toLowerCase() as keyof typeof keys] = false;
      }
    };

    window.addEventListener("resize", handleResize);
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

      // Leash logic
      if (playerRef.current && leashedBox) {
        const leashMaxLength = 4;
        const leashStrength = 0.15;
        const playerPos = playerRef.current.position;
        const leashedPos = leashedBox.position;
        const leashVec = new THREE.Vector3().subVectors(playerPos, leashedPos);
        const leashDist = leashVec.length();
        if (leashDist > leashMaxLength) {
          leashVec.normalize();
          // Pull leashed box toward player
          leashedBox.position.add(
            leashVec.multiplyScalar(
              (leashDist - leashMaxLength) * leashStrength,
            ),
          );
        }
        // Optionally: make leashed box "follow" a bit for realism
        // leashedBox.position.lerp(playerPos, 0.01);
      }

      // Update leash line
      leashLine.geometry.setFromPoints([
        playerRef.current
          ? playerRef.current.position.clone()
          : new THREE.Vector3(),
        leashedBox.position.clone(),
      ]);
      leashLine.geometry.attributes.position.needsUpdate = true;

      renderer.setRenderTarget(renderTarget);
      renderer.render(scene, camera);

      renderer.setRenderTarget(null);
      renderer.render(screenScene, screenCamera);
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
