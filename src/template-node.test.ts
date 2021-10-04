import {TemplateNode, TemplateNodeObserver} from './template-node';

type Composition = readonly [
  template: TemplateStringsArray,
  ...values: string[]
];

describe('TemplateNode', () => {
  let effects: (string | Composition)[] = [];
  let expectedEffects: (string | Composition)[] = [];

  const expectEffects = (
    ...additionalEvents: (string | Composition)[]
  ): void => {
    expectedEffects.push(...additionalEvents);
    expect(effects).toEqual(expectedEffects);
  };

  const observer: TemplateNodeObserver<string> = (...composition) =>
    effects.push(composition);

  beforeEach(() => {
    effects = [];
    expectedEffects = [];
  });

  test('string composition', () => {
    const nodeD = TemplateNode.create`\nD1${'d1'}\nD2`;
    const nodeC = TemplateNode.create`\nC1${'c1'}\nC2${nodeD}\nC3`;
    const nodeB = TemplateNode.create`\nB1${'b1'}\nB2${nodeC}\nB3`;
    const nodeA = TemplateNode.create`\nA1${'a1'}\nA2${nodeC}\nA3`;

    nodeA.subscribe(observer);

    expectEffects(
      compose`\nA1${'a1'}\nA2\nC1${'c1'}\nC2\nD1${'d1'}\nD2\nC3\nA3`
    );

    nodeB.subscribe(observer);

    expectEffects(
      compose`\nB1${'b1'}\nB2\nC1${'c1'}\nC2\nD1${'d1'}\nD2\nC3\nB3`
    );

    nodeC.subscribe(observer);
    expectEffects(compose`\nC1${'c1'}\nC2\nD1${'d1'}\nD2\nC3`);
    nodeD.subscribe(observer);
    expectEffects(compose`\nD1${'d1'}\nD2`);
    nodeA.update`\nA1${'a2'}\nA2${nodeC}\nA3`;

    expectEffects(
      compose`\nA1${'a2'}\nA2\nC1${'c1'}\nC2\nD1${'d1'}\nD2\nC3\nA3`
    );

    nodeB.update`\nB1${'b2'}\nB2${nodeC}\nB3`;

    expectEffects(
      compose`\nB1${'b2'}\nB2\nC1${'c1'}\nC2\nD1${'d1'}\nD2\nC3\nB3`
    );

    nodeC.update`\nC1${'c2'}\nC2${nodeD}\nC3`;

    expectEffects(
      compose`\nC1${'c2'}\nC2\nD1${'d1'}\nD2\nC3`,
      compose`\nB1${'b2'}\nB2\nC1${'c2'}\nC2\nD1${'d1'}\nD2\nC3\nB3`,
      compose`\nA1${'a2'}\nA2\nC1${'c2'}\nC2\nD1${'d1'}\nD2\nC3\nA3`
    );

    nodeD.update`\nD1${'d2'}\nD2`;

    expectEffects(
      compose`\nD1${'d2'}\nD2`,
      compose`\nC1${'c2'}\nC2\nD1${'d2'}\nD2\nC3`,
      compose`\nB1${'b2'}\nB2\nC1${'c2'}\nC2\nD1${'d2'}\nD2\nC3\nB3`,
      compose`\nA1${'a2'}\nA2\nC1${'c2'}\nC2\nD1${'d2'}\nD2\nC3\nA3`
    );
  });

  test('observation by subscribe', () => {
    const nodeD = TemplateNode.create`${'d'}`;
    const nodeC = TemplateNode.create`${'c'}${nodeD}`;
    const nodeB = TemplateNode.create`${'b'}${nodeC}${nodeC}`;
    const nodeA = TemplateNode.create`${'a'}${nodeC}`;

    nodeA.on('observe', () => effects.push('observe a'));
    nodeA.on('unobserve', () => effects.push('unobserve a'));
    nodeB.on('observe', () => effects.push('observe b'));
    nodeB.on('unobserve', () => effects.push('unobserve b'));
    nodeC.on('observe', () => effects.push('observe c'));
    nodeC.on('unobserve', () => effects.push('unobserve c'));
    nodeD.on('observe', () => effects.push('observe d'));
    nodeD.on('unobserve', () => effects.push('unobserve d'));

    const unsubscribeB = nodeB.subscribe(observer);

    expectEffects(
      'observe b',
      'observe c',
      'observe d',
      compose`${'b'}${'c'}${'d'}${'c'}${'d'}`
    );

    const unsubscribeA = nodeA.subscribe(observer);

    expectEffects('observe a', compose`${'a'}${'c'}${'d'}`);
    unsubscribeB();
    expectEffects('unobserve b');
    unsubscribeA();
    expectEffects('unobserve a', 'unobserve c', 'unobserve d');
  });

  test('observation by update', () => {
    const nodeA = TemplateNode.create`${'a'}`;
    const nodeB = TemplateNode.create`${'b'}`;
    const nodeC = TemplateNode.create`${'c'}`;
    const nodeD = TemplateNode.create`${'d'}`;

    nodeA.on('observe', () => effects.push('observe a'));
    nodeA.on('unobserve', () => effects.push('unobserve a'));
    nodeB.on('observe', () => effects.push('observe b'));
    nodeB.on('unobserve', () => effects.push('unobserve b'));
    nodeC.on('observe', () => effects.push('observe c'));
    nodeC.on('unobserve', () => effects.push('unobserve c'));
    nodeD.on('observe', () => effects.push('observe d'));
    nodeD.on('unobserve', () => effects.push('unobserve d'));

    nodeC.update`${'c'}${nodeD}`;
    expectEffects();
    nodeB.subscribe(observer);
    expectEffects('observe b', compose`${'b'}`);
    nodeB.update`${'b'}${nodeC}${nodeC}`;

    expectEffects(
      'observe c',
      'observe d',
      compose`${'b'}${'c'}${'d'}${'c'}${'d'}`
    );

    nodeA.subscribe(observer);
    expectEffects('observe a', compose`${'a'}`);
    nodeA.update`${'a'}${nodeC}`;
    expectEffects(compose`${'a'}${'c'}${'d'}`);
    nodeB.update`${'b'}`;
    expectEffects(compose`${'b'}`);
    nodeA.update`${'a'}`;
    expectEffects('unobserve c', 'unobserve d', compose`${'a'}`);
    nodeC.update`${'c'}`;
  });

  test('error by recursion', () => {
    const nodeA = TemplateNode.create``;
    const nodeB = TemplateNode.create`${nodeA}`;
    const nodeC = TemplateNode.create`${nodeB}`;

    expect(() => nodeA.update`${nodeA}`).toThrow(
      new Error('A node cannot be a descendant of itself.')
    );

    expect(() => nodeA.update`${nodeB}`).toThrow(
      new Error('A node cannot be a descendant of itself.')
    );

    expect(() => nodeA.update`${nodeC}`).toThrow(
      new Error('A node cannot be a descendant of itself.')
    );
  });

  test('multiple observers', () => {
    const observer1 = jest.fn();
    const observer2 = jest.fn();
    const node = TemplateNode.create`a`;
    const unsubscribe1 = node.subscribe(observer1);
    const unsubscribe2 = node.subscribe(observer2);

    node.subscribe(observer1);
    node.subscribe(observer2);
    node.update`b`;
    unsubscribe1();
    unsubscribe1();
    node.update`c`;
    unsubscribe2();
    node.update`d`;
    node.update`e`;
    node.subscribe(observer1);
    node.update`f`;

    expect(observer1.mock.calls).toEqual([
      compose`a`,
      compose`b`,
      compose`e`,
      compose`f`,
    ]);

    expect(observer2.mock.calls).toEqual([compose`a`, compose`b`, compose`c`]);
  });

  test('multiple observe event listeners', () => {
    const listener1 = jest.fn();
    const listener2 = jest.fn();
    const node = TemplateNode.create``;
    const off1 = node.on('observe', listener1);

    node.on('observe', listener1);
    expect(listener1).toHaveBeenCalledTimes(0);

    const unsubscribe1 = node.subscribe(jest.fn());

    expect(listener1).toHaveBeenCalledTimes(1);

    const unsubscribe2 = node.subscribe(jest.fn());

    node.on('observe', listener2);
    expect(listener2).toHaveBeenCalledTimes(1);
    node.on('observe', listener2);
    off1();
    unsubscribe1();
    unsubscribe2();
    expect(listener2).toHaveBeenCalledTimes(1);
    node.subscribe(jest.fn());
    expect(listener1).toHaveBeenCalledTimes(1);
    expect(listener2).toHaveBeenCalledTimes(2);
  });

  test('multiple unobserve event listeners', () => {
    const listener1 = jest.fn();
    const listener2 = jest.fn();
    const node = TemplateNode.create``;
    const off1 = node.on('unobserve', listener1);

    node.on('unobserve', listener1);

    const unsubscribe1 = node.subscribe(jest.fn());
    const unsubscribe2 = node.subscribe(jest.fn());

    node.on('unobserve', listener2);
    node.on('unobserve', listener2);
    unsubscribe1();
    expect(listener1).toHaveBeenCalledTimes(0);
    expect(listener2).toHaveBeenCalledTimes(0);
    unsubscribe2();
    expect(listener1).toHaveBeenCalledTimes(1);
    expect(listener2).toHaveBeenCalledTimes(1);
    off1();

    const unsubscribe3 = node.subscribe(jest.fn());

    expect(listener2).toHaveBeenCalledTimes(1);
    unsubscribe3();
    expect(listener1).toHaveBeenCalledTimes(1);
    expect(listener2).toHaveBeenCalledTimes(2);
  });
});

function compose(
  template: TemplateStringsArray,
  ...values: string[]
): Composition {
  const pseudoTemplate: any = [...template];

  pseudoTemplate.raw = [...template.raw];

  return [pseudoTemplate, ...values];
}
