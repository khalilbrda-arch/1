/**
 * Time.js
 * -------
 * نظام الوقت المستقل. يوفر deltaTime و elapsedTime لكل الأنظمة
 * (حركة، أنيميشن، موجات...) بدل ما كل نظام يحسب وقته بنفسه.
 */

const GameTime = {
  _clock: null,
  delta: 0,
  elapsed: 0,

  init() {
    this._clock = new THREE.Clock();
  },

  tick() {
    this.delta = this._clock.getDelta();
    this.elapsed = this._clock.getElapsedTime();
  },
};
