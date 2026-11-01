// godsworm-sprites.js - sprites d'unités 3/4 (face, dos, profil) façon Age of Empires.
// Dessinés en code au premier affichage (aucune image à charger), aux couleurs de FACTION_COLORS.
// Se branche sur WarlikeSprites.draw : en cas d'erreur, l'ancien rendu pixel est utilisé.
(() => {
  'use strict';
  if (typeof WarlikeSprites === 'undefined') return;

  const K = 4, N = 64, S = N * K, LW = 1.5 * K, LW2 = LW / 2 + 1;
  const OL = 'rgb(26,24,30)';
  const SKIN = [236, 194, 154], HAIR = [104, 72, 46], PANTS = [82, 64, 52], BOOT = [66, 48, 36];
  const METAL = [170, 176, 188], DMETAL = [106, 112, 124], WOOD = [140, 96, 56], STRAW = [222, 190, 100], MAIL = [150, 156, 168];
  const BLADE = [232, 236, 244], WHITE = [245, 245, 245];
  const FALLBACK = { pagan: '#2e7d32', crusader: '#b71c1c', northmen: '#1f4e8f', nomad: '#8c5b1f', neutral: '#555555' };
  const ROLES = ['peasant', 'warrior', 'archer', 'crusader', 'priest'];
  const ALIAS = { knight: 'crusader', paladin: 'crusader', mage: 'priest', priest: 'priest', scout: 'archer', soldier: 'warrior' };

  const mix = (c, t, k) => c.map((v, i) => v * (1 - k) + t[i] * k);
  const lt = (c, k = .3) => mix(c, [255, 255, 255], k);
  const dk = (c, k = .35) => mix(c, [0, 0, 0], k);
  const css = c => typeof c === 'string' ? c : 'rgb(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ')';
  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));

  function factionColor(fac) {
    let h = FALLBACK[fac] || FALLBACK.neutral;
    if (typeof FACTION_COLORS !== 'undefined' && FACTION_COLORS[fac] && FACTION_COLORS[fac].base) h = FACTION_COLORS[fac].base;
    return lt(hex(h), .12);
  }

  function renderFrame(role, fac, dr, step) {
    const cv = document.createElement('canvas'); cv.width = cv.height = S;
    const g = cv.getContext('2d'); g.lineJoin = 'round';
    const E = (cx, cy, rx, ry, fill, ol = true) => {
      g.beginPath(); g.ellipse(cx * K, cy * K, rx * K, ry * K, 0, 0, Math.PI * 2); g.fillStyle = css(fill); g.fill();
      if (ol) { g.lineWidth = LW; g.strokeStyle = OL; g.stroke(); }
    };
    const R = (x0, y0, x1, y1, r, fill) => {
      x0 *= K; y0 *= K; x1 *= K; y1 *= K; r = Math.min(r * K, (x1 - x0) / 2, (y1 - y0) / 2);
      g.beginPath(); g.moveTo(x0 + r, y0); g.lineTo(x1 - r, y0); g.arcTo(x1, y0, x1, y0 + r, r); g.lineTo(x1, y1 - r); g.arcTo(x0 + r, y1, x0, y1, r); g.lineTo(x0, y0 + r); g.arcTo(x0, y0, x0 + r, y0, r); g.closePath();
      g.fillStyle = css(fill); g.fill(); g.lineWidth = LW; g.strokeStyle = OL; g.stroke();
    };
    const P = (pts, fill, ol = true) => {
      g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0] * K, p[1] * K) : g.moveTo(p[0] * K, p[1] * K)); g.closePath();
      g.fillStyle = css(fill); g.fill(); if (ol) { g.lineWidth = LW2; g.strokeStyle = OL; g.stroke(); }
    };
    const stroke = (pts, w, col, cap) => {
      g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0] * K, p[1] * K) : g.moveTo(p[0] * K, p[1] * K));
      g.lineCap = cap; g.lineWidth = w; g.strokeStyle = css(col); g.stroke();
    };
    const L = (a, b, w, fill) => { stroke([a, b], w * K + 2 * LW, OL, 'round'); stroke([a, b], w * K, fill, 'round'); };
    const line = (a, b, w, fill) => stroke([a, b], w * K, fill, 'butt');
    const pie = (cx, cy, rx, ry, a0, a1, fill, ol) => {
      g.beginPath(); g.moveTo(cx * K, cy * K); g.ellipse(cx * K, cy * K, rx * K, ry * K, 0, a0 * Math.PI / 180, a1 * Math.PI / 180); g.closePath();
      g.fillStyle = css(fill); g.fill(); if (ol) { g.lineWidth = LW; g.strokeStyle = OL; g.stroke(); }
    };

    const C = factionColor(fac), CD = dk(C, .3);
    const b = (step === 1 || step === 3) ? -1 : 0;
    const lg = [0, 3, 0, -3][step], sw = lg * 0.6;
    const side = dr === 'side', back = dr === 'up', robe = role === 'priest';
    const tunic = { peasant: C, warrior: MAIL, archer: [88, 112, 68], crusader: [168, 174, 186], priest: [232, 228, 216] }[role];

    // jambes / robe
    if (robe) {
      const o = lg * 0.8;
      if (!side) P([[22, 40 + b], [42, 40 + b], [46 + o, 58], [18 - o, 58]], tunic);
      else P([[24, 40 + b], [40, 40 + b], [44 + o, 58], [22 + o * .3, 58]], tunic);
      line([side ? 24 : 20, 57], [side ? 42 : 44, 57], 2.4, C);
    } else if (!side) {
      for (const [sg, xc] of [[-1, 26.5], [1, 37.5]]) { const off = -lg * sg; L([xc, 46], [xc, 55 + off], 7, PANTS); E(xc, 57 + off, 4.6, 3.2, BOOT); }
    } else {
      for (const sg of [-1, 1]) { const fx = 32 + lg * 1.3 * sg; L([32, 46], [fx, 56], 7, sg < 0 ? dk(PANTS, .15) : PANTS); E(fx + 1.6, 57.5, 5, 3, BOOT); }
    }
    // accessoires dorsaux
    if (role === 'archer' && (back || side)) {
      R(back ? 37 : 24, 24 + b, back ? 43 : 29, 44 + b, 2, [122, 84, 52]);
      for (const x of back ? [38.5, 40.5] : [25, 27]) line([x, 24 + b], [x + 1, 19 + b], 1.6, [230, 220, 180]);
    }
    if (role === 'crusader' && back) P([[23, 28 + b], [41, 28 + b], [44, 56], [20, 56]], dk(C, .15));
    // tronc
    const tx0 = side ? 25 : 22, tx1 = side ? 39 : 42;
    R(tx0, 27 + b, tx1, 47 + b, 5, tunic);
    E((tx0 + tx1) / 2 - 2, 31 + b, 4, 2.6, lt(tunic, .35), false);
    if (role === 'peasant') line([tx0 + 2, 31 + b], [tx1 - 2, 44 + b], 3.6, CD);
    if (role === 'warrior') R(27, 28 + b, 37, 47 + b, 2, C);
    if (role === 'archer') line([tx0, 40 + b], [tx1, 40 + b], 2.4, [70, 52, 36]);
    if (role === 'crusader') {
      R(tx0 + 1, 27 + b, tx1 - 1, 53, 3, C);
      if (!back) { line([side ? 33 : 32, 29 + b], [side ? 33 : 32, 51], 3, WHITE); line([side ? 28 : 26, 35 + b], [38, 35 + b], 3, WHITE); }
    }
    if (role === 'priest') {
      line([tx0, 40 + b], [tx1, 40 + b], 3, C);
      if (!back) line([side ? 33 : 32, 28 + b], [side ? 33 : 32, 56], 3.4, C);
    }
    // bras
    const hl = [17, 42 + b + sw], hr = [47, 42 + b - sw];
    let hb, hf;
    if (!side) {
      L([22, 30 + b], [hl[0] + 1, hl[1] - 3], 6, tunic); L([42, 30 + b], [hr[0] - 1, hr[1] - 3], 6, tunic);
      E(hl[0], hl[1], 3.2, 3.2, SKIN); E(hr[0], hr[1], 3.2, 3.2, SKIN);
    } else {
      hb = [28 - sw * 1.4, 42 + b]; hf = [37 + sw * 1.4, 42 + b];
      L([31, 30 + b], [hb[0], hb[1] - 3], 6, dk(tunic, .12)); E(hb[0], hb[1], 3.1, 3.1, SKIN);
    }
    // tête
    const hx = side ? 33 : 32;
    E(hx, 19 + b, 8, 8.4, SKIN);
    if (side) {
      E(hx + 8, 20 + b, 1.6, 1.8, SKIN); E(hx + 4.2, 18 + b, 1, 1.2, OL, false);
      pie(hx, 19.5 + b, 8, 8.5, 90, 270, HAIR, false);
    } else if (back) E(hx, 19 + b, 8, 8.4, HAIR);
    else { E(hx - 3, 19.5 + b, 1.1, 1.4, OL, false); E(hx + 3, 19.5 + b, 1.1, 1.4, OL, false); }
    // couvre-chef
    if (role === 'peasant') {
      E(hx, 14 + b, 13, 4.8, STRAW); E(hx, 12 + b, 7, 5.2, lt(STRAW, .15)); line([hx - 7, 13.5 + b], [hx + 7, 13.5 + b], 2, C);
    } else if (role === 'warrior') {
      E(hx, 14.6 + b, 9, 6.6, METAL); E(hx, 17 + b, 11, 2.8, DMETAL); line([hx, 8.4 + b], [hx, 17 + b], 1.8, DMETAL);
      if (!back && !side) line([hx, 17 + b], [hx, 23 + b], 1.8, DMETAL);
    } else if (role === 'archer' || role === 'priest') {
      const hc = role === 'archer' ? C : [240, 236, 226];
      if (back) { E(hx, 18.4 + b, 9.4, 9.6, hc); line([hx, 10 + b], [hx, 26 + b], 1.2, dk(hc, .25)); }
      else if (side) { pie(hx, 18.7 + b, 9.6, 9.7, 80, 280, hc, true); E(hx + 4, 11 + b, 4.5, 3, hc, false); }
      else { E(hx, 18 + b, 10, 10, hc); E(hx, 20 + b, 6.2, 7, SKIN); E(hx - 2.8, 20 + b, 1.1, 1.4, OL, false); E(hx + 2.8, 20 + b, 1.1, 1.4, OL, false); }
      if (role === 'priest') line([hx - 7, 27 + b], [hx + 7, 27 + b], 2, C);
    } else if (role === 'crusader') {
      R(hx - 8.5, 9 + b, hx + 8.5, 27 + b, 4, METAL);
      if (!back && !side) { R(hx - 6, 17 + b, hx + 6, 19.6 + b, .6, OL); line([hx, 10 + b], [hx, 27 + b], 1.8, DMETAL); }
      if (side) R(hx + 1, 17 + b, hx + 8.6, 19.6 + b, .6, OL);
      E(hx, 8.4 + b, 3.6, 5, C);
    }
    // armes / objets
    if (role === 'peasant') {
      if (!side) { line([hr[0], hr[1] + 6], [hr[0] + 1, 8 + b], 3, WOOD); P([[hr[0] - 4, 10 + b], [hr[0] + 1, 4 + b], [hr[0] + 6, 10 + b]], METAL); }
      else {
        line([hf[0], hf[1] + 8], [hf[0] + 4, 12 + b], 3, WOOD); P([[hf[0] + 1, 14 + b], [hf[0] + 5, 7 + b], [hf[0] + 9, 14 + b]], METAL);
        L([31, 30 + b], [hf[0], hf[1] - 3], 6, tunic); E(hf[0], hf[1], 3.1, 3.1, SKIN);
      }
    } else if (role === 'warrior' || role === 'crusader') {
      const big = role === 'crusader', arm = role === 'warrior' ? MAIL : METAL;
      if (!side) {
        E(hl[0] - 1, hl[1] - 2, big ? 8 : 7, big ? 10 : 8.6, C); E(hl[0] - 1, hl[1] - 2, 3.2, 3.2, METAL); if (back) E(hl[0], hl[1], 3.2, 3.2, SKIN);
        L([42, 30 + b], [hr[0] - 1, hr[1] - 3], 6, arm); E(hr[0], hr[1], 3.2, 3.2, SKIN);
        P([[hr[0] - 2.4, hr[1] - 2], [hr[0], 11 + b], [hr[0] + 2.4, hr[1] - 2]], BLADE); R(hr[0] - 5, hr[1] - 4, hr[0] + 5, hr[1] - 1.6, .8, DMETAL);
      } else {
        L([33, 30 + b], [hf[0], hf[1] - 3], 6, arm); E(hf[0], hf[1], 3.1, 3.1, SKIN);
        P([[hf[0] + 1, hf[1] - 3], [hf[0] + 12, 14 + b], [hf[0] + 14, 16 + b], [hf[0] + 4, hf[1] - 1]], BLADE); R(hf[0] - 2, hf[1] - 5, hf[0] + 6, hf[1] - 2, .8, DMETAL);
        E(29, 37 + b, 5.6, big ? 9 : 8, C); E(29, 37 + b, 2.4, 2.4, METAL);
      }
    } else if (role === 'archer') {
      const bx = side ? 41 : 12;
      const pts = side ? [[bx - 3, 12 + b], [bx + 3, 24 + b], [bx + 3, 36 + b], [bx - 3, 48 + b]] : [[bx + 3, 12 + b], [bx - 3, 24 + b], [bx - 3, 36 + b], [bx + 3, 48 + b]];
      stroke(pts, 4.4 * K, OL, 'round'); stroke(pts, 2.4 * K, WOOD, 'round'); line(pts[0], pts[3], .6, [240, 240, 225]);
      if (!side) E(hl[0], hl[1], 3.2, 3.2, SKIN);
      else { L([33, 30 + b], [hf[0], hf[1] - 3], 6, [88, 112, 68]); E(bx, 38 + b, 3.1, 3.1, SKIN); }
    } else if (role === 'priest') {
      const sx = side ? 41 : hr[0];
      line([sx, 58], [sx, 8 + b], 2.8, WOOD); E(sx, 7 + b, 3.2, 3.2, [240, 205, 80]);
      if (!side) { E(hr[0], hr[1], 3.2, 3.2, SKIN); if (back) E(hl[0], hl[1], 3.2, 3.2, SKIN); }
      else { L([33, 30 + b], [sx - 1, 38 + b], 6, tunic); E(sx, 38 + b, 3.1, 3.1, SKIN); }
    }
    const out = document.createElement('canvas'); out.width = out.height = N;
    const o = out.getContext('2d'); o.imageSmoothingEnabled = true; o.imageSmoothingQuality = 'high'; o.drawImage(cv, 0, 0, N, N);
    return out;
  }

  const cache = new Map();
  function frame(role, fac, dir, step) {
    const key = role + '|' + fac + '|' + dir + '|' + step;
    let f = cache.get(key); if (!f) { f = renderFrame(role, fac, dir, step); cache.set(key, f); }
    return f;
  }

  const api = {
    frame,
    draw(ctx, u) {
      let role = ALIAS[u.type] || u.type; if (!ROLES.includes(role)) role = 'warrior';
      const face = u.spriteFacing || 'down';
      const dir = face === 'up' ? 'up' : (face === 'down' ? 'down' : 'side');
      const step = u.state === 'moving' ? Math.floor((u.spriteClock || 0) / 130) % 4 : 0;
      ctx.save(); ctx.translate(u.x, u.y);
      if (face === 'left') ctx.scale(-1, 1);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(frame(role, u.faction || 'neutral', dir, step), -24, -34, 48, 48);   // pieds alignés sur l'ombre (y + 9)
      ctx.restore();
    }
  };
  globalThis.GodswormSprites = api;

  const legacyDraw = WarlikeSprites.draw;
  WarlikeSprites.draw = function (ctx, u) {
    try { api.draw(ctx, u); } catch (e) { WarlikeSprites.draw = legacyDraw; legacyDraw.call(WarlikeSprites, ctx, u); }
  };
})();
