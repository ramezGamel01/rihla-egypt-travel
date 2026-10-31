// Scroll-driven 3D map: Egypt as a raised tile with the Nile, and a coach that
// drives the week's route as the page scrolls. `progress` (0..1) is read every frame.
import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import Bus3D from "./Bus3D.jsx";
import { CITIES } from "../data/cities.js";
import { DELTA, EGYPT, GULF_OF_SUEZ, JOURNEY, LAKE_NASSER, NILE, NILE_DAMIETTA, NILE_ROSETTA, curveFrom, project, shapeFrom, stopFractions } from "./geo.js";

const TOP = 0.32; // height of the map's top surface

const COLORS = {
  light: { land: "#efd9b0", side: "#c99a5b", nile: "#3fb8d0", delta: "#a9cf8f", route: "#e76f51", pending: "#264653", bg: "#fff3e3" },
  dark: { land: "#7d6a55", side: "#43362c", nile: "#4cd3ea", delta: "#4f7a4a", route: "#ff8a5c", pending: "#d8e6ea", bg: "#0f1b22" },
};

function Flat({ points, color, y, opacity = 1 }) {
  const geometry = useMemo(() => {
    const g = new THREE.ShapeGeometry(shapeFrom(points));
    g.rotateX(-Math.PI / 2);
    return g;
  }, [points]);
  return (
    <mesh geometry={geometry} position={[0, y, 0]}>
      <meshStandardMaterial color={color} roughness={0.9} transparent={opacity < 1} opacity={opacity} />
    </mesh>
  );
}

function Land({ colors }) {
  const geometry = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(shapeFrom(EGYPT), { depth: TOP, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08, bevelSegments: 2 });
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);
  return (
    <mesh geometry={geometry} position={[0, 0, 0]}>
      <meshStandardMaterial attach="material-0" color={colors.land} roughness={0.95} flatShading />
      <meshStandardMaterial attach="material-1" color={colors.side} roughness={1} />
    </mesh>
  );
}

function River({ points, colors, radius = 0.06 }) {
  const geometry = useMemo(() => new THREE.TubeGeometry(curveFrom(points, TOP + 0.09), 120, radius, 6, false), [points, radius]);
  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color={colors.nile} emissive={colors.nile} emissiveIntensity={0.35} roughness={0.3} />
    </mesh>
  );
}

function CityPins({ colors, active }) {
  return CITIES.map((city) => {
    const p = project(city.lon, city.lat, TOP + 0.1);
    const on = active === city.id;
    return (
      <group key={city.id} position={p}>
        <mesh position={[0, on ? 0.55 : 0.3, 0]}>
          <cylinderGeometry args={[0.025, 0.025, on ? 1.1 : 0.6, 8]} />
          <meshBasicMaterial color={on ? colors.route : colors.pending} transparent opacity={0.7} />
        </mesh>
        <mesh position={[0, on ? 1.12 : 0.62, 0]}>
          <sphereGeometry args={[on ? 0.14 : 0.08, 16, 16]} />
          <meshBasicMaterial color={on ? colors.route : colors.pending} toneMapped={false} />
        </mesh>
      </group>
    );
  });
}

// Moves the HTML city labels (rendered outside the canvas) to their pins on screen
function LabelProjector({ labels, active }) {
  const { camera, size } = useThree();
  const v = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    CITIES.forEach((city, i) => {
      const el = labels.current[i];
      if (!el) return;
      const on = active === city.id;
      v.copy(project(city.lon, city.lat, TOP + (on ? 1.45 : 0.9))).project(camera);
      const hidden = v.z > 1 || Math.abs(v.x) > 1.1 || Math.abs(v.y) > 1.1;
      el.style.opacity = hidden ? "0" : "1";
      el.style.transform = `translate(-50%, -50%) translate(${((v.x + 1) / 2) * size.width}px, ${((1 - v.y) / 2) * size.height}px)`;
    });
  });
  return null;
}

