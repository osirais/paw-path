import { CHUNK_LENGTH_SIZE } from "@/constants/chunk";
import {
  COLOR_BUILDING,
  COLOR_GROUND,
  COLOR_LEAVES,
  COLOR_SIDEWALK,
  COLOR_STREET,
  COLOR_TRUNK,
} from "@/constants/colors";
import { rng } from "@/utils/rng";
import * as THREE from "three";

export function genChunk() {
  const group = new THREE.Group();
  const half = CHUNK_LENGTH_SIZE / 2;

  // street - full chunk size (bottom plane)
  const street = new THREE.Mesh(
    new THREE.PlaneGeometry(CHUNK_LENGTH_SIZE, CHUNK_LENGTH_SIZE),
    new THREE.MeshStandardMaterial({
      color: COLOR_STREET,
      side: THREE.DoubleSide,
    }),
  );
  street.rotation.x = -Math.PI / 2;
  group.add(street);

  // sidewalk size smaller than chunk
  const sidewalkInset = 4;
  const sidewalkSize = CHUNK_LENGTH_SIZE - sidewalkInset * 2;

  // sidewalk - smaller square on top of street
  const sidewalk = new THREE.Mesh(
    new THREE.PlaneGeometry(sidewalkSize, sidewalkSize),
    new THREE.MeshStandardMaterial({
      color: COLOR_SIDEWALK,
      side: THREE.DoubleSide,
    }),
  );
  sidewalk.rotation.x = -Math.PI / 2;
  sidewalk.position.y = 0.01; // slightly above street
  group.add(sidewalk);

  // grass size smaller than sidewalk
  const grassInset = 3;
  const grassSize = sidewalkSize - grassInset * 2;

  // grass - smaller square inside sidewalk
  const grass = new THREE.Mesh(
    new THREE.PlaneGeometry(grassSize, grassSize),
    new THREE.MeshStandardMaterial({
      color: COLOR_GROUND,
      side: THREE.DoubleSide,
    }),
  );
  grass.rotation.x = -Math.PI / 2;
  grass.position.y = 0.02; // slightly above sidewalk
  group.add(grass);

  // trees only inside grass area
  for (let i = 0; i < 5; i++) {
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.15, 1.5),
      new THREE.MeshStandardMaterial({ color: COLOR_TRUNK }),
    );

    const leaves = new THREE.Mesh(
      new THREE.ConeGeometry(0.7, 1.8, 8),
      new THREE.MeshStandardMaterial({ color: COLOR_LEAVES }),
    );

    const margin = 1;
    const x = rng(-grassSize / 2 + margin, grassSize / 2 - margin);
    const z = rng(-grassSize / 2 + margin, grassSize / 2 - margin);
    const y = 0.75;

    trunk.position.set(x, y, z);
    leaves.position.set(x, y + 1.5, z);

    group.add(trunk);
    group.add(leaves);
  }

  // buildings only inside grass area
  for (let i = 0; i < 2; i++) {
    const width = rng(1.5, 3);
    const height = rng(3, 8);
    const depth = rng(1.5, 3);

    const building = new THREE.Mesh(
      new THREE.BoxGeometry(width, height, depth),
      new THREE.MeshStandardMaterial({ color: COLOR_BUILDING }),
    );

    const margin = 1;
    const x = rng(
      -grassSize / 2 + width / 2 + margin,
      grassSize / 2 - width / 2 - margin,
    );
    const z = rng(
      -grassSize / 2 + depth / 2 + margin,
      grassSize / 2 - depth / 2 - margin,
    );
    const y = height / 2;

    building.position.set(x, y, z);
    group.add(building);
  }

  return group;
}
