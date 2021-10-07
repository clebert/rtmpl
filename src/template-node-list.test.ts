// Copyright 2021 Clemens Akens. All rights reserved. MIT license.

import {tag} from './util/tag';
import {TemplateNode, TemplateNodeList} from '.';

describe('TemplateNodeList', () => {
  test('with separator', () => {
    const nodeList = new TemplateNodeList<string | boolean>({
      separator: TemplateNode.create<string | boolean>`|${false}|`,
    });

    const observer = jest.fn();

    nodeList.node.subscribe(observer);

    const nodeA = nodeList.add`a`;
    const nodeB = nodeList.add`<${'b'}>`;
    const nodeC = nodeList.add`c`;

    nodeList.delete(nodeA);
    nodeList.delete(nodeA);
    nodeList.delete(nodeB);
    nodeList.delete(nodeC);

    expect(observer.mock.calls).toEqual([
      tag``,
      tag`a`,
      tag<boolean | string>`a|${false}|<${'b'}>`,
      tag<boolean | string>`a|${false}|<${'b'}>|${false}|c`,
      tag<boolean | string>`<${'b'}>|${false}|c`,
      tag`c`,
      tag``,
    ]);
  });

  test('without separator', () => {
    const nodeList = new TemplateNodeList<string>();
    const observer = jest.fn();

    nodeList.node.subscribe(observer);

    const nodeA = nodeList.add`a`;
    const nodeB = nodeList.add`<${'b'}>`;
    const nodeC = nodeList.add`c`;

    nodeList.delete(nodeA);
    nodeList.delete(nodeB);
    nodeList.delete(nodeC);

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
});
