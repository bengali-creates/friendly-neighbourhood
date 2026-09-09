"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { ScrollTrigger } from "@/lib/gsap";

/**
 * 6 Architectural Camera Waypoints matching Kage's cinematic multi-chapter storytelling:
 * 0: Hero Gate Overview (High altitude, scanning the planetary cyber horizon)
 * 1: Act I Signal Ingest (Diving into the primary transmission tower)
 * 2: Act II Threat Interception (Inside the defense perimeter looking at the honeypot core)
 * 3: Act III Engine Pipeline (Ascending the data bus highway, banking along the traces)
 * 4: Act IV Telemetry Matrix (Wide orbit looking across the live global nodes)
 * 5: Act V Command Deck (Low angle horizon look-ahead under the celestial AI core)
 */
const CAM_WAYPOINTS = [
  { p: [0.0, 5.0, 95.0], t: [0.0, 0.0, 0.0], fov: 46, colorShift: [0.0, 0.9, 1.0] },
  { p: [-22.0, 14.0, 68.0], t: [5.0, 2.0, -10.0], fov: 44, colorShift: [0.0, 0.9, 1.0] },
  { p: [18.0, -8.0, 48.0], t: [-6.0, -2.0, -25.0], fov: 42, colorShift: [0.95, 0.15, 0.12] },
  { p: [-15.0, 22.0, 32.0], t: [0.0, 10.0, -35.0], fov: 45, colorShift: [0.0, 0.9, 1.0] },
  { p: [26.0, 6.0, 52.0], t: [-10.0, 4.0, -20.0], fov: 48, colorShift: [1.0, 0.45, 0.15] },
  { p: [0.0, -12.0, 65.0], t: [0.0, 8.0, -40.0], fov: 40, colorShift: [0.0, 0.9, 1.0] },
];

