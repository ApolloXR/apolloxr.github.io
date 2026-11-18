/* ApolloXR landing page — hero 4D point-cloud animation + email signup */
(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------------
   * Footer year
   * ------------------------------------------------------------- */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------------------------------------------------------------
   * Email signup
   * Works with any endpoint that accepts a form POST and returns JSON
   * (Formspree, Getform, Basin…). Set the form's `action` attribute.
   * ------------------------------------------------------------- */
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  document.querySelectorAll("form.signup").forEach((form) => {
    const input = form.querySelector('input[type="email"]');
    const button = form.querySelector('button[type="submit"]');
    const status = form.querySelector(".signup__status");
    const label = button.textContent;

    const say = (msg, kind) => {
      status.textContent = msg;
      status.classList.toggle("is-ok", kind === "ok");
      status.classList.toggle("is-err", kind === "err");
    };

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = input.value.trim();

      if (!EMAIL_RE.test(email)) {
        say("Please enter a valid email address.", "err");
        input.focus();
        return;
      }

      const endpoint = form.getAttribute("action") || "";
      if (endpoint.includes("YOUR_FORM_ID")) {
        console.warn("[ApolloXR] Signup endpoint not configured — see README.md.");
        say("Signups aren't connected yet. Please check back soon.", "err");
        return;
      }

      button.disabled = true;
      button.textContent = "Sending…";
      say("", null);

      try {
        const res = await fetch(endpoint, {
          method: "POST",
          body: new FormData(form),
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        form.classList.add("is-done");
        input.value = "";
        say("You're on the list — we'll be in touch soon.", "ok");
        button.textContent = "Subscribed ✓";
      } catch (err) {
        console.error(err);
        say("Something went wrong. Please try again in a moment.", "err");
        button.disabled = false;
        button.textContent = label;
      }
    });

    input.addEventListener("input", () => {
      if (status.classList.contains("is-err")) say("", null);
    });
  });

  /* ---------------------------------------------------------------
   * Scroll reveal
   * ------------------------------------------------------------- */
  const revealTargets = document.querySelectorAll(".step, .feature, .case, .section__head, .cta__card");
  if (!reduceMotion && "IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add("is-in");
          io.unobserve(en.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    revealTargets.forEach((el, i) => {
      el.classList.add("reveal");
      el.style.transitionDelay = `${(i % 3) * 80}ms`;
      io.observe(el);
    });
  }

  /* ---------------------------------------------------------------
   * Hero: a point-cloud performer, captured by a ring of cameras
   * ------------------------------------------------------------- */
  const canvas = document.getElementById("scan");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const hudTime = document.getElementById("hud-time");
  const hudFrame = document.getElementById("hud-frame");

  // --- tiny vector helpers
  const rotX = (p, a) => {
    const c = Math.cos(a), s = Math.sin(a);
    return [p[0], p[1] * c - p[2] * s, p[1] * s + p[2] * c];
  };
  const rotZ = (p, a) => {
    const c = Math.cos(a), s = Math.sin(a);
    return [p[0] * c - p[1] * s, p[0] * s + p[1] * c, p[2]];
  };
  const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

  // Seeded RNG so the cloud looks the same every load.
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

  // Sample a point on an ellipsoid surface (with slight thickness).
  const ellipsoidPoint = (r) => {
    const u = rnd() * 2 - 1;
    const th = rnd() * Math.PI * 2;
    const s = Math.sqrt(1 - u * u);
    const k = 0.94 + rnd() * 0.06;
    return [r[0] * s * Math.cos(th) * k, r[1] * u * k, r[2] * s * Math.sin(th) * k];
  };

  // Body parts. Static parts have a fixed centre; limb segments hang from a joint
  // and are posed each frame. Units ≈ metres, y up.
  const parts = [];
  const addStatic = (c, r, n) => parts.push({ kind: "static", c, r, n });
  const addLimb = (id, r, len, n) => parts.push({ kind: "limb", id, r, len, n });

  addStatic([0, 1.63, 0], [0.095, 0.12, 0.105], 340);   // head
  addStatic([0, 1.49, 0], [0.05, 0.06, 0.05], 50);       // neck
  addStatic([0, 1.3, 0], [0.19, 0.17, 0.11], 420);       // chest
  addStatic([0, 1.1, 0], [0.155, 0.13, 0.095], 260);     // waist
  addStatic([0, 0.94, 0], [0.165, 0.11, 0.105], 240);    // pelvis
  addStatic([-0.2, 1.42, 0], [0.07, 0.06, 0.07], 60);    // shoulders
  addStatic([0.2, 1.42, 0], [0.07, 0.06, 0.07], 60);
  ["armL", "armR"].forEach((s) => {
    addLimb(s + "U", [0.05, 0.15, 0.05], 0.29, 170);
    addLimb(s + "L", [0.042, 0.14, 0.042], 0.27, 150);
    addLimb(s + "H", [0.03, 0.06, 0.045], 0.12, 50);
  });
  ["legL", "legR"].forEach((s) => {
    addLimb(s + "U", [0.075, 0.22, 0.078], 0.43, 240);
    addLimb(s + "L", [0.055, 0.21, 0.058], 0.42, 200);
    addLimb(s + "F", [0.045, 0.035, 0.11], 0.06, 60);
  });

  // Pre-sample points in each part's local frame.
  const points = [];
  parts.forEach((part, pi) => {
    for (let i = 0; i < part.n; i++) {
      let p = ellipsoidPoint(part.r);
      if (part.kind === "limb") {
        p = add(p, [0, -part.len / 2, 0]);
        if (part.id.endsWith("F")) p = add(p, [0, part.len / 2 - 0.03, 0.06]); // foot points forward
      }
      points.push({ pi, p, j: rnd() });
    }
  });

  // Simple forward kinematics: returns world transform for each limb segment.
  const pose = (t) => {
    const w = t * 2.2;                    // stride frequency
    const sw = Math.sin(w);
    const bob = Math.abs(Math.cos(w)) * 0.025;
    const out = { bob };

    const arm = (side, phase) => {
      const shoulder = [side * 0.22, 1.42 - bob, 0];
      const spread = side * 0.12;
      const aU = phase * 0.55;
      const aL = -0.35 - Math.max(0, phase) * 0.45;
      const xf = (p, ang) => rotZ(rotX(p, ang), spread);
      out[(side < 0 ? "armL" : "armR") + "U"] = (p) => add(shoulder, xf(p, aU));
      const elbow = add(shoulder, xf([0, -0.29, 0], aU));
      out[(side < 0 ? "armL" : "armR") + "L"] = (p) => add(elbow, xf(p, aU + aL));
      const wrist = add(elbow, xf([0, -0.27, 0], aU + aL));
      out[(side < 0 ? "armL" : "armR") + "H"] = (p) => add(wrist, xf(p, aU + aL));
    };
    const leg = (side, phase) => {
      const hip = [side * 0.095, 0.9 - bob, 0];
      const aU = -phase * 0.5;
      const aL = Math.max(0, phase) * 0.8 + 0.05;
      const name = side < 0 ? "legL" : "legR";
      out[name + "U"] = (p) => add(hip, rotX(p, aU));
      const knee = add(hip, rotX([0, -0.43, 0], aU));
      out[name + "L"] = (p) => add(knee, rotX(p, aU + aL));
      const ankle = add(knee, rotX([0, -0.42, 0], aU + aL));
      out[name + "F"] = (p) => add(ankle, rotX(p, aU + aL * 0.6));
    };
    arm(-1, sw);
    arm(1, -sw);
    leg(-1, -sw);
    leg(1, sw);
    return out;
  };

  // Camera rig: three rings on a dome around the subject.
  const rig = [];
  [[0.25, 12, 1.55], [1.05, 14, 1.7], [1.95, 10, 1.35]].forEach(([y, n, r], ring) => {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + ring * 0.21;
      rig.push([Math.cos(a) * r, y, Math.sin(a) * r]);
    }
  });

  let W = 0, H = 0, DPR = 1;
  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = rect.width;
    H = rect.height;
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  };

  // Project a world point to screen; returns [x, y, depth, scale].
  const CAM_DIST = 6.5;
  const depthFade = (d, k, lo) => Math.max(lo, Math.min(1, 1 - (d - CAM_DIST) * k));
  const makeProjector = (yaw) => {
    const cy = Math.cos(yaw), sy = Math.sin(yaw);
    const pitch = -0.16;
    const cp = Math.cos(pitch), sp = Math.sin(pitch);
    const focal = Math.min(W, H) * 1.9;
    const cx = W / 2, cyS = H * 0.5;
    return (p) => {
      // centre on subject
      let x = p[0], y = p[1] - 0.92, z = p[2];
      // yaw
      const x1 = x * cy - z * sy;
      const z1 = x * sy + z * cy;
      // pitch
      const y2 = y * cp - z1 * sp;
      const z2 = y * sp + z1 * cp;
      const d = CAM_DIST + z2;
      const s = focal / d;
      return [cx + x1 * s, cyS - y2 * s, d, s];
    };
  };

  const lerp = (a, b, t) => a + (b - a) * t;
  // cyan → violet by height
  const colorFor = (h, a) => {
    const t = Math.min(1, Math.max(0, h / 1.8));
    const r = Math.round(lerp(94, 155, t));
    const g = Math.round(lerp(231, 123, t));
    const b = 255;
    return `rgba(${r},${g},${b},${a})`;
  };

  const FPS_LABEL = 60;
  let start = performance.now();
  let running = true;
  let rafId = 0;

  const draw = (now) => {
    const t = reduceMotion ? 1.3 : (now - start) / 1000;
    const yaw = reduceMotion ? 0.6 : t * 0.28;
    const proj = makeProjector(yaw);
    const P = pose(t);

    ctx.clearRect(0, 0, W, H);

    // floor rings
    ctx.lineWidth = 1;
    [0.6, 1.2, 2.0].forEach((r, i) => {
      ctx.beginPath();
      for (let k = 0; k <= 72; k++) {
        const a = (k / 72) * Math.PI * 2;
        const q = proj([Math.cos(a) * r, 0, Math.sin(a) * r]);
        k ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]);
      }
      ctx.strokeStyle = `rgba(120,160,255,${0.16 - i * 0.04})`;
      ctx.stroke();
    });

    // scan plane sweeping up and down
    const scanY = reduceMotion ? 1.1 : 0.9 + Math.sin(t * 0.9) * 0.95;

    // cameras + capture rays
    const flashIdx = Math.floor(t * 14) % rig.length;
    const subject = proj([0, 1.0, 0]);
    rig.forEach((c, i) => {
      const q = proj(c);
      const dist = (flashIdx - i + rig.length) % rig.length;
      const hot = dist < 4 ? 1 - dist / 4 : 0;
      const depthA = depthFade(q[2], 0.35, 0.25);
      if (hot > 0) {
        const g = ctx.createLinearGradient(q[0], q[1], subject[0], subject[1]);
        g.addColorStop(0, `rgba(94,231,255,${0.45 * hot * depthA})`);
        g.addColorStop(1, "rgba(94,231,255,0)");
        ctx.strokeStyle = g;
        ctx.beginPath();
        ctx.moveTo(q[0], q[1]);
        ctx.lineTo(subject[0], subject[1]);
        ctx.stroke();
      }
      const sz = Math.min(8, Math.max(3, q[3] * 0.04));
      ctx.fillStyle = `rgba(${hot ? "190,240,255" : "150,165,200"},${(0.35 + hot * 0.65) * depthA})`;
      ctx.fillRect(q[0] - sz / 2, q[1] - sz / 2, sz, sz * 0.75);
    });

    // the performer
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < points.length; i++) {
      const pt = points[i];
      const part = parts[pt.pi];
      let w;
      if (part.kind === "static") {
        w = add(part.c, pt.p);
        w[1] -= P.bob;
      } else {
        w = P[part.id](pt.p);
      }
      // a touch of shimmer — the "reconstruction" settling
      const jit = reduceMotion ? 0 : Math.sin(t * 3 + pt.j * 40) * 0.003;
      w[0] += jit; w[2] -= jit;

      const q = proj(w);
      const near = Math.abs(w[1] - scanY);
      const scanBoost = near < 0.05 ? 1 - near / 0.05 : 0;
      const depthA = depthFade(q[2], 1.6, 0.3);
      const a = Math.min(1, 0.6 * depthA + scanBoost * 0.9);
      const s = Math.max(1.2, q[3] * 0.011) * (1 + scanBoost * 0.6);
      ctx.fillStyle = scanBoost > 0.2 ? `rgba(230,250,255,${a})` : colorFor(w[1], a);
      ctx.fillRect(q[0] - s / 2, q[1] - s / 2, s, s);
    }
    ctx.globalCompositeOperation = "source-over";

    // scan plane outline
    ctx.beginPath();
    for (let k = 0; k <= 64; k++) {
      const a = (k / 64) * Math.PI * 2;
      const q = proj([Math.cos(a) * 0.45, scanY, Math.sin(a) * 0.45]);
      k ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]);
    }
    ctx.strokeStyle = "rgba(94,231,255,0.35)";
    ctx.stroke();

    // HUD
    if (hudTime && !reduceMotion) {
      const ms = Math.floor(t * 1000);
      const m = Math.floor(ms / 60000) % 60;
      const s = Math.floor(ms / 1000) % 60;
      hudTime.textContent = `t ${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(ms % 1000).padStart(3, "0")}`;
      hudFrame.textContent = `frame ${String(Math.floor(t * FPS_LABEL) % 10000).padStart(4, "0")}`;
    }

    if (running && !reduceMotion) rafId = requestAnimationFrame(draw);
  };

  const startLoop = () => {
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(draw);
  };

  const onResize = () => {
    resize();
    if (reduceMotion || !running) draw(performance.now());
  };
  resize();
  window.addEventListener("resize", onResize);

  // Pause when the hero is off-screen or the tab is hidden.
  if ("IntersectionObserver" in window && !reduceMotion) {
    new IntersectionObserver(([en]) => {
      running = en.isIntersecting && !document.hidden;
      if (running) startLoop();
    }).observe(canvas);
  }
  document.addEventListener("visibilitychange", () => {
    if (reduceMotion) return;
    running = !document.hidden;
    if (running) startLoop();
  });

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(onResize);
  startLoop();
})();
