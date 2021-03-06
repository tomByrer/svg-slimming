import chai = require('chai');
const should = chai.should();
import { rmAttribute } from '../../../src/slimming/rules/rm-attribute';
import { parse } from '../../../src/xml-parser/app';
import { createXML } from '../../../src/slimming/xml/create';

describe('rules/rm-attribute', () => {
	it('rule false branch', async () => {
		const xml = '<svg><polygon points="0,0 100,200,300,300,299,299" /></svg>';
		const dom = await parse(xml) as ITagNode;
		await rmAttribute([false], dom);
		createXML(dom).should.equal('<svg><polygon points="0,0 100,200,300,300,299,299"/></svg>');
	});

	it('移除属性', async () => {
		const xml = `<svg
			data-test="100"
			aria-colspan="3"
			onload="console.log(123)"
			version=""
			width="100"
			style="width:40"
		>
		<a x="1"/>
		<circle stroke="none" cx="1" cy="0.0"/>
		<animate to="1"/>
		<animate to="1" attributeName="title"/>
		<animate to="x" attributeName="amplitude"/>
		<animate to="x" from="0" attributeName="amplitude"/>
		<g fill="#000">
			<rect fill="black" stroke=""/>
			<g fill="none">
				<rect id="rect" fill="rgb(0,0,0,.5)" stroke="hsl(0,0%,0%)"/>
				<use href="#b" xlink:href="#rect"/>
			</g>
		</g>
		</svg>`;
		const dom = await parse(xml) as ITagNode;
		await rmAttribute([true, { rmDefault: true, keepEvent: false, keepAria: false }], dom);
		createXML(dom).replace(/>\s+</g, '><').should.equal('<svg width="100" style="width:40"><a/><circle cx="1"/><animate/><animate/><animate/><animate from="0" attributeName="amplitude"/><g><rect/><g fill="none"><rect id="rect" fill="rgb(0,0,0,.5)" stroke="hsl(0,0%,0%)"/><use href="#b"/></g></g></svg>');
	});

	it('移除属性 - 反转规则', async () => {
		const xml = `<svg
			data-test="100"
			aria-colspan="3"
			onload="console.log(123)"
			version=""
		><text stroke="none"/><circle cx="1" cy="0"/></svg>`;
		const dom = await parse(xml) as ITagNode;
		await rmAttribute([true, { rmDefault: false, keepEvent: true, keepAria: true }], dom);
		createXML(dom).should.equal('<svg aria-colspan="3" onload="console.log(123)"><text stroke="none"/><circle cx="1" cy="0"/></svg>');
	});
});
