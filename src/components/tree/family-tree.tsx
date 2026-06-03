"use client";

import { useCallback, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  type Node,
  type Edge,
  type Connection,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { PersonNode } from "./person-node";

interface PersonData extends Record<string, unknown> {
  id: string;
  fullName: string;
  gender: "MALE" | "FEMALE";
  isLiving: boolean;
  birthDate: string | null;
  deathDate: string | null;
}

interface Relation {
  parentId: string;
  childId: string;
}

interface Props {
  persons: PersonData[];
  relations: Relation[];
}

const nodeTypes = { person: PersonNode };

function buildLayout(persons: PersonData[], relations: Relation[]) {
  // Build adjacency map for tree layout
  const childrenMap = new Map<string, string[]>();
  const parentMap = new Map<string, string[]>();

  persons.forEach((p) => {
    childrenMap.set(p.id, []);
    parentMap.set(p.id, []);
  });

  relations.forEach(({ parentId, childId }) => {
    childrenMap.get(parentId)?.push(childId);
    parentMap.get(childId)?.push(parentId);
  });

  // Find roots (persons with no parents in relations)
  const roots = persons.filter((p) => (parentMap.get(p.id)?.length ?? 0) === 0);

  const positions = new Map<string, { x: number; y: number }>();
  const NODE_W = 160;
  const NODE_H = 80;
  const GAP_X = 40;
  const GAP_Y = 120;

  let globalX = 0;

  function layoutSubtree(id: string, depth: number): number {
    const children = childrenMap.get(id) ?? [];
    if (children.length === 0) {
      positions.set(id, { x: globalX * (NODE_W + GAP_X), y: depth * (NODE_H + GAP_Y) });
      globalX++;
      return positions.get(id)!.x;
    }
    const childXs = children.map((c) => layoutSubtree(c, depth + 1));
    const centerX = (childXs[0] + childXs[childXs.length - 1]) / 2;
    positions.set(id, { x: centerX, y: depth * (NODE_H + GAP_Y) });
    return centerX;
  }

  roots.forEach((r) => layoutSubtree(r.id, 0));

  // Persons not yet positioned
  persons.forEach((p) => {
    if (!positions.has(p.id)) {
      positions.set(p.id, { x: globalX * (NODE_W + GAP_X), y: 0 });
      globalX++;
    }
  });

  return positions;
}

export function FamilyTree({ persons, relations }: Props) {
  const positions = useMemo(() => buildLayout(persons, relations), [persons, relations]);

  const initialNodes: Node[] = useMemo(
    () =>
      persons.map((p) => ({
        id: p.id,
        type: "person",
        position: positions.get(p.id) ?? { x: 0, y: 0 },
        data: p,
      })),
    [persons, positions]
  );

  const initialEdges: Edge[] = useMemo(
    () =>
      relations.map(({ parentId, childId }, i) => ({
        id: `e-${i}`,
        source: parentId,
        target: childId,
        type: "smoothstep",
        style: { stroke: "hsl(145 35% 32%)", strokeWidth: 1.5, opacity: 0.7 },
      })),
    [relations]
  );

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const onConnect = useCallback((c: Connection) => setEdges((e) => addEdge(c, e)), [setEdges]);

  return (
    <div className="w-full h-full min-h-[500px]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="hsl(150 12% 22%)"
        />
        <Controls
          className="!bg-card/80 !border-border/60 !rounded-lg"
          showInteractive={false}
        />
        <MiniMap
          className="!bg-card/80 !border-border/60 !rounded-lg"
          nodeColor={(n) => {
            const d = n.data as PersonData;
            return d?.gender === "MALE" ? "hsl(145 35% 32%)" : "hsl(42 55% 52%)";
          }}
          maskColor="hsl(160 20% 8% / 0.6)"
        />
      </ReactFlow>
    </div>
  );
}
