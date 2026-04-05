// Three.js scene setup for Monument Valley–style chess board

class ChessBoardRenderer {
  constructor(containerElement) {
    this.container = containerElement;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.boardGroup = null;
    this.pieces = {};
    this.selectedSquare = null;

    // Check if Three.js is available
    if (typeof THREE === 'undefined') {
      console.error('Three.js not loaded. Waiting...');
      setTimeout(() => this.initialize(), 500);
    } else {
      this.initialize();
    }
  }

  initialize() {
    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf5e6d3);

    // Camera setup - angled isometric view for better visibility
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    const aspect = width / height;

    // Use perspective camera for realistic 3D view at an angle
    this.camera = new THREE.PerspectiveCamera(
      45,           // field of view
      aspect,       // aspect ratio
      0.1,          // near clipping plane
      1000          // far clipping plane
    );
    
    // Position camera at 45-degree angle for isometric view
    this.camera.position.set(8, 8, 8);
    this.camera.lookAt(0, 0, 0);

    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // Lighting - optimized for angled view
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 15, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -20;
    directionalLight.shadow.camera.right = 20;
    directionalLight.shadow.camera.top = 20;
    directionalLight.shadow.camera.bottom = -20;
    this.scene.add(directionalLight);

    // Create board
    this.createBoard();

    // Handle window resize
    window.addEventListener('resize', () => this.onWindowResize());

