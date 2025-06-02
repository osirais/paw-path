import { rng } from "@/utils/rng";
import * as THREE from "three";

export function setupScene() {
  const scene = new THREE.Scene();

  const groundSize = 200;

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(groundSize, groundSize),
    new THREE.MeshStandardMaterial({
      color: 0x228b22,
      side: THREE.DoubleSide,
    }),
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  scene.add(new THREE.AmbientLight(0xffffff, 0.5));

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(50, 100, 50);
  scene.add(directionalLight);

  // add random trees
  for (let i = 0; i < 100; i++) {
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.2, 2),
      new THREE.MeshStandardMaterial({ color: 0x8b4513 }),
    );

    const leaves = new THREE.Mesh(
      new THREE.ConeGeometry(1, 2.5, 8),
      new THREE.MeshStandardMaterial({ color: 0x006400 }),
    );

    const x = rng(-groundSize / 2, groundSize / 2);
    const z = rng(-groundSize / 2, groundSize / 2);
    const y = 1;

    trunk.position.set(x, y, z);
    leaves.position.set(x, y + 2, z);

    scene.add(trunk);
    scene.add(leaves);
  }

  // add random buildings
  for (let i = 0; i < 50; i++) {
    const width = rng(2, 5);
    const height = rng(5, 20);
    const depth = rng(2, 5);

    const building = new THREE.Mesh(
      new THREE.BoxGeometry(width, height, depth),
      new THREE.MeshStandardMaterial({ color: 0x808080 }),
    );

    const x = rng(-groundSize / 2, groundSize / 2);
    const z = rng(-groundSize / 2, groundSize / 2);
    const y = height / 2;

    building.position.set(x, y, z);
    scene.add(building);
  }

  return { scene, ground };
}
