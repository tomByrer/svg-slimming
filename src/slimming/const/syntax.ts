import { eventAttributes } from './definitions';

// 符合官方定义的 token
// https://drafts.csswg.org/css-syntax-3

// 是否支持 unicode
let supportUnicode = true;
try {
	supportUnicode = /\u{20BB7}/u.test('𠮷');
} catch (e) {
	supportUnicode = false;
}

const uModifier = supportUnicode ? 'u' : '';

// definition
export const commaWsp = '(?:\\s*,\\s*|\\s*)';
const semi = '\\s*;\\s*';
const paren = '\\s*\\(\\s*';
const rParen = '\\s*\\)';

// name token
// https://www.w3.org/TR/xml/#NT-Name
const NameStartChar = `:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD${supportUnicode ? '\\u{10000}-\\u{EFFFF}' : ''}`;
const NameChar = `${NameStartChar}\\-\\.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040`;
const Name = `[${NameStartChar}][${NameChar}]*`;

// css syntax
// https://drafts.csswg.org/css-syntax-3/#non-ascii-code-point
const cssNameStartChar = `A-Za-z_\\u0080-\\uFFFF${supportUnicode ? '\\u{10000}-\\u{EFFFF}' : ''}`;
const cssNameChar = `${cssNameStartChar}\\-0-9`;
const cssName = `[${cssNameStartChar}][${cssNameChar}]*`;

export const nameFullMatch = new RegExp(`^${Name}$`, uModifier);
export const cssNameFullMatch = new RegExp(`^${cssName}$`, uModifier);
export const cssNameSpaceSeparatedFullMatch = new RegExp(`^${cssName}(?:\\s+${cssName})*$`, uModifier);

// number token
// https://www.w3.org/TR/css3-values/#length-value
// https://www.w3.org/TR/css-syntax-3/#number-token-diagram
// https://www.w3.org/TR/css-syntax-3/#percentage-token-diagram
export const numberPattern = '[+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?';
const zero = '[+-]?(?:0+\\.)?0+(?:[eE][+-]?\\d+)?';
export const numberSequence = `${numberPattern}(?:${commaWsp}${numberPattern})*`;
const numberPair = `${numberPattern}${commaWsp}${numberPattern}`;
const numberPairSequence = `${numberPair}(?:${commaWsp}${numberPair})*`;
const numberPairDouble = `${numberPair}${commaWsp}${numberPair}`;
const numberPairTriplet = `${numberPair}${commaWsp}${numberPair}${commaWsp}${numberPair}`;
export const numberGlobal = new RegExp(numberPattern, 'g');
export const numberFullMatch = new RegExp(`^${numberPattern}$`);
export const numberOptionalFullMatch = new RegExp(`^${numberPattern}(?:\\s*${numberPattern})?$`);
export const numberListFullMatch = new RegExp(`^${numberSequence}$`);
export const numberSemiSepatatedFullMatch = new RegExp(`^${numberPattern}(?:${semi}${numberPattern})*(?:${semi})?$`);
export const integerFullMatch = /^[+-]?(?:\d+|(?:\d*\.)?\d+[eE][+-]?\d+)$/;

// https://www.w3.org/TR/css-values-3/#angle-value
export const angel = 'deg|grad|rad|turn';
export const angelFullMatch = new RegExp(`^${numberPattern}(?:${angel})?$`);

const controlPoint = `${numberPattern}${commaWsp}${numberPattern}${commaWsp}${numberPattern}${commaWsp}${numberPattern}`;
export const controlPointsFullMatch = new RegExp(`^${controlPoint}(?:${semi}${controlPoint})*(?:${semi})?$`);

const Units = '(?:em|ex|ch|rem|vx|vw|vmin|vmax|cm|mm|Q|in|pt|pc|px)';
export const percentageFullMatch = new RegExp(`^${numberPattern}%$`);
const length = `${numberPattern}${Units}?`;
const lengthPercentage = `(?:${length}|${numberPattern}%)`;
const lengthPair = `${length}${commaWsp}${length}`;

export const lengthPairFullMatch = new RegExp(`^${lengthPair}$`);
export const lengthPairListFullMatch = new RegExp(`^${lengthPair}(?:${semi}${lengthPair})*$`);
export const lengthPercentageFullMatch = new RegExp(`^${lengthPercentage}$`);
export const lengthPercentageListFullMatch = new RegExp(`^${lengthPercentage}(?:${commaWsp}${lengthPercentage})*$`);

export const viewBoxFullMatch = new RegExp(`^${controlPoint}$`);

// time token
// https://svgwg.org/specs/animations/#BeginValueListSyntax
const timeCountValue = '\\d+(?:\\.\\d+)?(?:h|min|s|ms)?';
const timeValue = '(?:\\d+:)?[0-5]\\d:[0-5]\\d(?:\\.\\d+)?';
const clockValue = `(?:${timeCountValue}|${timeValue})`;

