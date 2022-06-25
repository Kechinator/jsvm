"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Compiler = void 0;
const parser_1 = require("@babel/parser");
// Compiler is in charge of compiling the specified javascript code into raw bytecode
// Compiler will first construct a basic IR 
class Compiler {
    constructor(src) {
        this.ast = (0, parser_1.parse)(src);
    }
    constructIR() {
        for (var i = 0; i < this.ast.program.body.length; i++) {
            var node = this.ast.program.body[i];
            console.log(node);
        }
    }
    compile() {
        this.constructIR();
    }
}
exports.Compiler = Compiler;
