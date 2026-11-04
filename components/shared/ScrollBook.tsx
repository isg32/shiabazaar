"use client";

import { useRef, useEffect } from "react";
import * as THREE from "three";

export function ScrollBook() {
  const mountRef   = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const W = mount.clientWidth  || 400;
    const H = mount.clientHeight || 320;

    // ── Renderer ──────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    // ── Scene / Camera ────────────────────────────────────────────
    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, W / H, 0.1, 50);
    camera.position.set(0, 2.2, 5.5);
    camera.lookAt(0, 0, 0);

    // ── Lights ───────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xfff5e6, 1.1));

    const key = new THREE.DirectionalLight(0xfff0d8, 2.2);
    key.position.set(4, 7, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    scene.add(key);

    // warm fill from the left — echoes the coral brand
    const fill = new THREE.DirectionalLight(0xcc785c, 0.5);
    fill.position.set(-4, 2, 2);
    scene.add(fill);

    // ── Book geometry helper ──────────────────────────────────────
    function makeBook(
      w: number, h: number, d: number,
      coverColor: number, pageColor: number,
      posY: number, rotY: number,
    ): THREE.Group {
      const book = new THREE.Group();

      // main body
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        new THREE.MeshStandardMaterial({ color: coverColor, roughness: 0.82, metalness: 0.04 }),
      );
      body.castShadow = true;
      body.receiveShadow = true;
      book.add(body);

      // page block — slightly inset on all sides, lighter color
      const pages = new THREE.Mesh(
        new THREE.BoxGeometry(w * 0.92, h * 0.78, d * 0.94),
        new THREE.MeshStandardMaterial({ color: pageColor, roughness: 0.9, metalness: 0 }),
      );
      pages.position.x = w * 0.04; // shifted toward fore-edge
      book.add(pages);

      // spine strip — slightly raised, gold tint
      const spine = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, h * 1.002, d),
        new THREE.MeshStandardMaterial({ color: 0xc9a227, roughness: 0.5, metalness: 0.3 }),
      );
      spine.position.x = -w / 2;
      book.add(spine);

      book.position.y = posY;
      book.rotation.y = rotY;
      return book;
    }

    // ── Stack of books ────────────────────────────────────────────
    const stack = new THREE.Group();
    scene.add(stack);

    // books bottom → top: (w, h, d, cover, pages, y, rotY)
    const bookDefs = [
      [2.2, 0.22, 1.5,  0x2d1508, 0xe8dcc8,  0.00,  0.05 ],
      [2.0, 0.20, 1.38, 0x6b3b1e, 0xf0e4cc,  0.22, -0.10 ],
      [2.3, 0.24, 1.55, 0x8b1a1a, 0xe8dcc8,  0.42,  0.08 ],
      [1.9, 0.18, 1.30, 0x1a2a1a, 0xf4ead8,  0.66,  0.16 ],
      [2.1, 0.20, 1.42, 0x4a2010, 0xede0c4,  0.84, -0.06 ],
    ] as const;

    bookDefs.forEach(([w, h, d, cover, page, y, rot]) =>
      stack.add(makeBook(w, h, d, cover, page, y - 0.52, rot))
    );

    // ── Subtle ground shadow plane ────────────────────────────────
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(6, 6),
      new THREE.ShadowMaterial({ opacity: 0.18 }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -0.54;
    shadow.receiveShadow = true;
    scene.add(shadow);

    // ── Scroll → progress ────────────────────────────────────────
    // Progress runs 0→1 over the full traversal of the element through
    // the viewport: starts when bottom edge enters, ends when top edge exits.
    const onScroll = () => {
      const el = mountRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh   = window.innerHeight;
      progressRef.current = Math.max(0, Math.min(1, (vh - rect.top) / (rect.height + vh)));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    // Cubic ease-in-out: slow start, fast middle, slow end
    const easeInOut = (t: number) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    // ── Render loop ──────────────────────────────────────────────
    let raf: number;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      stack.rotation.y = easeInOut(progressRef.current) * (150 * Math.PI / 180);
      renderer.render(scene, camera);
    };
    animate();

    // ── Resize ───────────────────────────────────────────────────
    const onResize = () => {
      const w = mount.clientWidth  || 400;
      const h = mount.clientHeight || 320;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} className="w-full h-full min-h-[280px]" />;
}

export default ScrollBook;
