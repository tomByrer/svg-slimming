import { propEq } from 'ramda';
import { parse as parseCss, stringify as cssStringify } from 'css';
import { INode } from '../../node/index';
import { createShortenID } from '../algorithm/create-shorten-id';
import { shortenTag } from '../style/shorten-tag';
import { mixWhiteSpace } from '../utils/mix-white-space';
import { isTag } from '../xml/is-tag';
import { rmNode } from '../xml/rm-node';
import { traversalNode } from '../xml/traversal-node';

const classSelectorReg = /\.([^,\*#>+~:{\s\[\.]+)/gi;

export const shortenClass = (rule, dom) => new Promise((resolve, reject) => {
	if (rule[0]) {
		const classList = {};
		let si = 0;
		let cssNode: INode;
		let cssContent: INode;
		let parsedCss = null;

		const shorten = (key, rid) => {
			if (classList[key]) {
				return classList[key][0];
			}
			const sid = createShortenID(si++);
			classList[key] = [sid, rid];
			return sid;
		};

		// 首先取出所有被引用的 class ，并缩短
		traversalNode(propEq('nodeName', 'style'), (node: INode) => {
			cssNode = node;
			cssContent = node.childNodes[0];
			parsedCss = parseCss(cssContent.textContent, { silent: true });

			if (parsedCss) {
				parsedCss.stylesheet.rules.forEach(item => {
					if (item.type === 'rule') {
						item.ruleId = +new Date();
						item.selectors.forEach((selector, selectorIndex) => {
							item.selectors[selectorIndex] = selector.replace(classSelectorReg, (m, p) => `.${shorten(p, item.ruleId)}`);
						});
					}
				});
				cssContent.textContent = shortenTag(cssStringify(parsedCss, { compress: true }));
			}
		}, dom);

		// 查找 dom 树，找到被引用的 class ，替换为缩短后的值
		traversalNode(isTag, node => {
			for (let i = node.attributes.length; i--; ) {
				const attr = node.attributes[i];
				if (attr.fullname === 'class') {
					const className = mixWhiteSpace(attr.value.trim()).split(/\s/);
					for (let ci = className.length; ci--; ) {
						if (classList[className[ci]]) {
							const cName = classList[className[ci]][0];
							delete classList[className[ci]];
							className[ci] = cName;
						} else {
							className.splice(ci, 1);
						}
					}
					if (className.length) {
						attr.value = className.join(' ');
					} else {
						node.removeAttribute(attr.fullname);
					}
					break;
				}
			}
		}, dom);

		// 最后移除不存在的 class 引用
		Object.values(classList).forEach(item => {
			const reg = new RegExp(`.${item[0]}(?=[,\\*#>+~:{\\s\\[\\.]|$)`);
			for (let ri = parsedCss.stylesheet.rules.length; ri--; ) {
				const cssRule = parsedCss.stylesheet.rules[ri];
				if (cssRule.ruleId === item[1]) {
					for (let i = cssRule.selectors.length; i--; ) {
						if (reg.test(cssRule.selectors[i])) {
							cssRule.selectors.splice(i, 1);
						}
					}
					if (!cssRule.selectors.length) {
						parsedCss.stylesheet.rules.splice(ri, 1);
					}
					break;
				}
			}
			if (parsedCss.stylesheet.rules.length) {
				cssContent.textContent = shortenTag(cssStringify(parsedCss, { compress: true }));
			} else {
				rmNode(cssNode);
			}
		});
	}
	resolve();
});