// Three.js Chess Board Renderer - Proper perspective from white's side

class ChessBoardRenderer {
  constructor(containerElement) {
    this.container = containerElement;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.boardGroup = null;
    this.pieces = {};
    this.selectedSquare = null;

    if (typeof THREE === 'undefined') {
      console.error('Three.js not loaded. Retrying...');
      setTimeout(() => this.initialize(), 500);
    } else {
      this.initialize();
    }
  }

  initialize() {
    const width  = this.container.clientWidth;
    const height = this.container.clientHeight;

    // ── Scene ──────────────────────────────────────────────────────────────
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf5e6d3);

    // ── Camera ─────────────────────────────────────────────────────────────
    // Straight-on perspective from white's side (slightly elevated)
    this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    // Center on X, elevated on Y, in front of white on +Z
    this.camera.position.set(0, 9, 11);
    this.camera.lookAt(0, 0, 0);

    // ── Renderer ───────────────────────────────────────────────────────────
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.container.appendChild(this.renderer.domElement);

    // ── Lighting ───────────────────────────────────────────────────────────
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.55));

    const sun = new THREE.DirectionalLight(0xffffff, 0.85);
    sun.position.set(5, 14, 8);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left   = -15;
    sun.shadow.camera.right  =  15;
    sun.shadow.camera.top    =  15;
    sun.shadow.camera.bottom = -15;
    sun.shadow.camera.far    = 50;
    this.scene.add(sun);

    // Fill light from opposite side
    const fill = new THREE.DirectionalLight(0xffffff, 0.3);
    fill.position.set(-5, 8, -8);
    this.scene.add(fill);

    this.createBoard();

    window.addEventListener('resize', () => this.onWindowResize());
    this.animate();
  }

  // ── Board ─────────────────────────────────────────────────────────────────
  createBoard() {
    this.boardGroup = new THREE.Group();
    this.scene.add(this.boardGroup);

    const SQ  = 1.4;   // square size
    const SH  = 0.12;  // square height
    const OFF = 4.9;   // offset to center: (7 * 1.4) / 2 ≈ 4.9

    // Board base slab
    const baseGeom = new THREE.BoxGeometry(SQ * 8 + 0.3, SH * 0.8, SQ * 8 + 0.3);
    const baseMat  = new THREE.MeshStandardMaterial({ color: 0x5c3d1e, roughness: 0.9 });
    const base = new THREE.Mesh(baseGeom, baseMat);
    base.position.y = -SH * 0.9;
    base.receiveShadow = true;
    this.boardGroup.add(base);

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const isLight = (row + col) % 2 === 0;
        const sqGeom  = new THREE.BoxGeometry(SQ, SH, SQ);
        const sqMat   = new THREE.MeshStandardMaterial({
          color: isLight ? 0xf0ddb0 : 0x8b5e3c,
          roughness: 0.7,
          metalness: 0.0
        });
        const sq = new THREE.Mesh(sqGeom, sqMat);
        sq.position.set(col * SQ - OFF, 0, row * SQ - OFF);
        sq.receiveShadow = true;
        sq.userData = { type: 'square', row, col };
        this.boardGroup.add(sq);

        // Highlight overlay (invisible until needed)
        const hlGeom = new THREE.PlaneGeometry(SQ * 0.88, SQ * 0.88);
        const hlMat  = new THREE.MeshStandardMaterial({
          color: 0x44ff44,
          transparent: true,
          opacity: 0,
          depthWrite: false
        });
        const hl = new THREE.Mesh(hlGeom, hlMat);
        hl.rotation.x = -Math.PI / 2;
        hl.position.set(col * SQ - OFF, SH / 2 + 0.01, row * SQ - OFF);
        hl.userData = { type: 'highlight', row, col };
        this.boardGroup.add(hl);
      }
    }
  }

  // ── Pieces ────────────────────────────────────────────────────────────────
  addPiece(row, col, piece) {
    const key = `${row}-${col}`;
    const SQ  = 1.4;
    const OFF = 4.9;

    if (this.pieces[key]) {
      this.boardGroup.remove(this.pieces[key]);
      delete this.pieces[key];
    }
    if (!piece) return;

    const isWhite = piece.color === 'white';
    const mat = new THREE.MeshStandardMaterial({
      color    : isWhite ? 0xf8f0e0 : 0x1a1008,
      roughness: 0.35,
      metalness: 0.45,
      emissive : isWhite ? 0x666655 : 0x222211
    });

    const group = this.buildPiece(piece.type, mat);
    group.position.set(col * SQ - OFF, 0.12, row * SQ - OFF);
    group.userData = { piece, row, col, key, type: 'piece' };
    group.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });

    this.boardGroup.add(group);
    this.pieces[key] = group;
  }

  buildPiece(type, mat) {
    const s = 0.52; // base size unit

    const mesh  = (geom) => new THREE.Mesh(geom, mat);
    const cyl   = (rt, rb, h, seg=16) => new THREE.CylinderGeometry(rt, rb, h, seg);
    const cone  = (r, h, seg=16)      => new THREE.ConeGeometry(r, h, seg);
    const sph   = (r, seg=16)         => new THREE.SphereGeometry(r, seg, seg);
    const box   = (x, y, z)           => new THREE.BoxGeometry(x, y, z);

    const g = new THREE.Group();

    // Piece labels: what letter to show and at what height (y)
    const labels = {
      king:   { letter: 'K', topY: s * 1.37 },
      queen:  { letter: 'Q', topY: s * 1.10 },
      rook:   { letter: 'R', topY: s * 1.07 },
      bishop: { letter: 'B', topY: s * 1.28 },
      knight: { letter: 'N', topY: s * 0.96 },
      pawn:   { letter: 'P', topY: s * 0.52 },
    };

    switch (type) {
      case 'pawn': {
        const base = mesh(cyl(s*0.38, s*0.44, s*0.55));
        const neck = mesh(cyl(s*0.22, s*0.3,  s*0.18));
        const head = mesh(sph(s*0.3));
        neck.position.y = s * 0.37;
        head.position.y = s * 0.55;
        g.add(base, neck, head);
        break;
      }
      case 'knight': {
        const base  = mesh(cyl(s*0.38, s*0.44, s*0.5));
        const body  = mesh(cyl(s*0.28, s*0.38, s*0.35));
        const head  = mesh(box(s*0.55, s*0.65, s*0.38));
        const snout = mesh(box(s*0.35, s*0.22, s*0.28));
        base.position.y  = 0;
        body.position.y  = s * 0.42;
        head.position.y  = s * 0.88;
        snout.position.y = s * 0.78;
        snout.position.z = s * 0.3;
        g.add(base, body, head, snout);
        break;
      }
      case 'bishop': {
        const base  = mesh(cyl(s*0.38, s*0.44, s*0.52));
        const neck  = mesh(cyl(s*0.2,  s*0.3,  s*0.18));
        const body  = mesh(cyl(s*0.26, s*0.2,  s*0.55));
        const tip   = mesh(cone(s*0.18, s*0.42));
        const ball  = mesh(sph(s*0.12));
        neck.position.y = s * 0.35;
        body.position.y = s * 0.72;
        tip.position.y  = s * 1.17;
        ball.position.y = s * 1.4;
        g.add(base, neck, body, tip, ball);
        break;
      }
      case 'rook': {
        const base = mesh(cyl(s*0.42, s*0.46, s*0.5));
        const body = mesh(cyl(s*0.35, s*0.42, s*0.6));
        const top  = mesh(cyl(s*0.42, s*0.35, s*0.22));
        base.position.y = 0;
        body.position.y = s * 0.55;
        top.position.y  = s * 0.96;
        g.add(base, body, top);
        for (let i = 0; i < 4; i++) {
          const cr = mesh(box(s*0.18, s*0.26, s*0.18));
          const a  = (Math.PI / 2) * i + Math.PI / 4;
          cr.position.set(Math.cos(a)*s*0.32, s*1.14, Math.sin(a)*s*0.32);
          g.add(cr);
        }
        break;
      }
      case 'queen': {
        const base  = mesh(cyl(s*0.4,  s*0.46, s*0.5));
        const waist = mesh(cyl(s*0.22, s*0.32, s*0.22));
        const body  = mesh(cyl(s*0.34, s*0.22, s*0.7));
        const crown = mesh(sph(s*0.3));
        base.position.y  = 0;
        waist.position.y = s * 0.36;
        body.position.y  = s * 0.77;
        crown.position.y = s * 1.22;
        g.add(base, waist, body, crown);
        for (let i = 0; i < 5; i++) {
          const sp = mesh(cone(s*0.07, s*0.3));
          const a  = (Math.PI * 2 / 5) * i;
          sp.position.set(Math.cos(a)*s*0.28, s*1.42, Math.sin(a)*s*0.28);
          g.add(sp);
        }
        break;
      }
      case 'king': {
        const base  = mesh(cyl(s*0.42, s*0.46, s*0.5));
        const waist = mesh(cyl(s*0.22, s*0.34, s*0.22));
        const body  = mesh(cyl(s*0.32, s*0.22, s*0.75));
        const head  = mesh(cyl(s*0.36, s*0.32, s*0.2));
        base.position.y  = 0;
        waist.position.y = s * 0.36;
        body.position.y  = s * 0.8;
        head.position.y  = s * 1.27;
        g.add(base, waist, body, head);
        const cv = mesh(box(s*0.1, s*0.42, s*0.1));
        const ch = mesh(box(s*0.32, s*0.1, s*0.1));
        cv.position.y = s * 1.68;
        ch.position.y = s * 1.78;
        g.add(cv, ch);
        break;
      }
      default: {
        g.add(mesh(cyl(s*0.35, s*0.42, s*0.85)));
      }
    }

    // Add a floating label disc above the piece
    if (labels[type]) {
      const label = labels[type];
      const disc = this._makeLabelDisc(label.letter, mat.color.getHex());
      disc.position.y = label.topY + s * 0.22;
      g.add(disc);
    }

    return g;
  }

  // Creates a thin disc with a letter on it using a canvas texture
  _makeLabelDisc(letter, pieceColor) {
    const size   = 128;
    const canvas = document.createElement('canvas');
    canvas.width  = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Background circle — contrasting color
    const isLight = pieceColor > 0x888888;
    const bgColor   = isLight ? '#1a1008' : '#f8f0e0';
    const textColor = isLight ? '#f8f0e0' : '#1a1008';

    ctx.beginPath();
    ctx.arc(size/2, size/2, size/2 - 4, 0, Math.PI * 2);
    ctx.fillStyle = bgColor;
    ctx.fill();

    // Letter
    ctx.font = `bold ${size * 0.58}px Arial, sans-serif`;
    ctx.fillStyle = textColor;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(letter, size/2, size/2 + 4);

    const texture = new THREE.CanvasTexture(canvas);
    const geo = new THREE.CircleGeometry(0.52 * 0.38, 32);
    const mat = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false });
    const disc = new THREE.Mesh(geo, mat);
    disc.rotation.x = -Math.PI / 2; // face upward
    return disc;
  }

  // ── Highlights ────────────────────────────────────────────────────────────
  highlightSquare(row, col, color = 0x44ff44) {
    const highlights = this.boardGroup.children.filter(c => c.userData.type === 'highlight');
    highlights.forEach(h => { h.material.opacity = 0; });

    const target = highlights.find(h => h.userData.row === row && h.userData.col === col);
    if (target) {
      target.material.color.setHex(color);
      target.material.opacity = 0.45;
    }
    this.selectedSquare = { row, col };
  }

  clearHighlights() {
    this.boardGroup.children
      .filter(c => c.userData.type === 'highlight')
      .forEach(h => { h.material.opacity = 0; });
    this.selectedSquare = null;
  }

  // ── Ray-cast click to board square ────────────────────────────────────────
  getSquareAtPixel(x, y) {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(
      (x / this.container.clientWidth)  *  2 - 1,
      (y / this.container.clientHeight) * -2 + 1
    );
    raycaster.setFromCamera(mouse, this.camera);

    const squares = this.boardGroup.children.filter(c => c.userData.type === 'square');
    const hits = raycaster.intersectObjects(squares);
    return hits.length > 0 ? hits[0].object.userData : null;
  }

  // ── Sync board state ──────────────────────────────────────────────────────
  updateBoard(board) {
    Object.keys(this.pieces).forEach(key => {
      this.boardGroup.remove(this.pieces[key]);
    });
    this.pieces = {};

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        this.addPiece(row, col, board[row][col]);
      }
    }
  }

  // ── Render loop ───────────────────────────────────────────────────────────
  animate() {
    requestAnimationFrame(() => this.animate());
    this.renderer.render(this.scene, this.camera);
  }

  onWindowResize() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  dispose() {
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}

export default ChessBoardRenderer;