export function RadarCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    // 1. Scene & Atmosphere Setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x06040a, 0.0055);

    const camera = new THREE.PerspectiveCamera(
      CAM_WAYPOINTS[0].fov,
      window.innerWidth / window.innerHeight,
      0.1,
      1200
    );
    camera.position.set(CAM_WAYPOINTS[0].p[0], CAM_WAYPOINTS[0].p[1], CAM_WAYPOINTS[0].p[2]);
    camera.lookAt(CAM_WAYPOINTS[0].t[0], CAM_WAYPOINTS[0].t[1], CAM_WAYPOINTS[0].t[2]);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    // 2. Texture Generators for High-End Organic Glows & Round Disc Nodes
    const createDiscTexture = () => {
      const c = document.createElement("canvas");
      c.width = 128;
      c.height = 128;
      const ctx = c.getContext("2d");
      if (ctx) {
        const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
        g.addColorStop(0, "rgba(255,255,255,1)");
        g.addColorStop(0.25, "rgba(255,255,255,0.85)");
        g.addColorStop(0.65, "rgba(255,255,255,0.15)");
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g;
        ctx.arc(64, 64, 64, 0, Math.PI * 2);
        ctx.fill();
      }
      const tex = new THREE.CanvasTexture(c);
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      return tex;
    };
    const discTex = createDiscTexture();

    // 3. Evolving Architectural Geometry (Sanctuary of Digital Nodes)
    // A. The Core Radar Compass Rings
    const ringsGroup = new THREE.Group();
    const ringRadii = [18, 38, 64, 98, 140];
    const ringMat = new THREE.LineBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.14,
    });

    ringRadii.forEach((rad) => {
      const geo = new THREE.BufferGeometry();
      const pts: THREE.Vector3[] = [];
      const segs = 180;
      for (let i = 0; i <= segs; i++) {
        const a = (i / segs) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(a) * rad, Math.sin(a) * rad, 0));
      }
      geo.setFromPoints(pts);
      ringsGroup.add(new THREE.Line(geo, ringMat));
    });
    scene.add(ringsGroup);

    // B. Sweeping Shader Radar Beam
    const sweepGeo = new THREE.RingGeometry(0, 145, 96, 1, 0, Math.PI / 3.2);
    const sweepUniforms = {
      uColor: { value: new THREE.Color(0x00e5ff) },
    };
    const sweepMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: sweepUniforms,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        varying vec2 vUv;
        void main() {
          float alpha = pow(vUv.x, 2.4) * 0.16;
          gl_FragColor = vec4(uColor, alpha);
        }
      `,
      side: THREE.DoubleSide,
    });
    const sweepMesh = new THREE.Mesh(sweepGeo, sweepMat);
    sweepMesh.position.z = -1;
    scene.add(sweepMesh);

    // C. Celestial Threat Core (Kage Blood Moon equivalent for Spider-Sense)
    const CORE = { x: 24.0, y: 38.0, z: -110.0, r: 16.0 };
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xe0231c,
      map: discTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.85,
    });
    const coreDisc = new THREE.Mesh(
      new THREE.PlaneGeometry(CORE.r * 2, CORE.r * 2),
      coreMat
    );
    coreDisc.position.set(CORE.x, CORE.y, CORE.z);
    scene.add(coreDisc);

    // Core Outer Corona
    const coronaMat = new THREE.MeshBasicMaterial({
      color: 0xe0231c,
      map: discTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.35,
    });
    const corona = new THREE.Mesh(
      new THREE.PlaneGeometry(CORE.r * 5.2, CORE.r * 5.2),
      coronaMat
    );
    corona.position.set(CORE.x, CORE.y, CORE.z - 1);
    scene.add(corona);

    // D. 3D Layered Constellation of Threat & Signal Nodes
    const pCount = 280;
    const pPositions = new Float32Array(pCount * 3);
    const pColors = new Float32Array(pCount * 3);
    const cCyan = new THREE.Color(0x00e5ff);
    const cVermilion = new THREE.Color(0xe0231c);
    const cBone = new THREE.Color(0xdfe7e0);

    for (let i = 0; i < pCount; i++) {
      const r = Math.random() * 140 + 6;
      const th = Math.random() * Math.PI * 2;
      const z = (Math.random() - 0.5) * 80 - 15;

      pPositions[i * 3] = Math.cos(th) * r;
      pPositions[i * 3 + 1] = Math.sin(th) * r;
      pPositions[i * 3 + 2] = z;

      const rnd = Math.random();
      const col = rnd < 0.22 ? cVermilion : rnd < 0.68 ? cCyan : cBone;
      pColors[i * 3] = col.r;
      pColors[i * 3 + 1] = col.g;
      pColors[i * 3 + 2] = col.b;
    }

    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPositions, 3));
    pGeo.setAttribute("color", new THREE.BufferAttribute(pColors, 3));

    const pMat = new THREE.PointsMaterial({
      size: 4.8,
      map: discTex,
      vertexColors: true,
      transparent: true,
      opacity: 0.72,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const constellation = new THREE.Points(pGeo, pMat);
    scene.add(constellation);

    // E. 3D Digital Fiber Traces (Evolving background depth ribbons)
    const traceGroup = new THREE.Group();
    const traceCurves = [
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-80, -40, -40),
        new THREE.Vector3(-30, -10, -10),
        new THREE.Vector3(20, 30, -60),
        new THREE.Vector3(80, 50, -100),
      ]),
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-60, 40, -50),
        new THREE.Vector3(0, 10, -20),
        new THREE.Vector3(40, -30, -40),
        new THREE.Vector3(90, -50, -90),
      ]),
    ];

    traceCurves.forEach((crv, idx) => {
      const tubeGeo = new THREE.TubeGeometry(crv, 80, 0.45, 8, false);
      const tubeMat = new THREE.MeshBasicMaterial({
        color: idx === 0 ? 0x00e5ff : 0xe0231c,
        transparent: true,
        opacity: 0.18,
        wireframe: true,
      });
      traceGroup.add(new THREE.Mesh(tubeGeo, tubeMat));
    });
    scene.add(traceGroup);

    // 4. CatmullRom Splines for Continuous Cinematographic Camera Motion
    const curvePos = new THREE.CatmullRomCurve3(
      CAM_WAYPOINTS.map((w) => new THREE.Vector3(w.p[0], w.p[1], w.p[2])),
      false,
      "catmullrom",
      0.35
    );
    const curveLook = new THREE.CatmullRomCurve3(
      CAM_WAYPOINTS.map((w) => new THREE.Vector3(w.t[0], w.t[1], w.t[2])),
      false,
      "catmullrom",
      0.35
    );

    // 5. Scroll State Tracking & GSAP ScrollTrigger Integration
    let currentProgress = 0;
    let targetProgress = 0;
    let mouseX = 0;
    let mouseY = 0;

    const st = ScrollTrigger.create({
      start: "top top",
      end: "bottom bottom",
      scrub: 1.8,
      onUpdate: (self) => {
        targetProgress = self.progress;
      },
    });

    const onMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("mousemove", onMouseMove, { passive: true });

    // 6. Main Render Loop
    let animId: number;
    const clock = new THREE.Clock();
    const tempP = new THREE.Vector3();
    const tempT = new THREE.Vector3();

    const animate = () => {
      const dt = clock.getDelta();
      const time = clock.getElapsedTime();

      // Smooth progress dampening
      currentProgress += (targetProgress - currentProgress) * 0.08;

      // Evolve camera position along 3D CatmullRom Spline
      curvePos.getPoint(currentProgress, tempP);
      curveLook.getPoint(currentProgress, tempT);

      // Sub-pixel hand-held parallax drift
      tempP.x += mouseX * 2.8;
      tempP.y += mouseY * 1.8;
      tempT.x += mouseX * 0.8;
      tempT.y += mouseY * 0.5;

      camera.position.copy(tempP);
      camera.lookAt(tempT);

      // Dynamic FOV interpolation
      const seg = currentProgress * (CAM_WAYPOINTS.length - 1);
      const idx = Math.min(Math.floor(seg), CAM_WAYPOINTS.length - 2);
      const frac = seg - idx;
      camera.fov =
        CAM_WAYPOINTS[idx].fov +
        (CAM_WAYPOINTS[idx + 1].fov - CAM_WAYPOINTS[idx].fov) * frac;
      camera.updateProjectionMatrix();

      // Ambient object motion
      sweepMesh.rotation.z -= 0.014;
      ringsGroup.rotation.z = -time * 0.006;
      constellation.rotation.z = time * 0.012;
      traceGroup.rotation.z = Math.sin(time * 0.2) * 0.08;

      // Subtle celestial moon pulse
      const moonScale = 1.0 + Math.sin(time * 1.5) * 0.04;
      coreDisc.scale.set(moonScale, moonScale, 1);
      corona.scale.set(moonScale * 1.05, moonScale * 1.05, 1);

      // Interpolate theme tint between Signal cyan and Vermilion threat
      const c1 = CAM_WAYPOINTS[idx].colorShift;
      const c2 = CAM_WAYPOINTS[idx + 1].colorShift;
      const r = c1[0] + (c2[0] - c1[0]) * frac;
      const g = c1[1] + (c2[1] - c1[1]) * frac;
      const b = c1[2] + (c2[2] - c1[2]) * frac;
      sweepUniforms.uColor.value.setRGB(r, g, b);

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", onMouseMove);
      st.kill();
      renderer.dispose();
      discTex.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      style={{ opacity: 0.72 }}
      aria-hidden="true"
    />
  );
}
