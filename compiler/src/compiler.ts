import * as babel from "@babel/core";
import { parse } from '@babel/parser';
import { Opcode } from "./instrset";

export interface Context {
    variables: Map<string, number>
    counter: number

}

export type ArgumentHeader = 'variable'|'string'|'number'|'stack'|'dependency'|'undefined'|'array'|'object'


export interface InstructionArgument {
    type: ArgumentHeader
    value: any
}




export interface Instruction {
    opcode: Opcode
    args: InstructionArgument[]

}

export type IntermediateRepresentation = Instruction[]
// Compiler is in charge of compiling the specified javascript code into raw bytecode
// Compiler will first construct a basic IR 
export class Compiler {
    ast: babel.types.File
    contexts: Context[]
    dependencies: string[]
    


    ir: IntermediateRepresentation
  
    constructor(src: string) {
        this.ast = parse(src)
        this.dependencies = ['console', 'Array', 'window']
        this.contexts = [
            {
                variables: new Map<string, number>(),
                counter: 0,
            },
        ]
        this.ir = []
    }
    private isVariableInitalized(name: string): boolean {
        return this.contexts[0].variables.has(name)
    }
    private initalizeVariable(name: string, dst: number) {
        this.contexts[0].variables.set(name, dst)
    }
    private isADependency(name: string) {
        return this.dependencies.includes(name)
    }
    private getDependencyPointer(name: string) {
        return this.dependencies.indexOf(name)
    }



    private createNumberArgument(dst: number): InstructionArgument {
        return {
            type: 'number',
            value: dst
        }
    }
    private createArrayArgument(): InstructionArgument {
        return {
            type: 'array',
            value: null
        }
    }
    private createObjectArgument(): InstructionArgument {
        return {
            type: 'object',
            value: null
        }
    }
    private createUndefinedArgument(): InstructionArgument {
        return {
            type: 'undefined',
            value: null
        }
    }
    private createDependencyArgument(pointer: number): InstructionArgument {
        return {
            type: 'dependency',
            value: pointer
        }
    }
    private createStringArgument(value: string): InstructionArgument {
        return {
            type: 'string',
            value: value
        }
    }
    private createVariableArgument(dst: number): InstructionArgument {
        return {
            type: 'variable',
            value: dst
        }
    }
 

    private translateExpression(node: babel.types.Expression| babel.types.SpreadElement | babel.types.JSXNamespacedName | babel.types.ArgumentPlaceholder|undefined|null): InstructionArgument {
        if (node == undefined || node == null) {
            return {
                type: 'undefined',
                value: null
            }
        }
        switch (node.type) {
            case "CallExpression":
                this.translateCallExpression(node)

                var dst = this.contexts[0].counter++
                

                this.appendPopInstruction(this.createNumberArgument(dst))
                return this.createVariableArgument(dst)


                
            case "BinaryExpression":

                this.translateBinaryExpression(node)

                var dst = this.contexts[0].counter++
                

                this.appendPopInstruction(this.createNumberArgument(dst))
                return this.createVariableArgument(dst)

            case "StringLiteral":
                return this.createStringArgument(node.value)
            case "Identifier":

                if (this.isADependency(node.name)) {
                    var pointer = this.getDependencyPointer(node.name)

                    return this.createDependencyArgument(pointer)
                }


                var reg = this.contexts[0].variables.get(node.name)
                if (reg == undefined) {
                    throw "UNKNOWN_SOURCE_VARIABLE"
                }
                
                return this.createVariableArgument(reg)
            case "NumericLiteral":
                return this.createNumberArgument(node.value)
            default:
                console.log(node.type)
                throw "UNHANDLED_VALUE"
        }
    }
    private appendAddInstruction(args: InstructionArgument[]) {
        const instruction: Instruction = {
            opcode: 'ADD',
            args: args
        }
   

        this.ir.push(instruction)
    }
    private appendStoreInstruction(args: InstructionArgument[]) {

        const instruction: Instruction = {
            opcode: 'STORE',
            args: args
        }
   

        this.ir.push(instruction)
    }
    private appendGetPropertyInstruction() {
        const instruction: Instruction = {
            opcode: 'GET_PROPERTY',
            args: []
        }


        this.ir.push(instruction)
    }

    private appendPushInstruction(arg: InstructionArgument) {
        const instruction: Instruction = {
            opcode: 'PUSH',
            args: [arg]
        }


        this.ir.push(instruction)
    }
    private appendPopInstruction(arg: InstructionArgument) {
        const instruction: Instruction = {
            opcode: 'POP',
            args: [arg]
        }


        this.ir.push(instruction)
    }

    private appendApplyInstruction() {
        const instruction: Instruction = {
            opcode: 'APPLY',
            args: [],
        }
        this.ir.push(instruction)
    }
    private appendInitInstruction(arg: InstructionArgument) {
        const instruction: Instruction = {
            opcode: 'INIT_CONSTRUCTOR',
            args: [
                arg
            ],
        }
        this.ir.push(instruction)
    }
    private appendInitArrayInstruction() {
        const instruction: Instruction = {
            opcode: 'INIT_ARRAY',
            args: []
        }
        this.ir.push(instruction)
    }


    // CISC instruction
    // defines a variable with empty array
    // returns the dst register
    private declareArrVariable(): number {
        var dst = this.contexts[0].counter++

        this.appendStoreInstruction([
            this.createNumberArgument(dst),
            this.createArrayArgument()
            
        ])
        return dst
        
    }