    // Start animation loop
    this.animate();
  }

  createBoard() {
    this.boardGroup = new THREE.Group();
    this.scene.add(this.boardGroup);

    const colors = {
      light: 0xf0e6d2,
      dark: 0x8b7355
    };

    const squareSize = 1.4;  // Much larger squares
    const squareHeight = 0.1;

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const isLight = (row + col) % 2 === 0;
        const color = isLight ? colors.light : colors.dark;

        // Create square geometry
        const squareGeom = new THREE.BoxGeometry(squareSize, squareHeight, squareSize);
        const squareMat = new THREE.MeshStandardMaterial({
          color: color,
          roughness: 0.8,
          metalness: 0.0
        });

        const square = new THREE.Mesh(squareGeom, squareMat);
        square.position.set(col * squareSize - 4.9, 0, row * squareSize - 4.9);
        square.castShadow = true;
        square.receiveShadow = true;
        square.userData = { row, col };

        // Add subtle highlight for legal moves
        const highlightGeom = new THREE.PlaneGeometry(squareSize * 0.85, squareSize * 0.85);
        const highlightMat = new THREE.MeshStandardMaterial({
          color: 0xffff00,
          transparent: true,
          opacity: 0,
          emissive: 0xffff00
        });
        const highlight = new THREE.Mesh(highlightGeom, highlightMat);
        highlight.position.set(col * squareSize - 4.9, 0.06, row * squareSize - 4.9);
        highlight.userData = { type: 'highlight', row, col };

        this.boardGroup.add(square);
        this.boardGroup.add(highlight);
      }
    }
  }

  addPiece(row, col, piece) {
    const key = `${row}-${col}`;
    const squareSize = 1.4;

    // Remove existing piece at this location
    if (this.pieces[key]) {
      this.boardGroup.remove(this.pieces[key]);
    }

    if (!piece) {
      delete this.pieces[key];
      return;
    }

    // Bright contrasting colors for pieces
    const color = piece.color === 'white' ? 0xffffff : 0x000000;
    const geometry = this.getPieceGeometry(piece.type);
    
    const material = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.3,
      metalness: 0.5,
      emissive: piece.color === 'white' ? 0x888888 : 0x333333
    });

    // Create container group for piece
    const pieceGroup = new THREE.Group();
    pieceGroup.position.set(col * squareSize - 4.9, 0.1, row * squareSize - 4.9);
    pieceGroup.userData = { piece, row, col, key };

    // Handle both Group and Geometry returns from getPieceGeometry
    if (geometry.isGroup) {
      // Composite piece (like rook, bishop, queen, king)
      geometry.children.forEach(child => {
        if (child.geometry) {
          const mesh = new THREE.Mesh(child.geometry, material);
          mesh.position.copy(child.position);
          mesh.rotation.copy(child.rotation);
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          pieceGroup.add(mesh);
        }
      });
    } else {
      // Simple geometry (like pawn)
      const pieceModel = new THREE.Mesh(geometry, material);
      pieceModel.castShadow = true;
      pieceModel.receiveShadow = true;
      pieceGroup.add(pieceModel);
    }

    this.boardGroup.add(pieceGroup);
    this.pieces[key] = pieceGroup;
  }

  getPieceGeometry(type) {
    const size = 0.55;

    switch (type) {
      case 'pawn':
        // Pawn: small sphere on top of a cylinder
        const pawnGroup = new THREE.Group();
        const pawnBase = new THREE.CylinderGeometry(size * 0.35, size * 0.4, size * 0.5, 16);
        const pawnHead = new THREE.SphereGeometry(size * 0.28, 16, 16);
        const pawnBaseMesh = new THREE.Mesh(pawnBase);
        const pawnHeadMesh = new THREE.Mesh(pawnHead);
        pawnHeadMesh.position.y = size * 0.45;
        pawnGroup.add(pawnBaseMesh);
        pawnGroup.add(pawnHeadMesh);
        return pawnGroup;

      case 'knight':
        // Knight: tall box (horse head approximation)
        return new THREE.BoxGeometry(size * 0.5, size * 1.0, size * 0.45);

      case 'bishop':
        // Bishop: cone on cylinder
        const bishopGroup = new THREE.Group();
        const bishopBase = new THREE.CylinderGeometry(size * 0.35, size * 0.4, size * 0.5, 16);
        const bishopTop = new THREE.ConeGeometry(size * 0.32, size * 0.85, 16);
        const bishopBaseMesh = new THREE.Mesh(bishopBase);
        const bishopTopMesh = new THREE.Mesh(bishopTop);
        bishopTopMesh.position.y = size * 0.75;
        bishopGroup.add(bishopBaseMesh);
        bishopGroup.add(bishopTopMesh);
        return bishopGroup;

      case 'rook':
        // Rook: castle tower with crenellations
        const rookGroup = new THREE.Group();
        const rookBase = new THREE.CylinderGeometry(size * 0.4, size * 0.4, size * 0.95, 16);
        const rookBaseMesh = new THREE.Mesh(rookBase);
        rookGroup.add(rookBaseMesh);
        // Add top squares for crenellations
        for (let i = 0; i < 4; i++) {
          const crenGeom = new THREE.BoxGeometry(size * 0.15, size * 0.3, size * 0.15);
          const crenMesh = new THREE.Mesh(crenGeom);
          const angle = (Math.PI / 2) * i;
          crenMesh.position.x = Math.cos(angle) * size * 0.35;
          crenMesh.position.z = Math.sin(angle) * size * 0.35;
          crenMesh.position.y = size * 0.6;
          rookGroup.add(crenMesh);
        }
        return rookGroup;

      case 'queen':
        // Queen: cylinder with decorative crown on top
        const queenGroup = new THREE.Group();
        const queenBase = new THREE.CylinderGeometry(size * 0.32, size * 0.38, size * 0.6, 16);
        const queenMid = new THREE.CylinderGeometry(size * 0.28, size * 0.32, size * 0.5, 16);
        const queenTop = new THREE.SphereGeometry(size * 0.25, 16, 16);
        const queenBaseMesh = new THREE.Mesh(queenBase);
        const queenMidMesh = new THREE.Mesh(queenMid);
        const queenTopMesh = new THREE.Mesh(queenTop);
        queenMidMesh.position.y = size * 0.55;
        queenTopMesh.position.y = size * 1.0;
        queenGroup.add(queenBaseMesh);
        queenGroup.add(queenMidMesh);
        queenGroup.add(queenTopMesh);
        return queenGroup;

      case 'king':
        // King: tall crown with cross on top
        const kingGroup = new THREE.Group();
        const kingBase = new THREE.CylinderGeometry(size * 0.3, size * 0.36, size * 0.6, 16);
        const kingMid = new THREE.CylinderGeometry(size * 0.26, size * 0.3, size * 0.6, 16);
        const kingTop = new THREE.SphereGeometry(size * 0.22, 16, 16);
        const kingCross1 = new THREE.BoxGeometry(size * 0.08, size * 0.35, size * 0.08);
        const kingCross2 = new THREE.BoxGeometry(size * 0.08, size * 0.35, size * 0.08);
        const kingBaseMesh = new THREE.Mesh(kingBase);
        const kingMidMesh = new THREE.Mesh(kingMid);
        const kingTopMesh = new THREE.Mesh(kingTop);
        const kingCross1Mesh = new THREE.Mesh(kingCross1);
        const kingCross2Mesh = new THREE.Mesh(kingCross2);
        kingMidMesh.position.y = size * 0.6;
        kingTopMesh.position.y = size * 1.05;
        kingCross1Mesh.position.y = size * 1.25;
        kingCross2Mesh.position.y = size * 1.25;
        kingCross2Mesh.rotation.z = Math.PI / 2;
        kingGroup.add(kingBaseMesh);
        kingGroup.add(kingMidMesh);
        kingGroup.add(kingTopMesh);
        kingGroup.add(kingCross1Mesh);
        kingGroup.add(kingCross2Mesh);
        return kingGroup;

      default:
        return new THREE.CylinderGeometry(size * 0.35, size * 0.4, size * 0.8, 16);
    }
  }

  highlightSquare(row, col, color = 0xffff00) {
    const highlights = this.boardGroup.children.filter(child => child.userData.type === 'highlight');
    highlights.forEach(h => {
      h.material.opacity = 0;
    });

    const target = highlights.find(h => h.userData.row === row && h.userData.col === col);
    if (target) {
      target.material.color.setHex(color);
      target.material.opacity = 0.3;
    }

    this.selectedSquare = { row, col };
  }

  clearHighlights() {
    const highlights = this.boardGroup.children.filter(child => child.userData.type === 'highlight');
    highlights.forEach(h => {
      h.material.opacity = 0;
    });
    this.selectedSquare = null;
  }

  getSquareAtPixel(x, y) {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    mouse.x = (x / width) * 2 - 1;
    mouse.y = -(y / height) * 2 + 1;

    raycaster.setFromCamera(mouse, this.camera);

    const squares = this.boardGroup.children.filter(
      child => child.geometry instanceof THREE.BoxGeometry
    );

    const intersects = raycaster.intersectObjects(squares);
    if (intersects.length > 0) {
      const square = intersects[0].object;
      return square.userData;
    }

    return null;
  }

  updateBoard(board) {
    // Clear all pieces
    Object.keys(this.pieces).forEach(key => {
      this.boardGroup.remove(this.pieces[key]);
    });
    this.pieces = {};

    // Add pieces from new board state
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        this.addPiece(row, col, piece);
      }
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.renderer.render(this.scene, this.camera);
  }

  onWindowResize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    const aspect = width / height;

    // Update perspective camera
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
    
    this.renderer.setSize(width, height);
  }

  dispose() {
    this.renderer.dispose();
    this.container.removeChild(this.renderer.domElement);
  }
}

export default ChessBoardRenderer;
