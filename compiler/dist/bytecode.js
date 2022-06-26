"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BytecodeCompiler = void 0;
const Opcodes = new Map([
    ['ADD', 0],
    ['SUB', 1],
    ['MUL', 2],
    ['DIV', 3],
    ['MOD', 4],
    ['NEG', 5],
    // Store a value into local variable
    ['STORE', 6],
    ['GET_PROPERTY', 7],
    ['SET_PROPERTY', 8],
    ['EXISTS', 9],
    ['DELETE_PROPERTY', 10],
    ['INSTANCE_OF', 11],
    ['TYPEOF', 12],
    ['APPLY', 13],
    ['EQUAL', 14],
    ['NOT_EQUAL', 15],
    ['LESS_THAN', 16],
    ['LESS_THAN_EQUAL', 17],
    ['JMP', 18],
    ['JMP_IF', 19],
    ['JMP_ELSE', 20],
    ['PUSH', 21],
    ['POP', 22],
    ['INIT_CONSTRUCTOR', 23],
    ['INIT_ARRAY', 24]
]);
const Headers = new Map([
    ['string', 0],
    ['number', 1],
    ['stack', 2],
    ['variable', 3],
    ['dependency', 4],
    ['undefined', 5],
    ['array', 6],
    ['object', 7]
]);
class BytecodeCompiler {
    constructor(ir) {
        this.ir = ir;
        this.encryptedStrings = [];
        this.bytecode = [];
    }
    encryptXor(text, key) {
        var result = '';
        for (var i = 0; i < text.length; i++) {
            result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
        }
        return result;
    }
    compileInstructionArgument(arg) {
        const header = Headers.get(arg.type);
        if (header == undefined) {
            console.log(arg.type);
            throw 'UNKNOWN_HEADER';
        }
        switch (arg.type) {
            case "undefined":
                return [header];
            case "object":
                return [header];
            case "array":
                return [header];
            case "string":
                var key = "TEST";
                const encoded = this.encryptXor(arg.value, key);
                this.encryptedStrings.push(encoded);
                return [header, this.encryptedStrings.length - 1];
            case "number":
                return [header, arg.value];
            case "stack":
                return [];
            case "variable":
                return [header, arg.value];
            case "dependency":
                return [header, arg.value];
        }
    }
    compile() {
        const bytes = [];
        for (var i = 0; i < this.ir.length; i++) {
            var instruction = this.ir[i];
            var opcode = Opcodes.get(instruction.opcode);
            if (opcode == undefined) {
                throw "UNHANDLED_OPCODE";
            }
            bytes.push(opcode);
            for (var j = 0; j < instruction.args.length; j++) {
                bytes.push(...this.compileInstructionArgument(instruction.args[j]));
            }
        }
        this.bytecode = bytes;
        const encodedBytecode = Buffer.from(bytes).toString('base64');
        return {
            bytecode: encodedBytecode,
            encryptedStrings: this.encryptedStrings
        };
    }
}
exports.BytecodeCompiler = BytecodeCompiler;
