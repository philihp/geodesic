'use client'

import React from 'react'
import { filter, flatten, identity, map, pipe, reduce, sort } from 'ramda'
import styles from './page.module.css'

type point = [x: number, y: number, z: number]

const sin = (rad: number) => Math.sin(rad)
const cos = (rad: number) => Math.cos(rad)

const pi = Math.PI
// const phi = (1 + Math.sqrt(5)) / 2

const sqrt5 = Math.sqrt(5)

const rotZ = 0
const rotY = 0
const rotX = 0

const deg2rad = (deg: number): number => (2 * pi * deg) / 360

const gamma = deg2rad(rotZ)
const beta = deg2rad(rotY)
const alpha = deg2rad(rotX)

const rm = [
  [
    cos(beta) * cos(gamma),
    sin(alpha) * sin(beta) * cos(gamma) - cos(alpha) * sin(gamma),
    cos(alpha) * sin(beta) * cos(gamma) + sin(alpha) * sin(gamma),
  ],
  [
    cos(beta) * sin(gamma),
    sin(alpha) * sin(beta) * sin(gamma) + cos(alpha) * cos(gamma),
    cos(alpha) * sin(beta) * sin(gamma) - sin(alpha) * cos(gamma),
  ],
  [-sin(beta), sin(alpha) * cos(beta), cos(alpha) * cos(beta)],
]

const rot = ([x, y, z]: point): point => [
  x * rm[0][0] + y * rm[1][0] + z * rm[2][0],
  x * rm[0][1] + y * rm[1][1] + z * rm[2][1],
  x * rm[0][2] + y * rm[1][2] + z * rm[2][2],
]

const n: point[] = [
  //
  [-1, 0, 0],
  [1, 0, 0],
  [-1 / sqrt5, -2 / sqrt5, 0],
  [1 / sqrt5, 2 / sqrt5, 0],

  [-1 / sqrt5, -(1 - 1 / sqrt5) / 2, -Math.sqrt((1 + 1 / sqrt5) / 2)],
  [1 / sqrt5, (1 - 1 / sqrt5) / 2, Math.sqrt((1 + 1 / sqrt5) / 2)],
  [-1 / sqrt5, -(1 - 1 / sqrt5) / 2, Math.sqrt((1 + 1 / sqrt5) / 2)],
  [1 / sqrt5, (1 - 1 / sqrt5) / 2, -Math.sqrt((1 + 1 / sqrt5) / 2)],

  [-1 / sqrt5, -(-1 - 1 / sqrt5) / 2, Math.sqrt((1 - 1 / sqrt5) / 2)],
  [1 / sqrt5, (-1 - 1 / sqrt5) / 2, -Math.sqrt((1 - 1 / sqrt5) / 2)],
  [-1 / sqrt5, -(-1 - 1 / sqrt5) / 2, -Math.sqrt((1 - 1 / sqrt5) / 2)],
  [1 / sqrt5, (-1 - 1 / sqrt5) / 2, Math.sqrt((1 - 1 / sqrt5) / 2)],
]

const f: [point, point, point][] = [
  [n[1], n[3], n[5]],
  [n[1], n[5], n[11]],
  [n[1], n[11], n[9]],
  [n[1], n[9], n[7]],
  [n[1], n[7], n[3]],
  [n[3], n[5], n[8]],
  [n[5], n[11], n[6]],
  [n[11], n[9], n[2]],
  [n[9], n[7], n[4]],
  [n[7], n[3], n[10]],
  [n[6], n[8], n[5]],
  [n[8], n[10], n[3]],
  [n[10], n[4], n[7]],
  [n[4], n[2], n[9]],
  [n[2], n[6], n[11]],
  [n[0], n[6], n[8]],
  [n[0], n[8], n[10]],
  [n[0], n[10], n[4]],
  [n[0], n[4], n[2]],
  [n[0], n[2], n[6]],
]

const midpoint = ([az, ay, ax]: point, [bz, by, bx]: point): point => {
  const cz = (az + bz) / 2
  const cy = (ay + by) / 2
  const cx = (ax + bx) / 2
  const dist = Math.sqrt(cx ** 2 + cy ** 2 + cz ** 2)
  return [cz / dist, cy / dist, cx / dist]
}

