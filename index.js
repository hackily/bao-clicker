// #region constants
const TICK = 100;
const WRAP_MODULES = {
  auntie: {
    baseValue: 1,
    growth: 1.3,
    cost: 100,
  },
};
const STEAM_MODULES = {
  steam_basket: {
    baseValue: 0.1,
    growth: 1.2,
    cost: 10,
  },
};
const MODULES_MAP = {
  ...WRAP_MODULES,
  ...STEAM_MODULES,
};
// #endregion constants

const gameState = {
  clickers: [
    {
      name: "wrap",
      value: 0,
      rps: 0,
      click: 1,
      modules: {},
    },
    {
      name: "steam",
      value: 0,
      rps: 0,
      click: 1,
      modules: {},
    },
  ],
};
const handleClick = (e) => {
  const entity = e.target.getAttribute('entity-type');
  if(!entity) {
    throw new Error('Please provide an entity type for this clicker')
  }
  const clicker = gameState.clickers.find(clicker => clicker.name === entity);
  clicker.value += clicker.click;
};

const gameLoop = () => {
  gameState.clickers.forEach((clicker) => {
    const { modules } = clicker;
    // Recalculate RPS
    clicker.rps = Object.keys(modules).reduce(
      (acc, moduleName) => acc + MODULES_MAP[moduleName]?.baseValue ?? 0,
      0
    );
    // Apply values
    clicker.value += clicker.rps / (1000 / TICK);
  });
};

const startGameLoop = () => {
  gameLoop();
  setTimeout(startGameLoop, TICK);
};

startGameLoop();