    private declareArrVariableWithValue(argument: babel.types.Expression| babel.types.SpreadElement | babel.types.JSXNamespacedName | babel.types.ArgumentPlaceholder|undefined|null): number {
        
        this.appendPushInstruction(
            this.translateExpression(argument)
        )
        this.appendInitArrayInstruction()
       
      

        var dst = this.contexts[0].counter++
        this.appendPopInstruction(this.createNumberArgument(dst))

        return dst
    }

    private translateBinaryExpression(node: babel.types.BinaryExpression) {
        if (node.left.type =="PrivateName") {
            throw "UNHANDLED_PRIVATE_NAME"
        } 

        const left = this.translateExpression(node.left)

        const right = this.translateExpression(node.right)
        switch (node.operator) {
            case "+":
                this.appendAddInstruction([
                    left,
                    right
                ])


                break



            default:
                throw "UNHANDLED_OPERATOR_BINARY_EXPRESSION"
        }

    }


    private translateVariableDeclarator(node: babel.types.VariableDeclarator) {
        if (node.id.type != "Identifier") {
            throw "UNHANDLED_VARIABLE_DECL_ID"
        }
        
        var dst = this.contexts[0].counter++
        if (this.isVariableInitalized(node.id.name)) {
            const reg = this.contexts[0].variables.get(node.id.name)

            
            if (reg == undefined) {
                throw "UNHANDLED"
            }
            dst = reg

        } 



        this.appendStoreInstruction([
            this.createNumberArgument(dst),
            this.translateExpression(node.init),
            
        ])
        this.initalizeVariable(node.id.name, dst)

    }


    private translateMemberExpression(node: babel.types.MemberExpression) {
        if (node.object.type != "Identifier") {
            throw "UNHANDLED_MEMBER_EXPRESSION_STATE"
        }

    

        // Example: 
        // console.log("test") turns into
        // var bb = console["log"]
        // bb("test")


        if (!(this.dependencies.includes(node.object.name))) { 
            
            throw "BASE OBJECT NOT DEPENDENCY"
            
        }
        const pointer = this.dependencies.indexOf(node.object.name)
        this.appendPushInstruction(
            this.createDependencyArgument(pointer),
        )

        if (node.property.type != "Identifier") {
            throw "UNSUPPORTED PROPERTY TYPE"
        }
            
        this.appendPushInstruction(
            this.createStringArgument(node.property.name)
        )
        this.appendGetPropertyInstruction()
            



        
    }

   

    // We translate call arguments by constructing an array of all elements
    // 1) Defining a new variable with empty array
    // 2) EXEC Push this variable reference onto stack
    // 3) EXEC Push "push" string onto stack
    // 4) EXEC Get_Property and pushes onto top of stack
    // 5) EXEC Push "argument"
    // 6) EXEC Call
    // returns a pointer to the arguments array
    private translateCallArguments(args: Array<babel.types.Expression | babel.types.SpreadElement | babel.types.JSXNamespacedName | babel.types.ArgumentPlaceholder>): number {
        // define argument array
        const argumentsArrayToCall = this.declareArrVariable()

      

        
        args.forEach((argument) => {



            var initializedArrPointer = this.declareArrVariableWithValue(argument)



            // pushes a reference onto stack
            this.appendPushInstruction(
                this.createArrayArgument()
            )

            this.appendPushInstruction(
                this.createStringArgument('push')
            )

            this.appendGetPropertyInstruction()
            this.appendPushInstruction(
                this.createVariableArgument(argumentsArrayToCall)
            )
            this.appendPushInstruction(
                this.createVariableArgument(initializedArrPointer)
            )
            

            this.appendApplyInstruction()




        })

        return argumentsArrayToCall
    }

    private translateCallExpression(node: babel.types.CallExpression) {
        var dst = this.translateCallArguments(node.arguments)
        switch (node.callee.type) {
            case "MemberExpression":
            
                
                this.translateMemberExpression(node.callee)
                break
                
            case "Identifier":

                var arg = this.translateExpression(node.callee)
                this.appendPushInstruction(arg) 
                break



            default:
                console.log(node.callee.type)
                throw "UNHANDLED_CALL_EXPRESSION_TYPE"
        }
        this.appendPushInstruction(
            this.createUndefinedArgument()
        )
        this.appendPushInstruction(
            this.createVariableArgument(dst)
        )

        this.appendApplyInstruction()
        
    }
    private translateVariableDeclaration(node: babel.types.VariableDeclaration) {
        for (var i = 0; i<node.declarations.length; i++) {
            var declaration = node.declarations[i]

            this.translateVariableDeclarator(declaration)
                

            
            
            
        }
    }

    private constructIR() {
        for (var i=0; i < this.ast.program.body.length; i++) {
            var node = this.ast.program.body[i]

            switch (node.type) {
                case "VariableDeclaration":
                    this.translateVariableDeclaration(node)
                    break
                case "ExpressionStatement":
                    switch (node.expression.type) {
                        case "CallExpression":
                            this.translateCallExpression(node.expression)
                            break
                        default:
                            console.log(node.expression.type)
                            throw "UNHANDLED_EXPRESSION_STATEMENT"
                    }
                    break
                default:
                    console.log(node.type)
                    throw "UNHANDLED_NODE"
            }
      
        }
     
    }

   
   
    compile(): IntermediateRepresentation {
        
        this.constructIR()
        return this.ir
    }
}