const trisect = (accum: [point, point, point][], [a, b, c]: point[]) => {
  const ab = midpoint(a, b)
  const bc = midpoint(b, c)
  const ca = midpoint(c, a)
  accum.push([a, ab, ca])
  accum.push([b, bc, ab])
  accum.push([c, ca, bc])
  accum.push([ab, bc, ca])
  return accum
}

const f2 = reduce(trisect, [] as [point, point, point][], f)
const f4 = reduce(trisect, [] as [point, point, point][], f2)
const f8 = reduce(trisect, [] as [point, point, point][], f4)
const f16 = reduce(trisect, [] as [point, point, point][], f8)

const faces = filter((corners: [point, point, point]) => {
  // return true
  const limit = 0.0
  return corners[0][0] >= limit && corners[1][0] >= limit && corners[2][0] >= limit
}, f4)

const n2 = ([] as point[]).concat(...f2)
const n4 = ([] as point[]).concat(...f4)

const nodes = n4

const SCALE = 1 // (0.107 * nodes.length) ** 0.458 / 3

const pointAt = (p: point) => {
  const [z, y, x] = rot(p)
  return <circle cx={x} cy={y} r={0.02} className={styles.node} fill="#3da" />
}

const edgeAt = ([a, b]: [point, point]) => {
  const [az, ay, ax] = rot(a)
  const [bz, by, bx] = rot(b)
  const avgZ = (az + bz) / 2
  if (a[0] + b[0] <= -0.1) return null
  const path = `M ${ax} ${ay} L ${bx} ${by}`
  const opacity = avgZ / 4 + 0.75
  return <path key={`${path} ${opacity}`} d={path} className={styles.edge} stroke="pink" />
}

const faceAt = ([a, b, c]: [point, point, point]) => {
  const [az, ay, ax] = rot(a)
  const [bz, by, bx] = rot(b)
  const [cz, cy, cx] = rot(c)
  const avgZ = (az + bz + cz) / 3
  if (a[0] + b[0] + c[0] <= -0.1) return null
  const opacity = avgZ / 4 + 0.25
  const path = `M ${ax} ${ay} L ${bx} ${by} L ${cx} ${cy} L ${ax} ${ay}`
  return <path key={`${path} ${opacity}`} d={path} className={styles.edge} fill="#f3e" opacity={opacity} />
}

const distance = ([az, ay, ax]: point, [bz, by, bx]: point) => {
  const cz = 0 // (az + bz)
  const cy = ay + by
  const cx = ax + bx
  return Math.sqrt(cx ** 2 + cy ** 2)
}

const pushIfNotInclude = (arr: [number, point, point][], c: point, d: point) => {
  if (
    arr.some(
      ([_, a, b]) =>
        a[0] === d[0] && //
        a[1] === d[1] && //
        a[2] === d[2] && //
        c[0] === b[0] && //
        c[1] === b[1] && //
        c[2] === b[2]
    )
  )
    return
  arr.push([distance(c, d), c, d])
}

const lengths = reduce(
  (accum: [number, point, point][], [a, b, c]: point[]) => {
    pushIfNotInclude(accum, a, b)
    pushIfNotInclude(accum, b, c)
    pushIfNotInclude(accum, c, a)
    return accum
  },
  [] as [number, point, point][],
  faces
)

const sortedLengths = sort(([len1], [len2]) => len1 - len2, lengths)

const withoutPoints = map(
  ([len, [az, ay, ax], [bz, by, bx]]) => [
    len,
    Math.round(1000 * ay) / 1000,
    Math.round(1000 * ax) / 1000,
    Math.round(1000 * by) / 1000,
    Math.round(1000 * bx) / 1000,
  ],
  sortedLengths
)

const displayed = withoutPoints

const Home = () => (
  <>
    <svg
      viewBox={`${-1 * SCALE} ${-1 * SCALE} ${2 * SCALE} ${2 * SCALE}`} /* min-x min-y width height */
      preserveAspectRatio="xMidYMid meet">
      {/*map<[point, point, point], React.JSX.Element | null>(faceAt, faces)*/}
      {map(
        ([a, b, c]) => (
          <>
            {edgeAt([a, b])}
            {edgeAt([b, c])}
            {edgeAt([c, a])}
          </>
        ),
        faces
      )}
      {/* {map<point, React.JSX.Element>(pointAt, n4)} */}
    </svg>
    <pre>{JSON.stringify(displayed, undefined, 2)}</pre>
  </>
)
export default Home
