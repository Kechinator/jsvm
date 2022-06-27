"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const bytecode_1 = require("./bytecode");
const compiler_1 = require("./compiler");
const src = fs_1.default.readFileSync('./input/basic/test.js').toString();
const compiler = new compiler_1.Compiler(src);
const ir = compiler.compile();
const bytecodeCompiler = new bytecode_1.BytecodeCompiler(ir);
const vmArguments = bytecodeCompiler.compile();
console.log(vmArguments);
fs_1.default.writeFileSync('./input/basic/test.args', JSON.stringify(vmArguments, null, 4));
fs_1.default.writeFileSync('./input/basic/test.jsvm', JSON.stringify(ir, null, 4));
