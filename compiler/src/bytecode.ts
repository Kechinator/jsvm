import { ArgumentHeader, InstructionArgument, IntermediateRepresentation } from "./compiler";
import { Opcode } from "./instrset";

const Opcodes = new Map<Opcode, number>([
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
])

const Headers = new Map<ArgumentHeader, number>([
    ['string', 0],
    ['number', 1],
    ['stack', 2],
    ['variable', 3],
    ['dependency', 4],
    ['undefined', 5],
    ['array', 6],
    ['object', 7]
])
export interface VirtualMachineArguments {
    bytecode: string
    encryptedStrings: string[]

}

export class BytecodeCompiler {
    private ir: IntermediateRepresentation
    private encryptedStrings: string[]
    bytecode: number[]

    constructor(ir: IntermediateRepresentation) {
        this.ir = ir
        this.encryptedStrings = []
        this.bytecode = []
    }
    private encryptXor(text: string, key: string) {
        var result = '';
    
        for (var i = 0; i < text.length; i++) {
            result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
        }
        return result;
    }




    private compileInstructionArgument(arg: InstructionArgument): number[] {

        const header = Headers.get(arg.type)
        if (header == undefined) {
            console.log(arg.type)
            throw 'UNKNOWN_HEADER'
        }

        switch (arg.type) {
            case "undefined":
                return [header]
            case "object":
                return [header]
            case "array":
                return [header]
            case "string":

                var key = "TEST"
                const encoded = this.encryptXor(arg.value, key)

                
                this.encryptedStrings.push(encoded)
                return [header, this.encryptedStrings.length-1]
            case "number":
                return [header, arg.value]
            case "stack":
                return []
            case "variable":
                return [header, arg.value]
            case "dependency":
                return [header, arg.value]
        }
    }


    compile(): VirtualMachineArguments {

        const bytes: number[] = []
        for (var i=0; i<this.ir.length; i++) {
            var instruction = this.ir[i]
            
            var opcode = Opcodes.get(instruction.opcode)
            if (opcode == undefined) {
                throw "UNHANDLED_OPCODE"
            }
         
            bytes.push(opcode)

            for (var j=0; j<instruction.args.length;j++) {
                bytes.push(...this.compileInstructionArgument(instruction.args[j]))

            }
            

        }
        this.bytecode = bytes
        const encodedBytecode = Buffer.from(bytes).toString('base64')

    
        return {
            bytecode: encodedBytecode,
            encryptedStrings: this.encryptedStrings
        }
    }


 
}