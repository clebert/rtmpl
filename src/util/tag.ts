// Copyright 2021 Clemens Akens. All rights reserved. MIT license.

export type TaggedTemplate<TValue> = readonly [
  template: TemplateStringsArray,
  ...values: TValue[]
];

export function tag<TValue>(
  template: TemplateStringsArray,
  ...values: TValue[]
): TaggedTemplate<TValue> {
  const enumerableTemplate: any = [...template];

  enumerableTemplate.raw = [...template.raw];

  return [enumerableTemplate, ...values];
}
