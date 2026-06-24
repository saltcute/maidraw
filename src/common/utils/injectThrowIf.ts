/**
 * A dirty workaround to disable all score validity check in rg-stats.
 * Used so that the code won't be unnecessarily complicated just to simply calculate a rating.
 * 
 * Eg. 101.0000% score without a ALL PERFECT+ lamp.
 * 
 * TODO: a better way to handle this???
 */

const throwIf = require("rg-stats/js/util/throw-if");
throwIf.ThrowIf = () => {};

throwIf.ThrowIf.not = () => {};
throwIf.ThrowIf.negative = () => {};
throwIf.ThrowIf.positive = () => {};
throwIf.ThrowIf.positiveOrZero = () => {};
throwIf.ThrowIf.negativeOrZero = () => {};
throwIf.ThrowIf.zero = () => {};
