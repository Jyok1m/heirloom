import {
  Line,
  OrbitControls,
  QuadraticBezierLine,
  RoundedBox,
  Sparkles,
  Text,
} from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { useMemo, useRef, useState } from 'react';
import type { Group } from 'three';
import type { PersonNode, TreeLayout, TreePerson } from './layout';

const SEX_COLORS: Record<TreePerson['sex'], string> = {
  MALE: '#2d6a6f',
  FEMALE: '#b45309',
  OTHER: '#6d5aa8',
  UNKNOWN: '#57534e',
};

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
  const scale = selected ? 1.14 : hovered ? 1.07 : 1;

  // Gentle idle float, phase-shifted per node
  const phase = useMemo(() => Math.random() * Math.PI * 2, []);
  useFrame(({ clock }) => {
    if (group.current) {
      group.current.position.y =
        node.position[1] + Math.sin(clock.elapsedTime * 0.6 + phase) * 0.07;
    }
  });

  return (
    <group
      ref={group}
      position={node.position}
      scale={scale}
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
      <RoundedBox args={[2.5, 1.05, 0.22]} radius={0.12} smoothness={4}>
        <meshStandardMaterial
          color={SEX_COLORS[node.person.sex]}
          roughness={0.35}
          metalness={0.25}
          emissive={selected ? '#f59e0b' : hovered ? '#78350f' : '#000000'}
          emissiveIntensity={selected ? 0.35 : hovered ? 0.25 : 0}
        />
      </RoundedBox>
      {selected && (
        <RoundedBox args={[2.66, 1.21, 0.16]} radius={0.14} smoothness={4}>
          <meshBasicMaterial color="#fbbf24" wireframe transparent opacity={0.55} />
        </RoundedBox>
      )}
      <Text
        position={[0, 0.08, 0.13]}
        fontSize={0.24}
        maxWidth={2.2}
        textAlign="center"
        color="#fefce8"
        outlineWidth={0.008}
        outlineColor="#00000055"
      >
        {displayName(node.person)}
      </Text>
      <Text
        position={[0, -0.28, 0.13]}
        fontSize={0.13}
        color="#fde68a"
        fillOpacity={0.75}
      >
        {node.person.sex === 'MALE'
          ? '♂'
          : node.person.sex === 'FEMALE'
            ? '♀'
            : '·'}
      </Text>
    </group>
  );
}

function UnionKnot({ position }: { position: [number, number, number] }) {
  const ref = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = clock.elapsedTime * 0.6;
  });
  return (
    <group ref={ref} position={position}>
      <mesh>
        <icosahedronGeometry args={[0.17, 0]} />
        <meshStandardMaterial
          color="#f59e0b"
          roughness={0.2}
          metalness={0.7}
          emissive="#b45309"
          emissiveIntensity={0.4}
        />
      </mesh>
    </group>
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

  const cameraZ = Math.max(9, layout.bounds.width * 0.85, layout.bounds.height);

  return (
    <Canvas
      camera={{ position: [0, 1.2, cameraZ], fov: 46 }}
      onPointerMissed={() => onSelect(null)}
      dpr={[1, 2]}
    >
      <color attach="background" args={['#191410']} />
      <fog attach="fog" args={['#191410', cameraZ, cameraZ * 2.6]} />

      <hemisphereLight args={['#fde68a', '#292018', 0.5]} />
      <directionalLight position={[6, 10, 8]} intensity={1.4} color="#fff7ed" />
      <pointLight position={[-8, -4, 6]} intensity={40} color="#f59e0b" />

      <Sparkles
        count={140}
        scale={[layout.bounds.width + 8, layout.bounds.height + 6, 8]}
        size={2.2}
        speed={0.25}
        opacity={0.5}
        color="#fcd34d"
      />

      {layout.unions.map(({ union, position }) => (
        <group key={union.id}>
          {union.partnerIds.map((partnerId) => {
            const partner = positionOf.get(partnerId);
            return partner ? (
              <Line
                key={partnerId}
                points={[partner, position]}
                color="#d97706"
                lineWidth={1.6}
                transparent
                opacity={0.8}
              />
            ) : null;
          })}
          {union.childIds.map((childId) => {
            const child = positionOf.get(childId);
            if (!child) return null;
            const mid: [number, number, number] = [
              (position[0] + child[0]) / 2,
              (position[1] + child[1]) / 2 - 0.7,
              (position[2] + child[2]) / 2,
            ];
            return (
              <QuadraticBezierLine
                key={childId}
                start={position}
                end={[child[0], child[1] + 0.62, child[2]]}
                mid={mid}
                color="#a8a29e"
                lineWidth={1.2}
                transparent
                opacity={0.65}
                dashed
                dashScale={6}
              />
            );
          })}
          <UnionKnot position={position} />
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
      />
    </Canvas>
  );
}
