// The home page hero: a coach crossing the desert past the pyramids.
// Day at sunset in the light theme, a moonlit night in the dark one.
import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import Bus3D from "./Bus3D.jsx";

const ROAD_Z = 2.4;

const PALETTES = {
  day: { sky: "#f7c99a", sand: "#e8b97a", sandDark: "#c98f52", stone: "#d9a866", road: "#5b5049", sun: "#fff1c9", hemiSky: "#ffd9ae", hemiGround: "#a46a38", light: "#ffd2a1" },
  night: { sky: "#16233a", sand: "#7d6a5a", sandDark: "#4d4038", stone: "#8f7b66", road: "#2b2a2c", sun: "#f3f1e6", hemiSky: "#4a628f", hemiGround: "#2a2018", light: "#b9c8ff" },
};

// Rolling dunes with a flat strip where the road runs; the ground in front of the
// road slopes gently down so it never hides the coach
function duneHeight(x, z) {
  if (z > ROAD_Z + 1.2) return -0.64 - (z - ROAD_Z - 1.2) * 0.07 + 0.06 * Math.sin(x * 0.6 + z);
  const h =
    0.9 * Math.sin(x * 0.16 + z * 0.05) +
    0.55 * Math.sin(x * 0.07 - z * 0.14 + 1.3) +
    0.3 * Math.sin(x * 0.33 + z * 0.22) +
    0.18 * Math.sin(x * 0.9 - z * 0.6);
  const roadFlat = Math.min(1, Math.abs(z - ROAD_Z) / 3);
  const distance = THREE.MathUtils.smoothstep(-z, -2, 20) * 1.6;
  return (h + 1.2) * roadFlat * (0.45 + distance) - 0.6;
}

function Dunes({ palette }) {
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(140, 70, 180, 90);
    g.rotateX(-Math.PI / 2);
    g.translate(0, 0, -20);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) pos.setY(i, duneHeight(pos.getX(i), pos.getZ(i)));
    g.computeVertexNormals();
    return g;
  }, []);
  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color={palette.sand} roughness={1} flatShading />
    </mesh>
  );
}

function Pyramid({ position, size, color }) {
  return (
    <mesh position={[position[0], size * 0.36 + position[1], position[2]]} rotation={[0, Math.PI / 4, 0]}>
      <coneGeometry args={[size * 0.72, size * 0.72, 4, 1]} />
      <meshStandardMaterial color={color} roughness={0.95} flatShading />
    </mesh>
  );
}

// Road dashes and roadside posts slide past to make the coach feel like it's moving
function Road({ palette, moving, dir }) {
  const dashes = useRef();
  const posts = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const DASHES = 40;
  const POSTS = 16;
  const offset = useRef(0);

  useFrame((_, dt) => {
    if (moving) offset.current = (offset.current + dt * 5.5) % 4;
    for (let i = 0; i < DASHES; i++) {
      dummy.position.set(-80 + i * 4 - offset.current * dir, -0.58, ROAD_Z);
      dummy.updateMatrix();
      dashes.current.setMatrixAt(i, dummy.matrix);
    }
    dashes.current.instanceMatrix.needsUpdate = true;
    for (let i = 0; i < POSTS; i++) {
      dummy.position.set(-60 + i * 8 - offset.current * 2 * dir, -0.2, ROAD_Z + 1.9);
      dummy.updateMatrix();
      posts.current.setMatrixAt(i, dummy.matrix);
    }
    posts.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <mesh position={[0, -0.6, ROAD_Z]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[160, 2.6]} />
        <meshStandardMaterial color={palette.road} roughness={0.9} />
      </mesh>
      <instancedMesh ref={dashes} args={[null, null, DASHES]}>
        <boxGeometry args={[1.6, 0.02, 0.12]} />
        <meshStandardMaterial color="#f5e6c8" />
      </instancedMesh>
      <instancedMesh ref={posts} args={[null, null, POSTS]}>
        <boxGeometry args={[0.08, 0.8, 0.08]} />
        <meshStandardMaterial color="#f2efe8" emissive="#e76f51" emissiveIntensity={0.15} />
      </instancedMesh>
    </group>
  );
}

function Sky({ palette, night }) {
  const stars = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const n = 700;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 160;
      pos[i * 3 + 1] = 4 + Math.random() * 40;
      pos[i * 3 + 2] = -45 - Math.random() * 10;
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);
  return (
    <group>
      <mesh position={night ? [-14, 13, -50] : [12, 3.2, -50]}>
        <sphereGeometry args={[night ? 2.2 : 4.4, 32, 32]} />
        <meshBasicMaterial color={palette.sun} toneMapped={false} />
      </mesh>
      {/* A soft halo behind the sun or moon */}
      <mesh position={night ? [-14, 13, -51] : [12, 3.2, -51]}>
        <circleGeometry args={[night ? 7 : 14, 48]} />
        <meshBasicMaterial color={palette.sun} transparent opacity={night ? 0.08 : 0.22} toneMapped={false} />
      </mesh>
      {night && (
        <points geometry={stars}>
          <pointsMaterial color="#ffffff" size={0.14} sizeAttenuation transparent opacity={0.85} />
        </points>
      )}
    </group>
  );
}

