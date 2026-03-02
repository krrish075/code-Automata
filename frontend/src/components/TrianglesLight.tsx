import { useEffect, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Vec3 = Float32Array | number[];
type Vec4 = Float32Array | number[];
type Point2D = [number, number];

interface Circumcircle {
    i: number; j: number; k: number;
    x: number; y: number; r: number;
}

interface IRenderer {
    width: number; height: number;
    halfWidth: number; halfHeight: number;
    element: HTMLCanvasElement;
    setSize(w: number, h: number): IRenderer;
    clear(): IRenderer;
    render(scene: FSSScene): IRenderer;
}

// ─── Delaunay Triangulation ───────────────────────────────────────────────────

const EPSILON = 1.0 / 1048576.0;

function supertriangle(v: Point2D[]): Point2D[] {
    let xmin = Infinity, ymin = Infinity, xmax = -Infinity, ymax = -Infinity;
    for (let i = v.length; i--;) {
        if (v[i][0] < xmin) xmin = v[i][0]; if (v[i][0] > xmax) xmax = v[i][0];
        if (v[i][1] < ymin) ymin = v[i][1]; if (v[i][1] > ymax) ymax = v[i][1];
    }
    const dx = xmax - xmin, dy = ymax - ymin, dmax = Math.max(dx, dy);
    const xmid = xmin + dx * 0.5, ymid = ymin + dy * 0.5;
    return [
        [xmid - 20 * dmax, ymid - dmax],
        [xmid, ymid + 20 * dmax],
        [xmid + 20 * dmax, ymid - dmax],
    ];
}

function circumcircle(v: Point2D[], i: number, j: number, k: number): Circumcircle {
    const x1 = v[i][0], y1 = v[i][1], x2 = v[j][0], y2 = v[j][1], x3 = v[k][0], y3 = v[k][1];
    const fy12 = Math.abs(y1 - y2), fy23 = Math.abs(y2 - y3);
    let xc: number, yc: number;
    if (fy12 < EPSILON && fy23 < EPSILON) throw new Error("Coincident points!");
    if (fy12 < EPSILON) {
        const m2 = -((x3 - x2) / (y3 - y2)), mx2 = (x2 + x3) / 2, my2 = (y2 + y3) / 2;
        xc = (x2 + x1) / 2; yc = m2 * (xc - mx2) + my2;
    } else if (fy23 < EPSILON) {
        const m1 = -((x2 - x1) / (y2 - y1)), mx1 = (x1 + x2) / 2, my1 = (y1 + y2) / 2;
        xc = (x3 + x2) / 2; yc = m1 * (xc - mx1) + my1;
    } else {
        const m1 = -((x2 - x1) / (y2 - y1)), m2 = -((x3 - x2) / (y3 - y2));
        const mx1 = (x1 + x2) / 2, mx2 = (x2 + x3) / 2, my1 = (y1 + y2) / 2, my2 = (y2 + y3) / 2;
        xc = (m1 * mx1 - m2 * mx2 + my2 - my1) / (m1 - m2);
        yc = (fy12 > fy23) ? m1 * (xc - mx1) + my1 : m2 * (xc - mx2) + my2;
    }
    const dx = x2 - xc, dy = y2 - yc;
    return { i, j, k, x: xc, y: yc, r: dx * dx + dy * dy };
}

function dedup(edges: number[]): void {
    for (let j = edges.length; j;) {
        const b = edges[--j], a = edges[--j];
        for (let i = j; i;) {
            const n = edges[--i], m = edges[--i];
            if ((a === m && b === n) || (a === n && b === m)) {
                edges.splice(j, 2); edges.splice(i, 2); break;
            }
        }
    }
}

function delaunayTriangulate(vertices: Point2D[]): number[] {
    const n = vertices.length;
    if (n < 3) return [];
    const verts: Point2D[] = vertices.slice(0);
    const indices = Array.from({ length: n }, (_, i) => i);
    indices.sort((a, b) => verts[b][0] - verts[a][0]);
    const st = supertriangle(verts);
    verts.push(st[0], st[1], st[2]);
    const open: Circumcircle[] = [circumcircle(verts, n, n + 1, n + 2)];
    const closed: Circumcircle[] = [];
    const edges: number[] = [];
    for (let i = indices.length; i--; edges.length = 0) {
        const c = indices[i];
        for (let j = open.length; j--;) {
            const dx = verts[c][0] - open[j].x;
            if (dx > 0 && dx * dx > open[j].r) { closed.push(open[j]); open.splice(j, 1); continue; }
            const dy = verts[c][1] - open[j].y;
            if (dx * dx + dy * dy - open[j].r > EPSILON) continue;
            edges.push(open[j].i, open[j].j, open[j].j, open[j].k, open[j].k, open[j].i);
            open.splice(j, 1);
        }
        dedup(edges);
        for (let j = edges.length; j;) { const b = edges[--j], a = edges[--j]; open.push(circumcircle(verts, a, b, c)); }
    }
    for (let i = open.length; i--;) closed.push(open[i]);
    const result: number[] = [];
    for (let i = closed.length; i--;)
        if (closed[i].i < n && closed[i].j < n && closed[i].k < n)
            result.push(closed[i].i, closed[i].j, closed[i].k);
    return result;
}

// ─── FSS Math ─────────────────────────────────────────────────────────────────

const FArr = typeof Float32Array === "function" ? Float32Array : Array;

const V3 = {
    create(x = 0, y = 0, z = 0): Vec3 { const v = new FArr(3); v[0] = x; v[1] = y; v[2] = z; return v; },
    set(t: Vec3, x = 0, y = 0, z = 0) { t[0] = x; t[1] = y; t[2] = z; },
    copy(t: Vec3, a: Vec3) { t[0] = a[0]; t[1] = a[1]; t[2] = a[2]; },
    subtractVectors(t: Vec3, a: Vec3, b: Vec3) { t[0] = a[0] - b[0]; t[1] = a[1] - b[1]; t[2] = a[2] - b[2]; },
    crossVectors(t: Vec3, a: Vec3, b: Vec3) {
        t[0] = a[1] * b[2] - a[2] * b[1]; t[1] = a[2] * b[0] - a[0] * b[2]; t[2] = a[0] * b[1] - a[1] * b[0];
    },
    dot(a: Vec3, b: Vec3) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; },
    normalise(t: Vec3) {
        const len = Math.sqrt(t[0] * t[0] + t[1] * t[1] + t[2] * t[2]);
        if (len !== 0) { t[0] /= len; t[1] /= len; t[2] /= len; }
    },
};

