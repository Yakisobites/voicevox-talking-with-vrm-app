import * as THREE from "three";
import type { VRM } from "@pixiv/three-vrm";

const disposeMaterial = (material: THREE.Material) => {
  for (const value of Object.values(material)) {
    if (value && typeof value === "object" && "isTexture" in value) {
      (value as THREE.Texture).dispose();
    }
  }
  material.dispose();
};

export const disposeVrm = (targetVrm: VRM) => {
  targetVrm.scene.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (mesh.geometry) {
      mesh.geometry.dispose();
    }

    if (!mesh.material) {
      return;
    }

    if (Array.isArray(mesh.material)) {
      for (const material of mesh.material) {
        disposeMaterial(material);
      }
      return;
    }

    disposeMaterial(mesh.material);
  });
};
