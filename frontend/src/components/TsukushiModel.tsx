import type React from "react";
import { useVrmAnimations } from "../hooks/useVrmAnimations";
import { useVrmLoader } from "../hooks/useVrmLoader";
import { useVrmPose } from "../hooks/useVrmPose";

type TsukushiModelProps = {
  lipSyncTriggerRef: React.RefObject<number>;
  lipSyncDurationMsRef: React.RefObject<number>;
  isAudioPlayingRef: React.RefObject<boolean>;
};

export const TsukushiModel: React.FC<TsukushiModelProps> = ({
  lipSyncTriggerRef,
  lipSyncDurationMsRef,
  isAudioPlayingRef,
}) => {
  const vrm = useVrmLoader("/kasukabe-tumugi.vrm");

  useVrmAnimations({
    vrm,
    lipSyncTriggerRef,
    lipSyncDurationMsRef,
    isAudioPlayingRef,
  });
  useVrmPose(vrm);

  return vrm ? <primitive object={vrm.scene} /> : null;
};
