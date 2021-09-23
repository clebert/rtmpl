import {TemplateNode, TemplateNodeObserver} from '.';

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

  test('node composition', () => {
    const nodeC = TemplateNode.create`\nC1${'c1'}\nC2`;
    const nodeB = TemplateNode.create`\nB1${'b1'}\nB2${nodeC}\nB3`;
    const nodeA = TemplateNode.create`\nA1${'a1'}\nA2${nodeB}\nA3`;

    nodeA.subscribe(observer);

    expectEffects(
      compose`\nA1${'a1'}\nA2\nB1${'b1'}\nB2\nC1${'c1'}\nC2\nB3\nA3`
    );

    nodeB.subscribe(observer);
    expectEffects(compose`\nB1${'b1'}\nB2\nC1${'c1'}\nC2\nB3`);
    nodeC.subscribe(observer);
    expectEffects(compose`\nC1${'c1'}\nC2`);
    nodeA.update`\nA1${'a2'}\nA2${nodeB}\nA3`;

    expectEffects(
      compose`\nA1${'a2'}\nA2\nB1${'b1'}\nB2\nC1${'c1'}\nC2\nB3\nA3`
    );

    nodeB.update`\nB1${'b2'}\nB2${nodeC}\nB3`;

    expectEffects(
      compose`\nB1${'b2'}\nB2\nC1${'c1'}\nC2\nB3`,
      compose`\nA1${'a2'}\nA2\nB1${'b2'}\nB2\nC1${'c1'}\nC2\nB3\nA3`
    );

    nodeC.update`\nC1${'c2'}\nC2`;

    expectEffects(
      compose`\nC1${'c2'}\nC2`,
      compose`\nB1${'b2'}\nB2\nC1${'c2'}\nC2\nB3`,
      compose`\nA1${'a2'}\nA2\nB1${'b2'}\nB2\nC1${'c2'}\nC2\nB3\nA3`
    );
  });

  test('node nesting', () => {
    const nodeA = TemplateNode.create<string>`a`;
    const nodeB = TemplateNode.create<string>`b`;
    const nodeC = TemplateNode.create<string>`c`;

    nodeA.subscribe(observer);
    expectEffects(compose`a`);
    nodeB.subscribe(observer);
    expectEffects(compose`b`);
    nodeA.update`a${nodeB}${nodeB}${nodeC}`;
    expectEffects(compose`abbc`);
    nodeA.update`a${nodeB}`;
    expectEffects(compose`ab`);
    nodeB.update`b${nodeC}${nodeC}`;
    expectEffects(compose`bcc`, compose`abcc`);
    nodeA.update`a${nodeB}${nodeB}`;
    expectEffects(compose`abccbcc`);
    nodeB.update`b`;
    expectEffects(compose`b`, compose`abb`);
    nodeA.update`a${nodeB}${nodeC}`;
    expectEffects(compose`abc`);
  });

  test('illegal node nesting when creating', () => {
    const nodeC = TemplateNode.create`c`;

    TemplateNode.create`b${nodeC}`;

    expect(() => TemplateNode.create`a${nodeC}`).toThrow(
      new Error('A template node can have only one parent.')
    );
  });

  test('illegal node nesting when updating', () => {
    const nodeC = TemplateNode.create`c`;
    const nodeB = TemplateNode.create`b${nodeC}`;
    const nodeA = TemplateNode.create`a${nodeB}`;

    expect(() => nodeA.update`a${nodeC}`).toThrow(
      new Error('A template node can have only one parent.')
    );
  });

  test('node observation', () => {
    const nodeC = TemplateNode.create`${'c'}`;
    const nodeB = TemplateNode.create`${'b'}${nodeC}`;
    const nodeA = TemplateNode.create`${'a'}${nodeB}${nodeB}`;

    nodeA.on('observe', () => effects.push('observe a'));
    nodeA.on('unobserve', () => effects.push('unobserve a'));
    nodeB.on('observe', () => effects.push('observe b'));
    nodeB.on('unobserve', () => effects.push('unobserve b'));
    nodeC.on('observe', () => effects.push('observe c'));
    nodeC.on('unobserve', () => effects.push('unobserve c'));

    const unsubscribeA1 = nodeA.subscribe(() => effects.push('value1 a'));

    expectEffects('observe a', 'observe b', 'observe c', 'value1 a');

    const unsubscribeA2 = nodeA.subscribe(() => effects.push('value2 a'));

    expectEffects('value2 a');
    nodeA.update`${'a'}${nodeB}`;
    expectEffects('value1 a', 'value2 a');
    nodeA.update`${'a'}`;
    expectEffects('unobserve b', 'unobserve c', 'value1 a', 'value2 a');
    unsubscribeA1();
    expectEffects();
    unsubscribeA2();
    expectEffects('unobserve a');

    const unsubscribeC1 = nodeC.subscribe(() => effects.push('value1 c'));

    expectEffects('observe c', 'value1 c');

    const unsubscribeA3 = nodeA.subscribe(() => effects.push('value3 a'));

    expectEffects('observe a', 'value3 a');
    nodeA.update`${'a'}${nodeB}`;
    expectEffects('observe b', 'value3 a');

    const unsubscribeC2 = nodeC.subscribe(() => effects.push('value2 c'));

    expectEffects('value2 c');
    unsubscribeC1();
    expectEffects();
    unsubscribeC2();
    expectEffects();

    const unsubscribeB1 = nodeB.subscribe(() => effects.push('value1 b'));

    expectEffects('value1 b');
    unsubscribeA3();
    expectEffects('unobserve a');
    unsubscribeB1();
    expectEffects('unobserve b', 'unobserve c');
    nodeB.update`${'b'}`;
    expectEffects();
    nodeB.update`${'b'}${nodeC}`;
    expectEffects();
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
    const node = TemplateNode.create`a`;
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
    const node = TemplateNode.create`a`;
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
