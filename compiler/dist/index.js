"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const compiler_1 = require("./compiler");
const src = fs_1.default.readFileSync('input/basic/test.js').toString();
const compiler = new compiler_1.Compiler(src);
compiler.compile();
