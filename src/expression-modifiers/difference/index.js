import util from '../../utils/util';
import helper from '../helper';
import propertyPanelDef from './properties';

const DEFAULT_OPTIONS = {
  type: 'difference',
  disabled: false,
  primaryDimension: 0,
  crossAllDimensions: false,
  showExcludedValues: true,
  outputExpression: '',
};

const maxNumDimensionsSupported = 2;

function getPrefix({
  modifier, properties, layout,
}) {
  const aggrCompPrefix = helper.needDimension({ modifier, properties, layout }) ? 'Aggr(' : '';
  return aggrCompPrefix;
}

function getSuffix({
  modifier, numDimensions, dimensions, libraryItemsProps, dimensionAndFieldList,
}) {
  const excludedComp = helper.getExcludedComp({
    modifier, dimensions, libraryItemsProps, dimensionAndFieldList,
  });
  const aboveCompPrefix = helper.getAboveCompPrefix(modifier, numDimensions);
  return excludedComp ? ` + ${excludedComp} - ${aboveCompPrefix}` : ` - ${aboveCompPrefix}`;
}

export default {
  translationKey: 'properties.modifier.difference',

  needDimension: helper.needDimension,

  isApplicable({ properties, layout }) {
    return helper.isApplicable({
      properties, layout, minDimensions: 1, maxDimensions: maxNumDimensionsSupported,
    });
  },

  extractInputExpression: helper.extractInputExpression,

  generateExpression({
    expression, modifier, properties, libraryItemsProps, layout, numDimensions, dimensionAndFieldList,
  }) {
    if (!modifier) {
      return expression;
    }
    let numberOfDims = numDimensions;
    if (typeof numberOfDims === 'undefined') {
      numberOfDims = helper.getNumDimensions({ properties, layout });
    }
    const dimensions = util.getValue(properties, 'qHyperCubeDef.qDimensions', []);
    const expWithExcludedComp = helper.getExpressionWithExcludedComp({
      expression, modifier, dimensions, libraryItemsProps, dimensionAndFieldList,
    });
    const aboveComp = helper.getAboveComp(modifier, numberOfDims, expWithExcludedComp);
    const differenceComp = `${expWithExcludedComp} - ${aboveComp}`;
    let generatedExpression = differenceComp;

    if (helper.needDimension({ modifier, properties, layout })) {
      const dim1Comp = helper.getDimComp(dimensions, 1, libraryItemsProps);
      const dim2Comp = helper.getDimComp(dimensions, 0, libraryItemsProps);
      const aggrComp = helper.getAggrComp(generatedExpression, dim1Comp, dim2Comp);
      generatedExpression = aggrComp;
    }
    return generatedExpression;
  },

  initModifier(modifier) {
    Object.keys(DEFAULT_OPTIONS).forEach((key) => {
      if (modifier[key] === undefined) {
        modifier[key] = DEFAULT_OPTIONS[key]; // eslint-disable-line no-param-reassign
      }
    });
  },

  propertyPanelDef,
};