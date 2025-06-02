"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function World({
  pixelated = true,
}: { pixelated?: boolean } = {}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<THREE.Mesh | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  // Camera state refs
  const yawRef = useRef(0);
  const pitchRef = useRef(0);

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
    if (pixelated) {
      renderer.domElement.style.imageRendering = "pixelated";
    } else {
      renderer.domElement.style.imageRendering = "";
    }
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // use render target and screen quad if pixelated
    let renderTarget: THREE.WebGLRenderTarget | undefined;
    let screenScene: THREE.Scene | undefined;
    let screenCamera: THREE.OrthographicCamera | undefined;
    let screenMaterial: THREE.MeshBasicMaterial | undefined;
    let screenQuad: THREE.Mesh | undefined;

    if (pixelated) {
      const pixelWidth = 128;
      const pixelHeight = 128;

      renderTarget = new THREE.WebGLRenderTarget(pixelWidth, pixelHeight, {
        minFilter: THREE.NearestFilter,
        magFilter: THREE.NearestFilter,
        generateMipmaps: false,
        depthBuffer: true,
      });

      screenScene = new THREE.Scene();
      screenCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

      screenMaterial = new THREE.MeshBasicMaterial({
        map: renderTarget.texture,
      });

      screenQuad = new THREE.Mesh(
        new THREE.PlaneGeometry(2, 2),
        screenMaterial,
      );
      screenScene.add(screenQuad);
    }

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
      new THREE.BoxGeometry(1, 2, 1),
      new THREE.MeshStandardMaterial({ color: 0xff0000 }),
    );
    player.position.y = 1; // half of height
    // don't render player
    // scene.add(player);
    playerRef.current = player;

    const leashedBox = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardMaterial({ color: 0x0000ff }),
    );
    leashedBox.position.set(3, 0.5, 0); // half of height
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

    // Update yaw and pitch
    const handleMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement === mountRef.current) {
        const sensitivity = 0.002;
        yawRef.current += e.movementX * sensitivity;
        pitchRef.current -= e.movementY * sensitivity;
        const maxPitch = Math.PI / 2 - 0.05;
        pitchRef.current = Math.max(
          -maxPitch,
          Math.min(maxPitch, pitchRef.current),
        );
      }
    };

    const handleClick = () => {
      mountRef.current?.requestPointerLock();
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("pointerlockchange", () => {});

    mountRef.current.addEventListener("click", handleClick);

    // Dog wander state
    let dogWanderDir = new THREE.Vector3(1, 0, 0);
    let dogWanderTimer = 0;
    let dogPauseTimer = 0;
    let dogIsPaused = false;

    function animate() {
      requestAnimationFrame(animate);

      if (playerRef.current && cameraRef.current) {
        const moveSpeed = 0.1;
        // Move relative to camera yaw
        let moveDir = new THREE.Vector3();
        if (keys.w) moveDir.z -= 1;
        if (keys.s) moveDir.z += 1;
        if (keys.a) moveDir.x -= 1;
        if (keys.d) moveDir.x += 1;
        if (moveDir.lengthSq() > 0) {
          moveDir.normalize();
          // Rotate moveDir by yaw
          const yaw = yawRef.current;
          const cosYaw = Math.cos(yaw);
          const sinYaw = Math.sin(yaw);
          const dx = moveDir.x * cosYaw - moveDir.z * sinYaw;
          const dz = moveDir.x * sinYaw + moveDir.z * cosYaw;
          playerRef.current.position.x += dx * moveSpeed;
          playerRef.current.position.z += dz * moveSpeed;
        }

        // Camera position and look
        const eyeOffset = new THREE.Vector3(0, 1.6, 0);
        cameraRef.current.position
          .copy(playerRef.current.position)
          .add(eyeOffset)
          .setY(playerRef.current.position.y + 1.6);

        // Calculate look direction from yaw/pitch
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

      // Dog logic
      if (playerRef.current && leashedBox) {
        const leashMaxLength = 4;
        const leashStrength = 0.15;
        const dogSpeed = 0.07;
        const wanderSpeed = 0.015;
        const playerPos = playerRef.current.position;
        const leashedPos = leashedBox.position;
        const leashVec = new THREE.Vector3().subVectors(playerPos, leashedPos);
        const leashDist = leashVec.length();

        // Always keep dog on ground
        leashedBox.position.y = 0.5;

        if (leashDist > leashMaxLength) {
          // Leash taut: dog is pulled toward player, with a bit of jitter
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
          leashedBox.position.add(jitter);
          dogIsPaused = false; // Always move if leash is taut
          dogPauseTimer = 0;
        } else {
          // Leash slack: dog may pause or wander
          if (dogIsPaused) {
            dogPauseTimer -= 1;
            // Reduced jitter while paused
            leashedBox.position.x += (Math.random() - 0.5) * 0.003;
            leashedBox.position.z += (Math.random() - 0.5) * 0.003;
            if (dogPauseTimer <= 0) {
              dogIsPaused = false;
              dogWanderTimer = 0; // force new wander direction
            }
          } else {
            dogWanderTimer -= 1;
            if (dogWanderTimer <= 0) {
              // Randomly decide to pause or wander
              if (Math.random() < 0.7) {
                dogIsPaused = true;
                dogPauseTimer = 180 + Math.random() * 180; // pause 3-6s
              } else {
                const angle = Math.random() * Math.PI * 2;
                dogWanderDir.set(Math.cos(angle), 0, Math.sin(angle));
                dogWanderTimer = 60 + Math.random() * 90; // wander 1-2.5s
              }
            }
            if (!dogIsPaused) {
              // Move in wander direction, but don't stray too far from player
              const toPlayer = new THREE.Vector3().subVectors(
                playerPos,
                leashedBox.position,
              );
              if (toPlayer.length() > leashMaxLength * 0.8) {
                dogWanderDir.lerp(toPlayer.normalize(), 0.1);
              }
              leashedBox.position.add(
                dogWanderDir.clone().multiplyScalar(wanderSpeed),
              );
            }
          }
        }
      }

      leashLine.geometry.setFromPoints([
        playerRef.current
          ? playerRef.current.position.clone()
          : new THREE.Vector3(),
        leashedBox.position.clone(),
      ]);
      leashLine.geometry.attributes.position.needsUpdate = true;

      if (
        pixelated &&
        renderTarget &&
        screenScene &&
        screenCamera &&
        rendererRef.current &&
        cameraRef.current &&
        sceneRef.current
      ) {
        renderer.setRenderTarget(renderTarget);
        renderer.render(scene, camera);
        renderer.setRenderTarget(null);
        renderer.render(screenScene, screenCamera);
      } else {
        renderer.render(scene, camera);
      }
    }
    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("pointerlockchange", () => {});
      mountRef.current?.removeEventListener("click", handleClick);
      mountRef.current?.removeChild(renderer.domElement);
      scene.clear();
    };
  }, [pixelated]);

  return <div ref={mountRef} style={{ width: "100vw", height: "100vh" }} />;
}
