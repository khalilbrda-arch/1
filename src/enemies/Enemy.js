/**
 * Enemy.js
 * --------
 * المرحلة 6 — Enemy Base.
 *
 * يمثل عدوًا واحدًا.
 *
 * ملاحظة:
 * المشروع يستخدم Three.js r128،
 * لذلك لا نستخدم CapsuleGeometry لأنها غير متوفرة
 * في الإصدار الموجود بالمشروع.
 *
 * النموذج الحالي Prototype فقط.
 * سيتم استبداله بالنموذج النهائي في مرحلة الـVisual Overhaul.
 */

class Enemy {
  constructor(data = {}) {
    this.id =
      data.id ||
      `enemy_${Date.now()}_${Math.floor(Math.random() * 100000)}`;

    this.name =
      data.name || "Basic Enemy";

    this.type =
      data.type || "basic";

    this.maxHp =
      data.maxHp ?? 20;

    this.hp =
      data.hp ?? this.maxHp;

    this.speed =
      data.speed ?? 2.2;

    this.armor =
      data.armor ?? 0;

    this.resistance =
      data.resistance ?? 0;

    this.damage =
      data.damage ?? 10;

    this.isBoss = data.isBoss === true;
    this.bossId = data.bossId || null;
    this.bossPhase = data.bossPhase || 0;
    this.damageMultiplier = 1;
    this.speedMultiplier = 1;
    this.worldSpeedMultiplier = 1;

    this.reward =
      data.reward ?? 5;

    this.target =
      data.target || "base";

    this.statusEffects = [];

    this.model = null;

    this.animationState = "walk";

    // المسافة التي قطعها العدو على المسار.
    this.pathDistance = 0;

    this.alive = true;
    this.reachedBase = false;

    this._buildModel();
  }

  // =========================================================
  // PROTOTYPE MODEL
  // =========================================================

  _buildModel() {
    const group = new THREE.Group();
    const boss = this.isBoss;
    const scale = boss ? 2.7 : 1;
    const bodyColor = boss ? 0x5a244f : 0xb93e57;
    const accent = boss ? 0xff4fd8 : 0xff768d;
    const dark = boss ? 0x161426 : 0x241a25;
    const bodyGeo = new THREE.CylinderGeometry(.45*scale,.60*scale,1.05*scale, boss?12:10);
    const bodyMat = new THREE.MeshStandardMaterial({color:bodyColor,roughness:.58,metalness:boss?.22:.05,flatShading:false});
    const body = new THREE.Mesh(bodyGeo,bodyMat); body.position.y=.62*scale; body.castShadow=true; group.add(body);
    if(boss){
      const coreGeo=new THREE.SphereGeometry(.28*scale,16,12);
      const coreMat=new THREE.MeshStandardMaterial({color:0x5cf2ff,emissive:0x5cf2ff,emissiveIntensity:2.4,metalness:.4,roughness:.2});
      const core=new THREE.Mesh(coreGeo,coreMat); core.position.set(0,.8*scale,.47*scale); core.castShadow=true; group.add(core);
      const crown=new THREE.ConeGeometry(.52*scale,.72*scale,8);
      const crownMat=new THREE.MeshStandardMaterial({color:0x352040,roughness:.45,metalness:.35});
      const c=new THREE.Mesh(crown,crownMat); c.position.y=1.48*scale; c.rotation.y=Math.PI/8; c.castShadow=true; group.add(c);
      for(let i=0;i<4;i++){const eye=new THREE.Mesh(new THREE.SphereGeometry(.085*scale,10,8),new THREE.MeshBasicMaterial({color:accent}));const a=i*Math.PI/2;eye.position.set(Math.cos(a)*.28*scale,1.05*scale,Math.sin(a)*.28*scale+.30*scale);group.add(eye);}
      const ring=new THREE.Mesh(new THREE.TorusGeometry(.92*scale,.045*scale,8,48),new THREE.MeshBasicMaterial({color:accent,transparent:true,opacity:.65}));ring.rotation.x=Math.PI/2;ring.position.y=.12*scale;group.add(ring);this._bossRing=ring;
      for(let i=0;i<6;i++){const p=new THREE.Mesh(new THREE.ConeGeometry(.11*scale,.48*scale,5),new THREE.MeshStandardMaterial({color:dark,metalness:.4,roughness:.4}));const a=i*Math.PI/3;p.position.set(Math.cos(a)*.55*scale,.48*scale,Math.sin(a)*.55*scale);p.rotation.z=Math.cos(a)*.45;p.rotation.x=Math.sin(a)*.45;group.add(p);}
    } else {
      const head=new THREE.Mesh(new THREE.SphereGeometry(.43,14,10),new THREE.MeshStandardMaterial({color:0xd85368,roughness:.7}));head.position.y=1.2;head.castShadow=true;group.add(head);
      for(const x of [-.14,.14]){const eye=new THREE.Mesh(new THREE.SphereGeometry(.07,8,6),new THREE.MeshBasicMaterial({color:0x111111}));eye.position.set(x,1.24,.37);group.add(eye);}
    }
    group.userData.owner='enemy';group.userData.enemyId=this.id;group.userData.enemy=this;this.model=group;
  }

  // =========================================================
  // OBJECT
  // =========================================================

  getObject() {
    return this.model;
  }

  // =========================================================
  // UPDATE
  // =========================================================