const offsetValue = `(?:\\s*[+-]\\s*)?${clockValue}`;
const syncbaseValue = `${Name}\\.(?:begin|end)(?:${offsetValue})?`;
const eventValue = `(?:${Name}\\.)?(?:${eventAttributes.join('|')})(?:${offsetValue})?`;
const repeatValue = `(?:${Name}\\.)?repeat\\(\\d+\\)(?:${offsetValue})?`;
const accessKeyValue = `accessKey\\(.\\)(?:${offsetValue})?`;
const wallclockSyncValue = 'wallclock\\(\\d+\\)';

const timePattern = `(?:${offsetValue}|${syncbaseValue}|${eventValue}|${repeatValue}|${accessKeyValue}|${wallclockSyncValue}|indefinite)`;
export const clockFullMatch = new RegExp(`^${clockValue}$`);
export const timeListFullMatch = new RegExp(`^${timePattern}(\\s*;\\s*${timePattern})*$`, uModifier);

// transform token
// https://drafts.csswg.org/css-transforms/#svg-comma
const translate = `translate${paren}${numberPattern}(?:${commaWsp}?${numberPattern})?${rParen}`;
const scale = `scale${paren}${numberPattern}(?:${commaWsp}?${numberPattern})?${rParen}`;
const rotate = `rotate${paren}${numberPattern}(?:${commaWsp}?${numberPattern}${commaWsp}?${numberPattern})?${rParen}`;
const skewX = `skewX${paren}${numberPattern}${rParen}`;
const skewY = `skewY${paren}${numberPattern}${rParen}`;
const matrix = `matrix${paren}${numberPattern}(?:${commaWsp}?${numberPattern}){5}${rParen}`;
export const transformListFullMatch = new RegExp(`^(?:\\s*(?:${translate}|${scale}|${rotate}|${skewX}|${skewY}|${matrix})\\s*)*$`);

// uri token
// http://www.ietf.org/rfc/rfc3986.txt
export const URIFullMatch = /^(?:[^:/?#]+\:)?(?:\/\/[^/?#]*)?(?:[^?#]*)(?:\?[^#]*)?(?:#.*)?$/;

// https://tools.ietf.org/html/bcp47#section-2.1
export const langFullMatch = /^[a-zA-Z]{2,}(?:-[a-zA-Z0-9%]+)*$/;

// https://drafts.csswg.org/css-syntax-3/#typedef-ident-token
const hexDigit = '0-9a-fA-F';
const newLine = '\\r\\n';
const escape = `\\\\(?:[^${hexDigit}${newLine}]|[${hexDigit}]{1,6}\\s?)`;
const indentToken = `(?:--|-?(?:[${cssNameStartChar}]|${escape}))(?:[${cssNameChar}]|${escape})*`;
export const indentFullMatch = new RegExp(`^${indentToken}$`, uModifier);

// https://svgwg.org/svg2-draft/paths.html#PathDataBNF
const pathZ = '[zZ]';
const pathMToStrict = `[mM]\\s*${numberPairSequence}${pathZ}?`;
const pathMTo = `[mM]\\s*${numberSequence}`;
const pathTo = `[lLhHvVcCsSqQtTaA]\\s*${numberSequence}`;
const pathLToStrict = `[lL]\\s*(?:${numberPairSequence}|${pathZ})`;
const pathHVToStrict = `[hHvV]\\s*${numberSequence}`;
const pathCToStrict = `[cC]\\s*(?:${numberPairTriplet}(?:${commaWsp}${numberPairTriplet})*|(?:${numberPairSequence})?${pathZ})`;
const pathSQToStrict = `[sSqQ]\\s*(?:${numberPairDouble}(?:${commaWsp}${numberPairDouble})*|(?:${numberPairSequence})?${pathZ})`;
const pathTToStrict = `[tT]\\s*(?:${numberPairSequence}|${pathZ})`;
const pathA = `${numberPattern}${commaWsp}${numberPattern}${commaWsp}${numberPattern}${commaWsp}[01]${commaWsp}[01]${commaWsp}${numberPair}`;
const pathASequence = `${pathA}(?:${commaWsp}${pathA})*`;
const pathATo = `[aA]\\s*(?:${pathASequence}|(?:${pathASequence})?${pathZ})`;
const pathPatternStrict = `(?:${pathMToStrict}|${pathZ}|${pathLToStrict}|${pathHVToStrict}|${pathCToStrict}|${pathSQToStrict}|${pathTToStrict}|${pathATo})`;
const pathPattern = `(?:${pathMTo}|${pathZ}|${pathTo})`;
export const pathFullMatchStrict = new RegExp(`^${pathMToStrict}(?:${commaWsp}${pathPatternStrict})*$`);
export const pathFullMatch = new RegExp(`^${pathMTo}(?:${commaWsp}${pathPattern})*$`);

export const preservAspectRatioFullMatch = /^(?:none|xMinYMin|xMidYMin|xMaxYMin|xMinYMid|xMidYMid|xMaxYMid|xMinYMax|xMidYMax|xMaxYMax)(?:\s+(?:meet|slice))?$/;

// IRI
export const funcIRIToID = /^url\((["']?)#(.+)\1\)$/;
const url = 'url\\([^\\)]+\\)';
export const funcIRIFullMatch = new RegExp(`^${url}$`);
export const IRIFullMatch = /^#(.+)$/;

export const mediaTypeFullMatch = /^(?:image|audio|video|application|text|multipart|message)\/[^\/]+$/;
