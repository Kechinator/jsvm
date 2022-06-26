"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Compiler = void 0;
const parser_1 = require("@babel/parser");
// Compiler is in charge of compiling the specified javascript code into raw bytecode
// Compiler will first construct a basic IR 
class Compiler {
    constructor(src) {
        this.ast = (0, parser_1.parse)(src);
        this.dependencies = ['console', 'Array', 'window'];
        this.contexts = [
            {
                variables: new Map(),
                counter: 0,
            },
        ];
        this.ir = [];
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
    translateExpression(node) {
        if (node == undefined || node == null) {
            return {
                type: 'undefined',
                value: null
            };
        }
        switch (node.type) {
            case "CallExpression":
                this.translateCallExpression(node);
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
    appendAddInstruction(args) {
        const instruction = {
            opcode: 'ADD',
            args: args
        };
        this.ir.push(instruction);
    }
    appendStoreInstruction(args) {
        const instruction = {
            opcode: 'STORE',
            args: args
        };
        this.ir.push(instruction);
    }
    appendGetPropertyInstruction() {
        const instruction = {
            opcode: 'GET_PROPERTY',
            args: []
        };
        this.ir.push(instruction);
    }
    appendPushInstruction(arg) {
        const instruction = {
            opcode: 'PUSH',
            args: [arg]
        };
        this.ir.push(instruction);
    }
    appendPopInstruction(arg) {
        const instruction = {
            opcode: 'POP',
            args: [arg]
        };
        this.ir.push(instruction);
    }
    appendApplyInstruction() {
        const instruction = {
            opcode: 'APPLY',
            args: [],
        };
        this.ir.push(instruction);
    }
    appendInitInstruction(arg) {
        const instruction = {
            opcode: 'INIT_CONSTRUCTOR',
            args: [
                arg
            ],
        };
        this.ir.push(instruction);
    }
    appendInitArrayInstruction() {
        const instruction = {
            opcode: 'INIT_ARRAY',
            args: []
        };
        this.ir.push(instruction);
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
        switch (node.operator) {
            case "+":
                this.appendAddInstruction([
                    left,
                    right
                ]);
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
    translateMemberExpression(node) {
        if (node.object.type != "Identifier") {
            throw "UNHANDLED_MEMBER_EXPRESSION_STATE";
        }
        // Example: 
        // console.log("test") turns into
        // var bb = console["log"]
        // bb("test")
        if (!(this.dependencies.includes(node.object.name))) {
            throw "BASE OBJECT NOT DEPENDENCY";
        }
        const pointer = this.dependencies.indexOf(node.object.name);
        this.appendPushInstruction(this.createDependencyArgument(pointer));
        if (node.property.type != "Identifier") {
            throw "UNSUPPORTED PROPERTY TYPE";
        }
        this.appendPushInstruction(this.createStringArgument(node.property.name));
        this.appendGetPropertyInstruction();
    }
    // We translate call arguments by constructing an array of all elements
    // 1) Defining a new variable with empty array
    // 2) EXEC Push this variable reference onto stack
    // 3) EXEC Push "push" string onto stack
    // 4) EXEC Get_Property and pushes onto top of stack
    // 5) EXEC Push "argument"
    // 6) EXEC Call
    // returns a pointer to the arguments array
    translateCallArguments(args) {
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
    translateCallExpression(node) {
        var dst = this.translateCallArguments(node.arguments);
        switch (node.callee.type) {
            case "MemberExpression":
                this.translateMemberExpression(node.callee);
                break;
            case "Identifier":
                var arg = this.translateExpression(node.callee);
                this.appendPushInstruction(arg);
                break;
            default:
                console.log(node.callee.type);
                throw "UNHANDLED_CALL_EXPRESSION_TYPE";
        }
        this.appendPushInstruction(this.createUndefinedArgument());
        this.appendPushInstruction(this.createVariableArgument(dst));
        this.appendApplyInstruction();
    }
    translateVariableDeclaration(node) {
        for (var i = 0; i < node.declarations.length; i++) {
            var declaration = node.declarations[i];
            this.translateVariableDeclarator(declaration);
        }
    }
    constructIR() {
        for (var i = 0; i < this.ast.program.body.length; i++) {
            var node = this.ast.program.body[i];
            switch (node.type) {
                case "VariableDeclaration":
                    this.translateVariableDeclaration(node);
                    break;
                case "ExpressionStatement":
                    switch (node.expression.type) {
                        case "CallExpression":
                            this.translateCallExpression(node.expression);
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
        this.constructIR();
        return this.ir;
    }
}
exports.Compiler = Compiler;
