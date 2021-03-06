# rtmpl

[![][ci-badge]][ci-link] [![][version-badge]][version-link]
[![][license-badge]][license-link]

[ci-badge]: https://github.com/clebert/rtmpl/workflows/CI/badge.svg
[ci-link]: https://github.com/clebert/rtmpl
[version-badge]: https://badgen.net/npm/v/rtmpl
[version-link]: https://www.npmjs.com/package/rtmpl
[license-badge]: https://badgen.net/npm/license/rtmpl
[license-link]: https://github.com/clebert/rtmpl/blob/master/LICENSE.md

**R**eactive tagged **t**e**mpl**ate literals.

## Installation

```
npm install rtmpl --save
```

## Usage

The concept of this library arose from the requirement to dynamically generate
the text output of CLI applications. However, this may not be the only
reasonable usage scenario. Therefore, this library contains only the conceptual
core in the form of the so-called template nodes. These nodes can be nested
within each other in a tree structure and are observable.

To learn how to generate the text output of CLI applications using this library,
please refer to the README of project
[@rtmpl/terminal](https://github.com/clebert/rtmpl-terminal).

## Types

### `TemplateNode`

```ts
class TemplateNode<TValue> {
  static create<TValue>(
    template: TemplateStringsArray,
    ...children: (TemplateNode<TValue> | TValue)[]
  ): TemplateNode<TValue>;

  subscribe(observer: TemplateNodeObserver<TValue>): () => void;

  update(
    template: TemplateStringsArray,
    ...children: (TemplateNode<TValue> | TValue)[]
  ): this;

  on(event: 'observe' | 'unobserve', listener: () => void): () => void;
}
```

```ts
type TemplateNodeObserver<TValue> = (
  template: TemplateStringsArray,
  ...values: TValue[]
) => void;
```

### `TemplateNodeList`

```ts
class TemplateNodeList<TValue> {
  static join<TValue>(
    items: readonly (TemplateNode<TValue> | TValue)[],
    options?: TemplateNodeListOptions<TValue>
  ): [
    template: TemplateStringsArray,
    ...children: (TemplateNode<TValue> | TValue)[]
  ];

  readonly node: TemplateNode<TValue>;

  constructor(options?: TemplateNodeListOptions<TValue>);

  add(
    template: TemplateStringsArray,
    ...children: (TemplateNode<TValue> | TValue)[]
  ): TemplateNode<TValue>;

  delete(itemNode: TemplateNode<TValue>): void;
}
```

```ts
interface TemplateNodeListOptions<TValue> {
  readonly separator?: TemplateNode<TValue> | NonNullable<TValue>;
}
```

---

Copyright 2021 Clemens Akens. All rights reserved.
[MIT license](https://github.com/clebert/rtmpl/blob/master/LICENSE.md).
