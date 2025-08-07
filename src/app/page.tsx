'use client'

import React from 'react'
import { addIndex, eqBy, filter, flatten, identity, map, pipe, reduce, reverse, sort, uniq, uniqWith } from 'ramda'
import styles from './page.module.css'

type point = [x: number, y: number, z: number]
type triangle = [point, point, point]
type vector = [point, point]
type component = Record<string, string | number> // what Chromatik wants Chromatik gets

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

// 32 feet radius = 9.7536 meters
const DOME_DIAMETER = 9.7536

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
const f32 = reduce(trisect, [] as [point, point, point][], f16)

const faces = filter((corners: [point, point, point]) => {
  // return true
  const limit = 0.0
  return corners[0][0] >= limit && corners[1][0] >= limit && corners[2][0] >= limit
}, f4)

const n2 = ([] as point[]).concat(...f2)
const allPoints = ([] as point[]).concat(...faces)
const n4 = uniqWith((p: point, q: point) => p[0] === q[0] && p[1] === q[1] && p[2] === q[2])(allPoints)

const m = n4

const SCALE = 1 // (0.107 * m.length) ** 0.458 / 3

const digits = 5
const pointAt = (p: point, i: number) => {
  const [z, y, x] = rot(p)
  const formatCoord = (coord: number) => {
    const rounded = Math.round(coord * 10 ** digits) / 10 ** digits
    return rounded.toFixed(digits)
  }
  const SHOW_INDEX = true
  return (
    <>
      <circle cx={x} cy={y} r={0.016} className={styles.node} fill="#fff" />
      <text x={x + 0.08} y={y + 0.03} className={styles.nodeLabel}>
        {SHOW_INDEX && (
          <tspan x={x - 0.014} dy={-0.02}>
            {m.indexOf(p)}
          </tspan>
        )}
        {!SHOW_INDEX && (
          <>
            <tspan x={x + 0.01} dy="-0.5em">
              {formatCoord(z)}
            </tspan>
            <tspan x={x + 0.01} dy="1.2em">
              {formatCoord(y)}
            </tspan>
            <tspan x={x + 0.01} dy="1.2em">
              {formatCoord(x)}
            </tspan>
          </>
        )}
      </text>
    </>
  )
}

const triangles: triangle[] = [
  //
  [m[0], m[25], m[15]],
  [m[25], m[26], m[15]],
  [m[25], m[27], m[26]],
  [m[27], m[34], m[26]],

  [m[15], m[26], m[17]],
  [m[26], m[30], m[17]],
  [m[17], m[30], m[22]],
  [m[26], m[34], m[30]],

  [m[22], m[28], m[21]],
  [m[30], m[28], m[22]],
  [m[30], m[29], m[28]],
  [m[30], m[34], m[29]],

  [m[34], m[33], m[29]],
  [m[34], m[32], m[33]],
  [m[32], m[31], m[33]],
  [m[27], m[32], m[34]],
]

const options: component[] = [
  { rotate: 0 }, // 0
  { rotate: 180 }, // 1
  { rotate: 348 }, // 2
  { rotate: 168 }, // 3
  { rotate: 12 }, // 4
  { rotate: 192 }, // 5
  { rotate: 14 }, // 6
  { rotate: 0 }, // 7
  { rotate: 21 }, // 8
  { rotate: 194 }, // 9
  { rotate: 8 }, // 10
  { rotate: 180 }, // 11
  { rotate: 352 }, // 12
  { rotate: 165 }, // 13
  { rotate: 339 }, // 14
  { rotate: 346 }, // 15
]

