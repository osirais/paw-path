"use client";

import { InstanceProps, Merged, useGLTF } from "@react-three/drei";
import React, { createContext, useContext, useMemo } from "react";

export const buildingKeys = ["A", "B", "C", "D", "E", "F", "G", "H"];

export type BuildingInstances = React.FC<InstanceProps> &
  Record<string, React.FC<InstanceProps>>;

const BuildingContext = createContext<BuildingInstances | null>(null);

export function BuildingProvider({
  children,
  ...props
}: {
  children: React.ReactNode;
}) {
  const { nodes: nodesA } = useGLTF("/models/buildings/building_A.glb");
  const { nodes: nodesB } = useGLTF("/models/buildings/building_B.glb");
  const { nodes: nodesC } = useGLTF("/models/buildings/building_C.glb");
  const { nodes: nodesD } = useGLTF("/models/buildings/building_D.glb");
  const { nodes: nodesE } = useGLTF("/models/buildings/building_E.glb");
  const { nodes: nodesF } = useGLTF("/models/buildings/building_F.glb");
  const { nodes: nodesG } = useGLTF("/models/buildings/building_G.glb");
  const { nodes: nodesH } = useGLTF("/models/buildings/building_H.glb");

  const meshes = useMemo(
    () => ({
      A: nodesA.building_A,
      B: nodesB.building_B,
      C: nodesC.building_C,
      D: nodesD.building_D,
      E: nodesE.building_E,
      F: nodesF.building_F,
      G: nodesG.building_G,
      H: nodesH.building_H,
    }),
    [nodesA, nodesB, nodesC, nodesD, nodesE, nodesF, nodesG, nodesH],
  );

  return (
    <Merged meshes={meshes} {...props}>
      {(instances) => (
        <BuildingContext.Provider value={instances}>
          {children}
        </BuildingContext.Provider>
      )}
    </Merged>
  );
}

export function useBuildings() {
  const context = useContext(BuildingContext);
  if (!context)
    throw new Error("useBuildings must be used inside BuildingProvider");
  return context;
}

buildingKeys.forEach((key) => {
  useGLTF.preload(`/models/buildings/building_${key}.glb`);
});
