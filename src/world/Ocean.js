/**
 * Ocean.js
 * --------
 * نظام المحيط. مسؤول فقط عن إنشاء وتحريك سطح الماء.
 * مستقل تمامًا عن أي نظام آخر (لا يعرف شيئًا عن الجزيرة أو اللاعب).
 */

const Ocean = {
  mesh: null,
  _geometry: null,
  _basePositions: null,
  worldWaveMultiplier: 1,

  create(scene) {
    const size = CONFIG.WORLD.OCEAN_SIZE;
    const segments = CONFIG.WORLD.OCEAN_SEGMENTS;

    this._geometry = new THREE.PlaneGeometry(size, size, segments, segments);
    const material = new THREE.MeshPhongMaterial({
      color: CONFIG.WORLD.OCEAN_COLOR,
      shininess: 90,
      specular: 0x88d8ff,
      transparent: true,
      opacity: 0.92,
    });

    this.mesh = new THREE.Mesh(this._geometry, material);
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.position.y = 0;
    this.mesh.receiveShadow = true;
    scene.add(this.mesh);

    if (typeof EventBus !== "undefined") {
      EventBus.on("WorldModifiersChanged", (payload) => {
        const value = payload && Number(payload.oceanMultiplier);
        this.worldWaveMultiplier = Number.isFinite(value) && value > 0 ? value : 1;
      });
    }

    this._basePositions = new Float32Array(this._geometry.attributes.position.array);
  },

  update(elapsedTime) {
    if (!this._geometry) return;
    const pos = this._geometry.attributes.position;
    const wave = CONFIG.WORLD.WAVE_AMPLITUDE * this.worldWaveMultiplier;

    for (let i = 0; i < pos.count; i++) {
      const x = this._basePositions[i * 3];
      const z = this._basePositions[i * 3 + 2];
      const y =
        Math.sin(x * 0.15 + elapsedTime * 1.1) * wave +
        Math.cos(z * 0.18 + elapsedTime * 0.8) * wave;
      pos.setY(i, y);
    }
    pos.needsUpdate = true;
  },
};
