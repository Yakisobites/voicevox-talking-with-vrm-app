import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { ContactShadows, OrbitControls } from "@react-three/drei";
import type React from "react";

type SceneCanvasProps = {
  children: React.ReactNode;
};

export const SceneCanvas: React.FC<SceneCanvasProps> = ({ children }) => {
  return (
    <Canvas
      style={{ background: "transparent" }}
      camera={{ position: [0, 1.2, 1.6], fov: 35 }}
    >
      <ambientLight intensity={1.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <Suspense fallback={null}>{children}</Suspense>
      <ContactShadows
        opacity={0.5}
        scale={10}
        blur={1}
        far={10}
        color="#000000"
      />
      <OrbitControls target={[0, 1.0, 0]} />
    </Canvas>
  );
};
