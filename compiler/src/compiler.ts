import * as babel from "@babel/core";
import generate from "@babel/generator";
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

export interface Block {
    instructions: Instruction[]
    inheritsContext: boolean

}
export interface IntermediateRepresentation {
    [Label: string]: Block;
}
// Compiler is in charge of compiling the specified javascript code into raw bytecode
// Compiler will first construct a basic IR 
export class Compiler {
    ast: babel.types.File
    contexts: Context[]
    
    dependencies: string[]



    blocks: Block[]
    ir: IntermediateRepresentation
  
    constructor(src: string) {
        this.ast = parse(src)
        this.dependencies = ['console', 'Array', 'navigator', 'eval']
        this.contexts = [
            {
                variables: new Map<string, number>(),
                counter: 0,
            },
        ]
        
        var block: Block = {
            instructions: [],
            inheritsContext: true,
        }
        this.blocks = [block]
        this.ir = {
            'main': block
        }
            
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

    private pushInstruction(instruction: Instruction) {
        this.blocks[0].instructions.push(instruction)
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
    private translateUnaryExpression(node: babel.types.UnaryExpression) {


        this.appendPushInstruction(
            this.translateExpression(node.argument)
        )

        switch (node.operator) {
            case "typeof":


                this.appendTypeofInstruction()
                break



            case "!":
                this.appendNotInstruction()
                break
            default:
                console.log(node.operator)
                throw "UNSUPPORTED_UNARY_TYPE"
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
            case "UnaryExpression":
                this.translateUnaryExpression(node)
                var dst = this.contexts[0].counter++
                

                this.appendPopInstruction(this.createNumberArgument(dst))
                return this.createVariableArgument(dst)


            case "CallExpression":
                this.pushCallExpressionOntoStack(node)

                var dst = this.contexts[0].counter++
                

                this.appendPopInstruction(this.createNumberArgument(dst))
                return this.createVariableArgument(dst)
            case "MemberExpression":
                this.pushMemberExpressionOntoStack(node)
                this.appendGetPropertyInstruction()
    

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
    private appendNotInstruction() {
        const instruction: Instruction = {
            opcode: 'NOT',
            args: []
        }
   

        this.pushInstruction(instruction)
    }
    private appendTypeofInstruction() {
        const instruction: Instruction = {
            opcode: 'TYPEOF',
            args: []
        }
   

        this.pushInstruction(instruction)
    }
    private appendAddInstruction() {
        const instruction: Instruction = {
            opcode: 'ADD',
            args: []
        }
   

        this.pushInstruction(instruction)
    }
    private appendStrictNotEqual() {
        const instruction: Instruction = {
            opcode: 'ADD',
            args: []
        }
   

        this.pushInstruction(instruction)
    }
    private appendStoreInstruction(args: InstructionArgument[]) {

        const instruction: Instruction = {
            opcode: 'STORE',
            args: args
        }
   

        this.pushInstruction(instruction)
    }
    private appendGetPropertyInstruction() {
        const instruction: Instruction = {
            opcode: 'GET_PROPERTY',
            args: []
        }


        this.pushInstruction(instruction)
    }
    private appendCallMemberExpression() {
        const instruction: Instruction = {
            opcode: 'CALL_MEMBER_EXPRESSION',
            args: []
        }


        this.pushInstruction(instruction)
    }
    private appendPushInstruction(arg: InstructionArgument) {
        const instruction: Instruction = {
            opcode: 'PUSH',
            args: [arg]
        }


        this.pushInstruction(instruction)
    }
    private appendPopInstruction(arg: InstructionArgument) {
        const instruction: Instruction = {
            opcode: 'POP',
            args: [arg]
        }


        this.pushInstruction(instruction)
    }

    private appendCallInstruction() {
        const instruction: Instruction = {
            opcode: 'CALL',
            args: [],
        }
        this.pushInstruction(instruction)
    }
    private appendApplyInstruction() {
        const instruction: Instruction = {
            opcode: 'APPLY',
            args: [],
        }
        this.pushInstruction(instruction)
    }
    private appendInitInstruction(arg: InstructionArgument) {
        const instruction: Instruction = {
            opcode: 'INIT_CONSTRUCTOR',
            args: [
                arg
            ],
        }
        this.pushInstruction(instruction)
    }
    private appendInitArrayInstruction() {
        const instruction: Instruction = {
            opcode: 'INIT_ARRAY',
            args: []
        }
        this.pushInstruction(instruction)
    }
    private appendJmpIfInstruction(arg: InstructionArgument) {
        const instruction: Instruction = {
            opcode: 'JMP_IF',
            args: [arg]
        }
        this.pushInstruction(instruction)
    }

    private appendEqualInstruction() {
        const instruction: Instruction = {
            opcode: 'EQUAL',
            args: []
        }
        this.pushInstruction(instruction)
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

        this.appendPushInstruction(left)
        this.appendPushInstruction(right)

        switch (node.operator) {    
            case "==":

                this.appendEqualInstruction()
                break
            case "+":


                this.appendAddInstruction()


                break
            case "!==":
                this.appendStrictNotEqual()
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


    private pushMemberExpressionOntoStack(node: babel.types.MemberExpression) {

        switch (node.object.type) {
            case "Identifier":
                // Example: 
                // console.log("test") turns into
                // var bb = console["log"]
                // bb("test")


                if (this.isADependency(node.object.name)) { 
                    
                    const pointer = this.dependencies.indexOf(node.object.name)
                    this.appendPushInstruction(
                        this.createDependencyArgument(pointer),
                    )
                    
                } else {
                    console.log(node.object.name)
                    throw "BASE_NOT_DEPENDENCY"
                }
                

                if (node.property.type != "Identifier") {
                    throw "UNSUPPORTED PROPERTY TYPE"
                }
                break
            case "CallExpression":
                this.pushCallExpressionOntoStack(node.object)
                break
            default:
                console.log(node.object)
                throw "UNHANDLED_MEMBER_EXPRESSION_STATE"
            
        }
        
        if (node.property.type != "Identifier") {
            throw "UNHANDLED_PROPERTY_TYPE"
        }

    

        
            
        this.appendPushInstruction(
            this.createStringArgument(node.property.name)
        )
        
        

        
    }

   

    // We translate call arguments by constructing an array of all elements
    // 1) Defining a new variable with empty array
    // 2) EXEC Push this variable reference onto stack
    // 3) EXEC Push "push" string onto stack
    // 4) EXEC Get_Property and pushes onto top of stack
    // 5) EXEC Push "argument"
    // 6) EXEC Call
    // returns a pointer to the arguments array
    private pushCallArgumentsOntoStack(args: Array<babel.types.Expression | babel.types.SpreadElement | babel.types.JSXNamespacedName | babel.types.ArgumentPlaceholder>): number {
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

    private pushCallExpressionOntoStack(node: babel.types.CallExpression) {
        var dstOfCallArguments = this.pushCallArgumentsOntoStack(node.arguments)
        switch (node.callee.type) {
            case "MemberExpression":
            


                this.pushMemberExpressionOntoStack(node.callee)

                this.appendPushInstruction(
                    this.createVariableArgument(dstOfCallArguments)
                )
                this.appendCallMemberExpression()

                
                break
                
            case "Identifier":

                var arg = this.translateExpression(node.callee)

                this.appendPushInstruction(arg) 
                this.appendPushInstruction(
                    this.createVariableArgument(dstOfCallArguments)
                )

                this.appendCallInstruction()

                break



            default:
                console.log(node.callee.type)
                throw "UNHANDLED_CALL_EXPRESSION_TYPE"
        }
        
        // 
      

        
        
    }
    private translateVariableDeclaration(node: babel.types.VariableDeclaration) {
        for (var i = 0; i<node.declarations.length; i++) {
            var declaration = node.declarations[i]

            this.translateVariableDeclarator(declaration)
                

            
            
            
        }
    }
    private newBlock() {

    }

    
    private translateWhileLoop(node: babel.types.WhileStatement) {

    }
    

   
    private translateIfStatement(node: babel.types.IfStatement) {

        
        
        if (node.consequent.type == "BlockStatement") {

            var block: Block = {
                instructions: [],
                inheritsContext: true,
            }
            const label = `if_${node.start}:${node.end}`

            // push the expression onto the stack
            this.appendPushInstruction(
                this.translateExpression(node.test)
            )



            this.appendJmpIfInstruction(this.createStringArgument(label))

            this.ir[label] = block
            

            this.blocks.unshift(block)
        
       
            this.constructIR(node.consequent.body)
            this.blocks.shift()
        } 
        
        
        if (node.alternate && node.alternate.type == "BlockStatement") {
            var block: Block = {
                instructions: [],
                inheritsContext: true,
            }

            const label = `else_${node.start}:${node.end}`
            // push the expression onto the stack
            this.appendPushInstruction(
                this.translateExpression(node.test)
            )
            this.appendNotInstruction()


            this.appendJmpIfInstruction(this.createStringArgument(label))

            this.ir[label] = block
            

            this.blocks.unshift(block)
        
       
            this.constructIR(node.alternate.body)
            this.blocks.shift()
        }
        
        
    }

    private constructIR(statements: babel.types.Statement[]) {
        for (var i=0; i < statements.length; i++) {
            var node = statements[i]
            console.log("translating: ", generate(node).code)
            switch (node.type) {
             
                case "IfStatement":
                    this.translateIfStatement(node)
                    break

                case "VariableDeclaration":
                    this.translateVariableDeclaration(node)
                    break
                case "ExpressionStatement":
                    switch (node.expression.type) {
                        case "CallExpression":
                            this.pushCallExpressionOntoStack(node.expression)
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
        
        
        this.constructIR(this.ast.program.body)

 
        return this.ir
    }
}


