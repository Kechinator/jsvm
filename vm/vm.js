const headers = {
    'LOAD_STRING': 0,
    'LOAD_NUMBER': 1,

    'POP_STACK': 2,
    'FETCH_VARIABLE': 3,

    'FETCH_DEPENDENCY': 4,
    'LOAD_UNDEFINED': 5,
    'LOAD_ARRAY': 6,
    'LOAD_OBJECT': 7,
}

// Boiler template for VM
const opcodes = {
    // Arithmitic
    'ADD': 0,
    'SUB': 1,
    'MUL': 2,
    'DIV': 3,
    'MOD': 4,
    'NEG': 5,


    // Store a value into local variable
    'STORE': 6,
    'GET_PROPERTY': 7,
    'SET_PROPERTY': 8,
    'EXISTS': 9,
    'DELETE_PROPERTY': 10,
    'INSTANCE_OF': 11,
    'TYPEOF': 12,
    'APPLY': 13,
    'EQUAL': 14,
    'NOT_EQUAL': 15,
    'LESS_THAN': 16,
    'LESS_THAN_EQUAL': 17,
    'JMP': 18,
    'JMP_IF': 19,
    'JMP_ELSE': 20,
    'PUSH': 21,
    'POP': 22,
    'INIT_CONSTRUCTOR': 23,
    'INIT_ARRAY': 24,
}



class VM {
    constructor(encodedBytecode, encryptedStrings, dependencies) {
        this.decodedBytecode = this.decodeBytecode(encodedBytecode)
        // console.log(this.decodedBytecode)

        this.dependencies = dependencies
        this.encryptedStrings = encryptedStrings
        this.numbers = []
        this.opcodeHandlers = []
        this.stack = []
        this.localVariables = []
        this.programCounter = 0
        this.initOpcodeHandlers()
    }


    decodeBytecode(encodedBytecode) {    
        
        if (window) {
            var decodedBase64 = atob(encodedBytecode)
        } else {
            var decodedBase64 = Buffer.from(encodedBytecode, 'base64').toString('ascii')

        }
        
        var intArr = []
        for (var i=0; i<decodedBase64.length; i++) {
            intArr.push(decodedBase64.charCodeAt(i))
        }
        return intArr
    }

   
    getValue() {
        const header = this.decodedBytecode[this.programCounter++]


        switch (header) {
            // defines where our value is coming from, either we're directly loading in a value
            // popping from stack
            // or we're fetching it from local variable
            case headers['LOAD_STRING']:
                var stringPointer = this.decodedBytecode[this.programCounter++]
                // var shiftKey = this.decodedBytecode[this.programCounter++]

                var decryptXor = function(text, key) {
                    var result = '';
                
                    for (var i = 0; i < text.length; i++) {
                        result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
                    }
                    return result;
                }

            
                var ciphertext = this.encryptedStrings[stringPointer]
                
                
                var plaintext = decryptXor(ciphertext, "TEST")

                return plaintext

            case headers['LOAD_ARRAY']:
                return []
            case headers['LOAD_OBJECT']:
                return {}

            case headers['LOAD_NUMBER']:
                const numPointer = this.decodedBytecode[this.programCounter++]
                return numPointer

            case headers['POP_STACK']:

                const val = this.stack[this.stack.length]
                this.stack.length-= 1
                return val

            case headers['FETCH_DEPENDENCY']:
                const depPointer = this.decodedBytecode[this.programCounter++]
                return this.dependencies[depPointer]


            case headers['FETCH_VARIABLE']:
                const variable = this.decodedBytecode[this.programCounter++]
                
                return this.localVariables[variable]

        }

    }

