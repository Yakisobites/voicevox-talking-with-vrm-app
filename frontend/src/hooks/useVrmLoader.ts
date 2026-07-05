import { useEffect, useState } from "react";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { VRMLoaderPlugin, VRM } from "@pixiv/three-vrm";
import { disposeVrm } from "../utils/three-disposal";

export const useVrmLoader = (modelPath: string) => {
  const [vrm, setVrm] = useState<VRM | null>(null);

  useEffect(() => {
    const loader = new GLTFLoader();
    let disposed = false;
    let loadedVrm: VRM | null = null;

    loader.register((parser) => new VRMLoaderPlugin(parser));

    loader.load(modelPath, (gltf) => {
      const vrmData = gltf.userData.vrm as VRM;
      loadedVrm = vrmData;
      vrmData.scene.rotation.y = Math.PI;

      if (disposed) {
        disposeVrm(vrmData);
        return;
      }

      setVrm(vrmData);
    });

    return () => {
      disposed = true;
      if (loadedVrm) {
        disposeVrm(loadedVrm);
      }
    };
  }, [modelPath]);

  return vrm;
};
