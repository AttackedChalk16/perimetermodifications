// @flow

const initSpriteSheetSystem = (store) => {
  // TODO: don't load sprites if they're already loaded
  const {dispatch} = store;
  const state = store.getState();


  loadSprite(dispatch, state, 'FOOD', './img/Food2.png');
  loadSprite(dispatch, state, 'DIRT', './img/Dirt3.png');
  loadSprite(dispatch, state, 'STONE', './img/Stone1.png');
  loadSprite(dispatch, state, 'SULPHUR', './img/Brick1.png');
  loadSprite(dispatch, state, 'ICE', './img/Kitchen1.png');
  loadSprite(dispatch, state, 'PHEROMONE', './img/Pheromones.png');

  loadSprite(dispatch, state, 'ALERT', './img/Exclamation1.png');
  loadSprite(dispatch, state, 'WANDER', './img/Ellipsis1.png');
  loadSprite(dispatch, state, 'QUESTION', './img/Question1.png');
  loadSprite(dispatch, state, 'MALE', './img/Male1.png');
  loadSprite(dispatch, state, 'FEMALE', './img/Female1.png');

  loadSprite(dispatch, state, 'ANT', './img/Ant2.png');
  loadSprite(dispatch, state, 'WORM', './img/Worm1.png');

  loadSprite(dispatch, state, 'FLOOR_TILE', './img/FloorTile1.png');
};

const loadSprite = (dispatch, state, name, src): void => {
  // if (
  //   state.game != null && state.game.sprites != null &&
  //   state.game.sprites[name] != null
  // ) return;
  const img = new Image();
  img.addEventListener('load', () => {
  //  console.log("loaded " + src + " spritesheet");
    dispatch({
      type: 'SET_SPRITE_SHEET',
      name,
      img,
    });
  }, false);
  img.src = src;
}

module.exports = {initSpriteSheetSystem};
