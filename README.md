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

## Types

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
  ): void;

  on(event: 'observe' | 'unobserve', listener: () => void): () => void;
}
```

```ts
type TemplateNodeObserver<TValue> = (
  template: TemplateStringsArray,
  ...values: TValue[]
) => void;
```

---

Copyright 2021 Clemens Akens. All rights reserved.
[MIT license](https://github.com/clebert/rtmpl/blob/master/LICENSE.md).
