import { propEq } from 'ramda';
import { regularAttr } from '../const/regular-attr';
import { funcIRIToID, IRIFullMatch } from '../const/syntax';
import { isTag } from '../xml/is-tag';
import { rmNode } from '../xml/rm-node';
import { traversalNode } from '../xml/traversal-node';
import { getAncestor } from '../xml/get-ancestor';

interface IIDCacheITem {
	tag?: ITagNode; // 具有该 id 的节点
	iri: Array<[ITagNode, string]>; // [引用节点, 引用属性]
}

interface IIDCache {
	[propName: string]: IIDCacheITem | undefined;
}

const checkSub = (node: ITagNode, IDList: IIDCache, isDefs = false) => {
	let hasId = false;
	if (!isDefs) {
		const id = node.getAttribute('id');
		if (id) {
			if (IDList[id]) {
				hasId = true;
				(IDList[id] as IIDCacheITem).tag = node;
			}
		}
	}
	if (!hasId) {
		for (let ci = node.childNodes.length; ci--;) {
			const childNode = node.childNodes[ci];
			if (isTag(childNode)) {
				checkSub(childNode, IDList);
			} else {
				rmNode(childNode);
			}
		}
		if (!node.childNodes.length) {
			rmNode(node);
		} else if (!isDefs) {
			(node.parentNode as INode).replaceChild(node, ...node.childNodes);
		}
	}
};

export const shortenDefs = async (rule: TFinalConfigItem, dom: INode): Promise<null> => new Promise((resolve, reject) => {
	if (rule[0]) {
		let firstDefs: ITagNode | undefined;

		// 首先合并 defs 标签
		traversalNode<ITagNode>(propEq('nodeName', 'defs'), node => {
			if (firstDefs) {
				for (const childNode of node.childNodes) {
					// 合并时只把标签类元素挪过去
					if (isTag(childNode)) {
						firstDefs.appendChild(childNode);
					}
				}
				rmNode(node);
			} else {
				firstDefs = node;
				for (let ci = node.childNodes.length; ci--;) {
					const childNode = node.childNodes[ci];
					// 只保留标签类的子元素
					if (!isTag(childNode)) {
						rmNode(childNode);
					}
				}
			}
		}, dom);

		if (firstDefs) {
			// 取出所有被引用的 ID
			const IDList: IIDCache = {};
			traversalNode<ITagNode>(isTag, node => {
				node.attributes.forEach(attr => {
					if (regularAttr[attr.fullname].maybeFuncIRI) {
						const firi = funcIRIToID.exec(attr.value);
						if (firi) {
							if (!IDList[firi[2]]) {
								IDList[firi[2]] = {
									iri: [],
								};
							}
							(IDList[firi[2]] as IIDCacheITem).iri.push([node, attr.fullname]);
						}
					} else if (regularAttr[attr.fullname].maybeIRI) {
						const iri = IRIFullMatch.exec(attr.value);
						if (iri) {
							if (!IDList[iri[1]]) {
								IDList[iri[1]] = {
									iri: [],
								};
							}
							(IDList[iri[1]] as IIDCacheITem).iri.push([node, attr.fullname]);
						}
					}
				});
			}, dom);

			checkSub(firstDefs, IDList, true);

			// TODO 把 defs 直接应用
			(Object.values(IDList) as IIDCacheITem[]).forEach(item => {
				if (item.tag) {
					// 有可能引用对象存在于 defs 内部，并且已被移除
					for (let i = item.iri.length; i--;) {
						const [tag] = item.iri[i];
						// 判断是否已从文档中移除
						if (!getAncestor(tag, (node: INode) => node.nodeName === '#document')) {
							item.iri.splice(i, 1);
						}
					}
					if (!item.iri.length) {
						rmNode(item.tag);
					}
				}
			});
		}
	}
	resolve();
});
