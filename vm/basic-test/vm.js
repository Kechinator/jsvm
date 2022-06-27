


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
    'CALL': 13,
    'EQUAL': 14,
    'NOT_EQUAL': 15,
    'LESS_THAN': 16,
    'LESS_THAN_EQUAL': 17,
    'STRICT_NOT_EQUAL': 18,
    'JMP_IF': 19,
    'NOT':20,
    'PUSH': 21,
    'POP': 22,
    'INIT_CONSTRUCTOR': 23,
    'INIT_ARRAY': 24,
    'EXIT':25,
    'VOID': 26,
    'THROW': 27,
    'DELETE': 28,
    'UADD': 29,
    'UMINUS': 30,
    'BNOT': 31, 
    'AND': 32,
    'APPLY': 33,
    'CALL_MEMBER_EXPRESSION': 34,

}


class VM {
    constructor(encodedBytecode, encryptedStrings, dependencies, lookUpTable) {
        this.decodedBytecode = this.decodeBytecode(encodedBytecode)
        // console.log(this.decodedBytecode)

        this.dependencies = dependencies
        this.encryptedStrings = encryptedStrings
        this.numbers = []
        this.opcodeHandlers = []
        this.stack = []
        this.localVariables = []
        this.lookUpTable = lookUpTable

        this.exitToPreviousContext = [function(vm) {
                // if we call this function from main context then we just exit
                vm.programCounter = vm.decodedBytecode.length +1
                // vm.programCounter = +inf
        }]
        this.programCounter = 0
        this.initOpcodeHandlers()
    }


