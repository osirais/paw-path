import { genChunk } from "@/utils/gen-chunk";
import * as THREE from "three";

export function setupScene() {
  const scene = new THREE.Scene();

  const chunk = genChunk();
  scene.add(chunk);

  scene.add(new THREE.AmbientLight(0xffffff, 0.5));

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(50, 100, 50);
  scene.add(directionalLight);

  return { scene };
}
