/**
 * CameraDirector.jsx
 * Nova City — Cinematic Keyframe Camera Controller
 *
 * A drop-in React Three Fiber component that drives the scene camera
 * along a sequence of keyframes with smooth spline interpolation,
 * per-segment easing, FOV animation, optional camera shake, and
 * event callbacks.
 *
 * Architecture:
 *   - Catmull-Rom spline interpolation for both position and lookAt
 *     paths — gives smooth, acceleration-continuous fly-throughs with
 *     no sharp corners.
 *   - Linear interpolation mode available for hard cuts / 2-point moves.
 *   - 18 built-in easing functions covering every common curve.
 *   - Per-keyframe `ease` override — mix curves within a single flight.
 *   - A single useFrame does all work; scratch THREE vectors are reused
 *     across frames — zero per-frame allocations.
 *   - No OrbitControls, no pointer interaction — pure cinematic.
 *
 * Usage:
 *
 *   const KEYFRAMES = [
 *     { time: 0,  pos: [0, 120, 60],  lookAt: [0, 36, 0], fov: 55 },
 *     { time: 4,  pos: [20, 80, 100], lookAt: [0, 30, 0], fov: 50, ease: 'easeInOutCubic' },
 *     { time: 9,  pos: [30, 22, 160], lookAt: [0, 26, 0], fov: 44, ease: 'easeOutExpo' },
 *   ]
 *
 *   <CameraDirector
 *     keyframes={KEYFRAMES}
 *     playing
 *     onComplete={() => console.log('done')}
 *     onKeyframe={(i) => console.log(`reached keyframe ${i}`)}
 *   />
 */

import { useRef, useEffect, useCallback, useMemo, memo } from 'react'
import { useFrame, useThree }                             from '@react-three/fiber'
import * as THREE                                         from 'three'

// ─── Easing library ───────────────────────────────────────────────────────────

const PI      = Math.PI
const sin     = Math.sin
const cos     = Math.cos
const pow     = Math.pow
const sqrt    = Math.sqrt
const abs     = Math.abs

