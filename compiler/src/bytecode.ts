import { ArgumentHeader, Block, InstructionArgument, IntermediateRepresentation } from "./compiler";
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
    ['CALL', 13],
    ['EQUAL', 14],
    ['NOT_EQUAL', 15],
    ['LESS_THAN', 16],
    ['LESS_THAN_EQUAL', 17],
    ['STRICT_NOT_EQUAL', 18],
    ['JMP_IF', 19],
    ['NOT', 20],
    ['PUSH', 21],
    ['POP', 22],
    ['INIT_CONSTRUCTOR', 23],
    ['INIT_ARRAY', 24],
    ['EXIT', 25],
    ['APPLY', 33],
    ['CALL_MEMBER_EXPRESSION', 34]
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
    lookUpTable: LookUpTable

}
export interface LookUpTable {
    [Label: string]: number;
}

export class BytecodeCompiler {
    private ir: IntermediateRepresentation
    private encryptedStrings: string[]
    bytecode: number[]
    lookUpTable: LookUpTable



    constructor(ir: IntermediateRepresentation) {
        this.ir = ir
        this.encryptedStrings = []
        this.bytecode = []
        
        this.lookUpTable = {}
    }
    private encryptXor(text: string, key: string) {
        var result = '';
    
        for (var i = 0; i < text.length; i++) {
            result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
        }
        return result;
    }
    private longToByteArray(long: number) {
        // we want to represent the input as a 8-bytes array
        var byteArray = [0, 0, 0, 0, 0, 0, 0, 0];
    
        for ( var index = 0; index < byteArray.length; index ++ ) {
            var byte = long & 0xff;
            byteArray [ index ] = byte;
            long = (long - byte) / 256 ;
        }
    
        return byteArray;
    };  

    private makeid() {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      
        for (var i = 0; i < 8; i++)
          text += possible.charAt(Math.floor(Math.random() * possible.length));
    
        return text;
    }

    private stringToByteArray(key: string): number[] {

        var bytes = []
        for (var i = 0; i < key.length; i++) {
            bytes.push(key.charCodeAt(i))
        }
        return bytes
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

                
                var key = this.makeid()
                var keyArray = this.stringToByteArray(key)

                const encoded = this.encryptXor(arg.value, key)
                
                
                this.encryptedStrings.push(encoded)

                var stringPointer = this.longToByteArray(this.encryptedStrings.length-1)
                
               
               
                return [header, ...stringPointer, ...keyArray]
            case "number":
                // console.log(this.longToByteArray(arg.value), arg.value)'
                // console.log(arg.value)
                // console.log(this.byteArrayToLong(this.longToByteArray(arg.value)))
                return [header, ...this.longToByteArray(arg.value)]
            case "stack":
                return []
            case "variable":
                return [header, arg.value]
            case "dependency":
                return [header, arg.value]
        }
    }
    private compileBlock(block: Block, bytes: number[]) {
        
        for (var i=0; i<block.instructions.length; i++) {
            var instruction = block.instructions[i]
            
            var opcode = Opcodes.get(instruction.opcode)
            if (opcode == undefined) {
                throw "UNHANDLED_OPCODE"
            }
            
            
            if (instruction.opcode == "JMP_IF") {
                // need to implement a jmp look up table
                // console.log("JMP_IF", instruction.args[0])

                
                // console.log(bytes.length)
                // we need to put a place holder of 9 bytes beforehand so we can replace it later onwards when we add in the jmp locations

                var pushOpcode = Opcodes.get("PUSH")
                if (pushOpcode) {
                    bytes.push(pushOpcode)
                    bytes.push(...this.compileInstructionArgument({
                        type: "string",
                        value: this.encryptXor(instruction.args[0].value, "label")
                    }))
                }


                bytes.push(opcode)
               
                    
            } else {
                bytes.push(opcode)

                for (var j=0; j<instruction.args.length;j++) {
                    bytes.push(...this.compileInstructionArgument(instruction.args[j]))
    
                }
            }

            


           
            

        }
        
    }

    compile(): VirtualMachineArguments {

        const bytes: number[] = []

        for (const [label, block] of Object.entries(this.ir)) {

            console.log(`SET LOCATION ${label}: ${bytes.length}`)
            this.lookUpTable[this.encryptXor(label, 'label')] = bytes.length
            
            this.compileBlock(block, bytes)

            var exitOpcode = Opcodes.get("EXIT")
            if (exitOpcode) {
                bytes.push(exitOpcode)
            }
        }
        
        

        
       
        this.bytecode = bytes
        const encodedBytecode = Buffer.from(bytes).toString('base64')

    
        return {
            bytecode: encodedBytecode,
            encryptedStrings: this.encryptedStrings,
            lookUpTable: this.lookUpTable
        }
    }


 
}