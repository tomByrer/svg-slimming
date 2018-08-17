import { has, pipe, propEq } from 'ramda';
import { INode } from '../../node/index';
import { regularAttr, IRegularAttr } from '../const/regular-attr';
import { checkApply } from '../style/check-apply';
import { execStyle } from '../style/exec';
import { shortenStyle } from '../style/shorten';
import { stringifyStyle } from '../style/stringify';
import { legalValue } from '../validate/legal-value';
import { isTag } from '../xml/is-tag';
import { traversalNode } from '../xml/traversal-node';

// 属性转 style 的临界值
const styleThreshold = 4;
const style2value = pipe(stringifyStyle, shortenStyle);

export const shortenStyleAttr = (rule, dom) => new Promise((resolve, reject) => {
	if (rule[0]) {
		let hasStyleTag = false;

		traversalNode(propEq('nodeName', 'style'), (node: INode) => {
			hasStyleTag = true;
		}, dom);

		traversalNode(isTag, (node: INode) => {
			const attrObj = {};
			for (let i = node.attributes.length; i--; ) {
				const attr = node.attributes[i];
				const attrDefine: IRegularAttr = regularAttr[attr.fullname];
				if (attr.fullname === 'style') {
					const styleObj = execStyle(attr.value);
					const styleUnique = {};
					for (let si = styleObj.length; si--; ) {
						const styleItem = styleObj[si];
						const styleDefine: IRegularAttr = regularAttr[styleItem.fullname];
						if (
							styleUnique[styleItem.fullname] // 排重
							||
							!styleDefine.couldBeStyle // 不是合法的样式属性
							||
							!checkApply(styleDefine, node, dom) // 样式继承链上不存在可应用对象
							||
							!legalValue(styleDefine, styleItem.value) // 值不合法
						) {
							styleObj.splice(si, 1);
						} else {
							if (has(styleItem.fullname, attrObj)) { // 如果存在同名属性，要把被覆盖的属性移除掉
								node.removeAttribute(styleItem.fullname);
							}
							styleUnique[styleItem.fullname] = true;
							attrObj[styleItem.fullname] = styleItem.value;
						}
					}

					if (Object.keys(styleObj).length) {
						attr.value = style2value(styleObj);
					} else {
						node.removeAttribute(attr.fullname);
					}
				} else if (attrDefine.couldBeStyle) {
					if (
						attrObj[attr.fullname] // 已被 style 属性覆盖
						||
						!checkApply(attrDefine, node, dom) // 样式继承链上不存在可应用对象
						||
						!legalValue(attrDefine, attr.value) // 值不合法
					) {
						node.removeAttribute(attr.fullname);
					} else {
						attrObj[attr.fullname] = attr.value;
					}
				}
			}

			if (!hasStyleTag || rule[1]) {
				// [warning] svg 的样式覆盖规则是 style 属性 > style 标签 > 属性，所以以下代码可能导致不正确的覆盖！
				const attributes = node.attributes;
				if (Object.keys(attrObj).length > styleThreshold) {

					// 属性转 style
					for (let j = attributes.length; j--; ) {
						const attr = attributes[j];
						if (regularAttr[attr.fullname].couldBeStyle || attr.fullname === 'style') {
							node.removeAttribute(attr.fullname);
						}
					}
					node.setAttribute('style', style2value(Object.keys(attrObj).map(key => {
						return {
							name: key,
							fullname: key,
							value: attrObj[key],
						};
					})));

				} else {

					// style 转属性
					node.removeAttribute('style');
					attributes.forEach(attr => {
						if (has(attr.fullname, attrObj)) {
							delete attrObj[attr.fullname];
						}
					});
					Object.keys(attrObj).forEach(name => {
						node.setAttribute(name, attrObj[name]);
					});

				}
			}
		}, dom);
	}
	resolve();
});