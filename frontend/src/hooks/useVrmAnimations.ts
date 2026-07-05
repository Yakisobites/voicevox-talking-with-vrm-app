import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import type React from "react";
import { VRM } from "@pixiv/three-vrm";
import {
  VRMAnimationLoaderPlugin,
  createVRMAnimationClip,
} from "@pixiv/three-vrm-animation";
import { AnimationMixer, LoopOnce } from "three";
import type { AnimationAction } from "three";
import type { Object3D } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

type UseVrmAnimationsParams = {
  vrm: VRM | null;
  lipSyncTriggerRef: React.RefObject<number>;
  lipSyncDurationMsRef: React.RefObject<number>;
  isAudioPlayingRef: React.RefObject<boolean>;
  onLipSyncLevelChange?: (value: number) => void;
};

const randomBlinkIntervalMs = () => 8_000 + Math.random() * 6_000;
const randomIdleActionIntervalMs = () => 15_000 + Math.random() * 15_000;

export const useVrmAnimations = ({
  vrm,
  lipSyncTriggerRef,
  lipSyncDurationMsRef,
  isAudioPlayingRef,
  onLipSyncLevelChange,
}: UseVrmAnimationsParams) => {
  // --- Blink refs ---
  const activeLipSyncTriggerRef = useRef(0);
  const lipSyncStartMsRef = useRef<number | null>(null);
  const activeLipSyncDurationMsRef = useRef(600);
  const mouthOpenSmoothedRef = useRef(0);
  const nextBlinkAtMsRef = useRef(randomBlinkIntervalMs());
  const blinkStartMsRef = useRef<number | null>(null);
  const secondBlinkAtMsRef = useRef<number | null>(null);

  // --- Bone refs (初回フレームでキャッシュ) ---
  const boneRefsInitializedRef = useRef(false);
  const spineRef = useRef<Object3D | null>(null);

  // --- VRMA animation refs ---
  const mixerRef = useRef<AnimationMixer | null>(null);
  const vrmaActionRef = useRef<AnimationAction | null>(null);
  type VrmaState = "idle" | "playing" | "fading_out";
  const vrmaStateRef = useRef<VrmaState>("idle");
  const nextVrmaAtMsRef = useRef(randomIdleActionIntervalMs());

  const FADE_DURATION = 0.5;

  // --- VRMA ロード ---
  useEffect(() => {
    if (!vrm) return;

    const mixer = new AnimationMixer(vrm.scene);
    mixerRef.current = mixer;

    const loader = new GLTFLoader();
    loader.register((parser) => new VRMAnimationLoaderPlugin(parser));

    loader.load("/vrma/VRMA_01.vrma", (gltf) => {
      const vrmAnimations = gltf.userData.vrmAnimations;
      if (!vrmAnimations || vrmAnimations.length === 0) return;
      const clip = createVRMAnimationClip(vrmAnimations[0], vrm);
      const action = mixer.clipAction(clip);
      action.setLoop(LoopOnce, 1);
      action.clampWhenFinished = true;
      vrmaActionRef.current = action;
    });

    return () => {
      mixer.stopAllAction();
      mixerRef.current = null;
      vrmaActionRef.current = null;
      vrmaStateRef.current = "idle";
    };
  }, [vrm]);

  useFrame((state, delta) => {
    if (!vrm) return;
    const isAudioPlaying = isAudioPlayingRef.current === true;

    vrm.update(delta);

    const nowMs = state.clock.elapsedTime * 1000;

    // ---- ボーンref の初期化 (1回だけ) ----
    if (!boneRefsInitializedRef.current) {
      const get = (
        name: Parameters<NonNullable<VRM["humanoid"]>["getRawBoneNode"]>[0],
      ): Object3D | null =>
        vrm.humanoid?.getNormalizedBoneNode(name) ??
        vrm.humanoid?.getRawBoneNode(name) ??
        null;
      spineRef.current = get("spine");
      boneRefsInitializedRef.current = true;
    }

    // ---- 瞬き (常時) ----
    let blink = 0;

    if (blinkStartMsRef.current === null && nowMs >= nextBlinkAtMsRef.current) {
      blinkStartMsRef.current = nowMs;
      nextBlinkAtMsRef.current = nowMs + randomBlinkIntervalMs();
      if (Math.random() < 0.3) {
        secondBlinkAtMsRef.current = nowMs + 180 + 200;
      }
    }

    if (
      blinkStartMsRef.current === null &&
      secondBlinkAtMsRef.current !== null &&
      nowMs >= secondBlinkAtMsRef.current
    ) {
      blinkStartMsRef.current = nowMs;
      secondBlinkAtMsRef.current = null;
    }

    if (blinkStartMsRef.current !== null) {
      const blinkDurationMs = 180;
      const blinkProgress = (nowMs - blinkStartMsRef.current) / blinkDurationMs;
      if (blinkProgress >= 1) {
        blinkStartMsRef.current = null;
      } else if (blinkProgress <= 0.5) {
        blink = blinkProgress * 2;
      } else {
        blink = (1 - blinkProgress) * 2;
      }
    }

    vrm.expressionManager?.setValue("blink", Math.min(Math.max(blink, 0), 1));

    // ---- リップシンク ----
    if (lipSyncTriggerRef.current !== activeLipSyncTriggerRef.current) {
      activeLipSyncTriggerRef.current = lipSyncTriggerRef.current;
      lipSyncStartMsRef.current = nowMs;
      activeLipSyncDurationMsRef.current = Math.max(
        600,
        lipSyncDurationMsRef.current,
      );
    }

    let mouthOpenTarget = 0;
    const startMs = lipSyncStartMsRef.current;
    if (startMs !== null) {
      const durationMs = activeLipSyncDurationMsRef.current;
      const elapsed = nowMs - startMs;
      const progress = Math.min(elapsed / durationMs, 1);
      const envelope = 1 - progress;
      // Keep lip-sync oscillation frequency stable across short/long audio.
      const pulse = (Math.sin((elapsed / 1000) * Math.PI * 2 * 6) + 1) * 0.5;
      mouthOpenTarget = Math.min(Math.max(pulse * envelope, 0), 1);
      if (progress >= 1) {
        lipSyncStartMsRef.current = null;
        mouthOpenTarget = 0;
      }
    }
    const smoothing = Math.min(1, delta * 20);
    mouthOpenSmoothedRef.current +=
      (mouthOpenTarget - mouthOpenSmoothedRef.current) * smoothing;
    const mouthOpen = Math.min(Math.max(mouthOpenSmoothedRef.current, 0), 1);
    vrm.expressionManager?.setValue("aa", mouthOpen);
    onLipSyncLevelChange?.(mouthOpen);

    // ---- 体の呼吸揺れ (常時) ----
    if (spineRef.current) {
      spineRef.current.rotation.z =
        Math.sin(state.clock.elapsedTime * 1.2) * 0.018;
    }

    // ---- VRMA アニメーション (音声再生中は一時停止) ----
    const mixer = mixerRef.current;
    const action = vrmaActionRef.current;
    if (mixer && action) {
      if (isAudioPlaying) {
        if (vrmaStateRef.current !== "idle") {
          action.stop();
          vrmaStateRef.current = "idle";
          nextVrmaAtMsRef.current = nowMs + randomIdleActionIntervalMs();
        }
      } else {
        mixer.update(delta);

        const vrmaState = vrmaStateRef.current;
        const clipDuration = action.getClip().duration;

        if (vrmaState === "idle" && nowMs >= nextVrmaAtMsRef.current) {
          action.reset().fadeIn(FADE_DURATION).play();
          vrmaStateRef.current = "playing";
        }

        if (
          vrmaState === "playing" &&
          action.time >= clipDuration - FADE_DURATION
        ) {
          action.fadeOut(FADE_DURATION);
          vrmaStateRef.current = "fading_out";
        }

        if (vrmaState === "fading_out" && action.time >= clipDuration) {
          action.stop();
          vrmaStateRef.current = "idle";
          nextVrmaAtMsRef.current = nowMs + randomIdleActionIntervalMs();
        }
      }
    }
  });
};
