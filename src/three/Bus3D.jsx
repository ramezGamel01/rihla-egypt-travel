// A coach built from simple shapes, facing +x. Wheels spin while `speed` is above zero.
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";

const WHEELS = [
  [1.35, -0.62, 0.72],
  [1.35, -0.62, -0.72],
  [-1.25, -0.62, 0.72],
  [-1.25, -0.62, -0.72],
];

export default function Bus3D({ speed = 0, night = false, ...props }) {
  const wheels = useRef([]);
  useFrame((_, dt) => {
    if (!speed) return;
    wheels.current.forEach((w) => w && (w.rotation.y -= dt * speed * 6));
  });
  return (
    <group {...props}>
      {/* Body */}
      <RoundedBox args={[4.2, 1.45, 1.55]} radius={0.2} smoothness={4} castShadow>
        <meshStandardMaterial color="#fffaf2" roughness={0.45} metalness={0.05} />
      </RoundedBox>
      {/* Window band */}
      <mesh position={[-0.15, 0.22, 0]}>
        <boxGeometry args={[3.55, 0.56, 1.58]} />
        <meshStandardMaterial color="#173038" roughness={0.15} metalness={0.7} />
      </mesh>
      {/* Windscreen */}
      <mesh position={[2.08, 0.12, 0]}>
        <boxGeometry args={[0.08, 0.86, 1.36]} />
        <meshStandardMaterial color="#21414b" roughness={0.1} metalness={0.8} />
      </mesh>
      {/* Livery: a sunset stripe and a teal skirt */}
      <mesh position={[0, -0.24, 0]}>
        <boxGeometry args={[4.22, 0.16, 1.57]} />
        <meshStandardMaterial color="#e76f51" roughness={0.5} />
      </mesh>
      <mesh position={[0, -0.47, 0]}>
        <boxGeometry args={[4.18, 0.3, 1.56]} />
        <meshStandardMaterial color="#264653" roughness={0.6} />
      </mesh>
      {/* Roof unit */}
      <RoundedBox args={[1.5, 0.18, 0.95]} radius={0.06} position={[-0.4, 0.8, 0]}>
        <meshStandardMaterial color="#e9e3d8" roughness={0.6} />
      </RoundedBox>
      {/* Lights */}
      {[0.5, -0.5].map((z) => (
        <mesh key={`h${z}`} position={[2.11, -0.36, z]}>
          <boxGeometry args={[0.04, 0.12, 0.3]} />
          <meshStandardMaterial color="#fff6d6" emissive="#ffe8a3" emissiveIntensity={night ? 3 : 0.6} />
        </mesh>
      ))}
      {[0.55, -0.55].map((z) => (
        <mesh key={`t${z}`} position={[-2.11, -0.3, z]}>
          <boxGeometry args={[0.04, 0.22, 0.14]} />
          <meshStandardMaterial color="#ff5a3c" emissive="#ff3b1f" emissiveIntensity={night ? 2.5 : 0.5} />
        </mesh>
      ))}
      {night && <pointLight position={[3.2, -0.2, 0]} color="#ffe2a0" intensity={6} distance={7} />}
      {/* Wheels */}
      {WHEELS.map((p, i) => (
        <group key={i} position={p} rotation={[Math.PI / 2, 0, 0]}>
          <mesh ref={(el) => (wheels.current[i] = el)}>
            <cylinderGeometry args={[0.34, 0.34, 0.26, 18]} />
            <meshStandardMaterial color="#1c1f22" roughness={0.9} />
          </mesh>
          <mesh position={[0, p[2] > 0 ? 0.135 : -0.135, 0]}>
            <cylinderGeometry args={[0.16, 0.16, 0.02, 12]} />
            <meshStandardMaterial color="#c9ccd1" metalness={0.8} roughness={0.3} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
