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

    let freq = 5; // time in seconds
    if (game.time > (60 * 60 * 1)) {
      freq = 2;
    } else if (game.time > (60 * 60 * 3)) {
      freq = 1;
    } else if (game.time > (60 * 60 * 6)) {
      freq = 0.5;
    } else if (game.time > (60 * 60 * 9)) {
      freq = 0.5;
    }

    if (time > 1 && time % (freq * 60) == 0) {
      const playerID = 2;
      const pos = {x: normalIn(2, 5), y: normalIn(25, 45)};
      const theta = -1 * normalIn(30, 75) / 100;
      const velocity = normalIn(55, 90);
      const warhead = Entities.DYNAMITE.make(game, null, playerID);
      const missile = Entities.MISSILE.make(game, pos, playerID, warhead, theta, velocity);
      dispatch({type: 'CREATE_ENTITY', entity: missile});
    }

  });
};

module.exports = {initMissileAttackSystem};
