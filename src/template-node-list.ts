// Copyright 2021 Clemens Akens. All rights reserved. MIT license.

import {TemplateNode} from './template-node';

export interface TemplateNodeListOptions<TValue> {
  readonly separator?: TemplateNode<TValue> | NonNullable<TValue>;
}

export class TemplateNodeList<TValue> {
  // eslint-disable-next-line no-shadow
  static join<TValue>(
    itemNodes: readonly (TemplateNode<TValue> | TValue)[],
    options: TemplateNodeListOptions<TValue> = {}
  ): [
    template: TemplateStringsArray,
    ...children: (TemplateNode<TValue> | TValue)[]
  ] {
    const template: string[] & {raw: string[]} = [''] as any;

    template.raw = [''];

    const children: (TemplateNode<TValue> | TValue)[] = [];
    const {separator} = options;

    for (let index = 0; index < itemNodes.length; index += 1) {
      if (separator !== undefined && index > 0) {
        template.push('');
        template.raw.push('');
        children.push(separator);
      }

      template.push('');
      template.raw.push('');
      children.push(itemNodes[index]!);
    }

    return [template, ...children];
  }

  readonly node = TemplateNode.create<TValue>``;
  readonly #itemNodes = new Set<TemplateNode<TValue>>();
  readonly #options: TemplateNodeListOptions<TValue> | undefined;

  constructor(options?: TemplateNodeListOptions<TValue>) {
    this.#options = options;
  }

  add(
    template: TemplateStringsArray,
    ...children: (TemplateNode<TValue> | TValue)[]
  ): TemplateNode<TValue> {
    const itemNode = TemplateNode.create(template, ...children);

    this.#itemNodes.add(itemNode);

    this.node.update(
      ...TemplateNodeList.join([...this.#itemNodes], this.#options)
    );

    return itemNode;
  }

  delete(itemNode: TemplateNode<TValue>): void {
    if (this.#itemNodes.has(itemNode)) {
      this.#itemNodes.delete(itemNode);

      this.node.update(
        ...TemplateNodeList.join([...this.#itemNodes], this.#options)
      );
    }
  }
}
