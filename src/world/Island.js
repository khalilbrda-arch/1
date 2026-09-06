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
    this._buildDock();
    this._buildCrystals();
    this._buildLanterns();

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

  _buildDock() {
    const g=new THREE.Group();
    const wood=new THREE.MeshStandardMaterial({color:0x6d4936,roughness:.72,metalness:.05});
    for(let i=0;i<6;i++){const plank=new THREE.Mesh(new THREE.BoxGeometry(.65,.16,3.2),wood);plank.position.set(i*.7-1.75,1.85,-13.2);plank.rotation.y=.08;plank.castShadow=true;g.add(plank);}
    for(let i=0;i<3;i++){const post=new THREE.Mesh(new THREE.CylinderGeometry(.12,.15,2.3,8),wood);post.position.set(i*2-2,1,-14.5);post.castShadow=true;g.add(post);}
    this.group.add(g);
  },

  _buildCrystals() {
    const spots=[[-8,-5,.8],[9,-7,1.1],[-7,8,.65],[7,7,.9],[11,0,.7]];
    for(const [x,z,scale] of spots){
      const g=new THREE.Group();
      const mat=new THREE.MeshStandardMaterial({color:0x69dfff,emissive:0x1a7e9b,emissiveIntensity:1.5,roughness:.25,metalness:.18});
      for(let i=0;i<3;i++){const c=new THREE.Mesh(new THREE.ConeGeometry(.22*scale,.85*scale,6),mat);c.position.set((i-1)*.24*scale,.45*scale,(i%2)*.18*scale);c.rotation.z=(i-1)*.2;c.castShadow=true;g.add(c);}
      const glow=new THREE.PointLight(0x69dfff,.8,3,2);glow.position.y=.7*scale;g.add(glow);
      g.position.set(x,2,z);this.group.add(g);
    }
  },

  _buildLanterns(){
    const spots=[[-11,-1],[11,2],[-2,11],[3,-11]];
    for(const [x,z] of spots){const g=new THREE.Group();const post=new THREE.Mesh(new THREE.CylinderGeometry(.08,.11,1.5,8),new THREE.MeshStandardMaterial({color:0x354657,metalness:.55,roughness:.4}));post.position.y=.75;g.add(post);const lamp=new THREE.Mesh(new THREE.SphereGeometry(.18,12,8),new THREE.MeshStandardMaterial({color:0xffd98a,emissive:0xff9a42,emissiveIntensity:2.2}));lamp.position.y=1.55;g.add(lamp);const light=new THREE.PointLight(0xffb45b,.65,4,2);light.position.y=1.55;g.add(light);g.position.set(x,2,z);this.group.add(g);}
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
