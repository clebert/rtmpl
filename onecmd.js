// @ts-check

const std = require('@onecmd/standard-plugins');
const nodeVersion = '16';

/** @type {readonly import('onecmd').Plugin[]} */
const plugins = [
  std.babel(),
  std.editorconfig(),
  std.eslint(),
  std.git(),
  std.github({nodeVersion}),
  std.jest({coverage: true}),
  std.node(nodeVersion),
  std.npm(),
  std.prettier(),
  std.typescript('node', 'package'),
  std.vscode({showFilesInEditor: false}),

  {
    setup: () => [
      {
        type: 'mod',
        path: 'tsconfig.json',
        is: std.isObject,

        update: (content) => ({
          ...content,
          include: [...content.include, 'example/*.js'],
        }),
      },
    ],
  },
];

module.exports = plugins;
