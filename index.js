// #region constants
const TICK = 42;
const THEME_PREFIX = 'bao';
const ENTITY_TYPES = {
  wrap: 'wrap',
  steam: 'steam',
  sell: 'sell',
}
const WRAP_MODULES = {
  'rolling-pin': {
    baseRps: 1,
    baseCost: 10,
    growth: 1.1,
    parentEntity: 'wrap',
  },
  auntie: {
    baseRps: 3,
    baseCost: 50,
    growth: 1.12,
    parentEntity: 'wrap',
  },
};
const STEAM_MODULES = {
  'steam-basket': {
    baseRps: 0.5,
    baseCost: 10,
    growth: 1.05,
    parentEntity: 'steam',

  },
};
const SELL_MODULES = {
  cart: {
    baseRps: 2,
    baseCost: 50,
    growth: 1.2,
    parentEntity: 'sell',

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
      value: 10,
      rps: 0,
      click: 1,
      warnings: {
        default: "Click to wrap bao",
        outOfResource: ""
      },
      modules: {
        'rolling-pin': 1
      },
    },
    {
      entity: ENTITY_TYPES.steam,
      value: 10,
      rps: 0,
      click: 1,
      warnings: {
        default: "Click to steam bao",
        outOfResource: "Wrap more bao"
      },
      modules: {
        'steam-basket': 1
      },
    },
    {
      entity: ENTITY_TYPES.sell,
      value: 0,
      rps: 0,
      click: 1,
      warnings: {
        default: "Click to sell bao",
        outOfResource: "Steam more bao"
      },
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
    // draw
    const figure = document.querySelector(`article[class='${THEME_PREFIX}-${moduleEntity}'] figure`)
    figure.append(document.createElement('picture'));
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
      const clickerEl = document.querySelector(`button[entity-type="${clicker.entity}"]`)
      const warningEl = document.querySelector(`section[entity-type="${clicker.entity}"] aside`);
      if(!Math.round(prevClicker.value)) {
        clickerEl.disabled = true;
        if(warningEl.innerHTML !== clicker.warnings.outOfResource) {
          warningEl.innerHTML = clicker.warnings.outOfResource;
        }
      } else {
        clickerEl.disabled = false;
        if(warningEl.innerHTML !== clicker.warnings.default) {
          warningEl.innerHTML = clicker.warnings.default;
        }
      }
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

const initialize = () => {
  Object.keys(MODULES_MAP).forEach(moduleEntity => {
    // Update cost
    const costEl = document.querySelector(`button[entity-type="${moduleEntity}"] var[data-type="cost"]`);
    costEl.innerHTML = getModuleCost(moduleEntity).toLocaleString();
    // Update quantity
    const quantity = gameState.clickers.find(clicker => clicker.entity === MODULES_MAP[moduleEntity].parentEntity).modules[moduleEntity] || 0
    const quantityEl = document.querySelector(`button[entity-type="${moduleEntity}"] var[data-type="quantity"]`);
    quantityEl.innerHTML = quantity || '';
    // Render module pictures
    const figure = document.querySelector(`article[class='${THEME_PREFIX}-${moduleEntity}'] figure`)
    for(let i = 0; i < quantity; i++) {
      figure.append(document.createElement('picture'));
    }
  })
}

const startGameLoop = () => {
  gameLoop();
  setTimeout(startGameLoop, TICK);
};

initialize()
startGameLoop();