const V4 = {
    create(x = 0, y = 0, z = 0, w = 0): Vec4 { const v = new FArr(4); v[0] = x; v[1] = y; v[2] = z; v[3] = w; return v; },
    set(t: Vec4, x = 0, y = 0, z = 0, w = 0) { t[0] = x; t[1] = y; t[2] = z; t[3] = w; },
    add(t: Vec4, a: Vec4) { t[0] += a[0]; t[1] += a[1]; t[2] += a[2]; t[3] += a[3]; },
    multiplyVectors(t: Vec4, a: Vec4, b: Vec4) { t[0] = a[0] * b[0]; t[1] = a[1] * b[1]; t[2] = a[2] * b[2]; t[3] = a[3] * b[3]; },
    multiplyScalar(t: Vec4, s: number) { t[0] *= s; t[1] *= s; t[2] *= s; t[3] *= s; },
    clamp(t: Vec4, min: number, max: number) { for (let i = 0; i < 4; i++) { if (t[i] < min) t[i] = min; if (t[i] > max) t[i] = max; } },
};

// ─── FSS Classes ──────────────────────────────────────────────────────────────

class FSSColor {
    rgba: Vec4;
    hex: string;
    constructor(hex = "#000000", opacity = 1) {
        this.rgba = V4.create();
        this.hex = hex;
        this.set(hex, opacity);
    }
    set(hex: string, opacity = 1) {
        const h = hex.replace("#", "");
        const size = h.length / 3;
        this.rgba[0] = parseInt(h.substring(size * 0, size * 1), 16) / 255;
        this.rgba[1] = parseInt(h.substring(size * 1, size * 2), 16) / 255;
        this.rgba[2] = parseInt(h.substring(size * 2, size * 3), 16) / 255;
        this.rgba[3] = opacity;
    }
    format(): string {
        const hex = (ch: number) => { const h = Math.ceil(ch * 255).toString(16); return h.length === 1 ? "0" + h : h; };
        this.hex = "#" + hex(this.rgba[0]) + hex(this.rgba[1]) + hex(this.rgba[2]);
        return this.hex;
    }
}

class FSSVertex {
    position: Vec3;
    constructor(x = 0, y = 0, z = 0) { this.position = V3.create(x, y, z); }
}

class FSSTriangle {
    a: FSSVertex; b: FSSVertex; c: FSSVertex;
    vertices: FSSVertex[];
    u: Vec3; v: Vec3;
    centroid: Vec3; normal: Vec3;
    color: FSSColor;
    polygon: SVGPolygonElement;

