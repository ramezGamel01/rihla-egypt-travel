// An open-top coach cabin with every seat as a clickable 3D object.
// Mirrors the 2D seat map: same seats, same selection, same limits.
import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, RoundedBox } from "@react-three/drei";
import { BUS_CLASSES } from "../data/network.js";

const PITCH = 0.9; // distance between rows
const WIDTH = 0.62; // seat width

const COLORS = {
  light: { floor: "#e9e1d4", shell: "#fffaf2", glass: "#9cc9d6", free: "#f4ede2", freeBack: "#e2d6c3", taken: "#a7a9ad", picked: "#e76f51", hover: "#2a9d8f", bg: "#f6efe4" },
  dark: { floor: "#24323a", shell: "#30414a", glass: "#4c7b88", free: "#c9d4d8", freeBack: "#9eb0b6", taken: "#4a5257", picked: "#ff8a5c", hover: "#4cd3c2", bg: "#0f1b22" },
};

function seatX(col, layout) {
  // Columns left to right across the bus, with the aisle as an empty column
  const cols = layout.seats.length;
  return (col - (cols - 1) / 2) * (WIDTH + 0.08);
}

function Seat({ label, position, state, colors, onToggle, onHover, hovered, motion, tip }) {
  const group = useRef();
  const lift = useRef(0);
  const color = state === "taken" ? colors.taken : state === "picked" ? colors.picked : hovered ? colors.hover : colors.free;
  useFrame((_, dt) => {
    const target = state === "picked" ? 0.12 : hovered && state !== "taken" ? 0.06 : 0;
    lift.current += (target - lift.current) * (motion ? Math.min(1, dt * 12) : 1);
    group.current.position.y = position[1] + lift.current;
  });
  return (
    <group
      ref={group}
      position={position}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover(label);
        document.body.style.cursor = state === "taken" ? "not-allowed" : "pointer";
      }}
      onPointerMove={(e) => {
        const el = tip.current;
        if (!el) return;
        el.textContent = label;
        el.style.opacity = "1";
        el.style.transform = `translate(-50%, -140%) translate(${e.nativeEvent.offsetX}px, ${e.nativeEvent.offsetY}px)`;
      }}
      onPointerOut={() => {
        onHover(null);
        document.body.style.cursor = "";
        if (tip.current) tip.current.style.opacity = "0";
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (state !== "taken") onToggle(label);
      }}
    >
      <RoundedBox args={[WIDTH, 0.16, 0.6]} radius={0.05} smoothness={3} position={[0, 0.22, 0]}>
        <meshStandardMaterial color={color} roughness={0.7} />
      </RoundedBox>
      <RoundedBox args={[WIDTH, 0.62, 0.14]} radius={0.05} smoothness={3} position={[0, 0.55, 0.3]} rotation={[-0.18, 0, 0]}>
        <meshStandardMaterial color={state === "free" && !hovered ? colors.freeBack : color} roughness={0.7} />
      </RoundedBox>
    </group>
  );
}

function Cabin({ busClass, taken, picked, onToggle, colors, motion, tip }) {
  const layout = BUS_CLASSES[busClass].layout;
  const [hover, setHover] = useState(null);
  const length = layout.rows * PITCH + 1.6;
  const width = layout.seats.length * (WIDTH + 0.08) + 0.3;
  const seats = [];
  for (let r = 0; r < layout.rows; r++) {
    const row = String.fromCharCode(65 + r);
    layout.seats.forEach((n, col) => {
      if (!n) return;
      const label = `${row}${n}`;
      const state = taken.has(label) ? "taken" : picked.includes(label) ? "picked" : "free";
      seats.push(
        <Seat
          key={label}
          label={label}
          position={[seatX(col, layout), 0, -length / 2 + 1.4 + r * PITCH]}
          state={state}
          colors={colors}
          onToggle={onToggle}
          onHover={setHover}
          hovered={hover === label}
          motion={motion}
          tip={tip}
        />
      );
    });
  }
  return (
    <group>
      {/* Floor and walls */}
      <RoundedBox args={[width, 0.12, length]} radius={0.05} position={[0, 0, 0]}>
        <meshStandardMaterial color={colors.floor} roughness={0.9} />
      </RoundedBox>
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh position={[(side * width) / 2, 0.35, 0]}>
            <boxGeometry args={[0.06, 0.6, length]} />
            <meshStandardMaterial color={colors.shell} roughness={0.6} />
          </mesh>
          <mesh position={[(side * width) / 2, 0.95, 0]}>
            <boxGeometry args={[0.03, 0.6, length - 0.2]} />
            <meshStandardMaterial color={colors.glass} transparent opacity={0.22} roughness={0.1} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.35, length / 2]}>
        <boxGeometry args={[width, 0.6, 0.06]} />
        <meshStandardMaterial color={colors.shell} roughness={0.6} />
      </mesh>
      {/* Front: windscreen, dashboard and the driver */}
      <mesh position={[0, 0.7, -length / 2]}>
        <boxGeometry args={[width, 1.3, 0.04]} />
        <meshStandardMaterial color={colors.glass} transparent opacity={0.3} roughness={0.1} />
      </mesh>
      <mesh position={[0, 0.45, -length / 2 + 0.25]}>
        <boxGeometry args={[width - 0.1, 0.4, 0.4]} />
        <meshStandardMaterial color="#264653" roughness={0.6} />
      </mesh>
      <group position={[seatX(0, layout), 0, -length / 2 + 0.75]}>
        <RoundedBox args={[WIDTH, 0.5, 0.5]} radius={0.06} position={[0, 0.35, 0.1]}>
          <meshStandardMaterial color="#264653" roughness={0.7} />
        </RoundedBox>
        <mesh position={[0, 0.85, -0.25]} rotation={[-1.1, 0, 0]}>
          <torusGeometry args={[0.2, 0.035, 10, 28]} />
          <meshStandardMaterial color="#1c1f22" />
        </mesh>
      </group>
      {seats}
    </group>
  );
}

export default function BusSeats3D({ busClass, taken, picked, onToggle, dark, motion, label }) {
  const colors = dark ? COLORS.dark : COLORS.light;
  const canvasRef = useRef(null);
  // Turn slowly until the visitor grabs the bus
  const [spin, setSpin] = useState(motion);
  const tip = useRef(null);
  useEffect(() => {
    canvasRef.current?.setAttribute("aria-label", label);
    return () => (document.body.style.cursor = "");
  }, [label]);
  return (
    <div className="seats-stage">
    <Canvas ref={canvasRef} role="img" className="seats-canvas" dpr={[1, 2]} camera={{ position: [5.5, 6.5, 7.5], fov: 38 }}>
      <color attach="background" args={[colors.bg]} />
      <hemisphereLight args={[dark ? "#8aa3c9" : "#fff4e2", dark ? "#1b140f" : "#b7a58d", 1.1]} />
      <directionalLight position={[4, 9, 5]} intensity={dark ? 1.2 : 1.8} />
      <Cabin busClass={busClass} taken={taken} picked={picked} onToggle={onToggle} colors={colors} motion={motion} tip={tip} />
      <OrbitControls
        enablePan={false}
        minDistance={6}
        maxDistance={16}
        minPolarAngle={0.25}
        maxPolarAngle={1.25}
        autoRotate={spin && motion}
        autoRotateSpeed={0.7}
        enableDamping={motion}
        onStart={() => setSpin(false)}
      />
    </Canvas>
      <span ref={tip} className="seat-tip" aria-hidden="true" />
    </div>
  );
}
