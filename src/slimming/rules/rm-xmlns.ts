import { isTag } from '../xml/is-tag';
import { rmNode } from '../xml/rm-node';

interface IXmlnsDefineUnit {
	target: INode;
	count: number;
}

interface IXmlnsDefine {
	[propName: string]: IXmlnsDefineUnit;
}

export const rmXMLNS = async (rule: TFinalConfigItem, dom: IDomNode): Promise<null> => new Promise((resolve, reject) => {
	if (rule[0]) {
		const traversalNode = (node: INode, nsStack: IXmlnsDefine[]) => {
			if (isTag(node)) {
				const xmlnsObj: IXmlnsDefine = {};
				Object.assign(xmlnsObj, nsStack[nsStack.length - 1]);

				// 首先判断节点是否存在命名空间
				if (node.namespace) {
					if (xmlnsObj.hasOwnProperty(node.namespace)) {
						xmlnsObj[node.namespace].count++;
					} else {
						rmNode(node);
						return;
					}
				}

				// 遍历节点属性的命名空间
				for (let i = node.attributes.length; i--;) {
					const attr = node.attributes[i];
					if (attr.namespace === 'xmlns') {
						xmlnsObj[attr.name] = {
							target: node,
							count: 0,
						};
					} else if (attr.namespace) {
						if (xmlnsObj.hasOwnProperty(attr.namespace)) {
							xmlnsObj[attr.namespace].count++;
						} else {
							node.removeAttribute(attr.fullname);
						}
					}
				}

				// 压栈，并遍历子节点
				nsStack.push(xmlnsObj);
				node.childNodes.forEach(childNode => {
					traversalNode(childNode, nsStack);
				});
				Object.keys(xmlnsObj).forEach(ns => {
					if (xmlnsObj[ns].count === 0 && xmlnsObj[ns].target === node) {
						node.removeAttribute(`xmlns:${ns}`);
					}
				});
				nsStack.pop();
			}
		};

		dom.childNodes.forEach(node => {
			traversalNode(node, [{}]);
		});
	}
	resolve();
});
