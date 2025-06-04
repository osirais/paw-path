"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { BuildingProvider, useBuildings } from "./buildings";

export function Scene() {
  return (
    <Canvas style={{ width: "100vw", height: "100vh" }}>
      <ambientLight intensity={2} />
      <BuildingProvider>
        <InnerScene />
      </BuildingProvider>
      <OrbitControls />
    </Canvas>
  );
}

function InnerScene() {
  const buildings = useBuildings();

  const x = Object.values(buildings);

  const Building = x[Math.floor(Math.random() * x.length)];

  return (
    <>
      <Building position={[-2, 0, 0]} />
      <Building />
      <buildings.A position={[2, 0, 0]} />
      <buildings.B position={[4, 0, 0]} />
      <buildings.C position={[6, 0, 0]} rotation={[0, -Math.PI / 2, 0]} />
      <group position={[0, 0, -10]}>
        {Array.from({ length: 4 }).map((_, row) =>
          Array.from({ length: 100 }).map((_, col) => (
            <Building
              key={`${row}-${col}`}
              position={[-100 + col * 2, row * 2.5, 0]}
            />
          )),
        )}
      </group>
    </>
  );
}