    decodeBytecode(encodedBytecode) {    
        
        if (typeof window !== "undefined") {
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

    byteArrayToLong(byteArray) {
        var value = 0;
        for ( var i = byteArray.length - 1; i >= 0; i--) {
            value = (value * 256) + byteArray[i];
        }
    
        return value;
    }

    decryptXor(text, key) {
        var result = '';
    
        for (var i = 0; i < text.length; i++) {
            result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
        }
        return result;
    }
    load8ByteArray() {
        var byteArray = []
        for (var i = 0; i<8; i++) {
            const numPointer = this.decodedBytecode[this.programCounter++]
            byteArray.push(numPointer)
        }
        
        return byteArray
    }
    byteArrayToString(byteArray) {
        var value = "";
        for (var i =0;i <byteArray.length;i++) {
            value += String.fromCharCode(byteArray[i])
        }
    
        return value;
    }
        
    getValue() {
        const header = this.decodedBytecode[this.programCounter++]


        switch (header) {
            // defines where our value is coming from, either we're directly loading in a value
            // popping from stack
            // or we're fetching it from local variable
            case headers['LOAD_STRING']:
            
                
            


                
                var stringPointer = this.byteArrayToLong(this.load8ByteArray())



                var ciphertext = this.encryptedStrings[stringPointer]
                
                var key = this.byteArrayToString(this.load8ByteArray())
                

                

                return this.decryptXor(ciphertext, key)

            case headers['LOAD_ARRAY']:
                return []
            case headers['LOAD_OBJECT']:
                return {}

            case headers['LOAD_NUMBER']:

                var byteArray = this.load8ByteArray()
            

                var long = this.byteArrayToLong(byteArray)
           
                
                return long

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
            var arg$1 = vm.stack[vm.stack.length-2]
            var arg$2 = vm.stack[vm.stack.length-1]

            vm.stack[vm.stack.length] = arg$1 + arg$2

        }
        this.opcodeHandlers[opcodes['SUB']] = function(vm) {
            var arg$1 = vm.stack[vm.stack.length-2]
            var arg$2 = vm.stack[vm.stack.length-1]

            vm.stack[vm.stack.length] = arg$1 - arg$2
        }
        this.opcodeHandlers[opcodes['MUL']] = function(vm) {
            var arg$1 = vm.stack[vm.stack.length-2]
            var arg$2 = vm.stack[vm.stack.length-1]

            vm.stack[vm.stack.length] = arg$1 * arg$2
        }
        this.opcodeHandlers[opcodes['DIV']] = function(vm) {
            var arg$1 = vm.stack[vm.stack.length-2]
            var arg$2 = vm.stack[vm.stack.length-1]

            vm.stack[vm.stack.length] = arg$1 / arg$2

        }
        this.opcodeHandlers[opcodes['MOD']] = function(vm) {
            var arg$1 = vm.stack[vm.stack.length-2]
            var arg$2 = vm.stack[vm.stack.length-1]

            vm.stack[vm.stack.length] = arg$1 % arg$2
        }

        this.opcodeHandlers[opcodes['NEG']] = function(vm) {
            var arg$1 = vm.stack[vm.stack.length-1]
            

            vm.stack[vm.stack.length] = !arg$1
        }
        this.opcodeHandlers[opcodes['EQUAL']] = function(vm) {
            var arg$1 = vm.stack[vm.stack.length-2]
            var arg$2 = vm.stack[vm.stack.length-1]

            vm.stack[vm.stack.length] = arg$1 == arg$2
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
        this.opcodeHandlers[opcodes['CALL']] = function(vm) {
            var fn = vm.stack[vm.stack.length-2]
           
            var argArr = vm.stack[vm.stack.length-1]

           
            vm.stack[vm.stack.length] = fn(...argArr)

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
            var c = m.stack[vm.stack.length-2]
            var val = vm.stack[vm.stack.length-1]

            // console.log(c, val)
            
            vm.stack[vm.stack.length] = new c(val)
            // console.log(vm.stack)
        }
        this.opcodeHandlers[opcodes['STRICT_NOT_EQUAL']] = function(vm) {
            var base = vm.stack[vm.stack.length-2]
            var property = vm.stack[vm.stack.length-1]

            vm.stack[vm.stack.length] = base !== property

        }

        this.opcodeHandlers[opcodes['INIT_ARRAY']] = function(vm) {
            var v = vm.stack[vm.stack.length-1]

            vm.stack[vm.stack.length] = [v]

        }
        this.opcodeHandlers[opcodes['NOT']] = function(vm) {
            var expression = vm.stack[vm.stack.length-1]
            vm.stack[vm.stack.length] = !expression

        }
        this.opcodeHandlers[opcodes['TYPEOF']] = function(vm) {
            var expression = vm.stack[vm.stack.length-1]

            
            vm.stack[vm.stack.length] = typeof expression
        }
        this.opcodeHandlers[opcodes['JMP_IF']] = function(vm) {
            // console.log("UNHANDLED_JMP_IF")

           
            var expression = vm.stack[vm.stack.length-2]
            var label = vm.stack[vm.stack.length-1]
            
            if (expression) {
                // JMP to specified location
                // we keep a breakpoint to this

               
                var pc = vm.programCounter
                
                vm.exitToPreviousContext.unshift(function(vm) {
                    vm.programCounter = pc
                })
                
                var location = vm.lookUpTable[label]
                
                // console.log("JMP", vm.decryptXor(label, "label"))

                
                vm.programCounter = location

        
            }
            // vm.stack[vm.stack.length] = typeof expression
        }

        this.opcodeHandlers[opcodes['EXIT']] = function(vm) {
            // console.log('EXIT DETECTED')
            // console.log("BEFORE CALL: ", vm.programCounter)
            vm.exitToPreviousContext[0](vm)
            
            vm.exitToPreviousContext.shift()
            // console.log("JMPING BACK TO", vm.programCounter)
        
            
            
            // exit context
        }
        this.opcodeHandlers[opcodes['AND']] = function(vm) {
            var arg$1 = vm.stack[vm.stack.length-2]
            var arg$2 = vm.stack[vm.stack.length-1]

            vm.stack[vm.stack.length] = arg$1 && arg$2
        }

        this.opcodeHandlers[opcodes['APPLY']] = function(vm) {
            var fn = vm.stack[vm.stack.length-3]
            var obj = vm.stack[vm.stack.length-2]
            var args = vm.stack[vm.stack.length-1]

            vm.stack[vm.stack.length] = fn.apply(obj, args)
        }
        this.opcodeHandlers[opcodes['CALL_MEMBER_EXPRESSION']] = function(vm) {
            var obj = vm.stack[vm.stack.length-3]
            var property = vm.stack[vm.stack.length-2]
            var args = vm.stack[vm.stack.length-1]

            vm.stack[vm.stack.length] = obj[property](...args)
        }
        

        

    }
 


    getInstructionHandler(opcode) {
        return this.opcodeHandlers[opcode]

    }



    

    

}
function vmStart(vm) {

    
    while (vm.programCounter < vm.decodedBytecode.length) {
        // console.log(vm.stack)
        var count = vm.programCounter++
        // console.log(count)
        var opcode = vm.decodedBytecode[count]
        // console.log(`EXECUTING: ${opcode}`)
        var handler = vm.getInstructionHandler(opcode)
        
        if (handler == undefined) {
            // console.log(vm.decodedBytecode.slice(count-45, count+1))
            // console.log(opcode, count)
            throw "UNKNOWN_OPCODE"
        }
        // console.log(vm.programCounter)
        
        handler(vm)

    }
    
}


var arg = {
    bytecode: 'BgEAAAAAAAAAAAAAAAAAAAAAADQyVU15TnFiBgEBAAAAAAAAAAABAAAAAAAAAEgzVENYa1k4BgECAAAAAAAAAAMABgEAAAAAAAAAAAEFAAAAAAAAAAYBBAAAAAAAAAAGFQMAGBYBBQAAAAAAAAAVBhUAAgAAAAAAAABRMDl1WmUybgcVAwQVAwUhFQQAFQADAAAAAAAAADRHYTVMclhRFQMEIgYBBgAAAAAAAAABBQAAAAAAAAAGAQcAAAAAAAAAAAQAAAAAAAAAOHd3MUU2cGoGAQgAAAAAAAAABhUDBxUABQAAAAAAAAA1NzZMVERITQAWAQkAAAAAAAAAFQMJGBYBCgAAAAAAAAAVBhUABgAAAAAAAAByNlhtbHpzeQcVAwgVAwohFQQAFQAHAAAAAAAAADdwcDRObW80FQMIIgYBDAAAAAAAAAAGFQEFAAAAAAAAABgWAQ0AAAAAAAAAFQYVAAgAAAAAAAAAZmxDVTZkVjQHFQMMFQMNIRUEARUDDA0WAQ4AAAAAAAAABgELAAAAAAAAAAMOBgEPAAAAAAAAAAYVAwsYFgEQAAAAAAAAABUGFQAJAAAAAAAAAE1OeE1IaTFDBxUDDxUDECEVBAAVAAoAAAAAAAAAUWM5N1pwN2kVAw8iFQEFAAAAAAAAABUBBQAAAAAAAAAOFgERAAAAAAAAABUDERUACwAAAAAAAABMRHVWRUw0URMVAQUAAAAAAAAAFQEFAAAAAAAAAA4WARQAAAAAAAAAFQMUFBUADAAAAAAAAAA5ZDJxRGhJeBMGARcAAAAAAAAAAQUAAAAAAAAAGQYBEgAAAAAAAAAGFQANAAAAAAAAAExneEo4SXB5GBYBEwAAAAAAAAAVBhUADgAAAAAAAABhRDN6djVrUAcVAxIVAxMhFQQAFQAPAAAAAAAAAER4cndiSkh2FQMSIhkGARUAAAAAAAAABhUAEAAAAAAAAABNUk1GWnhTORgWARYAAAAAAAAAFQYVABEAAAAAAAAAZ0ZmcnJ2YW0HFQMVFQMWIRUEABUAEgAAAAAAAABJajA2ZjlMZBUDFSIZ',
    encryptedStrings: [
      "V]!>=!6\rv@'",
      '<G ',
      '!EJ\x1D',
      'X(\x06',
      'Y\x05\x12s*B\x03-W\x1E\x19V\x07D\x02',
      '\n',
      '\x02C+\x05',
      '[\x1F\x17',
      '\x16\x190=',
      '=;\x0B%',
      '=\f^',
      'ICH\x02\x10\x12o\x01\x1F\x1B',
      '0i#qw5\x11(f:h#',
      '5\x02\x0B',
      '\x111@\x12',
      '(\x17\x15',
      '#=',
      '\x173\x15\x1A',
      '%\x05W'
    ],
    lookUpTable: {
      '\x01\x00\x0B\x0B': 0,
      '\x05\x07=TU^[PS_': 613,
      '\t\r\x11\x003]XP_^ZR': 707
    }
}

const vm = new VM(arg.bytecode, arg.encryptedStrings, [console, Array, navigator, eval], arg.lookUpTable)

vmStart(vm)