function Journey({ progress, colors, onStop, motion }) {
  const curve = useMemo(() => curveFrom(JOURNEY, TOP + 0.12), []);
  const stops = useMemo(() => stopFractions(curve, JOURNEY, TOP), [curve]);
  const trail = useRef();
  const bus = useRef();
  const lastStop = useRef(null);
  const geometry = useMemo(() => new THREE.TubeGeometry(curve, 400, 0.05, 8, false), [curve]);
  const pending = useMemo(() => new THREE.TubeGeometry(curve, 400, 0.022, 6, false), [curve]);
  const look = useMemo(() => new THREE.Vector3(), []);
  const camTarget = useMemo(() => new THREE.Vector3(), []);
  const eased = useRef(progress.current);

  useFrame(({ camera }, dt) => {
    const k = motion ? 1 - Math.pow(0.004, dt) : 1;
    eased.current += (progress.current - eased.current) * k;
    const t = Math.min(0.9999, Math.max(0, eased.current));

    // Draw the route up to the bus
    const count = geometry.index.count;
    trail.current.geometry.setDrawRange(0, Math.floor((count * t) / 6) * 6);

    // Put the coach on the road, facing along it
    const pos = curve.getPointAt(t);
    const ahead = curve.getPointAt(Math.min(1, t + 0.002));
    bus.current.position.copy(pos);
    bus.current.rotation.y = Math.atan2(-(ahead.z - pos.z), ahead.x - pos.x);

    // Which chapter we're in: the last stop the coach has reached
    let current = stops[0].id;
    stops.forEach((s) => t >= s.t - 0.02 && (current = s.id));
    if (current !== lastStop.current) {
      lastStop.current = current;
      onStop(current);
    }

    // Camera: start on the whole country, then ride along, then pull back at the end
    const intro = THREE.MathUtils.smoothstep(t, 0, 0.08);
    const outro = THREE.MathUtils.smoothstep(t, 0.93, 1);
    const near = new THREE.Vector3(pos.x + 2.6, pos.y + 5.2, pos.z + 6.2);
    const far = new THREE.Vector3(0.6, 15, 13);
    camTarget.copy(far).lerp(near, intro * (1 - outro));
    camera.position.lerp(camTarget, motion ? 1 - Math.pow(0.02, dt) : 1);
    look.set(0, 0, 0).lerp(pos, intro * (1 - outro));
    camera.lookAt(look);
  });

  return (
    <group>
      <mesh geometry={pending}>
        <meshBasicMaterial color={colors.pending} transparent opacity={0.25} />
      </mesh>
      <mesh ref={trail} geometry={geometry}>
        <meshStandardMaterial color={colors.route} emissive={colors.route} emissiveIntensity={0.9} toneMapped={false} />
      </mesh>
      <group ref={bus} scale={0.16}>
        <group position={[0, 0.98, 0]}>
          <Bus3D speed={motion ? 1 : 0} />
        </group>
      </group>
    </group>
  );
}

function Map({ progress, dark, onStop, active, motion, labels }) {
  const colors = dark ? COLORS.dark : COLORS.light;
  return (
    <>
      <color attach="background" args={[colors.bg]} />
      <hemisphereLight args={[dark ? "#8fa6d6" : "#fff2dc", dark ? "#2a2018" : "#b98a55", dark ? 1.1 : 1.1]} />
      <directionalLight position={[6, 12, 8]} intensity={dark ? 1.6 : 2} color={dark ? "#dfe7ff" : "#ffe6c4"} />
      <group>
        <Land colors={colors} />
        <Flat points={GULF_OF_SUEZ} color={colors.nile} y={0.06} opacity={0.85} />
        <Flat points={DELTA} color={colors.delta} y={TOP + 0.085} />
        <Flat points={LAKE_NASSER} color={colors.nile} y={TOP + 0.087} opacity={0.9} />
        <River points={NILE} colors={colors} />
        <River points={NILE_ROSETTA} colors={colors} radius={0.04} />
        <River points={NILE_DAMIETTA} colors={colors} radius={0.04} />
        <CityPins colors={colors} active={active} />
        <LabelProjector labels={labels} active={active} />
        <Journey progress={progress} colors={colors} onStop={onStop} motion={motion} />
      </group>
    </>
  );
}

export default function JourneyScene({ progress, dark, onStop, active, lang, motion, running, label }) {
  const canvasRef = useRef(null);
  const labels = useRef([]);
  useEffect(() => {
    canvasRef.current?.setAttribute("aria-label", label);
  }, [label]);
  return (
    <>
      <Canvas
        ref={canvasRef}
        role="img"
        className="journey-canvas"
        dpr={[1, 1.75]}
        camera={{ position: [0.6, 15, 13], fov: 40, near: 0.1, far: 120 }}
        frameloop={running ? "always" : "demand"}
      >
        <Map progress={progress} dark={dark} onStop={onStop} active={active} motion={motion} labels={labels} />
      </Canvas>
      <div className="map-labels" aria-hidden="true">
        {CITIES.map((city, i) => (
          <span key={city.id} ref={(el) => (labels.current[i] = el)} className={`map-label ${active === city.id ? "is-on" : ""}`}>
            {city.name[lang]}
          </span>
        ))}
      </div>
    </>
  );
}