    constructor(a = new FSSVertex(), b = new FSSVertex(), c = new FSSVertex()) {
        this.a = a; this.b = b; this.c = c;
        this.vertices = [a, b, c];
        this.u = V3.create(); this.v = V3.create();
        this.centroid = V3.create(); this.normal = V3.create();
        this.color = new FSSColor();
        this.polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        this.polygon.setAttributeNS(null, "stroke-linejoin", "round");
        this.polygon.setAttributeNS(null, "stroke-miterlimit", "1");
        this.polygon.setAttributeNS(null, "stroke-width", "1");
        this.computeCentroid(); this.computeNormal();
    }
    computeCentroid() {
        this.centroid[0] = (this.a.position[0] + this.b.position[0] + this.c.position[0]) / 3;
        this.centroid[1] = (this.a.position[1] + this.b.position[1] + this.c.position[1]) / 3;
        this.centroid[2] = (this.a.position[2] + this.b.position[2] + this.c.position[2]) / 3;
    }
    computeNormal() {
        V3.subtractVectors(this.u, this.b.position, this.a.position);
        V3.subtractVectors(this.v, this.c.position, this.a.position);
        V3.crossVectors(this.normal, this.u, this.v);
        V3.normalise(this.normal);
    }
}

class FSSPlane {
    triangles: FSSTriangle[] = [];
    width: number; height: number;

    constructor(width: number, height: number, count: number) {
        this.width = width; this.height = height;
        const ox = width * -0.5, oy = height * 0.5;
        const verts: Point2D[] = Array.from({ length: count }, () => [
            ox + Math.random() * width,
            oy - Math.random() * height,
        ]);
        verts.push(
            [ox, oy], [ox + width / 2, oy], [ox + width, oy],
            [ox + width, oy - height / 2], [ox + width, oy - height],
            [ox + width / 2, oy - height], [ox, oy - height], [ox, oy - height / 2],
        );
        for (let i = 6; i >= 0; i--) {
            verts.push(
                [ox + Math.random() * width, oy], [ox, oy - Math.random() * height],
                [ox + width, oy - Math.random() * height], [ox + Math.random() * width, oy - height],
            );
        }
        const tris = delaunayTriangulate(verts);
        for (let i = tris.length; i;) {
            const p1: [number, number] = [Math.ceil(verts[tris[--i]][0]), Math.ceil(verts[tris[i]][1])];
            const p2: [number, number] = [Math.ceil(verts[tris[--i]][0]), Math.ceil(verts[tris[i]][1])];
            const p3: [number, number] = [Math.ceil(verts[tris[--i]][0]), Math.ceil(verts[tris[i]][1])];
            this.triangles.push(new FSSTriangle(
                new FSSVertex(p1[0], p1[1]),
                new FSSVertex(p2[0], p2[1]),
                new FSSVertex(p3[0], p3[1]),
            ));
        }
    }
}

class FSSMaterial {
    ambient: FSSColor; diffuse: FSSColor; slave: FSSColor;
    constructor(ambient = "#444444", diffuse = "#FFFFFF") {
        this.ambient = new FSSColor(ambient);
        this.diffuse = new FSSColor(diffuse);
        this.slave = new FSSColor();
    }
}

class FSSLight {
    position: Vec3; ray: Vec3;
    ambient: FSSColor; diffuse: FSSColor;
    constructor(ambient = "#FFFFFF", diffuse = "#FFFFFF") {
        this.position = V3.create();
        this.ray = V3.create();
        this.ambient = new FSSColor(ambient);
        this.diffuse = new FSSColor(diffuse);
    }
    setPosition(x: number, y: number, z: number) { V3.set(this.position, x, y, z); }
}

class FSSMesh {
    geometry: FSSPlane; material: FSSMaterial;
    visible = true;
    readonly FRONT = 0;

    constructor(geometry: FSSPlane, material: FSSMaterial) {
        this.geometry = geometry; this.material = material;
    }

    update(lights: FSSLight[]) {
        for (const tri of this.geometry.triangles) {
            V4.set(tri.color.rgba);
            for (const light of lights) {
                V3.subtractVectors(light.ray, light.position, tri.centroid);
                V3.normalise(light.ray);
                const illum = Math.max(V3.dot(tri.normal, light.ray), 0);
                V4.multiplyVectors(this.material.slave.rgba, this.material.ambient.rgba, light.ambient.rgba);
                V4.add(tri.color.rgba, this.material.slave.rgba);
                V4.multiplyVectors(this.material.slave.rgba, this.material.diffuse.rgba, light.diffuse.rgba);
                V4.multiplyScalar(this.material.slave.rgba, illum);
                V4.add(tri.color.rgba, this.material.slave.rgba);
            }
            V4.clamp(tri.color.rgba, 0, 1);
        }
    }
}

