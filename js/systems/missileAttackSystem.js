// @flow

const {randomIn, normalIn} = require('../utils/stochastic');
const globalConfig = require('../config');
const {Entities} = require('../entities/registry');

const initMissileAttackSystem = (store) => {
  const {dispatch} = store;
  let time = -1;
  store.subscribe(() => {
    const state = store.getState();
    const {game} = state;
    if (!game) return;
    if (game.time == time) return;
    time = game.time;

    if (game.pauseMissiles) return;

    let freq = 5; // time in seconds
    let altProb = 0;
    if (game.time > (60 * 60 * 1)) {
      freq = 2;
    } else if (game.time > (60 * 60 * 3)) {
      freq = 1;
      altProb = 0.05;
    } else if (game.time > (60 * 60 * 6)) {
      freq = 0.25;
      altProb = 0.1;
    } else if (game.time > (60 * 60 * 9)) {
      freq = 0.1;
      altProb = 0.15;
    }
    let alternateSide = Math.random() < altProb;
    if (time > 1 && time % (freq * 60) == 0) {
      const playerID = 2;
      let pos = {x: normalIn(2, 5), y: normalIn(25, 45)};
      let theta = -1 * normalIn(30, 75) / 100;
      const velocity = normalIn(55, 90);

      if (alternateSide) {
        pos.x = game.gridWidth - pos.x - 1;
        theta += Math.PI;
      }

      const warhead = Entities.DYNAMITE.make(game, null, playerID);
      const missile = Entities.MISSILE.make(game, pos, playerID, warhead, theta, velocity);
      dispatch({type: 'CREATE_ENTITY', entity: missile});
    }

  });
};

module.exports = {initMissileAttackSystem};
