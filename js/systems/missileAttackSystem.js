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
      freq = 5;
    }
    if (game.time > (60 * 60 * 5)) {
      freq = 2;
      altProb = 0.05;
    }
    if (game.time > (60 * 60 * 10)) {
      freq = 1;
      altProb = 0.1;
    }
    if (game.time > (60 * 60 * 12)) {
      freq = 0.5;
      altProb = 0.15;
    }
    let alternateSide = Math.random() < altProb;
    if (time > 1 && time % (freq * 60) == 0) {
      const playerID = 2;
      let pos = {x: randomIn(2, 5), y: randomIn(25, 45)};
      let theta = -1 * randomIn(25, 75) / 100;
      const velocity = randomIn(30, 90);

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
