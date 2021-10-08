// Copyright 2021 Clemens Akens. All rights reserved. MIT license.

import {tag} from './util/tag';
import {TemplateNode, TemplateNodeList} from '.';

describe('TemplateNodeList', () => {
  const separator = TemplateNode.create` ${','} `;

  test('adding and deleting item nodes with a separator', () => {
    const nodeList = new TemplateNodeList({separator});
    const observer = jest.fn();

    nodeList.node.subscribe(observer);

    const itemNodeA = nodeList.add`a`;
    const itemNodeB = nodeList.add`<${'b'}>`;
    const itemNodeC = nodeList.add`c`;

    nodeList.delete(itemNodeA);
    nodeList.delete(itemNodeA);
    nodeList.delete(itemNodeB);
    nodeList.delete(itemNodeC);

    expect(observer.mock.calls).toEqual([
      tag``,
      tag`a`,
      tag`a ${','} <${'b'}>`,
      tag`a ${','} <${'b'}> ${','} c`,
      tag`<${'b'}> ${','} c`,
      tag`c`,
      tag``,
    ]);
  });

  test('adding and deleting item nodes without a separator', () => {
    const nodeList = new TemplateNodeList<string>();
    const observer = jest.fn();

    nodeList.node.subscribe(observer);

    const itemNodeA = nodeList.add`a`;
    const itemNodeB = nodeList.add`<${'b'}>`;
    const itemNodeC = nodeList.add`c`;

    nodeList.delete(itemNodeA);
    nodeList.delete(itemNodeA);
    nodeList.delete(itemNodeB);
    nodeList.delete(itemNodeC);

    expect(observer.mock.calls).toEqual([
      tag``,
      tag`a`,
      tag`a<${'b'}>`,
      tag`a<${'b'}>c`,
      tag`<${'b'}>c`,
      tag`c`,
      tag``,
    ]);
  });

  test('joining items with a separator', () => {
    const listNode = TemplateNode.create``;
    const observer = jest.fn();

    listNode.subscribe(observer);

    listNode.update(
      ...TemplateNodeList.join(['a', TemplateNode.create`<${'b'}>`, 'c'], {
        separator,
      })
    );

    listNode.update(...TemplateNodeList.join(['a'], {separator}));
    listNode.update(...TemplateNodeList.join([], {separator}));

    expect(observer.mock.calls).toEqual([
      tag``,
      tag`${'a'} ${','} <${'b'}> ${','} ${'c'}`,
      tag`${'a'}`,
      tag``,
    ]);
  });

  test('joining items without a separator', () => {
    const listNode = TemplateNode.create``;
    const observer = jest.fn();

    listNode.subscribe(observer);

    listNode.update(
      ...TemplateNodeList.join(['a', TemplateNode.create`<${'b'}>`, 'c'])
    );

    listNode.update(...TemplateNodeList.join(['a']));
    listNode.update(...TemplateNodeList.join([]));

    expect(observer.mock.calls).toEqual([
      tag``,
      tag`${'a'}<${'b'}>${'c'}`,
      tag`${'a'}`,
      tag``,
    ]);
  });
});
