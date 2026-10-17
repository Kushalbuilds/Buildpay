import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html, OrbitControls, Sky, Stars } from '@react-three/drei';
import App from './App.jsx';

function RotatingBox() {
  const meshRef = useRef();
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.005;
      meshRef.current.rotation.y += 0.01;
    }
  });
  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#ff6600" />
    </mesh>
  );
}

export default function ThreeRoot() {
  return (
    <Canvas shadows camera={{ position: [0, 2, 5], fov: 60 }} style={{ width: '100vw', height: '100vh' }}>
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 10, 5]} intensity={1} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
      {/* Background */}
      <Sky sunPosition={[100, 20, 100]} />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade />
      {/* Simple 3D element */}
      <RotatingBox />
      {/* UI Panel – embed the existing React UI as HTML inside the 3D scene */}
      <Html position={[0, 1.5, 0]} transform occlude style={{ width: '1200px', backdropFilter: 'blur(12px) saturate(150%)', background: 'rgba(10,10,10,0.55)', borderRadius: '12px', padding: '24px' }}>
        <App />
      </Html>
      {/* Allow user to rotate view */}
      <OrbitControls enableZoom={false} />
    </Canvas>
  );
}
