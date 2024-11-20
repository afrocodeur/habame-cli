import * as cheerio from 'cheerio';
import {
    DEFAULT_SLOT_NAME,
    FRAGMENT_ACCEPTED_NAMES,
    SLOT_DEFINITION_TAG_NAME,
    SLOT_RENDER_TAG_NAME, STRUCT_CONTROL_AND_LOOP_ATTRIBUTES
} from "./constantes.js";

const xmlEngine = function(template) {

    if(typeof template === 'object') {
        return template;
    }
    template = template.split(/\r|\n/g).map((line) => line.trim()).join('');
    const dom = cheerio.load(template, { xml: { xmlMode: true, recognizeCDATA: true, recognizeSelfClosing: true } });

    const root = dom.root();
    const children = [];
    const childrenNodes = root.children();
    if(childrenNodes.length === 0) {
        return { content: root.text() };
    }
    childrenNodes.each((index, child) => {
        children.push(xmlNodeToJson(child))
    });
    return children;
};


const xmlNodeAttributeDescriptions =  function(nodeElement) {
    if(!nodeElement.attribs) {
        return {};
    }
    const attributes = { };

    for(const attributeName in nodeElement.attribs) {
        const attributePath = attributeName.split('.');
        const attributeValue = nodeElement.attribs[attributeName];
        if(attributePath.length === 1) {

            if(STRUCT_CONTROL_AND_LOOP_ATTRIBUTES.includes(attributeName.toLowerCase())) {
                attributes[attributeName] = attributeValue;
                continue;
            }

            attributes.attrs = attributes.attrs || {};
            attributes.attrs[attributeName] = attributeValue;
            continue;
        }
        const attributeType = attributePath.shift();
        const attributeSubName = attributePath.join('.');
        if(!attributes[attributeType]) {
            attributes[attributeType] = {};
        }
        attributes[attributeType][attributeSubName] = attributeValue;
    }

    return attributes;
};


const xmlNodeToJson =  function(nodeElement) {
    const element = {};
    const nodeTagName = nodeElement.name;

    if(nodeTagName && !FRAGMENT_ACCEPTED_NAMES.includes(nodeTagName.toLowerCase())) {
        const firstCharOfName = nodeTagName[0];
        if(firstCharOfName === firstCharOfName.toUpperCase()) {
            element.component = nodeTagName;
        }
        else {
            element.name = nodeTagName;
        }
    }

    const children = nodeElement.children;
    if(children && children.length > 0) {
        const elementChildren = [];
        const slots = [];
        Array.from(children).forEach((nodeChild) => {
            const child = xmlNodeToJson(nodeChild);
            if(child.name === SLOT_DEFINITION_TAG_NAME) {
                if(!child.attrs.name) {
                    throw new Error('Slot name is required');
                }
                if(child.props) {
                    child.props = Object.keys(child.props);
                }
                child.name = '';
                slots[child.attrs.name] = child;
                return;
            }
            if(child.name === SLOT_RENDER_TAG_NAME) {
                child.slot = (child.attrs && child.attrs.name) || DEFAULT_SLOT_NAME;
            }
            elementChildren.push(child);
        });
        element.content = (elementChildren.length === 1) ? elementChildren[0] : elementChildren;
        element.slots = slots;
    }
    else if(nodeElement.type === 'text') {
        element.content = nodeElement.data;
    }

    const attributeDescriptions = xmlNodeAttributeDescriptions(nodeElement);
    if(element.name === undefined && element.component === undefined && Object.keys(attributeDescriptions).length === 0) {
        return element.content;
    }
    for(const key in attributeDescriptions) {
        element[key] = attributeDescriptions[key];
    }

    return element;
};

export default xmlEngine;