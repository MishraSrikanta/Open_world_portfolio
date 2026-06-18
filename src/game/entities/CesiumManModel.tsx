import * as THREE from "three";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import { clone as cloneSkeleton } from "three/examples/jsm/utils/SkeletonUtils.js";
import { AVATAR_HEIGHT } from "../constants";

const URL = "/models/CesiumMan.glb";

/** Flip if the model ends up facing away from its travel direction. */
const MODEL_YAW = 0;
/** Standing height the model is auto-scaled to (world units). */
const TARGET_HEIGHT = AVATAR_HEIGHT;

/**
 * The rigged CesiumMan glTF, used as the player avatar. It ships with a single
 * walk clip, so we drive that one action and modulate `timeScale` by movement
 * speed: a gentle shuffle when idle, a brisk stride when running, frozen in
 * the air. The mesh is auto-fitted to TARGET_HEIGHT with feet at y=0.
 */
export function CesiumManModel({
  state,
}: {
  state: { speed: number; airborne: boolean };
}) {
  const group = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(URL);

  // clone so the skinned mesh + skeleton are independent of the cache
  const model = useMemo(() => cloneSkeleton(scene), [scene]);
  const { actions, names } = useAnimations(animations, group);

  useLayoutEffect(() => {
    model.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        o.castShadow = true;
        o.frustumCulled = false; // skinned bounds can pop; keep it simple
      }
    });
    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    box.getSize(size);
    const h = size.y || 1;
    const s = TARGET_HEIGHT / h;
    if (inner.current) {
      inner.current.scale.setScalar(s);
      inner.current.position.y = -box.min.y * s;
      inner.current.rotation.y = MODEL_YAW;
    }
  }, [model]);

  useEffect(() => {
    const action = actions[names[0]];
    action?.reset().setLoop(THREE.LoopRepeat, Infinity).play();
  }, [actions, names]);

  useFrame(() => {
    const action = actions[names[0]];
    if (!action) return;
    if (state.airborne) {
      action.timeScale = 0;
    } else {
      // idle shuffle .. full stride
      action.timeScale = 0.25 + state.speed * 2.0;
    }
  });

  return (
    <group ref={group}>
      <group ref={inner}>
        <primitive object={model} />
      </group>
    </group>
  );
}

useGLTF.preload(URL);
