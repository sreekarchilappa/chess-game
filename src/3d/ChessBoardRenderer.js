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

    // Camera setup - full viewport view
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    const aspect = width / height;

    // Use orthographic camera for cleaner chess view
    const viewSize = 15;
    this.camera = new THREE.OrthographicCamera(
      -viewSize * aspect / 2,
      viewSize * aspect / 2,
      viewSize / 2,
      -viewSize / 2,
      0.1,
      1000
    );
    this.camera.position.set(0, 10, 0);
    this.camera.lookAt(0, 0, 0);

    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // Lighting - strong for clarity
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9);
    directionalLight.position.set(5, 20, 5);
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
      metalness: 0.4,
      emissive: piece.color === 'white' ? 0x999999 : 0x444444
    });

    const pieceModel = new THREE.Mesh(geometry, material);
    pieceModel.position.set(col * squareSize - 4.9, 0.1, row * squareSize - 4.9);
    pieceModel.castShadow = true;
    pieceModel.receiveShadow = true;
    pieceModel.userData = { piece, row, col, key };

    // Add outline/edge to make pieces more visible
    const edges = new THREE.EdgesGeometry(geometry);
    const lineSegments = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({
      color: piece.color === 'white' ? 0x000000 : 0xffffff,
      linewidth: 2
    }));
    lineSegments.position.copy(pieceModel.position);

    this.boardGroup.add(pieceModel);
    this.boardGroup.add(lineSegments);
    this.pieces[key] = pieceModel;
  }

  getPieceGeometry(type) {
    const size = 0.65; // Increased from 0.45 to make pieces bigger

    switch (type) {
      case 'pawn':
        // Small cone with base
        return new THREE.ConeGeometry(size * 0.5, size * 0.9, 16);

      case 'knight':
        // Box shape - distinctive
        return new THREE.BoxGeometry(size * 0.6, size * 1.0, size * 0.5);

      case 'bishop':
        // Tall thin cone
        return new THREE.ConeGeometry(size * 0.42, size * 1.3, 16);

      case 'rook':
        // Short wide cylinder
        return new THREE.CylinderGeometry(size * 0.48, size * 0.5, size * 0.95, 16);

      case 'queen':
        // Tall cylinder
        return new THREE.CylinderGeometry(size * 0.45, size * 0.48, size * 1.2, 16);

      case 'king':
        // Tallest cylinder with different proportions
        return new THREE.CylinderGeometry(size * 0.42, size * 0.46, size * 1.4, 16);

      default:
        return new THREE.CylinderGeometry(size * 0.45, size * 0.48, size * 0.95, 16);
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
    const viewSize = 15;

    if (this.camera.isOrthographicCamera) {
      this.camera.left = -viewSize * aspect / 2;
      this.camera.right = viewSize * aspect / 2;
      this.camera.top = viewSize / 2;
      this.camera.bottom = -viewSize / 2;
      this.camera.updateProjectionMatrix();
    }
    
    this.renderer.setSize(width, height);
  }

  dispose() {
    this.renderer.dispose();
    this.container.removeChild(this.renderer.domElement);
  }
}

export default ChessBoardRenderer;
