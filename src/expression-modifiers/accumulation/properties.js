import util from '../../utils/util';

const MODIFIER_TYPE = 'accumulation';

function getModifierIndex(measure, modifiersRef) {
  const modifiers = util.getValue(measure, modifiersRef);
  if (!modifiers) {
    return -1;
  }
  for (let i = 0; i < modifiers.length; i++) {
    if (modifiers[i].type === MODIFIER_TYPE) {
      return i;
    }
  }
  return -1;
}

function getModifier(measure, modifiersRef) {
  const modifiers = util.getValue(measure, modifiersRef);
  if (!modifiers) {
    return;
  }
  for (let i = 0; i < modifiers.length; i++) {
    if (modifiers[i].type === MODIFIER_TYPE) {
      // eslint-disable-next-line consistent-return
      return modifiers[i];
    }
  }
}

function getRef(measure, modifiersRef) {
  const index = getModifierIndex(measure, modifiersRef);
  return index > -1 ? `${modifiersRef}.${index}` : modifiersRef;
}

export default function (rootPath) {
  const modifierProperties = {
    type: 'items',
    items: {
      disclaimer: {
        component: 'text',
        translation: 'properties.modifier.accumulation.disclaimer',
        show(itemData, handler) {
          return handler.maxDimensions() > 2;
        },
      },
      primaryDimension: {
        refFn: data => `${getRef(data, rootPath)}.accumulationDimension`,
        type: 'integer',
        translation: 'properties.modifier.primaryDimension',
        title: {
          translation: 'properties.modifier.accumulation.primaryDimension.tooltip',
        },
        component: 'dropdown',
        schemaIgnore: true,
        defaultValue: 1,
        options(itemData, handler) {
          const { qDimensionInfo } = handler.layout.qHyperCube;
          return qDimensionInfo.map((dim, idx) => ({ value: idx, label: dim.qGroupFallbackTitles[0] })); // To avoid depending on the layout, we use the first dimension in the drill down dimension
        },
        show(itemData, handler) {
          return handler.layout.qHyperCube.qDimensionInfo.length > 1;
        },
      },
      crossAllDimensions: {
        refFn: data => `${getRef(data, rootPath)}.crossAllDimensions`,
        type: 'boolean',
        translation: 'properties.modifier.crossAllDimensions',
        title: {
          translation: 'properties.modifier.accumulation.crossAllDimensions.tooltip',
        },
        schemaIgnore: true,
        defaultValue: false,
        show(itemData, handler) {
          return handler.layout.qHyperCube.qDimensionInfo.length > 1;
        },
      },
      fullRange: {
        refFn: data => `${getRef(data, rootPath)}.fullAccumulation`,
        type: 'boolean',
        translation: 'properties.modifier.range',
        component: 'dropdown',
        schemaIgnore: true,
        defaultValue: false,
        options: [
          {
            value: true,
            translation: 'properties.modifier.range.full',
          },
          {
            value: false,
            translation: 'properties.modifier.range.custom',
          },
        ],
      },
      steps: {
        refFn: data => `${getRef(data, rootPath)}.steps`,
        type: 'integer',
        translation: 'properties.modifier.range.steps',
        schemaIgnore: true,
        defaultValue: 6,
        change(itemData) {
          const modifier = getModifier(itemData, rootPath);
          if (modifier) {
            const { steps } = modifier;
            modifier.steps = typeof steps === 'number' && !Number.isNaN(steps) ? Math.abs(steps) : 6;
          }
        },
        show(itemData) {
          const modifier = getModifier(itemData, rootPath);
          return modifier && !modifier.fullAccumulation;
        },
      },
      showExcludedValues: {
        refFn: data => `${getRef(data, rootPath)}.showExcludedValues`,
        type: 'boolean',
        translation: 'properties.modifier.showExcludedValues',
        schemaIgnore: true,
        defaultValue: true,
      },
    },
    show(itemData) {
      const modifier = getModifier(itemData, rootPath);
      return modifier && !modifier.disabled;
    },
  };

  return modifierProperties;
}
