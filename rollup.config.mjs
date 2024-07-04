// const rollup = require('rollup');
// import rollup from "rollup";

// plugin that transpiles output into commonjs format
import commonjs from '@rollup/plugin-commonjs';
// // plugin that transpiles es6 to es5 for legacy platforms
// const buble = require('@rollup/plugin-buble');
// plugin that shows output file info
// const filesize = require('rollup-plugin-filesize');
/// plugin that resolves node module imports
// const { nodeResolve } = require('@rollup/plugin-node-resolve');
import nodeResolve from "@rollup/plugin-node-resolve";
// plugin that minifies and obfuscates code
// const { terser } = require('rollup-plugin-terser');
import typescript from "rollup-plugin-typescript2";

// const pkg = require('./package.json');
const input = 'src-esm/index.js';

const browserGlobals = {
  roslib: 'ROSLIB',
};

const moduleGlobals = {
  roslib: 'ROSLIB',
};

const outputFiles = {
  commonModule: './build/ros3d.cjs.js',
  esModule: './build/ros3d.esm.js',
  browserGlobal: './build/ros3d.js',
  browserGlobalMinified: './build/ros3d.min.js',
};

export default [
  // build main as ES5 in CommonJS format for compatibility
  // {
  //   input,
  //   output: {
  //     name: 'ROS3D',
  //     file: outputFiles.commonModule,
  //     format: 'cjs',
  //     globals: {
  //       ...moduleGlobals,
  //     }
  //   },
  //   external: [
  //     ...Object.keys(moduleGlobals)
  //   ],
  //   plugins: [
  //     nodeResolve({ browser: true }),
  //     // commonjs(),
  //     // buble(),
  //     // filesize(),
  //   ],
  // },
  // build module as ES5 in ES module format for modern tooling
  {
    input,
    output: {
      name: 'ROS3D',
      file: outputFiles.esModule,
      format: 'es',
      globals: {
        ...moduleGlobals,
      },
      inlineDynamicImports:true,
    },
    external: [
      ...Object.keys(moduleGlobals)
    ],
    plugins: [
      nodeResolve({ browser: true }),
      // typescript({allowJs: true}),
      commonjs(),
      // buble(),
      // filesize(),
    ],
  },
  // build browser as IIFE module for script tag inclusion, unminified
  // Usage:
  // <script src="../build/ros3d.js"></script>
  {
    input,
    output: {
      name: 'ROS3D',
      file: outputFiles.browserGlobal,
      format: 'iife',
      globals: {
        ...browserGlobals,
      },
    },
    external: [
      ...Object.keys(browserGlobals),
    ],
    plugins: [
      nodeResolve({ browser: true }),
      commonjs(),
      // filesize(),
    ],
  },
  // build browser as IIFE module for script tag inclusion, minified
  // Usage:
  // <script src="../build/ros3d.min.js"></script>
  {
    input,
    output: {
      name: 'ROS3D',
      file: outputFiles.browserGlobalMinified,
      format: 'iife',
      globals: {
        ...browserGlobals,
      },
    },
    external: [
      ...Object.keys(browserGlobals),
    ],
    plugins: [
      nodeResolve({ browser: true }),
      commonjs(),
      // filesize(),
      // terser(),
    ],
  },
];
