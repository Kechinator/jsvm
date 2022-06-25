const headers = {
    'LOAD_STRING': 0,
    'LOAD_NUMBER': 1,

    'POP_STACK': 2,
    'FETCH_VARIABLE': 3,

    'FETCH_DEPENDENCY': 4,

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
    'CALL': 13,
    'EQUAL': 14,
    'NOT_EQUAL': 15,
    'LESS_THAN': 16,
    'LESS_THAN_EQUAL': 17,
    'JMP': 18,
    'JMP_IF': 19,
    'JMP_ELSE': 20,
    'PUSH': 21,
    'POP': 22,
}



class VM {
    constructor(encodedBytecode, dependencies) {
        this.decodedBytecode = this.decodeBytecode(encodedBytecode)


        this.dependencies = dependencies
        this.encryptedStrings = []
        this.numbers = []
        this.opcodeHandlers = []
        this.stack = []
        this.localVariables = []
        this.programCounter = 0

    }


    decodeBytecode(encodedBytecode) {    
        var decodedBase64 = Buffer.from(encodedBytecode, 'base64').toString('ascii')

        var intArr = []
        for (var i =0; i<decodedBase64.length; i++) {
            intArr.push(decodedBase64.charCodeAt(i))
        }
    }


    getValue() {
        const header = this.decodedBytecode[this.programCounter++]


        switch (header) {
            // defines where our value is coming from, either we're directly loading in a value
            // popping from stack
            // or we're fetching it from local variable
            case headers['LOAD_STRING']:
                const stringPointer = this.decodedBytecode[this.programCounter++]
                const shiftKey = this.decodedBytecode[this.programCounter++]

                const ciphertext = this.encryptedStrings[stringPointer]
                
                const plaintext = ""
                for (var i=0; i<ciphertext.length; i++) {
                    plaintext += (ciphertext.charCodeAt(i) ^ shiftKey)
                }

                return plaintext


            case headers['LOAD_NUMBER']:
                const numPointer = this.decodedBytecode[this.programCounter++]
                return this.numbers[numPointer]

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
            var arg$1 = this.getValue()
            var arg$2 = this.getValue()

            this.stack[this.stack.length] = arg$1 + arg$2

        }
        this.opcodeHandlers[opcodes['SUB']] = function(vm) {
            var arg$1 = this.getValue()
            var arg$2 = this.getValue()

            this.stack[this.stack.length] = arg$1 - arg$2
        }
        this.opcodeHandlers[opcodes['MUL']] = function(vm) {
            var arg$1 = this.getValue()
            var arg$2 = this.getValue()

            this.stack[this.stack.length] = arg$1 * arg$2
        }
        this.opcodeHandlers[opcodes['DIV']] = function(vm) {
            var arg$1 = this.getValue()
            var arg$2 = this.getValue()

            this.stack[this.stack.length] = arg$1 / arg$2

        }
        this.opcodeHandlers[opcodes['MOD']] = function(vm) {
            var arg$1 = this.getValue()
            var arg$2 = this.getValue()

            this.stack[this.stack.length] = arg$1 % arg$2
        }

        this.opcodeHandlers[opcodes['NEG']] = function(vm) {
            var arg$1 = this.getValue()

            this.stack[this.stack.length] = !arg$1
        }

        this.opcodeHandlers

        

    }
 


    getInstructionHandler(opcode) {


    }



    start(vm) {
        while (true) {

            this.getInstructionHandler(this.programCounter++)
        }
    }

    

}
