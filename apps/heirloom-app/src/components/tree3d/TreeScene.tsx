import {
  CubicBezierLine,
  Environment,
  Lightformer,
  Line,
  OrbitControls,
  RoundedBox,
  Sparkles,
  Text,
} from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { useMemo, useRef, useState } from 'react';
import type { Group, Mesh } from 'three';
import type { PersonNode, TreeLayout, TreePerson } from './layout';

// Subdued heritage palette — accents only, cards stay dark ink
const SEX_ACCENTS: Record<TreePerson['sex'], string> = {
  MALE: '#5f8a8f',
  FEMALE: '#c08552',
  OTHER: '#8a7aa8',
  UNKNOWN: '#7a736b',
};

const CARD = { width: 2.5, height: 1.02, depth: 0.1 };

function displayName(person: TreePerson): string {
  return (
    [person.firstName, person.lastName].filter(Boolean).join(' ') || '(?)'
  );
}

function PersonCard({
  node,
  selected,
  onSelect,
}: {
  node: PersonNode;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const group = useRef<Group>(null);
  const phase = useMemo(() => Math.random() * Math.PI * 2, []);

  useFrame(({ clock }) => {
    if (!group.current) return;
    group.current.position.y =
      node.position[1] + Math.sin(clock.elapsedTime * 0.45 + phase) * 0.05;
    const target = selected ? 1.1 : hovered ? 1.045 : 1;
    group.current.scale.lerp(
      { x: target, y: target, z: target } as never,
      0.12,
    );
  });

  return (
    <group
      ref={group}
      position={node.position}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(node.person.id);
      }}
      onPointerOver={(event) => {
        event.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'auto';
      }}
    >
      {/* Thin brass frame behind the card */}
      <RoundedBox
        args={[CARD.width + 0.1, CARD.height + 0.1, CARD.depth - 0.04]}
        radius={0.09}
        smoothness={4}
        position={[0, 0, -0.02]}
      >
        <meshPhysicalMaterial
          color={selected ? '#d4a24c' : '#8a6a35'}
          roughness={0.35}
          metalness={0.85}
          emissive={selected ? '#b8860b' : '#000000'}
          emissiveIntensity={selected ? 0.25 : 0}
        />
      </RoundedBox>

      {/* Ink card */}
      <RoundedBox
        args={[CARD.width, CARD.height, CARD.depth]}
        radius={0.07}
        smoothness={4}
      >
        <meshPhysicalMaterial
          color={hovered || selected ? '#312a22' : '#26211b'}
          roughness={0.62}
          metalness={0.06}
          clearcoat={0.45}
          clearcoatRoughness={0.35}
        />
      </RoundedBox>

      {/* Sex accent: slim bar on the left edge */}
      <mesh position={[-CARD.width / 2 + 0.11, 0, CARD.depth / 2 + 0.001]}>
        <planeGeometry args={[0.055, CARD.height - 0.3]} />
        <meshBasicMaterial
          color={SEX_ACCENTS[node.person.sex]}
          transparent
          opacity={0.95}
        />
      </mesh>

      <Text
        position={[0.06, 0, CARD.depth / 2 + 0.012]}
        fontSize={0.21}
        maxWidth={2.05}
        textAlign="center"
        color="#ece2d0"
        letterSpacing={0.015}
        lineHeight={1.15}
      >
        {displayName(node.person)}
      </Text>
    </group>
  );
}

function UnionRing({ position }: { position: [number, number, number] }) {
  const ref = useRef<Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.x = Math.PI / 2 + Math.sin(clock.elapsedTime * 0.4) * 0.18;
    ref.current.rotation.z = clock.elapsedTime * 0.25;
  });
  return (
    <mesh ref={ref} position={position}>
      <torusGeometry args={[0.14, 0.035, 24, 48]} />
      <meshPhysicalMaterial
        color="#c9982f"
        roughness={0.28}
        metalness={0.9}
        emissive="#7a5a10"
        emissiveIntensity={0.18}
      />
    </mesh>
  );
}

export function TreeScene({
  layout,
  selectedId,
  onSelect,
}: {
  layout: TreeLayout;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const positionOf = useMemo(
    () =>
      new Map(layout.nodes.map((node) => [node.person.id, node.position])),
    [layout],
  );

  const cameraZ = Math.max(9, layout.bounds.width * 0.8, layout.bounds.height);

  return (
    <Canvas
      camera={{ position: [0, 0.6, cameraZ], fov: 42 }}
      onPointerMissed={() => onSelect(null)}
      dpr={[1, 2]}
    >
      <color attach="background" args={['#151009']} />
      <fog attach="fog" args={['#151009', cameraZ * 1.1, cameraZ * 3]} />

      {/* Procedural warm studio ambiance (no network fetch) */}
      <Environment resolution={128}>
        <Lightformer
          position={[0, 6, -8]}
          scale={[14, 6, 1]}
          intensity={1.6}
          color="#f5e0b8"
        />
        <Lightformer
          position={[-8, -2, 4]}
          scale={[5, 5, 1]}
          intensity={0.7}
          color="#c9762c"
        />
        <Lightformer
          position={[9, 3, 2]}
          scale={[4, 8, 1]}
          intensity={0.55}
          color="#fff6e5"
        />
      </Environment>

      <ambientLight intensity={0.25} color="#f5e6c8" />
      <directionalLight position={[5, 9, 7]} intensity={0.9} color="#ffedd0" />

      <Sparkles
        count={70}
        scale={[layout.bounds.width + 7, layout.bounds.height + 5, 7]}
        size={1.3}
        speed={0.16}
        opacity={0.3}
        color="#e8c56f"
      />

      {layout.unions.map(({ union, position }) => (
        <group key={union.id}>
          {union.partnerIds.map((partnerId) => {
            const partner = positionOf.get(partnerId);
            return partner ? (
              <Line
                key={partnerId}
                points={[partner, position]}
                color="#a97f2e"
                lineWidth={1.1}
                transparent
                opacity={0.55}
              />
            ) : null;
          })}
          {union.childIds.map((childId) => {
            const child = positionOf.get(childId);
            if (!child) return null;
            return (
              <CubicBezierLine
                key={childId}
                start={position}
                midA={[position[0], position[1] - 1.1, position[2]]}
                midB={[child[0], child[1] + 1.2, child[2]]}
                end={[child[0], child[1] + CARD.height / 2 + 0.07, child[2]]}
                color="#6f6659"
                lineWidth={1}
                transparent
                opacity={0.5}
              />
            );
          })}
          <UnionRing position={position} />
        </group>
      ))}

      {layout.nodes.map((node) => (
        <PersonCard
          key={node.person.id}
          node={node}
          selected={node.person.id === selectedId}
          onSelect={onSelect}
        />
      ))}

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        minDistance={4}
        maxDistance={cameraZ * 2.2}
        maxPolarAngle={Math.PI * 0.72}
        minPolarAngle={Math.PI * 0.22}
      />
    </Canvas>
  );
}
