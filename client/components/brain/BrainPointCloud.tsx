"use client";

import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

const REGION_ORDER = [
  "prefrontal",
  "amygdala",
  "anterior_cingulate",
  "insula",
  "hippocampus",
] as const;

type RegionKey = (typeof REGION_ORDER)[number];

// Neon colors per region (CSS vars don't work in WebGL)
const REGION_COLORS: Record<RegionKey, string> = {
  prefrontal: "#68f0ff",
  amygdala: "#ff4fd8",
  anterior_cingulate: "#ff8a48",
  insula: "#aa8f2d",
  hippocampus: "#8a5bff",
};

const REGION_IDS: Record<RegionKey, number> = {
  prefrontal: 1,
  amygdala: 2,
  anterior_cingulate: 3,
  insula: 4,
  hippocampus: 5,
};

const REGION_RGB_BY_ID = new Map<number, [number, number, number]>(
  REGION_ORDER.map((region) => {
    const c = new THREE.Color(REGION_COLORS[region]);
    return [REGION_IDS[region], [c.r, c.g, c.b] as [number, number, number]];
  }),
);

// World-space sizes — each slice is ~0.016 units thick, so points must
// be large enough to overlap adjacent slices and form a solid cloud.
const BASE_SIZE = 0.011;
const ACTIVE_SIZE = 0.015;

function ellipsoidScore(
  nx: number,
  ny: number,
  nz: number,
  cx: number,
  cy: number,
  cz: number,
  rx: number,
  ry: number,
  rz: number,
) {
  const dx = (nx - cx) / rx;
  const dy = (ny - cy) / ry;
  const dz = (nz - cz) / rz;
  const d2 = dx * dx + dy * dy + dz * dz;
  if (d2 > 1) return 0;
  return 1 - d2;
}

function bilateralEllipsoidScore(
  nx: number,
  ny: number,
  nz: number,
  cxAbs: number,
  cy: number,
  cz: number,
  rx: number,
  ry: number,
  rz: number,
) {
  const left = ellipsoidScore(nx, ny, nz, -cxAbs, cy, cz, rx, ry, rz);
  const right = ellipsoidScore(nx, ny, nz, cxAbs, cy, cz, rx, ry, rz);
  return Math.max(left, right);
}

function classifyRegionByPoint(nx: number, ny: number, nz: number) {
  let bestRegionId = 0;
  let bestScore = 0;

  const prefrontal = ellipsoidScore(nx, ny, nz, 0, 0.34, -0.68, 0.62, 0.34, 0.3);
  if (prefrontal > bestScore) {
    bestScore = prefrontal;
    bestRegionId = REGION_IDS.prefrontal;
  }

  const amygdala = bilateralEllipsoidScore(nx, ny, nz, 0.2, -0.28, -0.16, 0.14, 0.12, 0.12);
  if (amygdala > bestScore) {
    bestScore = amygdala;
    bestRegionId = REGION_IDS.amygdala;
  }

  const anteriorCingulate = ellipsoidScore(nx, ny, nz, 0, 0.1, -0.12, 0.2, 0.22, 0.2);
  if (anteriorCingulate > bestScore) {
    bestScore = anteriorCingulate;
    bestRegionId = REGION_IDS.anterior_cingulate;
  }

  const insula = bilateralEllipsoidScore(nx, ny, nz, 0.42, -0.02, -0.06, 0.14, 0.22, 0.16);
  if (insula > bestScore) {
    bestScore = insula;
    bestRegionId = REGION_IDS.insula;
  }

  const hippocampus = bilateralEllipsoidScore(nx, ny, nz, 0.22, -0.32, 0.28, 0.2, 0.12, 0.2);
  if (hippocampus > bestScore) {
    bestScore = hippocampus;
    bestRegionId = REGION_IDS.hippocampus;
  }

  return bestRegionId;
}

function applyMaterialVisibility(mat: THREE.PointsMaterial, opacity: number) {
  mat.opacity = opacity;
  mat.transparent = opacity < 1;
  mat.depthWrite = true;
  mat.depthTest = true;
}

interface BrainPointCloudProps {
  activeRegion?: string;
  highlightAllRegions?: boolean;
}

