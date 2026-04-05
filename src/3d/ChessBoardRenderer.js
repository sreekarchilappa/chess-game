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
    this.scene.background = new THREE.Color(0xf5e6d3); // Warm cream background

    // Camera setup - isometric-like view
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    const aspect = width / height;

    this.camera = new THREE.PerspectiveCamera(35, aspect, 0.1, 1000);
    // Position camera to view board centered and from above-right angle
    this.camera.position.set(12, 12, 12);
    this.camera.lookAt(3.5, 0, 3.5);

    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // Lighting - soft Monument Valley style
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffb6a3, 0.9);
    directionalLight.position.set(15, 20, 15);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -25;
    directionalLight.shadow.camera.right = 25;
    directionalLight.shadow.camera.top = 25;
    directionalLight.shadow.camera.bottom = -25;
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
      light: 0xe8d4c0,
      dark: 0xc9a878
    };

    const squareSize = 1.1;  // Larger squares
    const squareHeight = 0.15;

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const isLight = (row + col) % 2 === 0;
        const color = isLight ? colors.light : colors.dark;

        // Create square geometry (slightly raised for 3D effect)
        const squareGeom = new THREE.BoxGeometry(squareSize, squareHeight, squareSize);
        const squareMat = new THREE.MeshStandardMaterial({
          color: color,
          roughness: 0.7,
          metalness: 0.1
        });

        const square = new THREE.Mesh(squareGeom, squareMat);
        square.position.set(col * squareSize, 0, row * squareSize);
        square.castShadow = true;
        square.receiveShadow = true;
        square.userData = { row, col };

        // Add subtle highlight for legal moves
        const highlightGeom = new THREE.PlaneGeometry(squareSize * 0.9, squareSize * 0.9);
        const highlightMat = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0
        });
        const highlight = new THREE.Mesh(highlightGeom, highlightMat);
        highlight.position.set(col * squareSize, squareHeight / 2 + 0.01, row * squareSize);
        highlight.userData = { type: 'highlight', row, col };

        this.boardGroup.add(square);
        this.boardGroup.add(highlight);
      }
    }

    // Center the board in the viewport
    const boardSize = squareSize * 8;
    this.boardGroup.position.set(-boardSize / 2, 0, -boardSize / 2);
  }

  addPiece(row, col, piece) {
    const key = `${row}-${col}`;
    const squareSize = 1.1;

    // Remove existing piece at this location
    if (this.pieces[key]) {
      this.boardGroup.remove(this.pieces[key]);
    }

    if (!piece) {
      delete this.pieces[key];
      return;
    }

    const color = piece.color === 'white' ? 0xf5f5f5 : 0x333333;
    const geometry = this.getPieceGeometry(piece.type);
    
    // Create mesh with material
    const material = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.5,
      metalness: 0.3
    });

    const pieceModel = new THREE.Mesh(geometry, material);
    pieceModel.position.set(col * squareSize, 0.8, row * squareSize);
    pieceModel.castShadow = true;
    pieceModel.receiveShadow = true;
    pieceModel.userData = { piece, row, col, key };

    this.boardGroup.add(pieceModel);
    this.pieces[key] = pieceModel;
  }

  getPieceGeometry(type) {
    const size = 0.25;

    switch (type) {
      case 'pawn':
        return new THREE.ConeGeometry(size * 0.4, size * 0.8, 8);

      case 'knight':
        // Simple sphere for knight
        return new THREE.SphereGeometry(size * 0.4, 8, 8);

      case 'bishop':
        // Tall cone
        return new THREE.ConeGeometry(size * 0.35, size * 1.2, 8);

      case 'rook':
        // Cylinder
        return new THREE.CylinderGeometry(size * 0.35, size * 0.4, size * 0.9, 4);

      case 'queen':
        // Taller cone
        return new THREE.ConeGeometry(size * 0.4, size * 1.4, 8);

      case 'king':
        // Tallest cone
        return new THREE.ConeGeometry(size * 0.35, size * 1.6, 8);
        const kingGeom = new THREE.ConeGeometry(size * 0.35, size * 1.6, 8);
        return kingGeom;

      default:
        return new THREE.BoxGeometry(size, size, size);
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

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  dispose() {
    this.renderer.dispose();
    this.container.removeChild(this.renderer.domElement);
  }
}

export default ChessBoardRenderer;
