import { useEffect } from "react";
import type { VRM } from "@pixiv/three-vrm";

export const useVrmPose = (vrm: VRM | null) => {
  useEffect(() => {
    if (!vrm) {
      return;
    }

    const getPoseBone = (
      name: Parameters<NonNullable<VRM["humanoid"]>["getRawBoneNode"]>[0],
    ) =>
      vrm.humanoid?.getNormalizedBoneNode(name) ??
      vrm.humanoid?.getRawBoneNode(name);

    const leftUpperArm = getPoseBone("leftUpperArm");
    const rightUpperArm = getPoseBone("rightUpperArm");
    const leftLowerArm = getPoseBone("leftLowerArm");
    const rightLowerArm = getPoseBone("rightLowerArm");
    const leftHand = getPoseBone("leftHand");
    const rightHand = getPoseBone("rightHand");
    const leftUpperLeg = getPoseBone("leftUpperLeg");
    const rightUpperLeg = getPoseBone("rightUpperLeg");
    const head = getPoseBone("head");

    if (leftUpperArm) {
      leftUpperArm.rotation.z = Math.PI / 3;
      leftUpperArm.rotation.y = -Math.PI / 8;
    }
    if (rightUpperArm) {
      rightUpperArm.rotation.z = -Math.PI / 3;
      rightUpperArm.rotation.y = Math.PI / 8;
    }
    if (leftLowerArm) {
      leftLowerArm.rotation.z = Math.PI / 8;
      leftLowerArm.rotation.x = -Math.PI / 10;
    }
    if (rightLowerArm) {
      rightLowerArm.rotation.z = -Math.PI / 8;
      rightLowerArm.rotation.x = -Math.PI / 10;
    }
    if (leftHand) {
      leftHand.rotation.y = Math.PI / 10;
    }
    if (rightHand) {
      rightHand.rotation.y = -Math.PI / 10;
    }
    if (leftUpperLeg) {
      leftUpperLeg.rotation.y = Math.PI / 20;
    }
    if (rightUpperLeg) {
      rightUpperLeg.rotation.y = -Math.PI / 20;
    }
    if (head) {
      head.rotation.x = Math.PI / 60;
    }
  }, [vrm]);
};