  update(delta) {
    if (
      !this.alive ||
      this.reachedBase
    ) {
      return;
    }

    const safeDelta =
      Math.max(
        0,
        Math.min(delta, 0.1)
      );

    // المرحلة 9 — Status Effects (قسم 139): يُطبَّق أي تأثير حالة نشط
    // (مثل سم يُنقص HP دوريًا) قبل الحركة. قد يقتل العدو هذا الإطار.
    this._updateStatusEffects(safeDelta);

    if (!this.alive) {
      return;
    }

    this.pathDistance +=
      this.speed *
      this.getSpeedMultiplier() *
      this.speedMultiplier *
      this.worldSpeedMultiplier *
      safeDelta;

    const totalLength =
      EnemyPath.getTotalLength();

    if (
      this.pathDistance >=
      totalLength
    ) {
      this.pathDistance =
        totalLength;

      this.reachedBase = true;

      this.animationState =
        "attack";

      this._updateTransform();

      return;
    }

    this._updateTransform();
  }

  // =========================================================
  // TRANSFORM
  // =========================================================

  _updateTransform() {
    if (!this.model) {
      return;
    }

    const position =
      EnemyPath.getPositionAtDistance(
        this.pathDistance
      );

    const direction =
      EnemyPath.getDirectionAtDistance(
        this.pathDistance
      );

    /*
     * الأرض = Y 2
     *
     * العدو يقف فوق الأرض،
     * لذلك نرفع النموذج قليلًا.
     */
    this.model.position.set(
      position.x,
      position.y,
      position.z
    );

    if (this.isBoss && this._bossRing) this._bossRing.rotation.z += 0.9 * Math.min(0.05, Math.max(0, (typeof GameTime!=="undefined" ? GameTime.delta : 0)));

    if (
      Math.abs(direction.x) > 0.001 ||
      Math.abs(direction.z) > 0.001
    ) {
      this.model.rotation.y =
        Math.atan2(
          direction.x,
          direction.z
        );
    }
  }

  // =========================================================
  // STATUS EFFECTS (المرحلة 9 — قسم 23/139)
  // =========================================================
  //
  // بنية عامة فقط بهذه المرحلة — لا يوجد بعد أي دفاع يستدعي applyStatus
  // ("cannon" ضرر مباشر بلا عنصر). جاهزة لأنواع دفاعات مستقبلية
  // (Freeze Tower → "slow"، Poison Tower → "poison") دون أي تعديل هنا.

  /**
   * إضافة/تجديد تأثير حالة.
   * type: "slow" (value = نسبة إبطاء 0..1) أو "poison" (value = ضرر/ثانية).
   */
  applyStatus(type, opts = {}) {
    if (!this.alive) {
      return;
    }

    const duration =
      Math.max(0, Number(opts.duration) || 0);

    const value =
      Number(opts.value) || 0;

    const existing =
      this.statusEffects.find(
        (effect) => effect.type === type
      );

    if (existing) {
      existing.duration =
        Math.max(existing.duration, duration);

      existing.value = value;
    } else {
      this.statusEffects.push({
        type,
        value,
        duration,
      });
    }
  }

  _updateStatusEffects(delta) {
    if (this.statusEffects.length === 0) {
      return;
    }

    const remaining = [];

    for (const effect of this.statusEffects) {
      effect.duration -= delta;

      if (effect.type === "poison") {
        const tick = effect.value * delta;

        this.hp =
          Math.max(0, this.hp - tick);

        if (this.hp <= 0 && this.alive) {
          this.die();
        }
      }

      if (effect.duration > 0) {
        remaining.push(effect);
      }
    }

    this.statusEffects = remaining;
  }

  /**
   * مضاعف السرعة الحالي بسبب تأثيرات الإبطاء ("slow"). 1 = بلا تأثير.
   */
  getSpeedMultiplier() {
    const slow =
      this.statusEffects.find(
        (effect) => effect.type === "slow"
      );

    if (!slow) {
      return 1;
    }

    return Math.max(0.2, 1 - slow.value);
  }

  // =========================================================
  // DAMAGE
  // =========================================================

  takeDamage(amount) {
    if (!this.alive) {
      return {
        killed: false,
        damage: 0,
        remainingHp: 0,
      };
    }

    const rawDamage =
      Math.max(
        0,
        Number(amount) || 0
      );

    /*
     * Armor يقلل الضرر.
     *
     * أقل ضرر فعلي = 1
     * حتى لا يصبح العدو غير قابل للقتل
     * بسبب Armor في الأنظمة المستقبلية.
     */
    const effectiveDamage =
      Math.max(
        1,
        rawDamage * this.damageMultiplier - this.armor
      );

    this.hp =
      Math.max(
        0,
        this.hp - effectiveDamage
      );

    if (
      this.hp <= 0
    ) {
      this.die();

      return {
        killed: true,
        damage: effectiveDamage,
        remainingHp: 0,
      };
    }

    return {
      killed: false,
      damage: effectiveDamage,
      remainingHp: this.hp,
    };
  }

  // =========================================================
  // DEATH
  // =========================================================

  die() {
    if (!this.alive) {
      return;
    }

    this.alive = false;

    this.animationState =
      "death";
  }

  // =========================================================
  // HP
  // =========================================================

  getHpRatio() {
    if (
      this.maxHp <= 0
    ) {
      return 0;
    }

    return (
      this.hp /
      this.maxHp
    );
  }

  // =========================================================
  // BASE
  // =========================================================

  hasReachedBase() {
    return this.reachedBase;
  }

  // =========================================================
  // CLEANUP
  // =========================================================

  destroy() {
    if (
      this.model &&
      this.model.parent
    ) {
      this.model.parent.remove(
        this.model
      );
    }

    this.model = null;
  }
}