    initOpcodeHandlers() {
        this.opcodeHandlers[opcodes['ADD']] = function(vm) {
            // in int arrary
            var arg$1 = vm.getValue()
            var arg$2 = vm.getValue()

            vm.stack[vm.stack.length] = arg$1 + arg$2

        }
        this.opcodeHandlers[opcodes['SUB']] = function(vm) {
            var arg$1 = vm.getValue()
            var arg$2 = vm.getValue()

            vm.stack[vm.stack.length] = arg$1 - arg$2
        }
        this.opcodeHandlers[opcodes['MUL']] = function(vm) {
            var arg$1 = vm.getValue()
            var arg$2 = vm.getValue()

            vm.stack[vm.stack.length] = arg$1 * arg$2
        }
        this.opcodeHandlers[opcodes['DIV']] = function(vm) {
            var arg$1 = vm.getValue()
            var arg$2 = vm.getValue()

            vm.stack[vm.stack.length] = arg$1 / arg$2

        }
        this.opcodeHandlers[opcodes['MOD']] = function(vm) {
            var arg$1 = vm.getValue()
            var arg$2 = vm.getValue()

            vm.stack[vm.stack.length] = arg$1 % arg$2
        }

        this.opcodeHandlers[opcodes['NEG']] = function(vm) {
            var arg$1 = vm.getValue()

            vm.stack[vm.stack.length] = !arg$1
        }
        


        this.opcodeHandlers[opcodes['STORE']] = function(vm) {
            var dst = vm.getValue()
            var arg$1 = vm.getValue()
            

            // console.log(arg$1)
            vm.localVariables[dst] = arg$1

        }

        this.opcodeHandlers[opcodes['GET_PROPERTY']] = function(vm) {
            var base = vm.stack[vm.stack.length-2]
            var property = vm.stack[vm.stack.length-1]

            vm.stack[vm.stack.length] = base[property]

        }
        this.opcodeHandlers[opcodes['APPLY']] = function(vm) {
            var fn = vm.stack[vm.stack.length-3]
            var dstObj = vm.stack[vm.stack.length-2]
            var arg = vm.stack[vm.stack.length-1]

            
            vm.stack[vm.stack.length] = fn.apply(dstObj, arg)

        }

        this.opcodeHandlers[opcodes['PUSH']] = function(vm) {
            var value = vm.getValue()

            vm.stack[vm.stack.length] = value

        }
        this.opcodeHandlers[opcodes['POP']] = function(vm) {
            var dst = vm.getValue()

            vm.localVariables[dst] = vm.stack.pop()

        }

        this.opcodeHandlers[opcodes['INIT_CONSTRUCTOR']] = function(vm) {
            var c = vm.getValue()
            var val = vm.stack[vm.stack.length-1]

            // console.log(c, val)
            
            vm.stack[vm.stack.length] = new c(val)
            // console.log(vm.stack)
        }

        this.opcodeHandlers[opcodes['INIT_ARRAY']] = function(vm) {
            var v = vm.stack[vm.stack.length-1]

            vm.stack[vm.stack.length] = [v]

        }
        

        
        

        

    }
 


    getInstructionHandler(opcode) {
        return this.opcodeHandlers[opcode]

    }



    start() {
        while (this.programCounter < this.decodedBytecode.length) {

            var count = this.programCounter++
            var opcode = this.decodedBytecode[count]
        
            var handler = this.getInstructionHandler(opcode)
            if (handler == undefined) {
                // console.log(opcode)
                throw "UNKNOWN_OPCODE"
            }
            handler(vm)

        }
    }

    

}
const bytecode = 'BgEAAAAGAQEAAQYBAgMABgEAAQUGAQQGFQMAGBYBBRUGFQACBxUDBBUDBQ0VBAAVAAMHFQUVAwQNBgEGAQUGAQcABAYBCAYAAwcDBxYBCQADCQAFFgEKFQMKGBYBCxUGFQAGBxUDCBUDCw0VBAAVAAcHFQUVAwgNBgENBhUBBRgWAQ4VBhUACAcVAw0VAw4NFQQBFQUVAw0NFgEPBgEMAw8GARAGFQMMGBYBERUGFQAJBxUDEBUDEQ0VBAAVAAoHFQUVAxANBgESBhUEAhgWARMVBhUACwcVAxIVAxMNFQQAFQAMBxUFFQMSDQ=='


const encryptedStrings =  [
    "6*''\x10*\x14;\x167!",
    " 1'",
    '$0 <',
    '8*4',
    '576\x16;1 \x13;,=3\x167!',
    'k',
    '$0 <',
    '8*4',
    '$0 <',
    '$0 <',
    '8*4',
    '$0 <',
    '8*4'
  ]


const vm = new VM(bytecode, encryptedStrings, [console, Array, window])
vm.start(vm)