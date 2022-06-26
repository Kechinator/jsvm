"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Compiler = void 0;
const generator_1 = __importDefault(require("@babel/generator"));
const parser_1 = require("@babel/parser");
// Compiler is in charge of compiling the specified javascript code into raw bytecode
// Compiler will first construct a basic IR 
class Compiler {
    constructor(src) {
        this.ast = (0, parser_1.parse)(src);
        this.dependencies = ['console', 'Array', 'navigator', 'eval'];
        this.contexts = [
            {
                variables: new Map(),
                counter: 0,
            },
        ];
        var block = {
            instructions: [],
            inheritsContext: true,
        };
        this.blocks = [block];
        this.ir = {
            'main': block
        };
    }
    isVariableInitalized(name) {
        return this.contexts[0].variables.has(name);
    }
    initalizeVariable(name, dst) {
        this.contexts[0].variables.set(name, dst);
    }
    isADependency(name) {
        return this.dependencies.includes(name);
    }
    getDependencyPointer(name) {
        return this.dependencies.indexOf(name);
    }
    pushInstruction(instruction) {
        this.blocks[0].instructions.push(instruction);
    }
    createNumberArgument(dst) {
        return {
            type: 'number',
            value: dst
        };
    }
    createArrayArgument() {
        return {
            type: 'array',
            value: null
        };
    }
    createObjectArgument() {
        return {
            type: 'object',
            value: null
        };
    }
    createUndefinedArgument() {
        return {
            type: 'undefined',
            value: null
        };
    }
    createDependencyArgument(pointer) {
        return {
            type: 'dependency',
            value: pointer
        };
    }
    createStringArgument(value) {
        return {
            type: 'string',
            value: value
        };
    }
    createVariableArgument(dst) {
        return {
            type: 'variable',
            value: dst
        };
    }
    translateUnaryExpression(node) {
        this.appendPushInstruction(this.translateExpression(node.argument));
        switch (node.operator) {
            case "typeof":
                this.appendTypeofInstruction();
                break;
            case "!":
                this.appendNotInstruction();
                break;
            default:
                console.log(node.operator);
                throw "UNSUPPORTED_UNARY_TYPE";
        }
    }
    translateExpression(node) {
        if (node == undefined || node == null) {
            return {
                type: 'undefined',
                value: null
            };
        }
        switch (node.type) {
            case "UnaryExpression":
                this.translateUnaryExpression(node);
                var dst = this.contexts[0].counter++;
                this.appendPopInstruction(this.createNumberArgument(dst));
                return this.createVariableArgument(dst);
            case "CallExpression":
                this.pushCallExpressionOntoStack(node);
                var dst = this.contexts[0].counter++;
                this.appendPopInstruction(this.createNumberArgument(dst));
                return this.createVariableArgument(dst);
            case "MemberExpression":
                this.pushMemberExpressionOntoStack(node);
                this.appendGetPropertyInstruction();
                var dst = this.contexts[0].counter++;
                this.appendPopInstruction(this.createNumberArgument(dst));
                return this.createVariableArgument(dst);
            case "BinaryExpression":
                this.translateBinaryExpression(node);
                var dst = this.contexts[0].counter++;
                this.appendPopInstruction(this.createNumberArgument(dst));
                return this.createVariableArgument(dst);
            case "StringLiteral":
                return this.createStringArgument(node.value);
            case "Identifier":
                if (this.isADependency(node.name)) {
                    var pointer = this.getDependencyPointer(node.name);
                    return this.createDependencyArgument(pointer);
                }
                var reg = this.contexts[0].variables.get(node.name);
                if (reg == undefined) {
                    throw "UNKNOWN_SOURCE_VARIABLE";
                }
                return this.createVariableArgument(reg);
            case "NumericLiteral":
                return this.createNumberArgument(node.value);
            default:
                console.log(node.type);
                throw "UNHANDLED_VALUE";
        }
    }
    appendNotInstruction() {
        const instruction = {
            opcode: 'NOT',
            args: []
        };
        this.pushInstruction(instruction);
    }
    appendTypeofInstruction() {
        const instruction = {
            opcode: 'TYPEOF',
            args: []
        };
        this.pushInstruction(instruction);
    }
    appendAddInstruction() {
        const instruction = {
            opcode: 'ADD',
            args: []
        };
        this.pushInstruction(instruction);
    }
    appendStrictNotEqual() {
        const instruction = {
            opcode: 'ADD',
            args: []
        };
        this.pushInstruction(instruction);
    }
    appendStoreInstruction(args) {
        const instruction = {
            opcode: 'STORE',
            args: args
        };
        this.pushInstruction(instruction);
    }
    appendGetPropertyInstruction() {
        const instruction = {
            opcode: 'GET_PROPERTY',
            args: []
        };
        this.pushInstruction(instruction);
    }
    appendCallMemberExpression() {
        const instruction = {
            opcode: 'CALL_MEMBER_EXPRESSION',
            args: []
        };
        this.pushInstruction(instruction);
    }
    appendPushInstruction(arg) {
        const instruction = {
            opcode: 'PUSH',
            args: [arg]
        };
        this.pushInstruction(instruction);
    }
    appendPopInstruction(arg) {
        const instruction = {
            opcode: 'POP',
            args: [arg]
        };
        this.pushInstruction(instruction);
    }
    appendCallInstruction() {
        const instruction = {
            opcode: 'CALL',
            args: [],
        };
        this.pushInstruction(instruction);
    }
    appendApplyInstruction() {
        const instruction = {
            opcode: 'APPLY',
            args: [],
        };
        this.pushInstruction(instruction);
    }
    appendInitInstruction(arg) {
        const instruction = {
            opcode: 'INIT_CONSTRUCTOR',
            args: [
                arg
            ],
        };
        this.pushInstruction(instruction);
    }
    appendInitArrayInstruction() {
        const instruction = {
            opcode: 'INIT_ARRAY',
            args: []
        };
        this.pushInstruction(instruction);
    }
    appendJmpIfInstruction(arg) {
        const instruction = {
            opcode: 'JMP_IF',
            args: [arg]
        };
        this.pushInstruction(instruction);
    }
    appendEqualInstruction() {
        const instruction = {
            opcode: 'EQUAL',
            args: []
        };
        this.pushInstruction(instruction);
    }
    // CISC instruction
    // defines a variable with empty array
    // returns the dst register
    declareArrVariable() {
        var dst = this.contexts[0].counter++;
        this.appendStoreInstruction([
            this.createNumberArgument(dst),
            this.createArrayArgument()
        ]);
        return dst;
    }
    declareArrVariableWithValue(argument) {
        this.appendPushInstruction(this.translateExpression(argument));
        this.appendInitArrayInstruction();
        var dst = this.contexts[0].counter++;
        this.appendPopInstruction(this.createNumberArgument(dst));
        return dst;
    }
    translateBinaryExpression(node) {
        if (node.left.type == "PrivateName") {
            throw "UNHANDLED_PRIVATE_NAME";
        }
        const left = this.translateExpression(node.left);
        const right = this.translateExpression(node.right);
        this.appendPushInstruction(left);
        this.appendPushInstruction(right);
        switch (node.operator) {
            case "==":
                this.appendEqualInstruction();
                break;
            case "+":
                this.appendAddInstruction();
                break;
            case "!==":
                this.appendStrictNotEqual();
                break;
            default:
                throw "UNHANDLED_OPERATOR_BINARY_EXPRESSION";
        }
    }
    translateVariableDeclarator(node) {
        if (node.id.type != "Identifier") {
            throw "UNHANDLED_VARIABLE_DECL_ID";
        }
        var dst = this.contexts[0].counter++;
        if (this.isVariableInitalized(node.id.name)) {
            const reg = this.contexts[0].variables.get(node.id.name);
            if (reg == undefined) {
                throw "UNHANDLED";
            }
            dst = reg;
        }
        this.appendStoreInstruction([
            this.createNumberArgument(dst),
            this.translateExpression(node.init),
        ]);
        this.initalizeVariable(node.id.name, dst);
    }
    pushMemberExpressionOntoStack(node) {
        switch (node.object.type) {
            case "Identifier":
                // Example: 
                // console.log("test") turns into
                // var bb = console["log"]
                // bb("test")
                if (this.isADependency(node.object.name)) {
                    const pointer = this.dependencies.indexOf(node.object.name);
                    this.appendPushInstruction(this.createDependencyArgument(pointer));
                }
                else {
                    console.log(node.object.name);
                    throw "BASE_NOT_DEPENDENCY";
                }
                if (node.property.type != "Identifier") {
                    throw "UNSUPPORTED PROPERTY TYPE";
                }
                break;
            case "CallExpression":
                this.pushCallExpressionOntoStack(node.object);
                break;
            default:
                console.log(node.object);
                throw "UNHANDLED_MEMBER_EXPRESSION_STATE";
        }
        if (node.property.type != "Identifier") {
            throw "UNHANDLED_PROPERTY_TYPE";
        }
        this.appendPushInstruction(this.createStringArgument(node.property.name));
    }
    // We translate call arguments by constructing an array of all elements
    // 1) Defining a new variable with empty array
    // 2) EXEC Push this variable reference onto stack
    // 3) EXEC Push "push" string onto stack
    // 4) EXEC Get_Property and pushes onto top of stack
    // 5) EXEC Push "argument"
    // 6) EXEC Call
    // returns a pointer to the arguments array
    pushCallArgumentsOntoStack(args) {
        // define argument array
        const argumentsArrayToCall = this.declareArrVariable();
        args.forEach((argument) => {
            var initializedArrPointer = this.declareArrVariableWithValue(argument);
            // pushes a reference onto stack
            this.appendPushInstruction(this.createArrayArgument());
            this.appendPushInstruction(this.createStringArgument('push'));
            this.appendGetPropertyInstruction();
            this.appendPushInstruction(this.createVariableArgument(argumentsArrayToCall));
            this.appendPushInstruction(this.createVariableArgument(initializedArrPointer));
            this.appendApplyInstruction();
        });
        return argumentsArrayToCall;
    }
    pushCallExpressionOntoStack(node) {
        var dstOfCallArguments = this.pushCallArgumentsOntoStack(node.arguments);
        switch (node.callee.type) {
            case "MemberExpression":
                this.pushMemberExpressionOntoStack(node.callee);
                this.appendPushInstruction(this.createVariableArgument(dstOfCallArguments));
                this.appendCallMemberExpression();
                break;
            case "Identifier":
                var arg = this.translateExpression(node.callee);
                this.appendPushInstruction(arg);
                this.appendPushInstruction(this.createVariableArgument(dstOfCallArguments));
                this.appendCallInstruction();
                break;
            default:
                console.log(node.callee.type);
                throw "UNHANDLED_CALL_EXPRESSION_TYPE";
        }
        // 
    }
    translateVariableDeclaration(node) {
        for (var i = 0; i < node.declarations.length; i++) {
            var declaration = node.declarations[i];
            this.translateVariableDeclarator(declaration);
        }
    }
    newBlock() {
    }
    translateWhileLoop(node) {
    }
    translateIfStatement(node) {
        if (node.consequent.type == "BlockStatement") {
            var block = {
                instructions: [],
                inheritsContext: true,
            };
            const label = `if_${node.start}:${node.end}`;
            // push the expression onto the stack
            this.appendPushInstruction(this.translateExpression(node.test));
            this.appendJmpIfInstruction(this.createStringArgument(label));
            this.ir[label] = block;
            this.blocks.unshift(block);
            this.constructIR(node.consequent.body);
            this.blocks.shift();
        }
        if (node.alternate && node.alternate.type == "BlockStatement") {
            var block = {
                instructions: [],
                inheritsContext: true,
            };
            const label = `else_${node.start}:${node.end}`;
            // push the expression onto the stack
            this.appendPushInstruction(this.translateExpression(node.test));
            this.appendNotInstruction();
            this.appendJmpIfInstruction(this.createStringArgument(label));
            this.ir[label] = block;
            this.blocks.unshift(block);
            this.constructIR(node.alternate.body);
            this.blocks.shift();
        }
    }
    constructIR(statements) {
        for (var i = 0; i < statements.length; i++) {
            var node = statements[i];
            console.log("translating: ", (0, generator_1.default)(node).code);
            switch (node.type) {
                case "IfStatement":
                    this.translateIfStatement(node);
                    break;
                case "VariableDeclaration":
                    this.translateVariableDeclaration(node);
                    break;
                case "ExpressionStatement":
                    switch (node.expression.type) {
                        case "CallExpression":
                            this.pushCallExpressionOntoStack(node.expression);
                            break;
                        default:
                            console.log(node.expression.type);
                            throw "UNHANDLED_EXPRESSION_STATEMENT";
                    }
                    break;
                default:
                    console.log(node.type);
                    throw "UNHANDLED_NODE";
            }
        }
    }
    compile() {
        this.constructIR(this.ast.program.body);
        return this.ir;
    }
}
exports.Compiler = Compiler;
