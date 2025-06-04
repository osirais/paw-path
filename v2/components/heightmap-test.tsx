"use client";

import { OrbitControls, Plane } from "@react-three/drei";
import { Canvas, useLoader } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";

const Terrain = () => {
  const heightMap = useLoader(THREE.TextureLoader, "/map.png");

  const material = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      color: "gray",
      displacementMap: heightMap,
      displacementScale: 5,
    });

    mat.onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace(
        `#include <normal_fragment_maps>`,
        `
        #include <normal_fragment_maps>
        normal = normalize(cross(dFdx(vViewPosition), dFdy(vViewPosition)));
        `,
      );
    };

    return mat;
  }, [heightMap]);

  return (
    <group>
      <Plane
        castShadow
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -3, 0]}
        args={[50, 28, 1750, 980]}
      >
        <primitive object={material} attach="material" />
      </Plane>
    </group>
  );
};

export default function App() {
  return (
    <Canvas shadows style={{ width: "100vw", height: "100vh" }}>
      <ambientLight intensity={0.2} />
      <directionalLight position={[20, 5, 20]} intensity={2} />

      <OrbitControls />
      <Terrain />
    </Canvas>
  );
}
