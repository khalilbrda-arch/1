const WorldFX = {
  scene: null,
  rain: null,
  lightning: null,
  ring: null,
  _flash: 0,
  init(scene) {
    if (!scene || typeof THREE === "undefined") return;
    this.scene = scene;
    this._buildRain();
    this._buildLightning();
    const geo = new THREE.RingGeometry(2.5, 2.7, 48);
    const mat = new THREE.MeshBasicMaterial({ color: 0x79d9ff, transparent: true, opacity: .0, side: THREE.DoubleSide });
    this.ring = new THREE.Mesh(geo, mat); this.ring.rotation.x = -Math.PI/2; this.ring.position.set(0,2.08,0); scene.add(this.ring);
  },
  _buildRain() {
    const count=520, positions=new Float32Array(count*3);
    for(let i=0;i<count;i++){ positions[i*3]=(Math.random()-.5)*55; positions[i*3+1]=8+Math.random()*24; positions[i*3+2]=(Math.random()-.5)*55; }
    const geo=new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.BufferAttribute(positions,3));
    const mat=new THREE.PointsMaterial({color:0xb9e8ff,size:.09,transparent:true,opacity:.0,depthWrite:false});
    this.rain=new THREE.Points(geo,mat); this.scene.add(this.rain);
  },
  _buildLightning(){ this.lightning=new THREE.PointLight(0xdff7ff,0,60,2); this.lightning.position.set(6,12,-8); this.scene.add(this.lightning); },
  update(delta,world){
    if(!this.scene || !world) return;
    const storm=world.weatherId==='storm', rain=world.weatherId==='rain';
    if(this.rain){ this.rain.material.opacity=storm?.42:rain?.23:0; const p=this.rain.geometry.attributes.position; for(let i=1;i<p.count*3;i+=3){ let y=p.array[i]-delta*18; if(y<2.5)y=28+Math.random()*6; p.array[i]=y; } p.needsUpdate=true; }
    if(this.ring){ this.ring.material.opacity=storm ? .18 : .0; this.ring.scale.setScalar(1+Math.sin(performance.now()/240)*.06); }
    this._flash=Math.max(0,this._flash-delta); this.lightning.intensity=this._flash>0?5:0;
    if(storm && Math.random()<delta*.05){ this._flash=.08; }
  }
};
if(typeof globalThis!=='undefined') globalThis.WorldFX=WorldFX;