const edgeAt = ([a, b]: [point, point]) => {
  const [az, ay, ax] = rot(a)
  const [bz, by, bx] = rot(b)
  const avgZ = (az + bz) / 2
  if (a[0] + b[0] <= -0.1) return null
  const path = `M ${ax} ${ay} L ${bx} ${by}`
  const opacity = avgZ / 4 + 0.75
  return <path key={`${path} ${opacity}`} d={path} className={styles.edge} stroke="black" />
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

const flipAxes = ([a, b, c]: triangle): triangle => {
  const [ax, ay, az] = a
  const [bx, by, bz] = b
  const [cx, cy, cz] = c
  return [
    [az, ay, ax],
    [bz, by, bx],
    [cz, cy, cx],
  ]
}

const panelVector = ([a, b, c]: triangle): vector => {
  // Calculate the average (centroid) of the three points
  const centroid: point = [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3, (a[2] + b[2] + c[2]) / 3]

  // Calculate two vectors in the plane
  const vectorAB: point = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]
  const vectorAC: point = [c[0] - a[0], c[1] - a[1], c[2] - a[2]]

  // Calculate the cross product to get the normal vector
  const normal: point = [
    vectorAB[1] * vectorAC[2] - vectorAB[2] * vectorAC[1],
    vectorAB[2] * vectorAC[0] - vectorAB[0] * vectorAC[2],
    vectorAB[0] * vectorAC[1] - vectorAB[1] * vectorAC[0],
  ]

  // Normalize the normal vector
  const magnitude = Math.sqrt(normal[0] ** 2 + normal[1] ** 2 + normal[2] ** 2)
  const normalizedNormal: point = [normal[0] / magnitude, normal[1] / magnitude, normal[2] / magnitude]

  // Scale the normal vector (you can adjust this scale factor)
  const scale = 0.2
  const endPoint: point = [
    centroid[0] + normalizedNormal[0] * scale,
    centroid[1] + normalizedNormal[1] * scale,
    centroid[2] + normalizedNormal[2] * scale,
  ]

  return [centroid, endPoint]
}

const vectorToComponent = ([a, d]: vector, index: number): component[] => {
  const c = m[29]
  const b = m[0]

  const [[x, y, z], [dx, dy, dz]] = [a, d]

  // Relative direction as vector from origin
  const [vx, vy, vz]: point = [dx - x, dy - y, dz - z]

  // Normalize the direction vector
  const length = Math.sqrt(vx * vx + vy * vy + vz * vz)
  const [nx, ny, nz]: point = [vx / length, vy / length, vz / length]

  const components: component[] = [
    {
      id: `triangle-${index}`,
      type: 'BlinkyTriangle',
      x: (DOME_DIAMETER / 2) * x,
      y: (DOME_DIAMETER / 2) * y,
      z: (DOME_DIAMETER / 2) * z,
      pitch: Math.asin(-ny) * (180 / pi),
      yaw: 90 + Math.atan2(ny, nx) * (180 / pi),
      rotate: options[index].rotate as number /* - cosTheta * (180 / pi) */,
    },
  ]

  const SHOW_ORIENTATION_VECTOR = false
  if (SHOW_ORIENTATION_VECTOR) {
    components.push({
      // original vector perpendicular to triangle
      type: 'point',
      x: (DOME_DIAMETER / 2) * dx,
      y: (DOME_DIAMETER / 2) * dy,
      z: (DOME_DIAMETER / 2) * dz,
    })
  }

  return components
}

const vectorArrayToComponentArray = (vecs: vector[]): component[][] => {
  // grr @ addIndex(map)
  return vecs.map(vectorToComponent)
}

const SVG_PADDING = 0.02

const Home = () => (
  <>
    <svg
      viewBox={`
        ${-1 * SCALE - SVG_PADDING}
        ${-1 * SCALE - SVG_PADDING}
        ${2 * SCALE + SVG_PADDING * 2}
        ${2 * SCALE + SVG_PADDING * 2}`}
      preserveAspectRatio="xMidYMid meet"
    >
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
      {addIndex(map<point, React.JSX.Element>)(pointAt, n4)}
    </svg>
    <pre>
      {JSON.stringify(
        {
          label: 'BlinkyHarness',
          tag: 'Harness',
          parameters: {
            ip: {
              type: 'int',
              default: 15,
              min: 11,
              max: 15,
              label: 'Controller',
              description: 'IP of box should be 192.168.123.n',
            },
            port: {
              type: 'int',
              default: 1,
              min: 1,
              max: 4,
              label: 'Port',
              description: 'Numbered port on the controller, labeled SPI OUT and a number',
            },
          },
          transforms: [{ pitch: -90 }],
          components: [
            ...pipe<[list: readonly triangle[]], triangle[], vector[], component[][], component[]>(
              map<triangle, triangle>(flipAxes),
              map<triangle, vector>(panelVector),
              vectorArrayToComponentArray,
              flatten
            )(triangles),
          ],
          outputs: [
            {
              protocol: 'artnet',
              enabled: true,
              universe: '$port - 1',
              channel: 1,
              host: '192.168.123.$ip',
              start: '0',
              num: '132',
            },
          ],
        },
        undefined,
        2
      )}
    </pre>
    {/*
    <pre>
      Nodes:{'\n'}
      {addIndex<point, string>(map<point, string>)(
        //
        ([x, y, z]: point, i: number) => `${i}: (${x},${y},${z})`,
        n4
      ).join('\n')}
    </pre> */}
  </>
)
export default Home