function Dust({ moving, night, dir }) {
  const ref = useRef();
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const n = 260;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 40;
      pos[i * 3 + 1] = Math.random() * 4 - 0.5;
      pos[i * 3 + 2] = Math.random() * 10 - 6;
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);
  useFrame((_, dt) => {
    if (!moving) return;
    const pos = ref.current.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i) - dt * (1.5 + (i % 7) * 0.3) * dir;
      if (x < -20) x += 40;
      if (x > 20) x -= 40;
      pos.setX(i, x);
    }
    pos.needsUpdate = true;
  });
  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial color={night ? "#c9d4ff" : "#fff3dc"} size={0.05} transparent opacity={0.6} depthWrite={false} />
    </points>
  );
}

// Wide screens keep the headline on one side and the coach on the other.
// `dir` is 1 for left-to-right pages and -1 for Arabic, where the coach drives right to left.
const isWide = (size) => size.width / size.height > 1.15;

function Rig({ motion, progress, intro, dir }) {
  const { camera, pointer, size } = useThree();
  const look = useMemo(() => new THREE.Vector3(), []);
  const target = useMemo(() => new THREE.Vector3(), []);
  useFrame((_, dt) => {
    const p = progress.current;
    const px = motion ? pointer.x : 0;
    const py = motion ? pointer.y : 0;
    if (isWide(size)) {
      target.set(1.8 * dir + px * 1.2, 2.3 + py * 0.4 + p * 2.4, 14 - p * 4);
      look.set(3.2 * dir + px * 0.3, 0.7 + p * 0.6, -2);
    } else {
      target.set(0.6 + px * 0.6, 3.4 + p * 2, 22 - p * 4);
      look.set(0.5, 1.4, -2);
    }
    camera.position.lerp(target, motion ? 1 - Math.pow(0.02, dt) : 1);
    camera.lookAt(look);
    intro.current = Math.min(1, intro.current + dt * 0.45);
  });
  return null;
}

function Coach({ motion, night, intro, dir }) {
  const ref = useRef();
  const { size } = useThree();
  useFrame(({ clock }) => {
    const e = motion ? 1 - Math.pow(1 - intro.current, 3) : 1;
    ref.current.position.x = THREE.MathUtils.lerp(-18 * dir, (isWide(size) ? 7.2 : 0.4) * dir, e);
    ref.current.position.y = 0.36 + (motion ? Math.sin(clock.elapsedTime * 9) * 0.015 : 0);
  });
  return (
    <group ref={ref} position={[0.4 * dir, 0.36, ROAD_Z]} rotation={[0, dir > 0 ? 0 : Math.PI, 0]}>
      <Bus3D speed={motion ? 1.6 : 0} night={night} />
    </group>
  );
}

function Scene({ night, motion, progress, dir }) {
  const palette = night ? PALETTES.night : PALETTES.day;
  const intro = useRef(motion ? 0 : 1);
  return (
    <>
      <color attach="background" args={[palette.sky]} />
      <fog attach="fog" args={[palette.sky, 16, night ? 52 : 62]} />
      <hemisphereLight args={[palette.hemiSky, palette.hemiGround, night ? 0.55 : 1.05]} />
      <directionalLight position={night ? [-8, 10, 6] : [-6, 9, 12]} intensity={night ? 0.7 : 1.9} color={palette.light} />
      {!night && <directionalLight position={[12, 4, -20]} intensity={0.8} color="#ffb070" />}
      <Sky palette={palette} night={night} />
      <Dunes palette={palette} />
      <Pyramid position={[-9, -0.4, -16]} size={7.5} color={palette.stone} />
      <Pyramid position={[-1.5, -0.4, -22]} size={9.5} color={palette.stone} />
      <Pyramid position={[5.5, -0.4, -19]} size={5} color={palette.stone} />
      <Road palette={palette} moving={motion} dir={dir} />
      <Coach motion={motion} night={night} intro={intro} dir={dir} />
      <Dust moving={motion} night={night} dir={dir} />
      <Rig motion={motion} progress={progress} intro={intro} dir={dir} />
    </>
  );
}

export default function HeroScene({ night, motion, active, progress, label, rtl = false }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    canvasRef.current?.setAttribute("aria-label", label);
  }, [label]);
  return (
    <Canvas
      ref={canvasRef}
      className="hero-canvas"
      role="img"
      dpr={[1, 1.75]}
      camera={{ position: [1.6, 2.5, 15], fov: 40, near: 0.1, far: 200 }}
      frameloop={active && motion ? "always" : "demand"}
      gl={{ antialias: true, powerPreference: "high-performance" }}
    >
      <Scene night={night} motion={motion} progress={progress} dir={rtl ? -1 : 1} />
    </Canvas>
  );
}
