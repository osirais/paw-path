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

const sidewalkInset = 4;
const grassInset = 3;
const treeMargin = 1;
const buildingMargin = 1;

const sidewalkSize = CHUNK_LENGTH_SIZE - sidewalkInset * 2;
const grassSize = sidewalkSize - grassInset * 2;

const streetGeometry = new THREE.PlaneGeometry(
  CHUNK_LENGTH_SIZE,
  CHUNK_LENGTH_SIZE,
);
const sidewalkGeometry = new THREE.PlaneGeometry(sidewalkSize, sidewalkSize);
const grassGeometry = new THREE.PlaneGeometry(grassSize, grassSize);
const trunkGeometry = new THREE.CylinderGeometry(0.15, 0.15, 1.5);
const leavesGeometry = new THREE.ConeGeometry(0.7, 1.8, 8);

const streetMaterial = new THREE.MeshLambertMaterial({
  color: COLOR_STREET,
});
const sidewalkMaterial = new THREE.MeshLambertMaterial({
  color: COLOR_SIDEWALK,
});
const grassMaterial = new THREE.MeshLambertMaterial({
  color: COLOR_GROUND,
});
const trunkMaterial = new THREE.MeshLambertMaterial({ color: COLOR_TRUNK });
const leavesMaterial = new THREE.MeshLambertMaterial({ color: COLOR_LEAVES });
const buildingMaterial = new THREE.MeshLambertMaterial({
  color: COLOR_BUILDING,
});

export function genChunk() {
  const group = new THREE.Group();

  const street = new THREE.Mesh(streetGeometry, streetMaterial);
  street.rotation.x = -Math.PI / 2;
  group.add(street);

  const sidewalk = new THREE.Mesh(sidewalkGeometry, sidewalkMaterial);
  sidewalk.rotation.x = -Math.PI / 2;
  sidewalk.position.y = 0.01;
  group.add(sidewalk);

  const grass = new THREE.Mesh(grassGeometry, grassMaterial);
  grass.rotation.x = -Math.PI / 2;
  grass.position.y = 0.02;
  group.add(grass);
  const treeCount = 5;
  const dummy = new THREE.Object3D();

  const trunkMesh = new THREE.InstancedMesh(
    trunkGeometry,
    trunkMaterial,
    treeCount,
  );
  trunkMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

  const leavesMesh = new THREE.InstancedMesh(
    leavesGeometry,
    leavesMaterial,
    treeCount,
  );
  leavesMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

  for (let i = 0; i < treeCount; i++) {
    const x = rng(-grassSize / 2 + treeMargin, grassSize / 2 - treeMargin);
    const z = rng(-grassSize / 2 + treeMargin, grassSize / 2 - treeMargin);
    const y = 0.75;

    dummy.position.set(x, y, z);
    dummy.updateMatrix();
    trunkMesh.setMatrixAt(i, dummy.matrix);

    dummy.position.set(x, y + 1.5, z);
    dummy.updateMatrix();
    leavesMesh.setMatrixAt(i, dummy.matrix);
  }

  trunkMesh.instanceMatrix.needsUpdate = true;
  leavesMesh.instanceMatrix.needsUpdate = true;

  group.add(trunkMesh);
  group.add(leavesMesh);

  for (let i = 0; i < 2; i++) {
    const width = rng(1.5, 3);
    const height = rng(3, 8);
    const depth = rng(1.5, 3);

    const building = new THREE.Mesh(
      new THREE.BoxGeometry(width, height, depth),
      buildingMaterial,
    );

    const x = rng(
      -grassSize / 2 + width / 2 + buildingMargin,
      grassSize / 2 - width / 2 - buildingMargin,
    );
    const z = rng(
      -grassSize / 2 + depth / 2 + buildingMargin,
      grassSize / 2 - depth / 2 - buildingMargin,
    );
    const y = height / 2;

    building.position.set(x, y, z);
    group.add(building);
  }

  return group;
}
