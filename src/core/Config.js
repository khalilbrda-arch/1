/**
 * Config.js
 * ---------
 * المكان المركزي لكل الأرقام والإعدادات المهمة بالمشروع.
 * حسب GAME_SPEC.md قسم 78 — "الأرقام المهمة مركزية".
 *
 * تحديث جذري (v0.4): إلغاء نظام Player بمنظور First-Person بالكامل.
 * اللعبة الآن كاميرا ثابتة الزاوية من فوق (أسلوب Clash of Clans / RTS)،
 * بدون أي شخصية لاعب، تحكم فقط بالسحب (Pan) والتكبير/التصغير (Pinch Zoom).
 */

const CONFIG = {
  // ---------- عام ----------
  VERSION: "0.13.0",

  // ---------- الكاميرا (ثابتة الزاوية، لا تدور، فقط سحب وتكبير) ----------
  CAMERA: {
    FOV: 50,
    NEAR: 0.1,
    FAR: 1000,

    // زاوية الميلان بالدرجات، مقاسة من الأرض:
    // 0 = أفقي تمامًا (منظور شخص واقف) | 90 = عمودي تمامًا من فوق (خريطة مسطحة).
    // القيمة الحالية (58) تعطي منظرًا مائلًا شبيهًا بـ Clash of Clans:
    // تشوف واجهات المباني والمشهد بشكل جميل، وليس منظرًا علويًا مسطحًا.
    // غيّر هذا الرقم فقط لتغيير زاوية الكاميرا بالكامل، بدون لمس أي كود آخر.
    TILT_ANGLE_DEG: 58,
  },

  // ---------- تحكم الكاميرا (Pan + Zoom فقط — لا يوجد شخصية لاعب) ----------
  CAMERA_CONTROL: {
    // نقطة الأرض التي تنظر لها الكاميرا في البداية (مركز الجزيرة تقريبًا)
    START_TARGET: { x: 0, y: 0, z: 0 },

    // المسافة بين الكاميرا ونقطة النظر — يتحكم بها المستخدم بإصبعين (Zoom)
    DISTANCE_MIN: 14,
    DISTANCE_MAX: 55,
    DISTANCE_START: 30,

    // حساسية السحب بإصبع واحد (Pan)
    PAN_SPEED: 0.045,

    // حساسية التكبير/التصغير بإصبعين (Pinch)
    ZOOM_SPEED: 0.06,

    // حدود تحرك نقطة النظر حتى لا تبتعد الكاميرا كثيرًا عن الجزيرة والقاعدة
    PAN_BOUNDS: {
      MIN_X: -50,
      MAX_X: 50,
      MIN_Z: -50,
      MAX_Z: 50,
    },
  },

  // ---------- الإضاءة ----------
  LIGHTING: {
    HEMISPHERE_SKY_COLOR: 0xbfe3ff,
    HEMISPHERE_GROUND_COLOR: 0x1a3a2a,
    HEMISPHERE_INTENSITY: 0.7,
    SUN_COLOR: 0xfff0d0,
    SUN_INTENSITY: 1.4,
  },

  // ---------- الأداء ----------
  PERFORMANCE: {
    MAX_PIXEL_RATIO: 2,
    TARGET_FPS: 60,
  },

  // ---------- الخلفية / السماء ----------
  SKY: {
    TOP_COLOR: 0x4fa8d8,
    BOTTOM_COLOR: 0xdff3ff,
  },

  // ---------- العالم ----------
  WORLD_SYSTEMS: {
    DAY_NIGHT: {
      CYCLE_SECONDS: 120,
      MIN_LIGHT_FACTOR: 0.15,
    },
    EVENT_INTERVAL_SECONDS: 45,
    WEATHER_SEQUENCE: ["rain", "clear", "storm", "clear"],
    WEATHER: {
      clear: {
        id: "clear", name: "سماء صافية",
        oceanMultiplier: 1, fogDensityMultiplier: 1,
        defenseRangeMultiplier: 1, enemySpeedMultiplier: 1,
      },
      rain: {
        id: "rain", name: "مطر",
        oceanMultiplier: 1.15, fogDensityMultiplier: 1.2,
        defenseRangeMultiplier: 0.94, enemySpeedMultiplier: 0.96,
      },
      storm: {
        id: "storm", name: "عاصفة",
        oceanMultiplier: 1.45, fogDensityMultiplier: 1.5,
        defenseRangeMultiplier: 0.82, enemySpeedMultiplier: 0.9,
      },
    },
    EVENTS: [
      { id: "rain_window", duration: 12, weatherId: "rain" },
      { id: "tidal_surge", duration: 12, weatherId: "storm" },
      { id: "calm_window", duration: 8, weatherId: "clear" },
    ],
  },

  // ---------- العالم المتقدم (المرحلة 13 — Advanced World) ----------
  // تعريفات NPC/story/rules فقط؛ AdvancedWorldSystem يملك الحالة.
  ADVANCED_WORLD: {
    NPCS: [
      { id: "npc_keeper", name: "حارس الخليج", x: -5, z: -6, radius: 0.65, height: 1.7, color: 0x6f8fd8, dialogue: "الخليج يتغير مع العاصفة. راقب قواعد الخريطة الجديدة." },
      { id: "npc_cartographer", name: "رسّام الخرائط", x: 5, z: -6, radius: 0.65, height: 1.7, color: 0xd89b5f, dialogue: "الممرات ثابتة، لكن الظروف حولها ليست كذلك." },
    ],
    STORY_CHAPTERS: [
      { id: "story_arrival", title: "وصول إلى الخليج", trigger: "npc_interacted", npcId: "npc_keeper" },
      { id: "story_first_campaign", title: "أول حملة", trigger: "wave_completed", target: 1 },
      { id: "story_boss_signal", title: "إشارة الزعيم", trigger: "boss_defeated" },
    ],
    MAP_RULES: {
      storm_build_restriction: {
        id: "storm_build_restriction",
        type: "build_restriction",
        center: { x: 0, z: -10 },
        radius: 4,
        description: "المنطقة الشمالية معرضة للمد أثناء العاصفة."
      },
    },
    DYNAMIC_EVENTS: [
      { id: "storm_surge_hazard", triggerWorldEventId: "tidal_surge", mapRuleId: "storm_build_restriction" },
    ],
  },

  WORLD: {
    OCEAN_SIZE: 300,
    OCEAN_SEGMENTS: 120,
    OCEAN_COLOR: 0x1fa3c8,
    WAVE_AMPLITUDE: 0.35,
    SAND_COLOR: 0xe8c67a,
    GRASS_COLOR: 0x4caf6a,
  },

  // ---------- التفاعل مع عناصر الخريطة (قسم 39 بالمواصفات — World Interaction) ----------
  // لا يوجد استكشاف: هذه العناصر ظاهرة ومكانها ثابت منذ بداية اللعبة، تُجمع/تُفتح بالنقر (Tap) فقط.
  INTERACTABLES: {
    // صناديق كنز — تُفتح بنقرة واحدة، تعطي مكافأة ذهب أكبر، ثم تختفي نهائيًا.
    CHESTS: [
      { id: "chest_1", x: 10, z: 5, reward: 25 },
      { id: "chest_2", x: -10, z: -5, reward: 25 },
      { id: "chest_3", x: 2, z: -10, reward: 30 },
    ],
    // عقد موارد — تُجمع بنقرة واحدة، مكافأة أصغر، تختفي بعد الجمع.
    RESOURCES: [
      { id: "res_1", x: 3, z: 3, reward: 5 },
      { id: "res_2", x: -3, z: -8, reward: 5 },
      { id: "res_3", x: 7, z: -3, reward: 5 },
      { id: "res_4", x: -7, z: 3, reward: 5 },
      { id: "res_5", x: 0, z: 8, reward: 5 },
      { id: "res_6", x: 5, z: 8, reward: 5 },
    ],

    CHEST_COLOR: 0xffcc33,
    CHEST_SIZE: 0.9,
    RESOURCE_COLOR: 0x66ddaa,
    RESOURCE_SIZE: 0.45,

    // ارتفاع سطح الجزيرة تقريبًا (أعلى الرمل) — العناصر توضع فوقه.
    GROUND_Y: 2,

    // حركة تعويم بسيطة (Bobbing) لجذب الانتباه للعنصر القابل للتفاعل.
    BOB_SPEED: 2,
    BOB_HEIGHT: 0.15,

    // دوران بطيء ثابت لإعطاء إحساس "قابل للتفاعل" بصريًا.
    SPIN_SPEED: 0.6,
  },

  // ---------- إدخال النقر (Tap) — منفصل عن Pan/Zoom (قسم 75 بالمواصفات) ----------
  TAP_INPUT: {
    // أقصى مسافة حركة (بالبكسل) لا تزال تُعتبر "نقرة" وليست سحبًا.
    MAX_MOVE_PX: 12,
    // أقصى مدة زمنية (بالمللي ثانية) لا تزال تُعتبر "نقرة" وليست ضغطًا مطوّلًا.
    MAX_DURATION_MS: 300,
  },

  // ---------- خريطة الدفاع (قسم 135 بالمواصفات — المرحلة 5: DEFENSE MAP) ----------
  // هذه المرحلة بصرية/تركيبية فقط: مسار + نقطة ظهور + قاعدة + مناطق بناء.
  // الدفاعات لاحقًا (مرحلة 8) تُوضع بحرية بأي مكان بعيد عن المسار — لا خانات ثابتة.
  // لا يوجد أعداء ولا موجات ولا قتال بعد (تلك مراحل لاحقة: 6 و7 و9).
  DEFENSE_MAP: {
    // نفس ارتفاع سطح الجزيرة المستخدم بـ INTERACTABLES، حتى تظهر كل العناصر على نفس المستوى.
    GROUND_Y: 2,

    // نقطة ظهور الأعداء لاحقًا (قسم 11 — Enemy Path System).
    SPAWN: { x: -12, z: 0 },

    // نقاط المسار الوسيطة بالترتيب: Spawn → Path Point 1 → 2 → 3 → Base.
    PATH_POINTS: [
      { x: -8.49, z: 8.49 },
      { x: 0, z: 12 },
      { x: 8.49, z: 8.49 },
    ],

    // قاعدة اللاعب (قسم 10) — لها HP، تُدمَّر إذا وصل الأعداء إليها لاحقًا (مرحلة 6/7).
    BASE: { x: 12, z: 0, hp: 100, maxHp: 100 },

    // مناطق بناء مستقبلية (اقتصاد/مباني) — بصرية فقط بهذه المرحلة، تُفتح لاحقًا.
    BUILD_ZONES: [
      { id: "build_1", x: -6.5, z: -9.5 },
      { id: "build_2", x: 6.5, z: -9.5 },
    ],

    // قرار مسجَّل (طلب صريح من المستخدم): لا يوجد "خانات دفاع" بمواقع ثابتة.
    // الدفاعات (مرحلة 8) تُوضع بحرية بأي مكان على الجزيرة، بشرط ألا تكون فوق
    // مسار الأعداء أو ضمن هامش أمان قريب منه — انظر PATH_EXCLUSION_RADIUS
    // وDefenseMap.isPositionBuildable(x, z).
    // نصف قطر الهامش المحظور حول خط منتصف المسار (يشمل عرض المسار نفسه + مسافة أمان إضافية).
    PATH_EXCLUSION_RADIUS: 2.7,

    // ---------- ألوان وأبعاد بصرية ----------
    PATH_COLOR: 0xb08a55,
    PATH_WIDTH: 2.4,
    PATH_HEIGHT: 0.12,

    SPAWN_COLOR: 0xff5d5d,
    SPAWN_RADIUS: 1.6,
    SPAWN_SPIN_SPEED: 0.8,
    SPAWN_PULSE_SPEED: 1.5,

    BASE_WALL_COLOR: 0x9aa0a8,
    BASE_ROOF_COLOR: 0x3a6ea5,
    BASE_WALL_RADIUS: 2.2,
    BASE_WALL_HEIGHT: 2.6,
    BASE_ROOF_HEIGHT: 1.8,

    BUILD_ZONE_COLOR: 0x6fe08a,

    // ألوان معاينة وضع الدفاعات لاحقًا (مرحلة 8) — أخضر = مكان صالح، أحمر = ممنوع (على/قرب المسار).
    PLACEMENT_VALID_COLOR: 0xffb347,
    PLACEMENT_BLOCKED_COLOR: 0xff5d5d,

    ZONE_RADIUS: 1.8,
    ZONE_HEIGHT: 0.08,
    ZONE_PULSE_SPEED: 1.2,
    ZONE_PULSE_SCALE: 0.08,
  },

  // ---------- الموجات (قسم 137 بالمواصفات — المرحلة 7: WAVES) ----------
  // لا يوجد بعد أنواع أعداء متعددة (تلك مرحلة لاحقة) — كل الموجات تستخدم
  // العدو الأساسي "basic" بإحصائيات تتصاعد حسب رقم الموجة (قسم 14 —
  // Difficulty Scaling: HP وSpeed وArmor وDamage وReward كلها تتغير،
  // وليس فقط HP × 2).
  WAVES: {
    // مدة الانتظار قبل بدء أول موجة بعد تحميل اللعبة (بالثواني).
    TIME_BEFORE_FIRST_WAVE: 5,

    // مدة الاستراحة بين موجة مكتملة والتالية (بالثواني).
    TIME_BETWEEN_WAVES: 8,

    // الفاصل الزمني بين ظهور عدو والذي يليه ضمن نفس الموجة (بالثواني).
    SPAWN_INTERVAL: 0.9,

    // إحصائيات العدو الأساسي عند الموجة رقم 1 (قبل أي تصعيد).
    BASE_ENEMY: {
      maxHp: 20,
      speed: 2.2,
      armor: 0,
      resistance: 0,
      damage: 10,
      reward: 5,
    },

    // معدلات التصعيد لكل موجة إضافية بعد الموجة 1.
    SCALING: {
      HP_PER_WAVE: 0.18,        // +18% تراكمية بالـHP لكل موجة
      SPEED_PER_WAVE: 0.04,     // +4% خطية بالسرعة لكل موجة
      ARMOR_PER_WAVE: 0.3,      // +0.3 درع لكل موجتين (مقرّبة)
      DAMAGE_PER_WAVE: 0.10,    // +10% خطية بالضرر لكل موجة
      REWARD_PER_WAVE: 0.12,    // +12% خطية بالمكافأة لكل موجة

      QUANTITY_BASE: 4,         // عدد الأعداء بالموجة 1
      QUANTITY_PER_WAVE: 1,     // +1 عدو لكل موجة
      QUANTITY_MAX: 14,         // سقف أقصى لعدد أعداء الموجة الواحدة
    },
  },

  // ---------- الزعماء (Phase 10) ----------
  // الزعيم يُنشأ عبر EnemyManager ويستخدم Enemy نفسه؛ BossSystem يضيف فقط
  // المراحل والقدرات والغضب وربط المكافآت/الواجهة.
  BOSSES: {
    WAVE_INTERVAL: 5,
    DEFAULT_ID: "depth_guardian",
    SCALING: {
      HP_PER_BOSS_WAVE: 0.12,
      SPEED_PER_BOSS_WAVE: 0.02,
      ARMOR_PER_BOSS_WAVE: 0.5,
      DAMAGE_PER_BOSS_WAVE: 0.06,
      REWARD_PER_BOSS_WAVE: 0.15,
    },
    TYPES: {
      depth_guardian: {
        id: "depth_guardian",
        name: "حارس الأعماق",
        type: "boss",
        maxHp: 220,
        speed: 1.45,
        armor: 2,
        resistance: 0,
        damage: 18,
        reward: 100,
        phases: [
          { threshold: 1, damageMultiplier: 1, speedMultiplier: 1 },
          { threshold: 0.66, damageMultiplier: 1.15, speedMultiplier: 1.08 },
          { threshold: 0.33, damageMultiplier: 1.35, speedMultiplier: 1.16 },
        ],
        enrage: { threshold: 0.20, damageMultiplier: 1.35, speedMultiplier: 1.2 },
        ability: { id: "depth_pulse", cooldown: 7, baseDamage: 8, baseDamageToBase: 8, enrageDamageMultiplier: 1.25 },
        xpReward: 50,
        rewardItem: { itemId: "reinforced_cannon_core", amount: 1 },
      },
    },
  },

  // ---------- الدفاعات (قسم 138 بالمواصفات — المرحلة 8: DEFENSES) ----------
  // المرحلة الأولى: نوع دفاع واحد فقط "cannon" لإثبات أن النظام الكامل يعمل:
  // وضع حر بأي مكان على الجزيرة (يعتمد على DefenseMap.isPositionBuildable
  // من المرحلة 5)، إحصائيات، استهداف، وهجوم فعلي (عبر ProjectileManager
  // بالمرحلة 9). البنية Data-Driven (قسم 77): إضافة نوع دفاع جديد لاحقًا
  // (Sniper, Freeze Tower...) تعني إضافة مُدخَل جديد هنا فقط بدون لمس
  // Defense.js أو DefenseManager.js — قسم 98 (Content Expansion).
  DEFENSES: {
    // نفس ارتفاع سطح الجزيرة المستخدم بباقي الأنظمة.
    GROUND_Y: 2,

    // أقل مسافة مسموحة بين دفاعين متجاورين حتى لا يتراكبا بصريًا.
    MIN_DISTANCE_BETWEEN: 1.6,

    // قرار مسجَّل بهذه المرحلة: الوضع بالنقر (Tap-to-Place) على مكان صالح
    // على الجزيرة، وليس سحب وإفلات (Drag & Drop). سحب/نقل دفاع موضوع
    // بالفعل (قسم 54 بالمواصفات) مؤجَّل لمرحلة تحسين لاحقة — لا يُبنى الآن.
    TYPES: {
      cannon: {
        id: "cannon",
        name: "مدفع",
        cost: 40,

        damage: 8,
        critChance: 0.15,
        critMultiplier: 1.8,

        range: 7,
        fireRate: 1.1, // طلقة/ثانية

        // استراتيجية الاستهداف (قسم 20): "first" = أقرب عدو لوصول القاعدة
        // (الأبعد مسافةً على المسار) ضمن مدى الدفاع.
        targeting: "first",

        projectileSpeed: 14,
        projectileColor: 0xffcf5c,

        baseColor: 0x5a6572,
        turretColor: 0x3a4a5a,
        barrelColor: 0x232b33,
        barrelLength: 0.9,
      },
    },
  },

  // ---------- القتال (قسم 139 بالمواصفات — المرحلة 9: COMBAT) ----------
  // Projectiles + Damage + Critical: مُنفَّذة بالكامل هنا (Defense → Projectile
  // → EnemyManager.damageEnemy). Armor: مُنفَّذ أصلًا بـEnemy.takeDamage منذ
  // ---------- التقدم (المرحلة 7 — Progression) ----------
  // قواعد التقدم مركزية وقابلة للضبط: لا تُخزَّن قواعد XP/فتح المحتوى
  // داخل GameState أو واجهة المستخدم.
  PROGRESSION: {
    STARTING_LEVEL: 1,
    STARTING_XP: 0,
    XP_PER_LEVEL_BASE: 100,
    WAVE_XP_BASE: 25,
    WAVE_XP_PER_WAVE: 10,
    UNLOCKS: [
      { id: 'bay_start', type: 'areas', level: 1 },
      { id: 'cannon', type: 'defenses', level: 1 },
      { id: 'wave_1_ready', type: 'milestones', level: 1 },
      { id: 'bay_2', type: 'areas', level: 3 },
      { id: 'advanced_defenses', type: 'systems', level: 3 },
      { id: 'advanced_defenses_unlocked', type: 'milestones', level: 3 },
      { id: 'bay_3', type: 'areas', level: 5 },
      { id: 'advanced_systems', type: 'systems', level: 5 },
      { id: 'advanced_systems_unlocked', type: 'milestones', level: 5 },
    ],
  },

  // ---------- التجميع (المرحلة 9 — Collection) ----------
  // المصدر المركزي لتعريفات عناصر المجموعة وحالة الملكية والترقية.
  // CollectionSystem هو المالك الوحيد لحالة المجموعة أثناء التشغيل.
  COLLECTION: {
    MAX_ITEM_QUANTITY: 999999,
    MAX_UPGRADE_LEVEL: 50,
    RARITIES: ["Common", "Uncommon", "Rare", "Epic", "Legendary", "Mythic", "Secret"],
    ITEMS: {
      cannon_core: {
        id: "cannon_core",
        name: "نواة مدفع",
        category: "material",
        rarity: "Common",
        stackable: true,
        mergeEligible: true,
        unlockedByDefault: true,
        requiredLevel: 1,
        maxUpgradeLevel: 1,
      },
      reinforced_cannon_core: {
        id: "reinforced_cannon_core",
        name: "نواة مدفع معززة",
        category: "material",
        rarity: "Rare",
        stackable: true,
        mergeEligible: true,
        unlockedByDefault: false,
        requiredLevel: 3,
        maxUpgradeLevel: 10,
      },
      cannon: {
        id: "cannon",
        name: "مدفع",
        category: "defense",
        rarity: "Common",
        stackable: false,
        mergeEligible: false,
        unlockedByDefault: false,
        requiredLevel: 1,
        maxUpgradeLevel: 10,
      },
    },
  },

  // ---------- المهام (المرحلة 12 — Quests) ----------
  // تعريفات المحتوى فقط؛ QuestSystem يملك الحالة والتقدم والمكافآت المطلوبة.
  QUESTS: {
    STARTING_QUEST_IDS: ["quest_first_blood", "quest_wave_runner", "quest_cannon_operator", "quest_merge_apprentice", "quest_boss_hunter", "quest_core_collector"],
    TYPES: {
      quest_first_blood: {
        id: "quest_first_blood", name: "الدماء الأولى", type: "EnemyDied", target: 1,
        description: "اهزم عدوًا واحدًا.",
        rewards: { currency: 25, xp: 10 },
      },
      quest_wave_runner: {
        id: "quest_wave_runner", name: "عدّاء الموجات", type: "WaveCompleted", target: 3,
        description: "أكمل ثلاث موجات.",
        rewards: { currency: 50, xp: 15 },
      },
      quest_cannon_operator: {
        id: "quest_cannon_operator", name: "مشغّل المدفع", type: "DefensePlaced", match: { typeId: "cannon" }, target: 3,
        description: "ضع ثلاثة مدافع.",
        rewards: { currency: 60, xp: 20 },
      },
      quest_merge_apprentice: {
        id: "quest_merge_apprentice", name: "متدرّب الدمج", type: "MergeCompleted", target: 1,
        description: "نفّذ عملية دمج ناجحة.",
        rewards: { currency: 40, xp: 20 },
      },
      quest_boss_hunter: {
        id: "quest_boss_hunter", name: "صائد الزعماء", type: "BossDefeated", target: 1,
        description: "اهزم زعيمًا واحدًا.",
        rewards: { currency: 75, xp: 50 },
      },
      quest_core_collector: {
        id: "quest_core_collector", name: "جامع النوى", type: "ItemAcquired", match: { itemId: "cannon_core" }, target: 5,
        description: "اجمع خمس نوى مدفع.",
        rewards: { currency: 50, xp: 20 },
      },
    },
  },

  // ---------- الدمج (المرحلة 8 — Merge) ----------
  // تعريفات الدمج مركزية وقابلة للتوسع. المرحلة 8 لا تبني نظام
  // Collection الكامل؛ MergeSystem يملك فقط شريحة الملكية اللازمة
  // للمدخلات/النتائج، وستتوسع لاحقًا في Phase 9.
  MERGE: {
    WAVE_MATERIAL_REWARD: {
      itemId: "cannon_core",
      amount: 1,
    },
    RECIPES: {
      reinforced_cannon_core: {
        id: "reinforced_cannon_core",
        name: "نواة مدفع معززة",
        inputs: {
          cannon_core: 3,
        },
        result: {
          itemId: "reinforced_cannon_core",
          amount: 1,
        },
        cost: 30,
        requiredLevel: 3,
        xpReward: 20,
      },
    },
  },

  // ---------- الاقتصاد (المرحلة 6 — Economy) ----------
  // مصدر الحقيقة الوحيد لأرقام التوازن الاقتصادي الابتدائية.
  // القيم الفعلية أثناء اللعب مملوكة بالكامل لـ EconomySystem
  // (راجع src/economy/EconomySystem.js وDECISIONS.md).
  //
  // ملاحظة (GAME_SPEC.md §24): أسماء وقيم الموارد النهائية (موارد
  // متعددة، عملات خاصة...) لم تُحسم بعد. العملة الحالية الوحيدة
  // المطبَّقة فعليًا هي "الذهب" (currency)، وهذا القسم يغطيها فقط.
  ECONOMY: {
    // رصيد اللاعب عند أول تشغيل للعبة (قبل أي حفظ سابق).
    STARTING_CURRENCY: 0,
  },

  // المرحلة 6. Status Effects: بنية عامة جاهزة بـEnemy.js (applyStatus/slow/
  // poison) لا يستخدمها "cannon" حاليًا (بلا عنصر) — جاهزة لأنواع دفاعات
  // مستقبلية (Freeze Tower, Poison Tower...) دون تعديل نظام الأعداء وقتها.
  COMBAT: {
    PROJECTILE_RADIUS: 0.14,

    // أقل مسافة بين المقذوف والهدف تُعتبر بها "إصابة".
    HIT_DISTANCE: 0.35,
  },
};