export default function BrainPointCloud({
  activeRegion,
  highlightAllRegions = false,
}: BrainPointCloudProps) {
  const { scene } = useGLTF("/brain/scene.gltf");
  const groupRef = useRef<THREE.Group>(null);

  const pointSprite = useMemo(() => {
    const size = 64;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const gradient = ctx.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2,
    );
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.55, "rgba(255,255,255,0.95)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
  }, []);

  useEffect(() => {
    return () => {
      pointSprite?.dispose();
    };
  }, [pointSprite]);

  // Clone scene so we don't mutate the cached original
  const clonedScene = useMemo(() => scene.clone(true), [scene]);

  // Compute the model's bounding box center so we can offset it to the origin
  const centerOffset = useMemo(() => {
    clonedScene.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(clonedScene);
    const center = new THREE.Vector3();
    box.getCenter(center);
    return center;
  }, [clonedScene]);

  const modelSize = useMemo(() => {
    clonedScene.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(clonedScene);
    const size = new THREE.Vector3();
    box.getSize(size);
    return size;
  }, [clonedScene]);

  // Collect all Points objects in traversal order (matches mesh indices 0–18)
  const pointsList = useMemo(() => {
    const list: THREE.Points[] = [];
    clonedScene.traverse((child) => {
      if ((child as THREE.Points).isPoints) {
        list.push(child as THREE.Points);
      }
    });
    return list;
  }, [clonedScene]);

  // One-time: strip VEC4 colors → VEC3, compute spatial region masks, and assign material
  const regionDataByMesh = useMemo(() => {
    clonedScene.updateMatrixWorld(true);
    const halfX = modelSize.x > 0 ? modelSize.x / 2 : 1;
    const halfY = modelSize.y > 0 ? modelSize.y / 2 : 1;
    const halfZ = modelSize.z > 0 ? modelSize.z / 2 : 1;
    const worldPos = new THREE.Vector3();
    const regionData = new Map<
      string,
      { baseColors: Float32Array; regionMask: Uint8Array; count: number }
    >();

    pointsList.forEach((pts) => {
      const colorAttr = pts.geometry.getAttribute("color");
      if (colorAttr && colorAttr.itemSize === 4) {
        const src = colorAttr.array as Float32Array;
        const count = colorAttr.count;
        const rgb = new Float32Array(count * 3);
        for (let j = 0; j < count; j++) {
          rgb[j * 3] = src[j * 4];
          rgb[j * 3 + 1] = src[j * 4 + 1];
          rgb[j * 3 + 2] = src[j * 4 + 2];
        }
        pts.geometry.setAttribute("color", new THREE.BufferAttribute(rgb, 3));
      }

      const positionAttr = pts.geometry.getAttribute("position");
      const baseColorAttr = pts.geometry.getAttribute("color") as THREE.BufferAttribute;

      if (positionAttr && baseColorAttr && baseColorAttr.itemSize === 3) {
        const count = positionAttr.count;
        const baseColors = new Float32Array((baseColorAttr.array as Float32Array).slice(0));
        const regionMask = new Uint8Array(count);

        for (let i = 0; i < count; i++) {
          worldPos
            .set(
              positionAttr.getX(i),
              positionAttr.getY(i),
              positionAttr.getZ(i),
            )
            .applyMatrix4(pts.matrixWorld);

          const nx = (worldPos.x - centerOffset.x) / halfX;
          const ny = (worldPos.y - centerOffset.y) / halfY;
          const nz = (worldPos.z - centerOffset.z) / halfZ;
          regionMask[i] = classifyRegionByPoint(nx, ny, nz);
        }

        regionData.set(pts.uuid, { baseColors, regionMask, count });
      }

      pts.material = new THREE.PointsMaterial({
        size: BASE_SIZE,
        sizeAttenuation: true,
        map: pointSprite ?? null,
        alphaMap: pointSprite ?? null,
        transparent: true,
        alphaTest: 0.12,
        depthWrite: true,
        depthTest: true,
        vertexColors: true,
        opacity: 0.9,
      });
    });
    return regionData;
  }, [pointsList, pointSprite, clonedScene, centerOffset, modelSize]);

  // Update materials when active region changes
  useEffect(() => {
    const activeRegionId = activeRegion
      ? REGION_IDS[activeRegion as RegionKey] ?? 0
      : 0;
    const isAnyActive = activeRegion != null;

    pointsList.forEach((pts) => {
      const mat = pts.material as THREE.PointsMaterial;
      const data = regionDataByMesh.get(pts.uuid);
      const colorAttr = pts.geometry.getAttribute("color") as THREE.BufferAttribute;

      if (data && colorAttr && colorAttr.itemSize === 3) {
        const target = colorAttr.array as Float32Array;
        const { baseColors, regionMask, count } = data;

        if (!isAnyActive && !highlightAllRegions) {
          target.set(baseColors);
        } else {
          for (let j = 0; j < count; j++) {
            const idx = j * 3;
            const regionId = regionMask[j];
            const regionRGB = REGION_RGB_BY_ID.get(regionId);

            if (isAnyActive) {
              if (regionId === activeRegionId && regionRGB) {
                target[idx] = regionRGB[0];
                target[idx + 1] = regionRGB[1];
                target[idx + 2] = regionRGB[2];
              } else {
                target[idx] = baseColors[idx] * 0.7;
                target[idx + 1] = baseColors[idx + 1] * 0.7;
                target[idx + 2] = baseColors[idx + 2] * 0.7;
              }
            } else if (highlightAllRegions) {
              if (regionRGB) {
                target[idx] = regionRGB[0];
                target[idx + 1] = regionRGB[1];
                target[idx + 2] = regionRGB[2];
              } else {
                target[idx] = baseColors[idx] * 0.55;
                target[idx + 1] = baseColors[idx + 1] * 0.55;
                target[idx + 2] = baseColors[idx + 2] * 0.55;
              }
            }
          }
        }

        colorAttr.needsUpdate = true;
      }

      mat.vertexColors = true;
      mat.color.set(0xffffff);

      if (isAnyActive) {
        applyMaterialVisibility(mat, 0.95);
        mat.size = ACTIVE_SIZE;
      } else if (highlightAllRegions) {
        applyMaterialVisibility(mat, 0.9);
        mat.size = BASE_SIZE;
      } else {
        applyMaterialVisibility(mat, 0.9);
        mat.size = BASE_SIZE;
      }
      mat.needsUpdate = true;
    });
  }, [pointsList, activeRegion, highlightAllRegions, regionDataByMesh]);

  // Auto-rotate
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.15;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Offset the scene so its center sits at the group's origin (rotation pivot) */}
      <group position={[-centerOffset.x, -centerOffset.y, -centerOffset.z]}>
        <primitive object={clonedScene} />
      </group>
    </group>
  );
}

useGLTF.preload("/brain/scene.gltf");