const EASINGS = Object.freeze({
  linear:            (t) => t,

  // Quad
  easeInQuad:        (t) => t * t,
  easeOutQuad:       (t) => t * (2 - t),
  easeInOutQuad:     (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,

  // Cubic
  easeInCubic:       (t) => t * t * t,
  easeOutCubic:      (t) => (--t) * t * t + 1,
  easeInOutCubic:    (t) => t < 0.5 ? 4 * t * t * t : 1 - pow(-2 * t + 2, 3) / 2,

  // Quart
  easeInQuart:       (t) => t * t * t * t,
  easeOutQuart:      (t) => 1 - pow(1 - t, 4),
  easeInOutQuart:    (t) => t < 0.5 ? 8 * t * t * t * t : 1 - pow(-2 * t + 2, 4) / 2,

  // Quint
  easeInQuint:       (t) => t * t * t * t * t,
  easeOutQuint:      (t) => 1 - pow(1 - t, 5),
  easeInOutQuint:    (t) => t < 0.5 ? 16 * t * t * t * t * t : 1 - pow(-2 * t + 2, 5) / 2,

  // Expo
  easeInExpo:        (t) => t === 0 ? 0 : pow(2, 10 * t - 10),
  easeOutExpo:       (t) => t >= 1 ? 1 : 1 - pow(2, -10 * t),
  easeInOutExpo:     (t) => {
    if (t === 0 || t >= 1) return t >= 1 ? 1 : 0
    return t < 0.5 ? pow(2, 20 * t - 10) / 2 : (2 - pow(2, -20 * t + 10)) / 2
  },

  // Sine
  easeInSine:        (t) => 1 - cos(t * PI / 2),
  easeOutSine:       (t) => sin(t * PI / 2),
  easeInOutSine:     (t) => -(cos(PI * t) - 1) / 2,

  // Circ
  easeInCirc:        (t) => 1 - sqrt(1 - t * t),
  easeOutCirc:       (t) => sqrt(1 - pow(t - 1, 2)),
  easeInOutCirc:     (t) => t < 0.5
    ? (1 - sqrt(1 - pow(2 * t, 2))) / 2
    : (sqrt(1 - pow(-2 * t + 2, 2)) + 1) / 2,

  // Back (overshoot)
  easeInBack:        (t) => { const c = 1.70158; return (c + 1) * t * t * t - c * t * t },
  easeOutBack:       (t) => { const c = 1.70158; return 1 + (c + 1) * pow(t - 1, 3) + c * pow(t - 1, 2) },
  easeInOutBack:     (t) => {
    const c = 1.70158 * 1.525
    return t < 0.5
      ? (pow(2 * t, 2) * ((c + 1) * 2 * t - c)) / 2
      : (pow(2 * t - 2, 2) * ((c + 1) * (t * 2 - 2) + c) + 2) / 2
  },

  // Elastic
  easeOutElastic:    (t) => {
    if (t === 0 || t >= 1) return t >= 1 ? 1 : 0
    return pow(2, -10 * t) * sin((t * 10 - 0.75) * (2 * PI) / 3) + 1
  },

  // Cinematic — custom S-curve with late ease-out (camera-friendly)
  cinematic:         (t) => {
    const t2 = t * t
    return t2 / (2 * (t2 - t) + 1)
  },
})

function getEasing(name) {
  return EASINGS[name] || EASINGS.easeInOutCubic
}

// ─── Catmull-Rom spline evaluation ────────────────────────────────────────────

/**
 * Evaluate a Catmull-Rom spline at parameter t ∈ [0,1] between p1 and p2,
 * with neighbouring control points p0 and p3.
 * Tension α defaults to 0.5 (centripetal).
 */
function catmullRom(out, p0, p1, p2, p3, t, alpha = 0.5) {
  const t2 = t * t
  const t3 = t2 * t

  // Standard Catmull-Rom basis matrix coefficients
  const a0x = -alpha * p0.x + (2 - alpha) * p1.x + (alpha - 2) * p2.x + alpha * p3.x
  const a0y = -alpha * p0.y + (2 - alpha) * p1.y + (alpha - 2) * p2.y + alpha * p3.y
  const a0z = -alpha * p0.z + (2 - alpha) * p1.z + (alpha - 2) * p2.z + alpha * p3.z

  const a1x = 2 * alpha * p0.x + (alpha - 3) * p1.x + (3 - 2 * alpha) * p2.x - alpha * p3.x
  const a1y = 2 * alpha * p0.y + (alpha - 3) * p1.y + (3 - 2 * alpha) * p2.y - alpha * p3.y
  const a1z = 2 * alpha * p0.z + (alpha - 3) * p1.z + (3 - 2 * alpha) * p2.z - alpha * p3.z

  const a2x = -alpha * p0.x + alpha * p2.x
  const a2y = -alpha * p0.y + alpha * p2.y
  const a2z = -alpha * p0.z + alpha * p2.z

  out.x = a0x * t3 + a1x * t2 + a2x * t + p1.x
  out.y = a0y * t3 + a1y * t2 + a2y * t + p1.y
  out.z = a0z * t3 + a1z * t2 + a2z * t + p1.z

  return out
}

// ─── Scratch vectors (reused every frame — zero allocations) ──────────────────

const _pos    = new THREE.Vector3()
const _look   = new THREE.Vector3()
const _p0     = new THREE.Vector3()
const _p1     = new THREE.Vector3()
const _p2     = new THREE.Vector3()
const _p3     = new THREE.Vector3()

// ─── Keyframe normaliser ──────────────────────────────────────────────────────

/**
 * Validate and freeze keyframes into a canonical internal format.
 *
 * Each keyframe:
 *   { time, pos: Vec3, lookAt: Vec3, fov, ease: fn, shake }
 */
function normaliseKeyframes(raw) {
  if (!raw || raw.length < 2) {
    console.warn('[CameraDirector] Need at least 2 keyframes.')
    return []
  }

  // Sort by time ascending (defensive — caller should already order them)
  const sorted = [...raw].sort((a, b) => a.time - b.time)

  return sorted.map((kf) => ({
    time:   kf.time ?? 0,
    pos:    new THREE.Vector3(...(kf.pos    || [0, 0, 0])),
    lookAt: new THREE.Vector3(...(kf.lookAt || [0, 0, 0])),
    fov:    kf.fov   ?? null,        // null = don't animate FOV
    ease:   getEasing(kf.ease),
    shake:  kf.shake ?? 0,           // amplitude in world units
  }))
}

// ─── Linear interpolation helper ──────────────────────────────────────────────

const lerp = THREE.MathUtils.lerp

function lerpVec3(out, a, b, t) {
  out.x = a.x + (b.x - a.x) * t
  out.y = a.y + (b.y - a.y) * t
  out.z = a.z + (b.z - a.z) * t
  return out
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * CameraDirector
 *
 * Props:
 *   keyframes     {Array}     Required.  Array of keyframe objects (see top-of-file).
 *   playing       {boolean}   Start / pause playback.  Default true.
 *   loop          {boolean}   Loop back to first keyframe on complete.  Default false.
 *   interpolation {string}    'catmullrom' | 'linear'.  Default 'catmullrom'.
 *   speed         {number}    Playback speed multiplier.  Default 1.
 *   tension       {number}    Catmull-Rom tension (0.0–1.0).  Default 0.5.
 *   onComplete    {function}  Fired when the last keyframe is reached (or each loop).
 *   onKeyframe    {function}  Fired with (index) when a keyframe boundary is crossed.
 *   onProgress    {function}  Fired every frame with (globalT ∈ [0,1], elapsed, segIdx).
 *   startTime     {number}    Initial elapsed time offset (for resuming).  Default 0.
 */
export const CameraDirector = memo(function CameraDirector({
  keyframes:     rawKeyframes,
  playing        = true,
  loop           = false,
  interpolation  = 'catmullrom',
  speed          = 1,
  tension        = 0.5,
  onComplete,
  onKeyframe,
  onProgress,
  startTime      = 0,
}) {
  const { camera }        = useThree()
  const elapsedRef        = useRef(startTime)
  const lastSegRef        = useRef(-1)
  const completedRef      = useRef(false)
  const playingRef        = useRef(playing)
  const speedRef          = useRef(speed)
  const loopRef           = useRef(loop)

  // Sync prop refs (avoids re-creating useFrame closure)
  useEffect(() => { playingRef.current  = playing }, [playing])
  useEffect(() => { speedRef.current    = speed },   [speed])
  useEffect(() => { loopRef.current     = loop },    [loop])

  // Normalise keyframes — frozen Vector3s, resolved ease functions
  const kfs = useMemo(
    () => normaliseKeyframes(rawKeyframes),
    [rawKeyframes]
  )

  const totalDuration = useMemo(
    () => (kfs.length > 0 ? kfs[kfs.length - 1].time - kfs[0].time : 1),
    [kfs]
  )

  // Reset on keyframe array change
  useEffect(() => {
    elapsedRef.current   = startTime
    lastSegRef.current   = -1
    completedRef.current = false
  }, [kfs, startTime])

  // ── The single useFrame — all camera work happens here ─────────────────

  useFrame((state, delta) => {
    if (kfs.length < 2) return
    if (!playingRef.current && !completedRef.current) return

    // ── Advance time ─────────────────────────────────────────────────────
    if (playingRef.current) {
      elapsedRef.current += delta * speedRef.current
    }

    const startT = kfs[0].time
    const endT   = kfs[kfs.length - 1].time
    let   t      = elapsedRef.current

    // ── Loop / clamp ─────────────────────────────────────────────────────
    if (t >= endT) {
      if (loopRef.current) {
        t = startT + ((t - startT) % totalDuration)
        elapsedRef.current  = t
        lastSegRef.current  = -1
        completedRef.current = false
      } else {
        t = endT
        if (!completedRef.current) {
          completedRef.current = true
          onComplete?.()
        }
      }
    }

    // ── Find active segment [i, i+1] ─────────────────────────────────────
    let segIdx = 0
    for (let i = 0; i < kfs.length - 1; i++) {
      if (t >= kfs[i].time) segIdx = i
    }

    // ── Fire onKeyframe callback on boundary crossing ────────────────────
    if (segIdx !== lastSegRef.current) {
      lastSegRef.current = segIdx
      onKeyframe?.(segIdx)
    }

    // ── Segment-local t ∈ [0, 1] ─────────────────────────────────────────
    const kfA      = kfs[segIdx]
    const kfB      = kfs[Math.min(segIdx + 1, kfs.length - 1)]
    const segDur   = kfB.time - kfA.time
    const localRaw = segDur > 0 ? (t - kfA.time) / segDur : 1
    const localT   = Math.max(0, Math.min(1, localRaw))

    // Apply the *destination* keyframe's easing to the segment
    const eased = kfB.ease(localT)

    // ── Interpolate position ─────────────────────────────────────────────
    if (interpolation === 'catmullrom' && kfs.length >= 3) {
      // Catmull-Rom needs 4 control points: p0, p1 (from), p2 (to), p3
      const i0 = Math.max(0, segIdx - 1)
      const i1 = segIdx
      const i2 = Math.min(segIdx + 1, kfs.length - 1)
      const i3 = Math.min(segIdx + 2, kfs.length - 1)

      _p0.copy(kfs[i0].pos)
      _p1.copy(kfs[i1].pos)
      _p2.copy(kfs[i2].pos)
      _p3.copy(kfs[i3].pos)
      catmullRom(_pos, _p0, _p1, _p2, _p3, eased, tension)

      _p0.copy(kfs[i0].lookAt)
      _p1.copy(kfs[i1].lookAt)
      _p2.copy(kfs[i2].lookAt)
      _p3.copy(kfs[i3].lookAt)
      catmullRom(_look, _p0, _p1, _p2, _p3, eased, tension)
    } else {
      // Linear fallback (or exactly 2 keyframes)
      lerpVec3(_pos,  kfA.pos,    kfB.pos,    eased)
      lerpVec3(_look, kfA.lookAt, kfB.lookAt, eased)
    }

    // ── Camera shake ─────────────────────────────────────────────────────
    //    Blend shake amplitude between the two keyframes.
    const shakeAmp = lerp(kfA.shake, kfB.shake, eased)
    if (shakeAmp > 0.001) {
      const elapsed = state.clock.getElapsedTime()
      _pos.x += sin(elapsed * 13.1) * shakeAmp
      _pos.y += sin(elapsed *  9.7) * shakeAmp * 0.4
      _pos.z += cos(elapsed * 11.3) * shakeAmp
    }

    // ── Apply position + lookAt ──────────────────────────────────────────
    camera.position.copy(_pos)
    camera.lookAt(_look)

    // ── FOV animation ────────────────────────────────────────────────────
    const fovA = kfA.fov
    const fovB = kfB.fov
    if (fovA != null && fovB != null) {
      const fov = lerp(fovA, fovB, eased)
      if (abs(camera.fov - fov) > 0.01) {
        camera.fov = fov
        camera.updateProjectionMatrix()
      }
    } else if (fovB != null) {
      // Only destination has FOV — snap toward it in the last half
      const snapT = Math.max(0, (eased - 0.5) * 2)
      const fov   = lerp(camera.fov, fovB, snapT)
      if (abs(camera.fov - fov) > 0.01) {
        camera.fov = fov
        camera.updateProjectionMatrix()
      }
    }

    // ── Progress callback ────────────────────────────────────────────────
    if (onProgress) {
      const globalT = totalDuration > 0
        ? (t - startT) / totalDuration
        : 1
      onProgress(Math.max(0, Math.min(1, globalT)), t, segIdx)
    }
  })

  return null
})

export default CameraDirector