class FSSScene {
    meshes: FSSMesh[] = [];
    lights: FSSLight[] = [];
    add(o: FSSMesh | FSSLight) {
        if (o instanceof FSSMesh && !this.meshes.includes(o)) this.meshes.push(o);
        else if (o instanceof FSSLight && !this.lights.includes(o)) this.lights.push(o);
    }
    remove(o: FSSMesh | FSSLight) {
        if (o instanceof FSSMesh) this.meshes = this.meshes.filter(m => m !== o);
        else if (o instanceof FSSLight) this.lights = this.lights.filter(l => l !== o);
    }
}

class FSSCanvasRenderer {
    width = 0; height = 0; halfWidth = 0; halfHeight = 0;
    element: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;

    constructor() {
        this.element = document.createElement("canvas");
        this.element.style.display = "block";
        this.ctx = this.element.getContext("2d")!;
    }

    setSize(w: number, h: number) {
        if (this.width === w && this.height === h) return;
        this.width = w; this.height = h;
        this.halfWidth = w * 0.5; this.halfHeight = h * 0.5;
        this.element.width = w; this.element.height = h;
        this.ctx.setTransform(1, 0, 0, -1, this.halfWidth, this.halfHeight);
    }

    clear() { this.ctx.clearRect(-this.halfWidth, -this.halfHeight, this.width, this.height); }

    render(scene: FSSScene) {
        this.clear();
        this.ctx.lineJoin = "round";
        this.ctx.lineWidth = 1;
        for (const mesh of scene.meshes) {
            if (!mesh.visible) continue;
            mesh.update(scene.lights);
            for (const tri of mesh.geometry.triangles) {
                const color = tri.color.format();
                this.ctx.beginPath();
                this.ctx.moveTo(tri.a.position[0], tri.a.position[1]);
                this.ctx.lineTo(tri.b.position[0], tri.b.position[1]);
                this.ctx.lineTo(tri.c.position[0], tri.c.position[1]);
                this.ctx.closePath();
                this.ctx.strokeStyle = color;
                this.ctx.fillStyle = color;
                this.ctx.stroke();
                this.ctx.fill();
            }
        }
    }
}

// ─── React Component ──────────────────────────────────────────────────────────

const MESH_CONFIG = { width: 1.2, height: 1.2, slices: 250, ambient: "#222222", diffuse: "#FFFFFF" };
const LIGHT_CONFIG = { xPos: 0, yPos: 200, zOffset: 100, ambient: "#444444", diffuse: "#FFFFFF" };

export default function TrianglesLight() {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const renderer = new FSSCanvasRenderer();
        renderer.setSize(container.offsetWidth, container.offsetHeight);
        container.appendChild(renderer.element);

        const scene = new FSSScene();
        let mesh: FSSMesh | null = null;
        let light: FSSLight | null = null;
        let rafId: number;

        function createMesh() {
            if (mesh) scene.remove(mesh);
            renderer.clear();
            const geometry = new FSSPlane(
                MESH_CONFIG.width * renderer.width,
                MESH_CONFIG.height * renderer.height,
                MESH_CONFIG.slices,
            );
            const material = new FSSMaterial(MESH_CONFIG.ambient, MESH_CONFIG.diffuse);
            mesh = new FSSMesh(geometry, material);
            scene.add(mesh);
        }

        function addLight() {
            renderer.clear();
            light = new FSSLight(LIGHT_CONFIG.ambient, LIGHT_CONFIG.diffuse);
            light.setPosition(LIGHT_CONFIG.xPos, LIGHT_CONFIG.yPos, LIGHT_CONFIG.zOffset);
            scene.add(light);
        }

        function resize(w: number, h: number) {
            renderer.setSize(w, h);
            createMesh();
        }

        function animate() {
            renderer.render(scene);
            rafId = requestAnimationFrame(animate);
        }

        function onResize() { resize(container.offsetWidth, container.offsetHeight); }

        function onMouseMove(e: MouseEvent) {
            if (!light) return;
            light.setPosition(
                e.clientX - renderer.width / 2,
                renderer.height / 2 - e.clientY,
                light.position[2],
            );
        }

        createMesh();
        addLight();
        window.addEventListener("resize", onResize);
        window.addEventListener("mousemove", onMouseMove);
        animate();

        return () => {
            cancelAnimationFrame(rafId);
            window.removeEventListener("resize", onResize);
            window.removeEventListener("mousemove", onMouseMove);
            if (container.contains(renderer.element)) container.removeChild(renderer.element);
        };
    }, []);

    return (
        <div
            ref={containerRef}
            style={{
                position: "fixed",
                inset: 0,
                background: "#151618",
                overflow: "hidden",
                zIndex: -1,
                pointerEvents: "none"
            }}
        />
    );
}
