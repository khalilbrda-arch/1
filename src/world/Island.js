/**
 * Island.js
 * ---------
 * نظام الجزيرة. يبني جزيرة البداية (الخليج الهادئ) من:
 * قاعدة رملية + تلة عشب + أشجار نخيل + صخور.
 * مستقل عن أي نظام آخر. يُرجع Group واحد يُضاف للمشهد.
 */

const Island = {
  group: null,

  create(scene) {
    this.group = new THREE.Group();

    this._buildSandBase();
    this._buildGrassHill();
    this._buildPalmTree(6, 3, 1);
    this._buildPalmTree(-5, 5, 0.85);
    this._buildPalmTree(4, -6, 0.9);
    this._buildRock(-7, 1, -2);
    this._buildRock(8, 1, 2);
    this._buildRock(-3, 1, 7);

    scene.add(this.group);
    return this.group;
  },

  _buildSandBase() {
    const geo = new THREE.CylinderGeometry(14, 16, 2, 8, 1);
    const mat = new THREE.MeshStandardMaterial({
      color: CONFIG.WORLD.SAND_COLOR,
      flatShading: true,
      roughness: 1,
    });
    const sand = new THREE.Mesh(geo, mat);
    sand.position.y = 1;
    sand.receiveShadow = true;
    sand.castShadow = true;
    this.group.add(sand);
  },

  _buildGrassHill() {
    const geo = new THREE.ConeGeometry(10, 6, 8, 1);
    const mat = new THREE.MeshStandardMaterial({
      color: CONFIG.WORLD.GRASS_COLOR,
      flatShading: true,
      roughness: 0.85,
    });
    const grass = new THREE.Mesh(geo, mat);
    grass.position.y = 4.5;
    grass.castShadow = true;
    grass.receiveShadow = true;
    this.group.add(grass);
  },

  _buildPalmTree(x, z, scale = 1) {
    const g = new THREE.Group();

    const trunkGeo = new THREE.CylinderGeometry(0.15, 0.25, 3.2, 6);
    const trunkMat = new THREE.MeshStandardMaterial({
      color: 0x8a5a34,
      flatShading: true,
    });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 1.6;
    trunk.castShadow = true;
    g.add(trunk);

    const leafMat = new THREE.MeshStandardMaterial({
      color: 0x3fae5c,
      flatShading: true,
    });
    for (let i = 0; i < 5; i++) {
      const leafGeo = new THREE.ConeGeometry(0.35, 1.8, 4);
      const leaf = new THREE.Mesh(leafGeo, leafMat);
      leaf.position.y = 3.2;
      leaf.rotation.z = Math.PI / 2.3;
      leaf.rotation.y = (i / 5) * Math.PI * 2;
      leaf.position.x = Math.cos((i / 5) * Math.PI * 2) * 0.6;
      leaf.position.z = Math.sin((i / 5) * Math.PI * 2) * 0.6;
      leaf.castShadow = true;
      g.add(leaf);
    }

    g.position.set(x, 0, z);
    g.scale.setScalar(scale);
    this.group.add(g);
  },

  _buildRock(x, y, z) {
    const geo = new THREE.DodecahedronGeometry(1, 0);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x8a8f96,
      flatShading: true,
      roughness: 0.9,
    });
    const rock = new THREE.Mesh(geo, mat);
    rock.position.set(x, y, z);
    rock.scale.setScalar(0.7 + Math.random() * 0.6);
    rock.rotation.set(Math.random(), Math.random(), Math.random());
    rock.castShadow = true;
    rock.receiveShadow = true;
    this.group.add(rock);
  },
};
