import { CHUNK_LENGTH_SIZE } from "@/constants/chunk";
import {
  COLOR_BUILDING,
  COLOR_GROUND,
  COLOR_LEAVES,
  COLOR_SIDEWALK,
  COLOR_TRUNK,
} from "@/constants/colors";
import { rng } from "@/utils/rng";
import * as THREE from "three";

export function genChunk() {
  const group = new THREE.Group();

  // ground
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(CHUNK_LENGTH_SIZE, CHUNK_LENGTH_SIZE),
    new THREE.MeshStandardMaterial({
      color: COLOR_GROUND,
      side: THREE.DoubleSide,
    }),
  );
  ground.rotation.x = -Math.PI / 2;
  group.add(ground);

  // sidewalk (outline path)
  const outlineWidth = 1.5;
  const yOffset = 0.05;
  const half = CHUNK_LENGTH_SIZE / 2;

  // front border (along X axis)
  const frontBorder = new THREE.Mesh(
    new THREE.BoxGeometry(
      CHUNK_LENGTH_SIZE + outlineWidth * 2,
      0.1,
      outlineWidth,
    ),
    new THREE.MeshStandardMaterial({ color: COLOR_SIDEWALK }),
  );
  frontBorder.position.set(0, yOffset, half + outlineWidth / 2);
  group.add(frontBorder);

  // back border
  const backBorder = new THREE.Mesh(
    new THREE.BoxGeometry(
      CHUNK_LENGTH_SIZE + outlineWidth * 2,
      0.1,
      outlineWidth,
    ),
    new THREE.MeshStandardMaterial({ color: COLOR_SIDEWALK }),
  );
  backBorder.position.set(0, yOffset, -half - outlineWidth / 2);
  group.add(backBorder);

  // left border (along Z axis)
  const leftBorder = new THREE.Mesh(
    new THREE.BoxGeometry(outlineWidth, 0.1, CHUNK_LENGTH_SIZE),
    new THREE.MeshStandardMaterial({ color: COLOR_SIDEWALK }),
  );
  leftBorder.position.set(-half - outlineWidth / 2, yOffset, 0);
  group.add(leftBorder);

  // right border
  const rightBorder = new THREE.Mesh(
    new THREE.BoxGeometry(outlineWidth, 0.1, CHUNK_LENGTH_SIZE),
    new THREE.MeshStandardMaterial({ color: COLOR_SIDEWALK }),
  );
  rightBorder.position.set(half + outlineWidth / 2, yOffset, 0);
  group.add(rightBorder);

  // trees
  for (let i = 0; i < 20; i++) {
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.15, 1.5),
      new THREE.MeshStandardMaterial({ color: COLOR_TRUNK }),
    );

    const leaves = new THREE.Mesh(
      new THREE.ConeGeometry(0.7, 1.8, 8),
      new THREE.MeshStandardMaterial({ color: COLOR_LEAVES }),
    );

    const x = rng(-half, half);
    const z = rng(-half, half);
    const y = 0.75;

    trunk.position.set(x, y, z);
    leaves.position.set(x, y + 1.5, z);

    group.add(trunk);
    group.add(leaves);
  }

  // buildings
  for (let i = 0; i < 10; i++) {
    const width = rng(1.5, 3);
    const height = rng(3, 8);
    const depth = rng(1.5, 3);

    const building = new THREE.Mesh(
      new THREE.BoxGeometry(width, height, depth),
      new THREE.MeshStandardMaterial({ color: COLOR_BUILDING }),
    );

    const x = rng(-half, half);
    const z = rng(-half, half);
    const y = height / 2;

    building.position.set(x, y, z);
    group.add(building);
  }

  return group;
}
