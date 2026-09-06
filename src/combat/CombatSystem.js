/**
 * CombatSystem.js
 * ---------------
 * المرحلة 4 — Architecture Foundation / Combat Boundary.
 *
 * مسؤول عن تمرير نتائج الهجمات إلى نظام الأعداء دون أن تعرف المقذوفات
 * أو الدفاعات مدير الأعداء مباشرة.
 *
 * هذه خطوة تأسيسية محافظة:
 * - لا تغيّر معادلة الضرر الحالية.
 * - لا تنقل حساب Armor أو Damage من Enemy.
 * - لا تغيّر منطق الموت أو المكافآت.
 * - لا يملك هذا النظام حالة Scene أو دورة تحديث مستقلة.
 *
 * Enemy.takeDamage() ما زال يملك حاليًا حساب الضرر الفعلي وArmor.
 * وسيتم نقل قواعد القتال تدريجيًا بعد تثبيت الحدود واختبارات السلوك.
 */

const CombatSystem = {
  /**
   * حل إصابة مقذوف لهدف.
   *
   * المسار المعماري:
   *
   * Projectile
   *     ↓
   * CombatSystem
   *     ↓
   * EnemyManager
   *     ↓
   * Enemy.takeDamage()
   *
   * السلوك الفعلي للضرر لا يتغير في هذه المرحلة.
   */
  resolveProjectileHit(targetEnemy, amount) {
    if (
      !targetEnemy ||
      !targetEnemy.alive
    ) {
      return null;
    }

    if (
      typeof amount !== "number" ||
      !Number.isFinite(amount) ||
      amount < 0
    ) {
      console.error(
        "CombatSystem: invalid projectile damage amount.",
        amount
      );

      return null;
    }

    if (
      typeof EnemyManager === "undefined"
    ) {
      console.error(
        "CombatSystem: EnemyManager is not available."
      );

      return null;
    }

    return EnemyManager.damageEnemy(
      targetEnemy,
      amount
    );
  },
};
