export type TemplateNodeObserver<TValue> = (
  template: TemplateStringsArray,
  ...values: TValue[]
) => void;

export class TemplateNode<TValue> {
  // eslint-disable-next-line no-shadow
  static create<TValue>(
    template: TemplateStringsArray,
    ...children: (TemplateNode<TValue> | TValue)[]
  ): TemplateNode<TValue> {
    return new TemplateNode(template, children);
  }

  #template: TemplateStringsArray;
  #children: readonly (TemplateNode<TValue> | TValue)[];
  #observers = new Set<TemplateNodeObserver<TValue>>();
  #parent?: TemplateNode<TValue>;
  #observeListeners = new Set<() => void>();
  #unobserveListeners = new Set<() => void>();
  #observeEventFired = false;

  constructor(
    template: TemplateStringsArray,
    children: readonly (TemplateNode<TValue> | TValue)[]
  ) {
    for (const child of children) {
      if (child instanceof TemplateNode) {
        child.#bindTo(this);
      }
    }

    this.#template = template;
    this.#children = children;
  }

  subscribe(observer: TemplateNodeObserver<TValue>): () => void {
    if (!this.#observers.has(observer)) {
      this.#observe();
      this.#observers.add(observer);
      observer(...this.#compose());
    }

    return (): void => {
      this.#observers.delete(observer);
      this.#unobserve();
    };
  }

  update(
    template: TemplateStringsArray,
    ...children: (TemplateNode<TValue> | TValue)[]
  ): void {
    const prevChildren = new Set(this.#children);

    for (const child of children) {
      if (prevChildren.has(child)) {
        prevChildren.delete(child);
      } else if (child instanceof TemplateNode) {
        child.#bindTo(this);

        if (this.#observed) {
          child.#observe();
        }
      }
    }

    for (const child of prevChildren) {
      if (child instanceof TemplateNode) {
        child.#parent = undefined;
        child.#unobserve();
      }
    }

    this.#template = template;
    this.#children = children;
    this.#publish();
  }

  on(eventType: 'observe' | 'unobserve', listener: () => void): () => void {
    const listeners =
      eventType === 'observe'
        ? this.#observeListeners
        : this.#unobserveListeners;

    if (!listeners.has(listener)) {
      listeners.add(listener);

      if (eventType === 'observe' && this.#observed) {
        listener();
      }
    }

    return (): void => {
      listeners.delete(listener);
    };
  }

  #bindTo(parent: TemplateNode<TValue>): void {
    if (this.#parent && this.#parent !== parent) {
      throw new Error('A template node can have only one parent.');
    }

    this.#parent = parent;
  }

  #publish(): void {
    if (this.#observers.size > 0) {
      const [template, ...values] = this.#compose();

      for (const observer of this.#observers) {
        observer(template, ...values);
      }
    }

    if (this.#parent) {
      this.#parent.#publish();
    }
  }

  #compose(): readonly [template: TemplateStringsArray, ...values: TValue[]] {
    const template: string[] & {raw: string[]} = [] as any;

    template.raw = [];

    const values: TValue[] = [];

    template.push(this.#template[0]!);
    template.raw.push(this.#template.raw[0]!);

    for (let index = 0; index < this.#children.length; index += 1) {
      const child = this.#children[index]!;

      if (child instanceof TemplateNode) {
        const [childTemplate, ...childValues] = child.#compose();

        template[template.length - 1] += childTemplate[0];
        template.raw[template.raw.length - 1] += childTemplate.raw[0];
        template.push(...childTemplate.slice(1));
        template.raw.push(...childTemplate.raw.slice(1));
        values.push(...childValues);
        template[template.length - 1] += this.#template[index + 1];
        template.raw[template.raw.length - 1] += this.#template.raw[index + 1];
      } else {
        values.push(child);
        template.push(this.#template[index + 1]!);
        template.raw.push(this.#template.raw[index + 1]!);
      }
    }

    return [template, ...values];
  }

  get #observed(): boolean {
    return (
      this.#observers.size > 0 ||
      (this.#parent ? this.#parent.#observed : false)
    );
  }

  #observe(): void {
    if (!this.#observeEventFired) {
      this.#observeEventFired = true;

      for (const listener of this.#observeListeners) {
        listener();
      }
    }

    for (const child of this.#children) {
      if (child instanceof TemplateNode) {
        child.#observe();
      }
    }
  }

  #unobserve(): void {
    if (!this.#observed && this.#observeEventFired) {
      this.#observeEventFired = false;

      for (const listener of this.#unobserveListeners) {
        listener();
      }
    }

    for (const child of this.#children) {
      if (child instanceof TemplateNode) {
        child.#unobserve();
      }
    }
  }
}
