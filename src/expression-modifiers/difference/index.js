import util from '../../utils/util';
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

function simplifyExpression(expression) {
  const s = expression.trim();
  const expComp = s.substring(0, 1) === '=' ? s.substring(1).trim() : s;
  return expComp;
}

function getDimSortCriterias(dimensions, dimIdx = 0) {
  const dimension = dimensions[dimIdx];
  return dimension.qDef.qSortCriterias[0];
}

function getDimDef(dimensions, dimIdx = 0, libraryItemsProps) {
  const dimension = dimensions[dimIdx];
  return dimension.qLibraryId
    ? libraryItemsProps[dimension.qLibraryId].qDim.qFieldDefs[0]
    : dimension.qDef.qFieldDefs[0];
}

function getDimComp(dimensions, dimIdx, libraryItemsProps) {
  const sortCriterias = getDimSortCriterias(dimensions, dimIdx);
  const dimDef = getDimDef(dimensions, dimIdx, libraryItemsProps);
  if (!sortCriterias.qSortByExpression && !sortCriterias.qSortByNumeric && !sortCriterias.qSortByAscii) {
    return `[${dimDef}]`;
  }
  const type = ['Descending', 'Ascending'];
  const numericComp = sortCriterias.qSortByNumeric ? `(Numeric, ${type[(sortCriterias.qSortByNumeric + 1) / 2]})` : '';
  const textComp = sortCriterias.qSortByAscii ? `(Text, ${type[(sortCriterias.qSortByAscii + 1) / 2]})` : '';
  if (sortCriterias.qSortByNumeric && sortCriterias.qSortByAscii) {
    return `([${dimDef}], ${numericComp}, ${textComp})`;
  }
  if (sortCriterias.qSortByNumeric) {
    return `([${dimDef}], ${numericComp})`;
  }
  if (sortCriterias.qSortByAscii) {
    return `([${dimDef}], ${textComp})`;
  }
  return `[${dimDef}]`;
}

function getAboveComp(modifier, numDimensions) {
  const { crossAllDimensions } = modifier;
  return numDimensions === 2 && crossAllDimensions ? 'Above(Total ' : 'Above(';
}

function getExpressionComp(modifier, expression) {
  const { showExcludedValues } = modifier;
  const expComp = simplifyExpression(expression);
  return showExcludedValues ? `${expComp} + Sum({1} 0)` : expComp;
}

function getNumDimensions({ properties, layout }) {
  return util.getValue(properties, 'qHyperCubeDef.qDimensions', util.getValue(layout, 'qHyperCube.qDimensionInfo', []))
    .length;
}

function needDimension({ modifier, properties, layout }) {
  return getNumDimensions({ properties, layout }) === 2 && modifier.primaryDimension === 0;
}

export default {
  translationKey: 'properties.modifier.difference',

  needDimension,

  simplifyExpression,

  isApplicable({ properties, layout }) {
    return getNumDimensions({ properties, layout }) <= maxNumDimensionsSupported;
  },

  extractInputExpression({
    outputExpression, modifier, properties, layout, numDimensions,
  }) {
    if (!modifier) {
      return;
    }
    let numberOfDims;
    if (typeof numDimensions === 'undefined') {
      numberOfDims = getNumDimensions({ properties, layout });
    }
    const aboveComp = getAboveComp(modifier, numberOfDims);
    const rangeSumCompPrefix = 'RangeSum(';
    const rangeSumCompSuffix = `, -${aboveComp}`;
    const aggrCompPrefix = needDimension({ modifier, properties, layout }) ? 'Aggr(' : '';
    const prefix = aggrCompPrefix + rangeSumCompPrefix;
    const idx1 = outputExpression.indexOf(prefix);
    if (idx1 === -1) {
      return;
    }
    const idx2 = outputExpression.lastIndexOf(rangeSumCompSuffix);
    if (idx2 === -1) {
      return;
    }
    let exp = outputExpression.substring(idx1 + prefix.length, idx2);
    const { showExcludedValues } = modifier;
    if (showExcludedValues) {
      const expCompSuffix = ' + Sum({1} 0)';
      if (exp.substring(exp.length - expCompSuffix.length) !== expCompSuffix) {
        return;
      }
      exp = exp.substring(0, exp.length - expCompSuffix.length);
    }
    return exp; // eslint-disable-line consistent-return
  },

  generateExpression({
    expression, modifier, properties, libraryItemsProps, layout, numDimensions,
  }) {
    if (!modifier) {
      return expression;
    }
    let numberOfDims = numDimensions;
    if (typeof numberOfDims === 'undefined') {
      numberOfDims = getNumDimensions({ properties, layout });
    }
    const expComp = getExpressionComp(modifier, expression);
    const aboveComp = getAboveComp(modifier, numberOfDims);
    const rangeSumComp = `RangeSum(${expComp}, -${aboveComp}${expComp}))`;
    let generatedExpression = rangeSumComp;

    if (needDimension({ modifier, properties, layout })) {
      const dimensions = util.getValue(properties, 'qHyperCubeDef.qDimensions', []);
      const aggrComp = `Aggr(${rangeSumComp}, ${getDimComp(dimensions, 1, libraryItemsProps)}, ${getDimComp(
        dimensions,
        0,
        libraryItemsProps,
      )})`;
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
