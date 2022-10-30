// #region constants
const TICK = 42;
const ENTITY_TYPES = {
  wrap: 'wrap',
  steam: 'steam',
  sell: 'sell',
}
const WRAP_MODULES = {
  auntie: {
    baseRps: 1,
    baseCost: 100,
    growth: 1.3,
    parentEntity: 'wrap'
  },
};
const STEAM_MODULES = {
  steamBasket: {
    baseRps: 0.2,
    baseCost: 10,
    growth: 1.1,
    parentEntity: 'steam'
  },
};
const SELL_MODULES = {
  cart: {
    baseRps: 2,
    baseCost: 200,
    growth: 1.5,
    parentEntity: 'sell'
  }
}
const MODULES_MAP = {
  ...WRAP_MODULES,
  ...STEAM_MODULES,
  ...SELL_MODULES
};
// #endregion constants

const gameState = {
  currencyEntity: ENTITY_TYPES.sell,
  clickers: [
    {
      entity: ENTITY_TYPES.wrap,
      value: 100,
      rps: 0,
      click: 1,
      modules: {
        auntie: 1
      },
    },
    {
      entity: ENTITY_TYPES.steam,
      value: 100,
      rps: 0,
      click: 1,
      modules: {},
    },
    {
      entity: ENTITY_TYPES.sell,
      value: 0,
      rps: 0,
      click: 1,
      modules: {
        cart: 1
      },
    },
  ],
};

const getModuleCost = (moduleEntity) => {
  const module = MODULES_MAP[moduleEntity];
  const clicker = gameState.clickers.find(clicker => clicker.entity === module.parentEntity);
  return Math.round(module.baseCost * Math.pow(module.growth, clicker.modules[moduleEntity] ?? 0));
} 

const getCurrency = () => {
  const currencyClicker = gameState.clickers.find(clicker => clicker.entity === gameState.currencyEntity);
  return currencyClicker.value;
}

const buyModule = (e) => {
  const moduleEntity = e.currentTarget.getAttribute('entity-type');
  const module = MODULES_MAP[moduleEntity];
  if(module) {
    // Subtract cost
    const currencyClicker = gameState.clickers.find(clicker => clicker.entity === gameState.currencyEntity);
    const clicker = gameState.clickers.find(clicker => clicker.entity === module.parentEntity);
    currencyClicker.value -= getModuleCost(moduleEntity);
    // Increase module value;
    clicker.modules[moduleEntity] = (clicker.modules[moduleEntity] ?? 0) + 1
    // Update cost
    const costEl = e.currentTarget.querySelector('var[data-type="cost"]')
    costEl.innerHTML = getModuleCost(moduleEntity).toLocaleString();
    // Update quantity
    const quantityEl = e.currentTarget.querySelector('var[data-type="quantity"]')
    quantityEl.innerHTML = clicker.modules[moduleEntity]
  }
}

const handleClick = (e) => {
  const entity = e.currentTarget.getAttribute('entity-type');
  if(!entity) {
    throw new Error('Please provide an entity type for this clicker')
  }
  const clickerIdx = gameState.clickers.findIndex(clicker => clicker.entity === entity);
  const clicker = gameState.clickers[clickerIdx]
  const prevClicker = gameState.clickers[clickerIdx -1];
  let created = clicker.click;
  if(prevClicker) {
    created = Math.min(prevClicker.value, created)
    prevClicker.value -= created;
  }
  clicker.value += created;
};

const gameLoop = () => {
  gameState.clickers.forEach((clicker, index) => {
    const { modules } = clicker;
    // Recalculate RPS
    clicker.rps = Object.keys(modules).reduce(
      (acc, moduleName) => acc + (MODULES_MAP[moduleName]?.baseRps ?? 0) * modules[moduleName],
      0
    );
    // Apply values
    const prevClicker = gameState.clickers[index -1];
    const rate = clicker.rps / (1000 / TICK);
    let created = rate;
    if(prevClicker) {
      created = Math.min(prevClicker.value, rate)
      prevClicker.value -= created;
    }
    clicker.value += created
    
    // Draw
    const valueEl = document.querySelector(`section[entity-type='${clicker.entity}'] [data-type="value"]`) 
    if(valueEl) {
      valueEl.innerHTML = Math.floor(clicker.value).toLocaleString(undefined)
    }
    const rpsEl = document.querySelector(`section[entity-type='${clicker.entity}'] [data-type="rps"]`) 
    if(rpsEl) {
      rpsEl.innerHTML = clicker.rps.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 2});
    }

  });
  const currency = getCurrency();
  const buyModuleBtns = document.querySelectorAll('.module-container button') 
  buyModuleBtns.forEach(btn => {
    const moduleEntity = btn.getAttribute('entity-type');
    btn.disabled = currency < getModuleCost(moduleEntity);
  })
};

const startGameLoop = () => {
  gameLoop();
  setTimeout(startGameLoop, TICK);
};

startGameLoop();
